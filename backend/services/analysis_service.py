import asyncio
import logging
from datetime import datetime, timezone
from typing import AsyncGenerator, Dict, Any, Callable, Optional

from models.schemas import (
    AggregatedEvidence,
    AnalysisReport,
    CategoryScores,
)
from utils.validators import validate_project_url
from analyzers.playwright_analyzer import PlaywrightAnalyzer
from analyzers.lighthouse_analyzer import LighthouseAnalyzer
from analyzers.html_analyzer import HtmlAnalyzer
from services.scoring_service import ScoringService
from services.gemini_service import GeminiService

logger = logging.getLogger(__name__)

class AnalysisService:
    """Orchestrates end-to-end evidence gathering and AI evaluation."""

    def __init__(self):
        self.playwright_analyzer = PlaywrightAnalyzer()
        self.lighthouse_analyzer = LighthouseAnalyzer()
        self.html_analyzer = HtmlAnalyzer()
        self.scoring_service = ScoringService()
        self.gemini_service = GeminiService()

    async def run_full_analysis(
        self,
        raw_url: str,
        progress_callback: Optional[Callable[[str, str], None]] = None,
    ) -> AnalysisReport:
        """Executes the complete pipeline synchronously or with a callback."""

        async def notify(stage: str, message: str):
            if progress_callback:
                if asyncio.iscoroutinefunction(progress_callback):
                    await progress_callback(stage, message)
                else:
                    progress_callback(stage, message)

        # 1. Validation
        await notify("connecting", "Let's take a look at your project. Validating address...")
        is_valid, normalized_url, error_msg = validate_project_url(raw_url)
        if not is_valid:
            raise ValueError(error_msg)

        await notify("exploring", "I'm exploring the interface now with a browser...")
        
        # 2. Playwright Analysis
        try:
            website_info, playwright_info, rendered_html = await self.playwright_analyzer.analyze(normalized_url)
        except Exception as e:
            logger.error(f"Playwright run failed: {e}", exc_info=True)
            raise RuntimeError(f"We couldn't open this website properly: {str(e)[:100]}")

        # 3. HTML & DOM Analysis
        await notify("inspecting_dom", "Examining page structure, headings, and semantics...")
        html_info = self.html_analyzer.analyze(rendered_html)

        # 4. Lighthouse Analysis (Run concurrently or with safe timeout)
        await notify("auditing_performance", "Looking at performance, accessibility, and SEO...")
        loop = asyncio.get_event_loop()
        # Run lighthouse in thread pool to not block asyncio event loop
        try:
            lighthouse_info = await loop.run_in_executor(
                None, self.lighthouse_analyzer.analyze, normalized_url, 35
            )
        except Exception as e:
            logger.warning(f"Lighthouse execution skipped: {e}")
            lighthouse_info = self.lighthouse_analyzer._build_fallback(status="skipped")

        # 5. Aggregate Evidence
        analyzed_timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
        evidence = AggregatedEvidence(
            url=normalized_url,
            analyzed_at=analyzed_timestamp,
            website=website_info,
            playwright=playwright_info,
            lighthouse=lighthouse_info,
            html=html_info,
        )

        # 6. Baseline Scoring
        baseline_scores = self.scoring_service.calculate_baseline_scores(evidence)

        # 7. Gemini Reasoning
        await notify("synthesizing", "Synthesizing insights and preparing your feedback...")
        review_result = await self.gemini_service.generate_review(evidence, baseline_scores)

        # 8. Assemble final report
        scores: CategoryScores = review_result["scores"]
        overall_score = float(review_result["overall_score"])
        verdict = review_result.get("verdict_label") or self.scoring_service.get_verdict_label(overall_score)

        report = AnalysisReport(
            url=normalized_url,
            overall_score=overall_score,
            verdict_label=verdict,
            summary=review_result["summary"],
            scores=scores,
            strengths=review_result["strengths"],
            issues=review_result["issues"],
            recommendations=review_result["recommendations"],
            screenshot_base64=playwright_info.screenshot_base64,
            analyzed_at=analyzed_timestamp,
            evidence_snapshot={
                "website_title": website_info.title,
                "status_code": website_info.status_code,
                "load_time_ms": website_info.load_time_ms,
                "links_count": website_info.links_count,
                "buttons_count": website_info.buttons_count,
                "forms_count": website_info.forms_count,
                "h1_count": html_info.h1_count,
                "missing_alt_images": html_info.missing_alt_images_count,
                "console_errors_count": len(playwright_info.console_errors),
                "mobile_has_horizontal_overflow": playwright_info.mobile_has_horizontal_overflow,
                "lighthouse_performance": lighthouse_info.performance,
                "lighthouse_accessibility": lighthouse_info.accessibility,
                "lighthouse_seo": lighthouse_info.seo,
            },
        )

        await notify("complete", "Here's what I think.")
        return report
