import React from 'react';
import { Compass, Sparkles, RefreshCw } from 'lucide-react';

export default function Header({ isReviewing, hasReport, onReset }) {
  return (
    <header className="border-b border-[#E8E2D5] bg-[#FAF7F0]/90 backdrop-blur-sm sticky top-0 z-40 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <div 
          onClick={onReset}
          className="flex items-center gap-3 cursor-pointer group"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && onReset()}
        >
          <div className="w-9 h-9 rounded-full bg-charcoal-900 text-paper-50 flex items-center justify-center font-serif text-lg font-medium shadow-soft-sm group-hover:bg-charcoal-700 transition-colors">
            R
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif text-lg font-semibold tracking-tight text-charcoal-900">
                AI Project Reviewer
              </span>
              <span className="hidden sm:inline-block text-[11px] font-medium tracking-wide uppercase px-2 py-0.5 rounded-full bg-sage-100 text-sage-700 border border-sage-200">
                Editorial MVP
              </span>
            </div>
            <p className="text-[12px] text-charcoal-500 hidden md:block">
              Evidence-based evaluation & actionable critique
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {hasReport && (
            <button
              onClick={onReset}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3.5 py-1.5 rounded-lg border border-[#D5CDC0] bg-white text-charcoal-700 hover:bg-paper-200 transition-colors shadow-soft-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Review Another Site</span>
            </button>
          )}

          <div className="flex items-center gap-1.5 text-xs text-charcoal-500 bg-white/70 px-2.5 py-1 rounded-full border border-[#E8E2D5]">
            <span className="w-2 h-2 rounded-full bg-sage-500 animate-pulse"></span>
            <span className="hidden sm:inline">Engine Active</span>
          </div>
        </div>
      </div>
    </header>
  );
}
