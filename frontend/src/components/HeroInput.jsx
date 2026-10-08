import React, { useState } from 'react';
import { Globe, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';

const SAMPLE_PROJECTS = [
  { name: 'Vite Official', url: 'https://vitejs.dev' },
  { name: 'Wikipedia', url: 'https://en.wikipedia.org' },
  { name: 'Hacker News', url: 'https://news.ycombinator.com' },
  { name: 'GitHub Blog', url: 'https://github.blog' },
];

export default function HeroInput({ onSubmit, isLoading, errorMessage, onClearError }) {
  const [inputUrl, setInputUrl] = useState('');
  const [localValidation, setLocalValidation] = useState('');

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (onClearError) onClearError();
    setLocalValidation('');

    const trimmed = inputUrl.trim();
    if (!trimmed) {
      setLocalValidation("Please enter a website URL to begin the review.");
      return;
    }

    // Basic client check
    const hasProtocol = trimmed.startsWith('http://') || trimmed.startsWith('https://');
    const targetUrl = hasProtocol ? trimmed : `https://${trimmed}`;

    try {
      const parsed = new URL(targetUrl);
      if (!parsed.hostname || !parsed.hostname.includes('.')) {
        setLocalValidation("That doesn't look like a valid project URL.");
        return;
      }
      if (['localhost', '127.0.0.1', '0.0.0.0'].includes(parsed.hostname.toLowerCase())) {
        setLocalValidation("Localhost URLs cannot be inspected by the reviewer.");
        return;
      }
    } catch {
      setLocalValidation("That doesn't look like a valid project URL.");
      return;
    }

    onSubmit(targetUrl);
  };

  const handlePickSample = (sampleUrl) => {
    setInputUrl(sampleUrl);
    setLocalValidation('');
    if (onClearError) onClearError();
  };

  const activeError = localValidation || errorMessage;

  return (
    <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 max-w-4xl mx-auto text-center">
      {/* Intro Subtitle Badge */}
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-paper-200 border border-[#D5CDC0] text-xs font-medium text-charcoal-700 mb-6 shadow-soft-sm">
        <Sparkles className="w-3.5 h-3.5 text-dusty-600" />
        <span>Autonomous browser inspection &middot; Lighthouse telemetry &middot; Gemini reasoning</span>
      </div>

      {/* Main Title */}
      <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-medium tracking-tight text-charcoal-900 leading-[1.15] mb-5">
        Let&apos;s review your project.
      </h1>

      <p className="max-w-2xl mx-auto text-base sm:text-lg text-charcoal-600 leading-relaxed mb-10 font-normal">
        Enter the live URL of your deployed web project. We open your website in an automated browser, measure real-world performance, audit accessibility, and deliver a personalized, editorial evaluation.
      </p>

      {/* Input Form */}
      <form onSubmit={handleFormSubmit} className="max-w-2xl mx-auto mb-6">
        <div className="relative flex flex-col sm:flex-row items-stretch gap-2.5 p-2 rounded-2xl bg-white border border-[#D5CDC0] shadow-soft focus-within:border-dusty-500 focus-within:ring-2 focus-within:ring-dusty-100 transition-all">
          <div className="flex items-center flex-1 px-3 py-1.5 gap-2.5">
            <Globe className="w-5 h-5 text-charcoal-400 shrink-0" />
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => {
                setInputUrl(e.target.value);
                if (localValidation) setLocalValidation('');
                if (errorMessage && onClearError) onClearError();
              }}
              placeholder="https://your-project.com"
              disabled={isLoading}
              aria-label="Website project URL"
              className="w-full bg-transparent text-charcoal-900 text-sm sm:text-base placeholder:text-charcoal-400 focus:outline-none"
            />
            {inputUrl && !isLoading && (
              <button
                type="button"
                onClick={() => setInputUrl('')}
                className="text-xs text-charcoal-400 hover:text-charcoal-600 px-1 py-0.5"
              >
                Clear
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-charcoal-900 text-paper-50 font-medium text-sm hover:bg-charcoal-800 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-soft-sm shrink-0"
          >
            <span>{isLoading ? "Starting Review..." : "Review My Project"}</span>
            <ArrowRight className="w-4 h-4 text-paper-300" />
          </button>
        </div>

        {/* Error message */}
        {activeError && (
          <div className="mt-3.5 flex items-center justify-center gap-2 text-xs sm:text-sm text-terracotta-600 bg-terracotta-50 border border-terracotta-100 rounded-lg p-2.5 animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{activeError}</span>
          </div>
        )}
      </form>

      {/* Sample Quick-picks */}
      <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs text-charcoal-500">
        <span className="font-medium mr-1 text-charcoal-400">Try an example:</span>
        {SAMPLE_PROJECTS.map((sample) => (
          <button
            key={sample.name}
            type="button"
            onClick={() => handlePickSample(sample.url)}
            className="px-2.5 py-1 rounded-md bg-white border border-[#E8E2D5] text-charcoal-700 hover:border-dusty-500 hover:bg-dusty-50 hover:text-dusty-700 transition-all text-xs shadow-soft-sm"
          >
            {sample.name}
          </button>
        ))}
      </div>
    </section>
  );
}
