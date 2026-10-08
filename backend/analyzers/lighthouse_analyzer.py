import os
import json
import logging
import subprocess
import shutil
from typing import Dict, Any, Optional
from models.schemas import LighthouseMetrics

logger = logging.getLogger(__name__)

class LighthouseAnalyzer:
    """Executes Google Lighthouse audit via CLI subprocess with graceful fallback."""

    def __init__(self):
        self.chrome_path = self._detect_chrome_path()

    def _detect_chrome_path(self) -> Optional[str]:
        # 1. Check environment variable
        env_path = os.getenv("CHROME_PATH")
        if env_path and os.path.exists(env_path):
            return env_path

        # 2. Check standard Windows Edge / Chrome locations
        candidates = [
            r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
            r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
            r"C:\Program Files\Google\Chrome\Application\chrome.exe",
            r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
            os.path.expanduser(r"~\AppData\Local\Google\Chrome\Application\chrome.exe"),
        ]
        for p in candidates:
            if os.path.exists(p):
                return p

        # 3. Check Linux/Mac which in PATH
        for binary in ["google-chrome", "google-chrome-stable", "chromium", "chromium-browser", "msedge"]:
            path = shutil.which(binary)
            if path:
                return path

        return None

    def analyze(self, url: str, timeout_seconds: int = 50) -> LighthouseMetrics:
        """Runs lighthouse and parses performance, accessibility, best-practices, and SEO scores."""
        logger.info(f"Starting Lighthouse analysis for: {url}")

        cmd = [
            "npx",
            "-y",
            "lighthouse",
            url,
            "--output=json",
            "--output-path=stdout",
            "--quiet",
            '--chrome-flags="--headless --no-sandbox --disable-dev-shm-usage --disable-gpu"',
            "--only-categories=performance,accessibility,best-practices,seo",
            "--max-wait-for-load=25000",
        ]

        env = os.environ.copy()
        if self.chrome_path:
            env["CHROME_PATH"] = self.chrome_path

        try:
            # Run via shell=True on Windows to resolve npx.cmd correctly with explicit utf-8 encoding
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                encoding="utf-8",
                errors="replace",
                timeout=timeout_seconds,
                env=env,
                shell=(os.name == "nt"),
            )

            if result.returncode != 0:
                logger.warning(f"Lighthouse returned non-zero code {result.returncode}: {result.stderr[:300]}")
                return self._build_fallback(status="completed_with_partial_heuristics")

            # Lighthouse writes JSON output to stdout
            raw_output = result.stdout.strip()
            if not raw_output:
                logger.warning("Lighthouse returned empty stdout")
                return self._build_fallback(status="empty_report")

            # Extract json if there are warnings before json
            json_start = raw_output.find("{")
            if json_start == -1:
                return self._build_fallback(status="invalid_json")

            data = json.loads(raw_output[json_start:])
            categories = data.get("categories", {})
            audits = data.get("audits", {})

            perf_score = categories.get("performance", {}).get("score")
            a11y_score = categories.get("accessibility", {}).get("score")
            bp_score = categories.get("best-practices", {}).get("score")
            seo_score = categories.get("seo", {}).get("score")

            fcp = audits.get("first-contentful-paint", {}).get("displayValue")
            lcp = audits.get("largest-contentful-paint", {}).get("displayValue")
            cls = audits.get("cumulative-layout-shift", {}).get("displayValue")
            speed_index = audits.get("speed-index", {}).get("displayValue")

            key_findings = []
            for audit_key, audit_data in audits.items():
                if audit_data.get("score") is not None and audit_data["score"] < 0.6:
                    title = audit_data.get("title")
                    if title and title not in key_findings:
                        key_findings.append(title)
                if len(key_findings) >= 6:
                    break

            return LighthouseMetrics(
                performance=round(perf_score * 10, 1) if perf_score is not None else None,
                accessibility=round(a11y_score * 10, 1) if a11y_score is not None else None,
                best_practices=round(bp_score * 10, 1) if bp_score is not None else None,
                seo=round(seo_score * 10, 1) if seo_score is not None else None,
                fcp=fcp,
                lcp=lcp,
                cls=cls,
                speed_index=speed_index,
                raw_status="success",
                key_findings=key_findings,
            )

        except subprocess.TimeoutExpired:
            logger.warning(f"Lighthouse timed out after {timeout_seconds}s for {url}")
            return self._build_fallback(status="timeout_fallback")
        except Exception as e:
            logger.error(f"Lighthouse analysis encountered error: {e}", exc_info=True)
            return self._build_fallback(status="execution_error")

    def _build_fallback(self, status: str) -> LighthouseMetrics:
        """Returns baseline metrics object if external lighthouse run is impeded."""
        return LighthouseMetrics(
            performance=None,
            accessibility=None,
            best_practices=None,
            seo=None,
            fcp=None,
            lcp=None,
            cls=None,
            speed_index=None,
            raw_status=status,
            key_findings=[],
        )
