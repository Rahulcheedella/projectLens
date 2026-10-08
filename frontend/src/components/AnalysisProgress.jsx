import React from 'react';
import { Check, Loader2, Circle, Globe, Eye, Zap, Shield, Sparkles } from 'lucide-react';

const STAGES = [
  { id: 'connecting', label: 'Website connected', icon: Globe, detail: 'Verifying DNS resolution and security boundaries' },
  { id: 'exploring', label: 'Exploring the interface', icon: Eye, detail: 'Automated browser inspecting layout & capturing viewports' },
  { id: 'auditing_performance', label: 'Checking performance & vitals', icon: Zap, detail: 'Measuring load time, layout stability & resource weight' },
  { id: 'inspecting_dom', label: 'Reviewing accessibility & semantics', icon: Shield, detail: 'Examining heading hierarchy, alt attributes & DOM structure' },
  { id: 'synthesizing', label: 'Preparing your feedback', icon: Sparkles, detail: 'Formulating personalized, humanized critique & roadmap' },
];

export default function AnalysisProgress({ currentStage, currentMessage, targetUrl }) {
  // Determine current active index based on stage
  const getStageIndex = (stage) => {
    switch (stage) {
      case 'connecting': return 0;
      case 'exploring': return 1;
      case 'auditing_performance': return 2;
      case 'inspecting_dom': return 3;
      case 'synthesizing': return 4;
      case 'complete': return 5;
      default: return 1;
    }
  };

  const currentIndex = getStageIndex(currentStage);

  return (
    <div className="max-w-xl mx-auto py-12 px-4 sm:px-6 animate-fade-in">
      <div className="bg-white rounded-2xl border border-[#E8E2D5] p-6 sm:p-8 shadow-soft">
        {/* Header note */}
        <div className="text-center mb-8">
          <span className="text-xs uppercase tracking-wider font-semibold text-dusty-600 px-2.5 py-1 rounded-full bg-dusty-50 border border-dusty-100">
            Live Analysis in Progress
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-medium text-charcoal-900 mt-3 mb-1">
            Let&apos;s take a look at your project.
          </h2>
          <p className="text-xs sm:text-sm text-charcoal-500 font-mono truncate max-w-sm mx-auto">
            {targetUrl}
          </p>
        </div>

        {/* Dynamic Humanized Subtitle */}
        <div className="mb-8 p-3.5 rounded-xl bg-paper-100 border border-[#E8E4DA] text-center">
          <p className="text-sm font-medium text-charcoal-700 italic">
            &ldquo;{currentMessage || "Checking how the interface behaves..."}&rdquo;
          </p>
        </div>

        {/* Stepped progress indicators */}
        <div className="space-y-4">
          {STAGES.map((stage, idx) => {
            const isCompleted = idx < currentIndex;
            const isCurrent = idx === currentIndex;
            const isPending = idx > currentIndex;

            return (
              <div
                key={stage.id}
                className={`flex items-start gap-3.5 p-3 rounded-xl transition-all ${
                  isCurrent
                    ? 'bg-dusty-50/60 border border-dusty-200'
                    : isCompleted
                    ? 'bg-sage-50/40 border border-transparent'
                    : 'opacity-40 border border-transparent'
                }`}
              >
                {/* Status Icon */}
                <div className="mt-0.5 shrink-0">
                  {isCompleted ? (
                    <div className="w-5 h-5 rounded-full bg-sage-500 text-white flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    </div>
                  ) : isCurrent ? (
                    <div className="w-5 h-5 rounded-full bg-dusty-500 text-white flex items-center justify-center animate-spin">
                      <Loader2 className="w-3.5 h-3.5" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-charcoal-300 flex items-center justify-center">
                      <Circle className="w-2 h-2 text-charcoal-300 fill-current" />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={`text-sm font-medium ${isCurrent ? 'text-charcoal-900 font-semibold' : 'text-charcoal-800'}`}>
                      {stage.label}
                    </p>
                    {isCurrent && (
                      <span className="text-[11px] text-dusty-600 font-medium animate-pulse">
                        Examining...
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-charcoal-500 mt-0.5">
                    {stage.detail}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer reassurance */}
        <div className="mt-8 pt-4 border-t border-[#E8E2D5] text-center text-xs text-charcoal-400">
          This takes approximately 10–25 seconds to complete thorough browser rendering and audits.
        </div>
      </div>
    </div>
  );
}
