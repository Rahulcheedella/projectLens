import React, { useState } from 'react';
import Header from './components/Header';
import HeroInput from './components/HeroInput';
import EvaluationDimensions from './components/EvaluationDimensions';
import AnalysisProgress from './components/AnalysisProgress';
import ReportDashboard from './components/ReportDashboard';
import { analyzeProjectStream, analyzeProjectUrl } from './services/api';

export default function App() {
  const [viewState, setViewState] = useState('idle'); // 'idle' | 'analyzing' | 'report'
  const [currentUrl, setCurrentUrl] = useState('');
  const [progressStage, setProgressStage] = useState('connecting');
  const [progressMessage, setProgressMessage] = useState('');
  const [reportData, setReportData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const handleStartReview = async (url) => {
    setCurrentUrl(url);
    setViewState('analyzing');
    setProgressStage('connecting');
    setProgressMessage("Let's take a look at your project...");
    setErrorMessage('');

    // Try real-time SSE streaming first
    analyzeProjectStream(url, {
      onProgress: (stage, message) => {
        setProgressStage(stage);
        setProgressMessage(message);
      },
      onComplete: (report) => {
        setReportData(report);
        setViewState('report');
      },
      onError: async (err) => {
        console.warn('Streaming error, attempting standard API fallback...', err);
        // Fallback to standard POST
        try {
          setProgressMessage('Finalizing evaluation report...');
          const fallbackReport = await analyzeProjectUrl(url);
          setReportData(fallbackReport);
          setViewState('report');
        } catch (fallbackErr) {
          setErrorMessage(fallbackErr.message || 'We could not complete the review for this URL.');
          setViewState('idle');
        }
      },
    });
  };

  const handleReset = () => {
    setViewState('idle');
    setReportData(null);
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F0] text-charcoal-800">
      {/* Editorial Navigation */}
      <Header
        isReviewing={viewState === 'analyzing'}
        hasReport={viewState === 'report'}
        onReset={handleReset}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        {viewState === 'idle' && (
          <>
            <HeroInput
              onSubmit={handleStartReview}
              isLoading={false}
              errorMessage={errorMessage}
              onClearError={() => setErrorMessage('')}
            />
            <EvaluationDimensions />
          </>
        )}

        {viewState === 'analyzing' && (
          <AnalysisProgress
            currentStage={progressStage}
            currentMessage={progressMessage}
            targetUrl={currentUrl}
          />
        )}

        {viewState === 'report' && reportData && (
          <ReportDashboard
            report={reportData}
            onReset={handleReset}
          />
        )}
      </main>

      {/* Editorial Footer */}
      <footer className="mt-auto border-t border-[#E8E2D5] bg-[#FAF7F0] py-8 px-4 text-center text-xs text-charcoal-500">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-serif text-charcoal-700 font-medium">
            AI Project Reviewer &mdash; Thoughtful, humanized website audits
          </p>
          <div className="flex items-center gap-4 text-charcoal-400">
            <span>Playwright &middot; Lighthouse &middot; Gemini</span>
            <span>&bull;</span>
            <span className="font-mono">V1 MVP</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
