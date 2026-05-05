'use client';

import { useState } from 'react';

interface RatingResult {
  name: string;
  location: string;
  singlesRating: string;
  doublesRating: string | null;
  dynamicRating: string;
  tfr: number;
}

interface Props {
  onApply?: (singles: string, doubles: string) => void;
}

export function RatingCalculator({ onApply }: Props) {
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

  const handleApply = () => {
    if (result && onApply) {
      onApply(result.singlesRating, result.doublesRating || result.singlesRating);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-slate-50 rounded-2xl border border-slate-200 shadow-sm mt-8">
      <h3 className="text-lg text-slate-900 font-bold mb-2">Verify NTRP Rating</h3>
      <p className="text-xs text-slate-500 mb-6 uppercase tracking-wider font-black">
        Connect to TennisRecord.com
      </p>
      
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Player Name</label>
          <input
            type="text"
            placeholder="e.g. John Smith"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all shadow-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">City/State</label>
          <input
            type="text"
            placeholder="e.g. Austin, TX"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all shadow-sm"
          />
        </div>

        <button
          type="button"
          onClick={handleCalculate}
          disabled={loading || !name || !city}
          className="w-full bg-slate-900 text-white py-4 px-4 rounded-xl font-bold hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-all shadow-lg"
        >
          {loading ? 'Searching...' : 'Find My Record'}
        </button>
      </div>

      {error && (
        <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 text-sm font-medium">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-8 p-6 bg-white rounded-2xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="font-black text-slate-900 text-xl">{result.name}</p>
              <p className="text-xs text-slate-500 font-medium">{result.location}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-black bg-emerald-100 text-emerald-700 px-2 py-1 rounded uppercase tracking-tighter">Verified Record</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100">
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Singles</p>
              <p className="text-2xl font-black text-indigo-600">{result.singlesRating}</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-xl border border-purple-100">
              <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-1">Doubles</p>
              <p className="text-2xl font-black text-purple-600">{result.doublesRating || result.singlesRating}</p>
            </div>
          </div>

          {onApply && (
            <button
              type="button"
              onClick={handleApply}
              className="w-full bg-emerald-600 text-white py-3 px-4 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-md active:scale-95"
            >
              Apply to Profile
            </button>
          )}
        </div>
      )}
    </div>
  );
}
