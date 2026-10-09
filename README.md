# AI Project Reviewer

> **Thoughtful, evidence-based, and humanized evaluations for live web projects.**  
> Built with React, FastAPI, Playwright, Lighthouse, BeautifulSoup, and Google Gemini.

---

## Live Link: https://project-lens-ashen.vercel.app/

## 1. Overview

**AI Project Reviewer** is a full-stack web application that allows any developer or founder to enter the live URL of their deployed web project and receive an honest, personalized, and editorial evaluation.

Unlike generic prompts that ask an LLM to blindly "review a URL," the AI Project Reviewer first gathers **hard, objective evidence** from the website using automated browser telemetry:
- **Playwright** opens the site, inspects desktop (1280×800) and mobile (390×844) viewports, measures page load duration, captures high-resolution screenshots, checks internal links for 404/500 errors, and logs unhandled JavaScript runtime exceptions.
- **Lighthouse** audits Core Web Vitals (FCP, LCP, CLS, Speed Index) and technical scores for Performance, Accessibility, Best Practices, and SEO.
- **BeautifulSoup** parses HTML semantic tags (`<header>`, `<main>`, `<nav>`, `<footer>`), heading hierarchy (H1/H2 distribution), Open Graph social previews, and image accessibility attributes.
- **Google Gemini** reasons over this structured evidence object to synthesize a conversational, humanized review with calibrated 0–10 category scores, specific strengths, prioritized issues (Critical, High, Medium, Low), and an actionable roadmap.

---

## 2. Key Features

- **Warm Editorial UI/UX**: Designed with a calm, tactile palette (Warm White, Ivory, Charcoal, Soft Sage, Dusty Blue, and Lavender accents). Avoids neon AI gradients and cluttered SaaS templates.
- **Humanized Conversational Voice**: Replaces robotic loading texts with natural progress markers (*"Let's take a look at your project"*, *"Exploring the interface"*, *"Checking performance & vitals"*).
- **Dual-Viewport Inspection**: Tests both desktop presentation and mobile responsive behavior (detecting horizontal overflow bugs where elements bleed past 390px width).
- **Interactive Screenshot Inspector**: View the analyzed site's visual capture with an expandable fullscreen modal.
- **Severity-Grouped Issue Explorer**: Filter discovered issues by *Critical*, *High*, *Medium*, or *Low* impact, with concrete observed evidence and remediation steps.
- **Prioritized Roadmap**: Step-by-step action items ranked by engineering impact.
- **Server-Sent Events (SSE) Streaming**: Real-time progress updates streaming directly from the backend to the browser.
- **Resilient Fallback Engine**: If Lighthouse or external APIs experience transient network spikes, the system automatically preserves all collected DOM/Playwright data and calculates deterministic baseline scores so an audit is always successfully delivered.

---

## 3. Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite 6, Tailwind CSS 3, Lucide Icons |
| **Backend** | Python 3.11+, FastAPI, Uvicorn, Pydantic v2 |
| **Browser Automation** | Playwright (Async Chromium / Microsoft Edge headless) |
| **Auditing & Telemetry** | Google Lighthouse CLI 13.5+, BeautifulSoup4 |
| **Artificial Intelligence** | Google Gemini SDK (`google-genai` with `gemini-3.5-flash` / `gemini-3.8-flash`) |
| **Communication** | JSON REST API & Server-Sent Events (`/api/analyze/stream`) |

---

## 4. Architecture

```
[ User Browser ]
       │
       ▼ (HTTP / SSE)
[ React + Vite Frontend ]
       │
       ▼ (POST /api/analyze/stream)
[ FastAPI Backend ]
       │
       ├──► 1. URL Validation & SSRF Guard (validators.py)
       ├──► 2. Playwright Headless Browser (playwright_analyzer.py)
       │       └── Viewport testing, DOM extraction, screenshot, console logs
       ├──► 3. Lighthouse CLI Audit (lighthouse_analyzer.py)
       │       └── Performance, Accessibility, Best Practices, SEO vitals
       ├──► 4. BeautifulSoup HTML Parser (html_analyzer.py)
       │       └── Landmark semantics, H1/H2 checks, missing alt images
       ├──► 5. Evidence Aggregator (analysis_service.py)
       ├──► 6. Google Gemini Reasoning (gemini_service.py)
       │       └── Strict evidence reasoning into structured JSON
       └──► 7. Scoring Service (scoring_service.py)
               └── 0–10 score normalization & verdict synthesis
```

---

## 5. Local Setup

### Prerequisites
- **Node.js** (v18 or higher)
- **Python** (v3.11 or higher)
- **Google Gemini API Key** ([Get a key here](https://aistudio.google.com/app/apikey))

### Clone & Configure Environment

```bash
git clone <your-repo-url>
cd ai-project-reviewer

# Create environment configuration
cp .env.example backend/.env
```

Edit `backend/.env` with your Gemini API key:
```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
PORT=8000
HOST=0.0.0.0
FRONTEND_URL=http://localhost:5173
```

---

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
.\venv\Scripts\activate
# Linux/Mac:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Install Playwright browser binary
playwright install chromium

# Start FastAPI development server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
The backend API is now running at `http://localhost:8000` (docs at `http://localhost:8000/docs`).

---

### Frontend Setup

In a new terminal window:

```bash
cd frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 6. Testing

### Run Standalone Backend Verification
You can test the backend pipeline on any live URL:
```bash
cd backend
.\venv\Scripts\python -c "import asyncio; from services.analysis_service import AnalysisService; asyncio.run(AnalysisService().run_full_analysis('https://en.wikipedia.org'))"
```

### Build Frontend Production Bundle
```bash
cd frontend
npm run build
```

---

## 7. Deployment Instructions

### Frontend Deployment (Vercel)
1. Push your repository to GitHub.
2. Link the repository on [Vercel](https://vercel.com).
3. Set **Root Directory** to `frontend`.
4. Configure environment variable:
   - `VITE_API_URL`: `https://your-backend-service.onrender.com`
5. Deploy. `frontend/vercel.json` ensures client-side routing works smoothly.

### Backend Deployment (Render)
1. In Render, select **New Web Service** and connect your repository.
2. Use the included `render.yaml` or set:
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt && playwright install chromium --with-deps`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
3. Add Environment Variables:
   - `GEMINI_API_KEY`: `your_gemini_api_key`
   - `FRONTEND_URL`: `https://your-project.vercel.app`

---

## 8. Known Limitations (V1 Scope)

- **Frontend-Only Visibility**: The system evaluates publicly observable front-end behavior, network telemetry, and rendered DOM structure. It cannot inspect private server-side source code, internal databases, or backend microservices.
- **Authentication Walls**: Websites behind login screens or strict Cloudflare CAPTCHA challenges cannot be fully browsed.
- **Single-Page Crawl**: V1 focuses on the primary submitted landing URL rather than a full multi-page crawl.

---

## 9. Future Roadmap (V2)

- GitHub repository integration for source code review
- Multi-page sitemap crawling and page comparisons
- Downloadable PDF reports with shareable permalinks
- Historical audit comparison and score improvement tracking
- Automated accessibility fix suggestions with copy-paste code snippets

---

## 10. License

MIT License. Designed with care for developers, indie hackers, and product teams.
