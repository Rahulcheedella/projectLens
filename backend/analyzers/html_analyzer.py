import re
from typing import Dict, Any, List
from bs4 import BeautifulSoup
from models.schemas import HtmlStructure

class HtmlAnalyzer:
    """Analyzes raw and DOM-rendered HTML for semantics, accessibility markers, and SEO tags."""

    def analyze(self, html_content: str) -> HtmlStructure:
        if not html_content:
            return HtmlStructure()

        soup = BeautifulSoup(html_content, "html.parser")

        # Title
        title_tag = soup.find("title")
        has_title = bool(title_tag and title_tag.get_text(strip=True))
        title_text = title_tag.get_text(strip=True) if has_title else ""

        # Meta description
        meta_desc = soup.find("meta", attrs={"name": re.compile(r"^description$", re.I)})
        has_meta_desc = False
        meta_desc_text = ""
        if meta_desc and meta_desc.get("content"):
            meta_desc_text = meta_desc.get("content", "").strip()
            has_meta_desc = bool(meta_desc_text)

        # Headings
        h1_tags = soup.find_all("h1")
        h1_count = len(h1_tags)

        h2_tags = soup.find_all("h2")
        h2_count = len(h2_tags)

        # Images & Alt
        images = soup.find_all("img")
        total_images = len(images)
        missing_alt = 0
        for img in images:
            alt = img.get("alt")
            if alt is None or alt.strip() == "":
                # Check aria-label or decorative presentation
                aria_hidden = img.get("aria-hidden") == "true"
                role = img.get("role") == "presentation"
                if not (aria_hidden or role):
                    missing_alt += 1

        # Viewport meta
        viewport = soup.find("meta", attrs={"name": re.compile(r"^viewport$", re.I)})
        has_viewport = bool(viewport and viewport.get("content"))

        # Favicon
        favicon = soup.find("link", attrs={"rel": re.compile(r"icon", re.I)})
        has_favicon = bool(favicon and favicon.get("href"))

        # Canonical
        canonical = soup.find("link", attrs={"rel": re.compile(r"canonical", re.I)})
        has_canonical = bool(canonical and canonical.get("href"))

        # OpenGraph
        og_title = soup.find("meta", attrs={"property": "og:title"})
        has_og = bool(og_title and og_title.get("content"))

        # Semantic landmarks
        semantic_tags = ["header", "nav", "main", "footer", "section", "article", "aside"]
        found_semantics = [tag for tag in semantic_tags if soup.find(tag) is not None]

        return HtmlStructure(
            has_title=has_title,
            title_text=title_text,
            has_meta_description=has_meta_desc,
            meta_description=meta_desc_text,
            h1_count=h1_count,
            h2_count=h2_count,
            missing_alt_images_count=missing_alt,
            total_images_count=total_images,
            has_viewport_tag=has_viewport,
            has_favicon=has_favicon,
            has_canonical=has_canonical,
            has_open_graph=has_og,
            semantic_elements=found_semantics,
        )
