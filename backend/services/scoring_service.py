from typing import Dict, Any
from models.schemas import CategoryScores, AggregatedEvidence

class ScoringService:
    """Calculates, normalizes, and validates category scores and overall rating."""

    @staticmethod
    def calculate_baseline_scores(evidence: AggregatedEvidence) -> CategoryScores:
        """Derives deterministic initial scores (0-10) directly from technical observations."""
        lh = evidence.lighthouse
        html = evidence.html
        pw = evidence.playwright
        site = evidence.website

        # 1. Performance (0-10)
        if lh.performance is not None:
            perf_score = float(lh.performance)
        else:
            # Synthetic heuristic if lighthouse unavailable
            perf_score = 8.5
            if site.load_time_ms > 3500:
                perf_score -= 2.0
            elif site.load_time_ms > 1800:
                perf_score -= 1.0
            if site.images_count > 30:
                perf_score -= 0.5

        # 2. Accessibility (0-10)
        if lh.accessibility is not None:
            a11y_score = float(lh.accessibility)
        else:
            a11y_score = 9.0
            if html.missing_alt_images_count > 0:
                ratio = html.missing_alt_images_count / max(html.total_images_count, 1)
                a11y_score -= min(3.0, round(ratio * 3.5, 1))
            if not html.has_title:
                a11y_score -= 1.5
            if html.h1_count == 0:
                a11y_score -= 1.0
            elif html.h1_count > 1:
                a11y_score -= 0.5

        # 3. SEO (0-10)
        if lh.seo is not None:
            seo_score = float(lh.seo)
        else:
            seo_score = 8.0
            if html.has_title:
                seo_score += 0.5
            else:
                seo_score -= 2.0
            if html.has_meta_description:
                seo_score += 0.5
            else:
                seo_score -= 1.5
            if html.has_viewport_tag:
                seo_score += 0.5
            if html.has_open_graph:
                seo_score += 0.5

        # 4. Functionality (0-10)
        func_score = 9.0
        if pw.console_errors:
            func_score -= min(3.0, len(pw.console_errors) * 0.8)
        if pw.broken_links:
            func_score -= min(2.5, len(pw.broken_links) * 1.0)
        if site.status_code >= 400:
            func_score = 3.0

        # 5. UI / UX (0-10)
        ui_score = 8.5
        if pw.mobile_has_horizontal_overflow:
            ui_score -= 2.0
        if not html.has_viewport_tag:
            ui_score -= 1.5
        if site.buttons_count == 0 and site.links_count == 0:
            ui_score -= 2.0

        # Clamp all scores to 1.0 - 10.0 range
        def clamp(val: float) -> float:
            return round(max(1.0, min(10.0, float(val))), 1)

        return CategoryScores(
            ui_ux=clamp(ui_score),
            performance=clamp(perf_score),
            accessibility=clamp(a11y_score),
            seo=clamp(seo_score),
            functionality=clamp(func_score),
        )

    @staticmethod
    def calculate_overall_score(scores: CategoryScores) -> float:
        """Weighted score calculation."""
        overall = (
            scores.ui_ux * 0.25
            + scores.performance * 0.25
            + scores.accessibility * 0.20
            + scores.seo * 0.15
            + scores.functionality * 0.15
        )
        return round(overall, 1)

    @staticmethod
    def get_verdict_label(overall_score: float) -> str:
        if overall_score >= 9.0:
            return "Exceptional Polish & Execution"
        elif overall_score >= 8.0:
            return "Strong Foundation with High Polish"
        elif overall_score >= 7.0:
            return "Solid Project with Refinement Opportunities"
        elif overall_score >= 5.5:
            return "Promising Concept with Key Technical Gaps"
        else:
            return "Requires Structural & Usability Overhaul"
