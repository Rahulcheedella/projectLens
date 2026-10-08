import React from 'react';
import { Layout, Zap, Eye, Search, CheckCircle2, ShieldCheck } from 'lucide-react';

const DIMENSIONS = [
  {
    title: 'UI / UX Design',
    icon: Layout,
    color: 'text-dusty-600 bg-dusty-50 border-dusty-200',
    description: 'Visual balance, typography hierarchy, mobile viewport adaptability, and interactive touch ergonomics.',
  },
  {
    title: 'Speed & Performance',
    icon: Zap,
    color: 'text-amber-700 bg-amber-50 border-amber-200',
    description: 'Core Web Vitals including First Contentful Paint, layout stability, asset overhead, and render bottlenecks.',
  },
  {
    title: 'Accessibility',
    icon: Eye,
    color: 'text-sage-700 bg-sage-50 border-sage-200',
    description: 'DOM semantics, alternative text for imagery, contrast considerations, and keyboard-friendly structure.',
  },
  {
    title: 'Search Optimization',
    icon: Search,
    color: 'text-lavender-700 bg-lavender-50 border-lavender-200',
    description: 'Metadata precision, Open Graph social previews, single-H1 clarity, and crawler discoverability.',
  },
  {
    title: 'Functionality & Health',
    icon: CheckCircle2,
    color: 'text-charcoal-700 bg-charcoal-100 border-charcoal-200',
    description: 'Console runtime errors, dead internal links, broken navigation anchors, and HTTPS integrity.',
  },
  {
    title: 'Web Standards',
    icon: ShieldCheck,
    color: 'text-sage-700 bg-sage-50 border-sage-200',
    description: 'Modern viewport declarations, HTML5 landmark structure, and adherence to production web standards.',
  },
];

export default function EvaluationDimensions() {
  return (
    <section className="py-12 px-4 sm:px-6 max-w-5xl mx-auto border-t border-[#E8E2D5]/70">
      <div className="text-center max-w-xl mx-auto mb-10">
        <h2 className="font-serif text-2xl sm:text-3xl font-medium text-charcoal-900 mb-2">
          What the reviewer examines
        </h2>
        <p className="text-sm text-charcoal-500">
          We combine real browser automation evidence with technical telemetry to provide a balanced, multi-dimensional assessment.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {DIMENSIONS.map((dim) => {
          const Icon = dim.icon;
          return (
            <div
              key={dim.title}
              className="p-5 rounded-xl bg-white border border-[#E8E2D5] shadow-soft-sm hover:shadow-soft hover:border-[#D5CDC0] transition-all group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${dim.color} shrink-0`}>
                  <Icon className="w-4 h-4" />
                </div>
                <h3 className="font-serif text-base font-semibold text-charcoal-900 group-hover:text-charcoal-700 transition-colors">
                  {dim.title}
                </h3>
              </div>
              <p className="text-xs sm:text-[13px] text-charcoal-600 leading-relaxed">
                {dim.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
