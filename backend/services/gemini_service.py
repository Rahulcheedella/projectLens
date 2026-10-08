import os
import json
import logging
from typing import Dict, Any, Optional
from google import genai
from google.genai import types

from pathlib import Path
from dotenv import load_dotenv

# Ensure environment is loaded
_env_candidates = [
    Path(__file__).parent.parent / ".env",
    Path(__file__).parent.parent.parent / ".env",
]
for _p in _env_candidates:
    if _p.exists():
        load_dotenv(dotenv_path=_p)
        break
load_dotenv()

from models.schemas import (
    AggregatedEvidence,
    CategoryScores,
    StrengthItem,
    IssueItem,
    RecommendationItem,
)
from services.scoring_service import ScoringService

logger = logging.getLogger(__name__)

class GeminiService:
    """Invokes Google Gemini using official google-genai SDK to generate humanized reviews."""

    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY", "").strip()
        self.client = None
        if self.api_key:
            try:
                self.client = genai.Client(api_key=self.api_key)
            except Exception as e:
                logger.error(f"Failed to initialize Gemini Client: {e}")

    async def generate_review(
        self,
        evidence: AggregatedEvidence,
        baseline_scores: CategoryScores,
    ) -> Dict[str, Any]:
        """Sends structured evidence to Gemini to produce an editorial review."""
        if not self.client:
            logger.warning("No Gemini API key configured. Generating deterministic fallback review.")
            return self._build_deterministic_review(evidence, baseline_scores)

        # Build clean prompt with evidence
        prompt = self._build_prompt(evidence, baseline_scores)

        candidate_models = [
            "gemini-3.5-flash",
            "gemini-3.5-flash-lite",
            "gemini-3.8-flash",
            "gemini-3.7-flash",
        ]
        last_error = None

        for model_name in candidate_models:
            try:
                response = self.client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        temperature=0.3,
                    ),
                )
                response_text = response.text.strip()
                parsed_data = json.loads(response_text)
                validated_review = self._validate_and_sanitize(parsed_data, baseline_scores)
                logger.info(f"Successfully generated review with Gemini model {model_name}")
                return validated_review
            except Exception as e:
                logger.warning(f"Gemini call with {model_name} failed: {e}")
                last_error = e

        logger.error(f"All Gemini models failed, falling back to deterministic review. Last error: {last_error}")
        return self._build_deterministic_review(evidence, baseline_scores)

    def _build_prompt(self, ev: AggregatedEvidence, scores: CategoryScores) -> str:
        evidence_dict = {
            "url": ev.url,
            "website": {
                "title": ev.website.title,
                "status_code": ev.website.status_code,
                "load_time_ms": ev.website.load_time_ms,
                "h1_headings": ev.website.headings_h1,
                "h2_headings": ev.website.headings_h2,
                "navigation_items": ev.playwright.navigation_items,
                "text_snippet": ev.website.text_sample[:500],
                "links_count": ev.website.links_count,
                "buttons_count": ev.website.buttons_count,
                "forms_count": ev.website.forms_count,
                "images_count": ev.website.images_count,
            },
            "playwright_observations": {
                "console_errors": ev.playwright.console_errors,
                "broken_links": ev.playwright.broken_links,
                "responsive_observations": ev.playwright.responsive_observations,
                "mobile_horizontal_overflow": ev.playwright.mobile_has_horizontal_overflow,
            },
            "lighthouse_audits": {
                "performance_score": ev.lighthouse.performance,
                "accessibility_score": ev.lighthouse.accessibility,
                "best_practices_score": ev.lighthouse.best_practices,
                "seo_score": ev.lighthouse.seo,
                "first_contentful_paint": ev.lighthouse.fcp,
                "largest_contentful_paint": ev.lighthouse.lcp,
                "cumulative_layout_shift": ev.lighthouse.cls,
                "audit_flags": ev.lighthouse.key_findings,
            },
            "html_semantics": {
                "has_title": ev.html.has_title,
                "has_meta_description": ev.html.has_meta_description,
                "meta_description_sample": ev.html.meta_description[:120],
                "h1_count": ev.html.h1_count,
                "missing_alt_images": ev.html.missing_alt_images_count,
                "total_images": ev.html.total_images_count,
                "has_viewport_tag": ev.html.has_viewport_tag,
                "has_open_graph": ev.html.has_open_graph,
                "semantic_elements_used": ev.html.semantic_elements,
            },
            "baseline_calculated_scores": {
                "ui_ux": scores.ui_ux,
                "performance": scores.performance,
                "accessibility": scores.accessibility,
                "seo": scores.seo,
                "functionality": scores.functionality,
            },
        }

        return f"""You are a distinguished senior design engineer, full-stack web architect, and thoughtful product reviewer.
You are conducting a humanized, honest, and constructive evaluation of the live web project at: {ev.url}.

EVIDENCE COLLECTED FROM REAL BROWSER & AUDIT RUNS:
```json
{json.dumps(evidence_dict, indent=2)}
```

INSTRUCTIONS & TONE:
1. Speak conversationally and thoughtfully, like an experienced lead engineer giving one-on-one mentorship.
   AVOID robotic AI jargon like "As an AI language model", "Based on the provided data", or generic SaaS filler.
2. Formulate your opening summary conversationally: highlight what makes the site stand out first, then identify the single most impactful opportunity for improvement.
3. GROUND EVERY OBSERVATION IN REAL EVIDENCE from the JSON above. Never hallucinate features not evident in the data.
4. IMPORTANT SCOPE BOUNDARY: You cannot inspect private backend databases, server code, or backend infrastructure from a live URL alone. Explicitly state this boundary if relevant.
5. Scores must be on a 1.0 to 10.0 scale, consistent with the observed technical measurements.
6. Provide issues categorized by severity ('critical', 'high', 'medium', 'low') with real evidence and concrete, actionable steps.
7. Provide prioritized recommendations (1, 2, 3...) that an engineer can implement immediately.

RESPOND ONLY IN VALID JSON MATCHING THIS EXACT SCHEMA:
{{
  "overall_score": 8.2,
  "verdict_label": "Strong Foundation with High Polish",
  "summary": "Your project makes a compelling first impression. The visual hierarchy and clean navigation indicate careful attention to craft. The primary opportunity lies in fine-tuning image delivery and addressing missing alt attributes to ensure complete accessibility.",
  "scores": {{
    "ui_ux": 8.4,
    "performance": 7.8,
    "accessibility": 8.1,
    "seo": 8.9,
    "functionality": 8.5
  }},
  "strengths": [
    {{
      "title": "Clear Navigation & Visual Hierarchy",
      "description": "Navigation links are concise and the single prominent H1 heading creates an intuitive reading flow for visitors."
    }}
  ],
  "issues": [
    {{
      "severity": "medium",
      "title": "Unlabeled Images Impeding Screen Readers",
      "description": "Several images lack descriptive alt tags.",
      "evidence": "Observed 3 images lacking alt text in DOM audit.",
      "recommendation": "Add descriptive alt attributes to informative images or aria-hidden='true' to purely decorative graphics."
    }}
  ],
  "recommendations": [
    {{
      "priority": 1,
      "title": "Compress & optimize hero imagery",
      "description": "Convert PNG/JPEG assets to WebP format to reduce initial page weight."
    }}
  ]
}}
"""

    def _validate_and_sanitize(self, data: Dict[str, Any], baseline: CategoryScores) -> Dict[str, Any]:
        """Ensures all fields are safe, valid, and properly bounded."""
        raw_scores = data.get("scores", {})

        def clean_score(val, fallback):
            try:
                f = float(val)
                return round(max(1.0, min(10.0, f)), 1)
            except (ValueError, TypeError):
                return fallback

        ui_ux = clean_score(raw_scores.get("ui_ux"), baseline.ui_ux)
        performance = clean_score(raw_scores.get("performance"), baseline.performance)
        accessibility = clean_score(raw_scores.get("accessibility"), baseline.accessibility)
        seo = clean_score(raw_scores.get("seo"), baseline.seo)
        functionality = clean_score(raw_scores.get("functionality"), baseline.functionality)

        scores_obj = CategoryScores(
            ui_ux=ui_ux,
            performance=performance,
            accessibility=accessibility,
            seo=seo,
            functionality=functionality,
        )

        overall = ScoringService.calculate_overall_score(scores_obj)
        verdict = data.get("verdict_label") or ScoringService.get_verdict_label(overall)

        summary = data.get("summary", "").strip()
        if not summary:
            summary = (
                f"Your project is in good operational shape with an overall score of {overall}/10. "
                "The core experience is functional, and targeted adjustments will elevate its speed and accessibility."
            )

        strengths = []
        for s in data.get("strengths", []):
            if isinstance(s, dict) and s.get("title"):
                strengths.append(
                    StrengthItem(
                        title=str(s["title"])[:80],
                        description=str(s.get("description", ""))[:300],
                    )
                )

        issues = []
        for iss in data.get("issues", []):
            if isinstance(iss, dict) and iss.get("title"):
                sev = str(iss.get("severity", "medium")).lower()
                if sev not in ("critical", "high", "medium", "low"):
                    sev = "medium"
                issues.append(
                    IssueItem(
                        severity=sev,
                        title=str(iss["title"])[:90],
                        description=str(iss.get("description", ""))[:350],
                        evidence=str(iss.get("evidence", "Observed during live browser inspection"))[:250],
                        recommendation=str(iss.get("recommendation", ""))[:350],
                    )
                )

        recommendations = []
        for idx, rec in enumerate(data.get("recommendations", []), 1):
            if isinstance(rec, dict) and rec.get("title"):
                recommendations.append(
                    RecommendationItem(
                        priority=int(rec.get("priority", idx)),
                        title=str(rec["title"])[:90],
                        description=str(rec.get("description", ""))[:350],
                    )
                )

        return {
            "overall_score": overall,
            "verdict_label": verdict,
            "summary": summary,
            "scores": scores_obj,
            "strengths": strengths,
            "issues": issues,
            "recommendations": recommendations,
        }

    def _build_deterministic_review(
        self, ev: AggregatedEvidence, scores: CategoryScores
    ) -> Dict[str, Any]:
        """Provides high-quality editorial feedback when LLM API is unavailable."""
        overall = ScoringService.calculate_overall_score(scores)
        verdict = ScoringService.get_verdict_label(overall)

        strengths = []
        if ev.html.has_title:
            strengths.append(
                StrengthItem(
                    title="Descriptive Page Identity",
                    description=f"The document title '{ev.website.title[:50]}' clearly communicates the site purpose.",
                )
            )
        if ev.website.links_count > 0:
            strengths.append(
                StrengthItem(
                    title="Cohesive Information Architecture",
                    description=f"Clean internal navigation structure discovered across {ev.website.links_count} interactive links.",
                )
            )
        if not ev.playwright.mobile_has_horizontal_overflow:
            strengths.append(
                StrengthItem(
                    title="Mobile Viewport Adaptability",
                    description="Elements adjust cleanly within mobile boundaries without unintended horizontal overflow.",
                )
            )

        issues = []
        if ev.html.missing_alt_images_count > 0:
            issues.append(
                IssueItem(
                    severity="high" if ev.html.missing_alt_images_count > 2 else "medium",
                    title="Missing Image Alt Attributes",
                    description=f"{ev.html.missing_alt_images_count} images do not provide accessible description tags.",
                    evidence=f"{ev.html.missing_alt_images_count} of {ev.html.total_images_count} images lack alt attributes.",
                    recommendation="Add descriptive alt tags to communicate visual context to assistive technologies.",
                )
            )

        if not ev.html.has_meta_description:
            issues.append(
                IssueItem(
                    severity="medium",
                    title="Missing Meta Description Tag",
                    description="Search engines use meta descriptions as snippet previews in search result listings.",
                    evidence="No <meta name='description'> found in document head.",
                    recommendation="Include an informative 120-160 character meta description summarizing the page.",
                )
            )

        if ev.playwright.console_errors:
            issues.append(
                IssueItem(
                    severity="high",
                    title="Client-Side JavaScript Console Exceptions",
                    description=f"{len(ev.playwright.console_errors)} unhandled exceptions detected in browser runtime.",
                    evidence=f"Console error: {ev.playwright.console_errors[0][:120]}",
                    recommendation="Audit front-end error handlers and check missing assets or null pointer references.",
                )
            )

        recommendations = [
            RecommendationItem(
                priority=1,
                title="Audit semantic hierarchy and meta tags",
                description="Ensure every page defines a unique title, meta description, and exactly one prominent H1 heading.",
            ),
            RecommendationItem(
                priority=2,
                title="Optimize static assets and image formats",
                description="Adopt modern WebP/AVIF formats with explicit width and height dimensions to reduce layout shifts.",
            ),
        ]

        summary = (
            f"Your project is in solid condition with an overall rating of {overall}/10. "
            f"The layout and core functionality provide a dependable experience. "
            f"Addressing the highlighted accessibility and metadata suggestions will ensure full polish across all devices."
        )

        return {
            "overall_score": overall,
            "verdict_label": verdict,
            "summary": summary,
            "scores": scores,
            "strengths": strengths,
            "issues": issues,
            "recommendations": recommendations,
        }
