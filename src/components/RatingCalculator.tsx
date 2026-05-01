'use client';

import { useState } from 'react';

interface RatingResult {
  name: string;
  location: string;
  dynamicRating: string;
  tfr: number;
}

export function RatingCalculator() {
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RatingResult | null>(null);
  const [error, setError] = useState('');

  async function handleCalculate() {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/tennisrecord', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, city }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to fetch rating');
      } else {
        setResult(data);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Calculate Your TFR Rating</h3>
      <p className="text-sm text-gray-600 mb-4">
        Enter your name and city exactly as it appears on tennisrecord.com
      </p>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Player Name</label>
          <input
            type="text"
            placeholder="e.g. John Smith"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">City</label>
          <input
            type="text"
            placeholder="e.g. Austin, TX"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
          />
        </div>

        <button
          onClick={handleCalculate}
          disabled={loading || !name || !city}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Calculating...' : 'Calculate TFR'}
        </button>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-4 p-4 bg-green-50 rounded-md">
          <p className="font-semibold text-slate-900">{result.name}</p>
          <p className="text-sm text-slate-600">{result.location}</p>
          <div className="mt-2">
            <p className="text-sm text-slate-900">Dynamic Rating: <span className="font-semibold">{result.dynamicRating}</span></p>
            <p className="text-2xl font-bold text-blue-600 mt-1">TFR: {result.tfr}</p>
          </div>
        </div>
      )}
    </div>
  );
}
