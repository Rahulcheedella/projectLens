import base64
import time
import logging
from typing import Tuple, Dict, Any, List
from playwright.async_api import async_playwright, Browser, Page, Response
from models.schemas import WebsiteOverview, PlaywrightObservations

logger = logging.getLogger(__name__)

class PlaywrightAnalyzer:
    """Uses Playwright to browse live websites, evaluate viewport responsiveness, and collect evidence."""

    async def analyze(self, url: str, timeout_ms: int = 25000) -> Tuple[WebsiteOverview, PlaywrightObservations, str]:
        console_errors: List[str] = []
        console_warnings: List[str] = []
        start_time = time.time()

        website = WebsiteOverview()
        observations = PlaywrightObservations()
        rendered_html = ""

        async with async_playwright() as p:
            # Launch chromium with resilient fallback to msedge if needed
            args = [
                "--no-sandbox",
                "--disable-dev-shm-usage",
                "--disable-gpu",
                "--disable-extensions",
            ]
            try:
                browser = await p.chromium.launch(headless=True, args=args)
            except Exception as launch_err:
                logger.info(f"Standard chromium launch failed ({launch_err}), attempting msedge channel...")
                browser = await p.chromium.launch(channel="msedge", headless=True, args=args)

            # --- DESKTOP VIEWPORT RUN ---
            context = await browser.new_context(
                viewport={"width": 1280, "height": 800},
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                ignore_https_errors=True,
            )

            page = await context.new_page()

            # Attach console listeners
            page.on(
                "console",
                lambda msg: (
                    console_errors.append(msg.text[:200])
                    if msg.type == "error"
                    else (
                        console_warnings.append(msg.text[:200])
                        if msg.type == "warning"
                        else None
                    )
                ),
            )

            try:
                response = await page.goto(
                    url,
                    wait_until="domcontentloaded",
                    timeout=timeout_ms,
                )

                # Allow dynamic single-page applications (React/Next/Vite) a short settling period
                await page.wait_for_timeout(2000)

                load_time_ms = round((time.time() - start_time) * 1000, 1)
                website.load_time_ms = load_time_ms
                website.status_code = response.status if response else 200
                website.resolved_url = page.url
                website.title = (await page.title()).strip()

                rendered_html = await page.content()

                # Extract headings
                h1_elements = await page.query_selector_all("h1")
                h1_texts = []
                for h in h1_elements[:5]:
                    t = (await h.inner_text()).strip()
                    if t:
                        h1_texts.append(t)
                website.headings_h1 = h1_texts

                h2_elements = await page.query_selector_all("h2")
                h2_texts = []
                for h in h2_elements[:8]:
                    t = (await h.inner_text()).strip()
                    if t:
                        h2_texts.append(t)
                website.headings_h2 = h2_texts

                # Extract element counts
                links = await page.query_selector_all("a")
                website.links_count = len(links)

                buttons = await page.query_selector_all("button, [role='button']")
                website.buttons_count = len(buttons)

                forms = await page.query_selector_all("form")
                website.forms_count = len(forms)

                images = await page.query_selector_all("img")
                website.images_count = len(images)

                # Navigation links
                nav_items = []
                nav_elements = await page.query_selector_all("nav a, header a")
                for n in nav_elements[:8]:
                    txt = (await n.inner_text()).strip()
                    if txt and len(txt) < 30 and txt not in nav_items:
                        nav_items.append(txt)
                observations.navigation_items = nav_items

                # Text sample for context
                body_text = await page.inner_text("body")
                clean_text = " ".join(body_text.split())
                website.text_sample = clean_text[:1200]

                # Check sample of internal links for broken status
                sample_urls = []
                for link in links[:12]:
                    href = await link.get_attribute("href")
                    if href and not href.startswith(("#", "javascript:", "mailto:", "tel:")):
                        if href.startswith("/"):
                            sample_urls.append(url.rstrip("/") + href)
                        elif href.startswith("http"):
                            sample_urls.append(href)

                broken_links = []
                for test_link in sample_urls[:5]:
                    try:
                        res = await page.request.fetch(test_link, timeout=4000)
                        if res.status >= 400:
                            broken_links.append(f"{test_link} (HTTP {res.status})")
                    except Exception:
                        pass
                observations.broken_links = broken_links

                # Capture desktop screenshot (quality-optimized JPEG)
                screenshot_bytes = await page.screenshot(
                    type="jpeg",
                    quality=80,
                    full_page=False,
                )
                observations.screenshot_base64 = base64.b64encode(screenshot_bytes).decode("utf-8")

            except Exception as e:
                logger.error(f"Playwright navigation error: {e}", exc_info=True)
                website.title = website.title or "Error loading page"
                observations.responsive_observations.append(f"Browser navigation encountered an issue: {str(e)[:150]}")

            finally:
                await context.close()

            # --- MOBILE RESPONSIVE CHECK ---
            try:
                mobile_context = await browser.new_context(
                    viewport={"width": 390, "height": 844},  # Modern mobile viewport (iPhone 12/13/14)
                    is_mobile=True,
                    user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1",
                    ignore_https_errors=True,
                )
                mobile_page = await mobile_context.new_page()
                await mobile_page.goto(url, wait_until="domcontentloaded", timeout=15000)
                await mobile_page.wait_for_timeout(1000)

                # Check for horizontal scroll overflow bug
                overflow = await mobile_page.evaluate(
                    "() => document.documentElement.scrollWidth > window.innerWidth"
                )
                observations.mobile_has_horizontal_overflow = bool(overflow)

                if overflow:
                    observations.responsive_observations.append(
                        "Mobile viewport has horizontal content overflow (elements bleed past 390px width)."
                    )
                else:
                    observations.responsive_observations.append(
                        "Mobile layout fits cleanly within standard 390px viewport width without unintended horizontal scrolling."
                    )

                await mobile_context.close()
            except Exception as e:
                logger.warning(f"Mobile responsive inspection failed: {e}")
                observations.responsive_observations.append("Mobile viewport check could not complete.")

            await browser.close()

        observations.console_errors = console_errors[:10]
        observations.console_warnings = console_warnings[:10]

        return website, observations, rendered_html
