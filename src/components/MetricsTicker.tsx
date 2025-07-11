"use client";
import { useState, useEffect } from 'react';

interface Metric {
  primary: string;
  secondary: string;
  value: string;
  color: string;
}

const metrics: Metric[] = [
  {
    primary: "Classes Covered",
    secondary: "Reliability",
    value: "1,247",
    color: "text-green-600"
  },
  {
    primary: "Hours Saved", 
    secondary: "Speed",
    value: "3,892",
    color: "text-blue-600"
  },
  {
    primary: "Schools Protected",
    secondary: "Peace of Mind", 
    value: "47",
    color: "text-purple-600"
  }
];

export default function MetricsTicker() {
  const [currentMetric, setCurrentMetric] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMetric((prev) => (prev + 1) % metrics.length);
    }, 3000); // Rotate every 3 seconds

    return () => clearInterval(interval);
  }, []);

  const metric = metrics[currentMetric];

  return (
    <div className="bg-white/90 backdrop-blur-sm border-b border-gray-200 py-2 px-4">
      <div className="max-w-7xl mx-auto flex items-center justify-center space-x-8">
        {/* Sample Data Badge */}
        <span className="inline-block bg-amber-100 text-amber-800 font-semibold text-xs px-3 py-1 rounded-full border border-amber-300 mr-4 shadow-sm">
          SAMPLE DATA
        </span>
        <div className="text-center">
          <div className={`text-2xl font-bold ${metric.color}`}>
            {metric.value}
          </div>
          <div className="text-sm font-medium text-gray-700">
            {metric.primary}
          </div>
          <div className="text-xs text-gray-500">
            {metric.secondary}
          </div>
        </div>
        
        {/* Additional static metrics */}
        <div className="hidden md:flex space-x-8">
          <div className="text-center">
            <div className="text-lg font-semibold text-indigo-600">99.2%</div>
            <div className="text-xs text-gray-600">Success Rate</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-emerald-600">2.3min</div>
            <div className="text-xs text-gray-600">Avg Response</div>
          </div>
        </div>
      </div>
    </div>
  );
} 