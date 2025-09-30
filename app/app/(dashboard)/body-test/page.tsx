"use client";

import { useState } from 'react';
import Card from '@/components/ui/card-snippet';
import BodyTestForm from '@/components/fitness/body-test-form';
import BodyTestResults from '@/components/fitness/body-test-results';
import BodyTestHistory from '@/components/fitness/body-test-history';

export default function BodyTestPage() {
  const [activeTab, setActiveTab] = useState<'test' | 'history'>('test');
  const [latestResults, setLatestResults] = useState(null);

  const handleTestComplete = (results: any) => {
    setLatestResults(results);
    // Optionally switch to results view or refresh history
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-default-900">Body Composition Test</h1>
          <p className="text-default-600 mt-1">
            Measure body fat percentage and predict powerlifting performance
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-default-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('test')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'test'
                ? 'bg-white text-default-900 shadow-sm'
                : 'text-default-600 hover:text-default-900'
            }`}
          >
            New Test
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'history'
                ? 'bg-white text-default-900 shadow-sm'
                : 'text-default-600 hover:text-default-900'
            }`}
          >
            History
          </button>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'test' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form Card */}
          <Card title="Body Measurement">
            <BodyTestForm onTestComplete={handleTestComplete} />
          </Card>

          {/* Results Card */}
          <Card title="Test Results">
            {latestResults ? (
              <BodyTestResults results={latestResults} />
            ) : (
              <div className="flex items-center justify-center h-96 text-default-500">
                <div className="text-center">
                  <div className="w-16 h-16 bg-default-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-default-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                  </div>
                  <p className="text-sm">Complete the measurement form to see your results</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
          <Card title="Measurement History">
            <BodyTestHistory />
          </Card>
        </div>
      )}
    </div>
  );
}