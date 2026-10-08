from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class AnalyzeRequest(BaseModel):
    url: str = Field(..., description="The live website URL to evaluate")

class WebsiteOverview(BaseModel):
    title: str = ""
    resolved_url: str = ""
    status_code: int = 200
    load_time_ms: float = 0.0
    text_sample: str = ""
    headings_h1: List[str] = []
    headings_h2: List[str] = []
    links_count: int = 0
    buttons_count: int = 0
    forms_count: int = 0
    images_count: int = 0

class PlaywrightObservations(BaseModel):
    screenshot_base64: Optional[str] = None
    console_errors: List[str] = []
    console_warnings: List[str] = []
    broken_links: List[str] = []
    responsive_observations: List[str] = []
    mobile_has_horizontal_overflow: bool = False
    navigation_items: List[str] = []

class LighthouseMetrics(BaseModel):
    performance: Optional[float] = None
    accessibility: Optional[float] = None
    best_practices: Optional[float] = None
    seo: Optional[float] = None
    fcp: Optional[str] = None
    lcp: Optional[str] = None
    cls: Optional[str] = None
    speed_index: Optional[str] = None
    raw_status: str = "completed"
    key_findings: List[str] = []

class HtmlStructure(BaseModel):
    has_title: bool = False
    title_text: str = ""
    has_meta_description: bool = False
    meta_description: str = ""
    h1_count: int = 0
    h2_count: int = 0
    missing_alt_images_count: int = 0
    total_images_count: int = 0
    has_viewport_tag: bool = False
    has_favicon: bool = False
    has_canonical: bool = False
    has_open_graph: bool = False
    semantic_elements: List[str] = []

class AggregatedEvidence(BaseModel):
    url: str
    analyzed_at: str
    website: WebsiteOverview
    playwright: PlaywrightObservations
    lighthouse: LighthouseMetrics
    html: HtmlStructure

class StrengthItem(BaseModel):
    title: str
    description: str

class IssueItem(BaseModel):
    severity: str = Field(..., description="critical | high | medium | low")
    title: str
    description: str
    evidence: str
    recommendation: str

class RecommendationItem(BaseModel):
    priority: int
    title: str
    description: str

class CategoryScores(BaseModel):
    ui_ux: float
    performance: float
    accessibility: float
    seo: float
    functionality: float

class AnalysisReport(BaseModel):
    url: str
    overall_score: float
    verdict_label: str = ""
    summary: str
    scores: CategoryScores
    strengths: List[StrengthItem]
    issues: List[IssueItem]
    recommendations: List[RecommendationItem]
    screenshot_base64: Optional[str] = None
    analyzed_at: str
    evidence_snapshot: Dict[str, Any]
    limitations_notice: str = (
        "Note: This review is synthesized purely from publicly observable live front-end behavior, "
        "rendered DOM structure, and network performance. Private server-side architecture, proprietary database "
        "logic, and source code security cannot be inspected from a public URL."
    )
