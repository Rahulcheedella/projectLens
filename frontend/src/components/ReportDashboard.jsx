import React, { useState } from 'react';
import { 
  ExternalLink, 
  CheckCircle2, 
  AlertTriangle, 
  AlertOctagon, 
  Info, 
  Maximize2, 
  X, 
  Copy, 
  Check, 
  Sparkles, 
  Smartphone, 
  Monitor, 
  Clock, 
  Layers,
  ChevronDown,
  ChevronUp,
  Share2
} from 'lucide-react';

export default function ReportDashboard({ report, onReset }) {
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [isScreenshotZoomed, setIsScreenshotZoomed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isTechDetailsOpen, setIsTechDetailsOpen] = useState(false);

  if (!report) return null;

  const {
    url,
    overall_score,
    verdict_label,
    summary,
    scores,
    strengths = [],
    issues = [],
    recommendations = [],
    screenshot_base64,
    analyzed_at,
    evidence_snapshot = {},
    limitations_notice,
  } = report;

  // Severity count
  const severityCounts = {
    critical: issues.filter(i => i.severity === 'critical').length,
    high: issues.filter(i => i.severity === 'high').length,
    medium: issues.filter(i => i.severity === 'medium').length,
    low: issues.filter(i => i.severity === 'low').length,
  };

  const filteredIssues = selectedSeverity === 'all' 
    ? issues 
    : issues.filter(i => i.severity === selectedSeverity);

  const handleCopySummary = () => {
    const text = `AI Project Review for ${url}\nOverall Score: ${overall_score}/10 (${verdict_label})\n\n${summary}\n\nKey Recommendations:\n${recommendations.map(r => `${r.priority}. ${r.title}`).join('\n')}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper for score color classes (editorial subdued tones)
  const getScoreTheme = (score) => {
    if (score >= 8.5) return { bg: 'bg-sage-50', text: 'text-sage-700', border: 'border-sage-200', bar: 'bg-sage-500' };
    if (score >= 7.0) return { bg: 'bg-dusty-50', text: 'text-dusty-700', border: 'border-dusty-200', bar: 'bg-dusty-500' };
    if (score >= 5.5) return { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200', bar: 'bg-amber-500' };
    return { bg: 'bg-terracotta-50', text: 'text-terracotta-700', border: 'border-terracotta-200', bar: 'bg-terracotta-500' };
  };

  const overallTheme = getScoreTheme(overall_score);

  return (
    <div className="max-w-5xl mx-auto py-8 sm:py-12 px-4 sm:px-6 space-y-10 animate-fade-in">
      
      {/* Top Meta Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E8E2D5]">
        <div>
          <div className="flex items-center gap-2 text-xs text-charcoal-500 mb-1">
            <span className="font-medium text-charcoal-400">Reviewed target</span>
            <span>&middot;</span>
            <span className="flex items-center gap-1 font-mono">{analyzed_at}</span>
          </div>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-base sm:text-lg font-semibold text-charcoal-900 hover:text-dusty-600 transition-colors"
          >
            <span className="truncate max-w-md sm:max-w-lg">{url}</span>
            <ExternalLink className="w-4 h-4 shrink-0 text-charcoal-400" />
          </a>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopySummary}
            className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-[#D5CDC0] bg-white text-charcoal-700 hover:bg-paper-200 transition-colors shadow-soft-sm"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-sage-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied" : "Copy Summary"}</span>
          </button>
          <button
            onClick={onReset}
            className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-charcoal-900 text-paper-50 hover:bg-charcoal-800 transition-colors shadow-soft-sm"
          >
            <span>Review New URL</span>
          </button>
        </div>
      </div>

      {/* 1. HERO VERDICT & EDITORIAL OPENING */}
      <div className="p-6 sm:p-10 rounded-2xl bg-white border border-[#E8E2D5] shadow-soft">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          
          {/* Conversational critique */}
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-dusty-600 px-2.5 py-0.5 rounded-full bg-dusty-50 border border-dusty-100">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Editorial Assessment</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl font-medium text-charcoal-900 tracking-tight">
              Here&apos;s what I think.
            </h1>

            <div className="text-base sm:text-lg text-charcoal-700 leading-relaxed font-normal bg-paper-50/80 p-4 sm:p-5 rounded-xl border border-[#ECE7DC]">
              &ldquo;{summary}&rdquo;
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-charcoal-500">
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${overallTheme.bg} ${overallTheme.text} ${overallTheme.border}`}>
                {verdict_label}
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-charcoal-400" />
                Page load: {evidence_snapshot.load_time_ms || 1200}ms
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5 text-charcoal-400" />
                Mobile layout: {evidence_snapshot.mobile_has_horizontal_overflow ? "Overflow detected" : "Fits 390px viewport"}
              </span>
            </div>
          </div>

          {/* Overall Score Dial */}
          <div className="shrink-0 mx-auto lg:mx-0 flex flex-col items-center justify-center p-6 rounded-2xl bg-paper-100/70 border border-[#E8E4DA] min-w-[200px]">
            <span className="text-xs font-medium uppercase tracking-wider text-charcoal-500 mb-2">
              Overall Score
            </span>
            <div className="flex items-baseline gap-1">
              <span className="font-serif text-5xl sm:text-6xl font-semibold tracking-tight text-charcoal-900">
                {overall_score}
              </span>
              <span className="text-lg font-medium text-charcoal-400">/10</span>
            </div>
            <div className="w-32 h-2 bg-[#E8E2D5] rounded-full overflow-hidden mt-3">
              <div 
                className={`h-full ${overallTheme.bar} rounded-full transition-all duration-1000`} 
                style={{ width: `${Math.min(100, overall_score * 10)}%` }}
              />
            </div>
          </div>

        </div>
      </div>

      {/* 2. CATEGORY SCORE BREAKDOWN */}
      <div>
        <h2 className="font-serif text-xl sm:text-2xl font-semibold text-charcoal-900 mb-4">
          Category Score Breakdown
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {[
            { key: 'ui_ux', label: 'UI / UX', val: scores.ui_ux, desc: 'Visual flow & touch' },
            { key: 'performance', label: 'Performance', val: scores.performance, desc: 'Load & Vitals' },
            { key: 'accessibility', label: 'Accessibility', val: scores.accessibility, desc: 'Semantics & contrast' },
            { key: 'seo', label: 'SEO', val: scores.seo, desc: 'Metadata & hierarchy' },
            { key: 'functionality', label: 'Functionality', val: scores.functionality, desc: 'Console & links' },
          ].map(cat => {
            const theme = getScoreTheme(cat.val);
            return (
              <div 
                key={cat.key}
                className="p-4 rounded-xl bg-white border border-[#E8E2D5] shadow-soft-sm flex flex-col justify-between group hover:border-[#D5CDC0] transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-charcoal-800">{cat.label}</span>
                    <span className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded ${theme.bg} ${theme.text}`}>
                      {cat.val}
                    </span>
                  </div>
                  <p className="text-[11px] text-charcoal-500 mb-3">{cat.desc}</p>
                </div>
                <div className="w-full h-1.5 bg-paper-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${theme.bar} rounded-full transition-all duration-700`}
                    style={{ width: `${Math.min(100, cat.val * 10)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. SCREENSHOT PRESENTATION */}
      {screenshot_base64 && (
        <div className="p-6 rounded-2xl bg-white border border-[#E8E2D5] shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-serif text-lg sm:text-xl font-semibold text-charcoal-900">
                Visual Capture & Viewport Behavior
              </h2>
              <p className="text-xs text-charcoal-500">
                Browser render snapshot captured at 1280&times;800 desktop resolution.
              </p>
            </div>
            <button
              onClick={() => setIsScreenshotZoomed(true)}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-[#D5CDC0] bg-paper-50 hover:bg-paper-200 text-charcoal-700 transition-colors"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Expand Preview</span>
            </button>
          </div>

          <div 
            onClick={() => setIsScreenshotZoomed(true)}
            className="group relative rounded-xl border border-[#E8E2D5] overflow-hidden bg-paper-100 cursor-zoom-in max-h-96"
          >
            <img
              src={`data:image/jpeg;base64,${screenshot_base64}`}
              alt={`Live screenshot of ${url}`}
              className="w-full object-cover object-top group-hover:scale-[1.01] transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-charcoal-900/0 group-hover:bg-charcoal-900/10 transition-colors flex items-center justify-center">
              <span className="opacity-0 group-hover:opacity-100 text-xs font-medium bg-charcoal-900/80 text-white px-3 py-1.5 rounded-full backdrop-blur-sm transition-opacity">
                Click to inspect full screenshot
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 4. WHAT YOU DID WELL (STRENGTHS) */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white border border-[#E8E2D5] shadow-soft">
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-7 h-7 rounded-full bg-sage-100 text-sage-700 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-serif text-xl sm:text-2xl font-semibold text-charcoal-900">
              What you did well
            </h2>
            <p className="text-xs text-charcoal-500">Identified strengths observed in your live architecture</p>
          </div>
        </div>

        {strengths.length === 0 ? (
          <p className="text-sm text-charcoal-500 italic">No specific strengths documented.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {strengths.map((s, idx) => (
              <div 
                key={idx}
                className="p-4 rounded-xl bg-sage-50/50 border border-sage-100/80 hover:border-sage-200 transition-colors"
              >
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-sage-200 text-sage-800 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-charcoal-900 mb-1">
                      {s.title}
                    </h3>
                    <p className="text-xs sm:text-[13px] text-charcoal-600 leading-relaxed">
                      {s.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. WHAT NEEDS ATTENTION (ISSUES BY SEVERITY) */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white border border-[#E8E2D5] shadow-soft">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-serif text-xl sm:text-2xl font-semibold text-charcoal-900">
                What needs attention
              </h2>
              <p className="text-xs text-charcoal-500">Observable issues grouped by impact severity</p>
            </div>
          </div>

          {/* Severity Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-paper-100 border border-[#E8E4DA] text-xs">
            {['all', 'critical', 'high', 'medium', 'low'].map(sev => {
              const count = sev === 'all' ? issues.length : severityCounts[sev];
              return (
                <button
                  key={sev}
                  onClick={() => setSelectedSeverity(sev)}
                  className={`px-2.5 py-1 rounded-lg capitalize font-medium transition-all ${
                    selectedSeverity === sev
                      ? 'bg-white text-charcoal-900 shadow-soft-sm'
                      : 'text-charcoal-500 hover:text-charcoal-800'
                  }`}
                >
                  {sev} {count > 0 && <span className="text-[10px] opacity-75 font-mono">({count})</span>}
                </button>
              );
            })}
          </div>
        </div>

        {filteredIssues.length === 0 ? (
          <div className="p-6 text-center rounded-xl bg-paper-50 border border-[#ECE7DC] text-xs sm:text-sm text-charcoal-500">
            No issues found under the &ldquo;{selectedSeverity}&rdquo; filter.
          </div>
        ) : (
          <div className="space-y-3.5">
            {filteredIssues.map((issue, idx) => {
              const sevBadge = {
                critical: 'bg-terracotta-100 text-terracotta-700 border-terracotta-200',
                high: 'bg-terracotta-50 text-terracotta-600 border-terracotta-100',
                medium: 'bg-amber-50 text-amber-800 border-amber-200',
                low: 'bg-paper-200 text-charcoal-700 border-[#D5CDC0]',
              }[issue.severity] || 'bg-paper-200 text-charcoal-700';

              return (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-[#E8E2D5] bg-paper-50/40 hover:bg-white hover:border-[#D5CDC0] transition-all"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${sevBadge}`}>
                        {issue.severity}
                      </span>
                      <h3 className="text-sm font-semibold text-charcoal-900">
                        {issue.title}
                      </h3>
                    </div>
                  </div>

                  <p className="text-xs sm:text-[13px] text-charcoal-600 mb-2.5 leading-relaxed">
                    {issue.description}
                  </p>

                  {/* Evidence tag */}
                  {issue.evidence && (
                    <div className="mb-2 p-2 rounded-lg bg-white border border-[#E8E4DA] text-[11px] text-charcoal-500 font-mono">
                      <span className="font-semibold text-charcoal-700">Observed evidence: </span>
                      {issue.evidence}
                    </div>
                  )}

                  {/* Recommendation action */}
                  {issue.recommendation && (
                    <div className="text-xs text-dusty-700 bg-dusty-50/60 p-2 rounded-lg border border-dusty-100 flex items-start gap-1.5">
                      <span className="font-semibold text-dusty-800 shrink-0">Fix:</span>
                      <span>{issue.recommendation}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 6. RECOMMENDED ACTIONABLE ROADMAP */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white border border-[#E8E2D5] shadow-soft">
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-7 h-7 rounded-full bg-dusty-100 text-dusty-700 flex items-center justify-center">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-serif text-xl sm:text-2xl font-semibold text-charcoal-900">
              Recommended Improvements
            </h2>
            <p className="text-xs text-charcoal-500">Prioritized roadmap with concrete implementation guidance</p>
          </div>
        </div>

        <div className="space-y-3">
          {recommendations.map((rec, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl border border-[#E8E2D5] bg-white flex items-start gap-3.5 hover:shadow-soft-sm transition-shadow"
            >
              <div className="w-6 h-6 rounded-full bg-charcoal-900 text-paper-50 text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5">
                {rec.priority || idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-charcoal-900 mb-1">
                  {rec.title}
                </h3>
                <p className="text-xs sm:text-[13px] text-charcoal-600 leading-relaxed">
                  {rec.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 7. TECHNICAL EVIDENCE EXPLORER (EXPANDABLE) */}
      <div className="border border-[#E8E2D5] rounded-xl bg-white overflow-hidden shadow-soft-sm">
        <button
          onClick={() => setIsTechDetailsOpen(!isTechDetailsOpen)}
          className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-paper-100 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-charcoal-400" />
            <span className="text-xs sm:text-sm font-semibold text-charcoal-800">
              View Collected Technical Evidence & Diagnostics
            </span>
          </div>
          {isTechDetailsOpen ? (
            <ChevronUp className="w-4 h-4 text-charcoal-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-charcoal-400" />
          )}
        </button>

        {isTechDetailsOpen && (
          <div className="p-5 border-t border-[#E8E2D5] bg-paper-50 space-y-4 text-xs font-mono">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-white rounded-lg border border-[#E8E4DA]">
                <div className="text-charcoal-400 text-[10px]">Title Tag</div>
                <div className="font-semibold text-charcoal-800 truncate">{evidence_snapshot.website_title || "None"}</div>
              </div>
              <div className="p-3 bg-white rounded-lg border border-[#E8E4DA]">
                <div className="text-charcoal-400 text-[10px]">H1 Count</div>
                <div className="font-semibold text-charcoal-800">{evidence_snapshot.h1_count}</div>
              </div>
              <div className="p-3 bg-white rounded-lg border border-[#E8E4DA]">
                <div className="text-charcoal-400 text-[10px]">Interactive Links</div>
                <div className="font-semibold text-charcoal-800">{evidence_snapshot.links_count}</div>
              </div>
              <div className="p-3 bg-white rounded-lg border border-[#E8E4DA]">
                <div className="text-charcoal-400 text-[10px]">Images Missing Alt</div>
                <div className="font-semibold text-charcoal-800">{evidence_snapshot.missing_alt_images}</div>
              </div>
            </div>

            <div className="p-3 bg-white rounded-lg border border-[#E8E4DA]">
              <div className="text-charcoal-400 text-[10px] mb-1">Runtime Exceptions Detected</div>
              <div className="text-charcoal-700">
                {evidence_snapshot.console_errors_count === 0 ? "None (0 console errors)" : `${evidence_snapshot.console_errors_count} error(s)`}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 8. SCOPE & LIMITATIONS DISCLAIMER */}
      <div className="p-4 rounded-xl bg-paper-200/60 border border-[#E8E2D5] text-[11px] sm:text-xs text-charcoal-500 leading-relaxed">
        <span className="font-semibold text-charcoal-700">Evaluation Scope: </span>
        {limitations_notice}
      </div>

      {/* SCREENSHOT ZOOM MODAL */}
      {isScreenshotZoomed && screenshot_base64 && (
        <div 
          className="fixed inset-0 z-50 bg-charcoal-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setIsScreenshotZoomed(false)}
        >
          <div 
            className="relative max-w-5xl max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-soft-lg flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 px-4 border-b border-[#E8E2D5] flex items-center justify-between bg-paper-100">
              <span className="text-xs font-mono text-charcoal-600 truncate max-w-md">{url}</span>
              <button
                onClick={() => setIsScreenshotZoomed(false)}
                className="w-7 h-7 rounded-full bg-white border border-[#D5CDC0] flex items-center justify-center text-charcoal-600 hover:text-charcoal-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-auto p-2 max-h-[82vh]">
              <img
                src={`data:image/jpeg;base64,${screenshot_base64}`}
                alt="Full resolution preview"
                className="w-full h-auto rounded-lg"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
