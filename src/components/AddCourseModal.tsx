import React, { useState } from 'react';
import { X, Plus, Flag, MapPin, Sparkles, Check } from 'lucide-react';
import { Course, TeeBox } from '../types';
import { generate18Holes } from '../utils/teeUtils';

interface AddCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCourseAdded: (newCourse: Course) => void;
}

export const AddCourseModal: React.FC<AddCourseModalProps> = ({
  isOpen,
  onClose,
  onCourseAdded,
}) => {
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [region, setRegion] = useState<'SF' | 'East Bay' | 'Peninsula' | 'South Bay' | 'North Bay' | 'Other'>('SF');
  const [par, setPar] = useState<number>(72);
  const [notes, setNotes] = useState('');

  // White / Member Tee (Default)
  const [whiteYardage, setWhiteYardage] = useState<number>(6150);
  const [whiteRating, setWhiteRating] = useState<number>(70.2);
  const [whiteSlope, setWhiteSlope] = useState<number>(125);

  // Optional Back / Tournament Tee
  const [includeBackTee, setIncludeBackTee] = useState(true);
  const [backTeeName, setBackTeeName] = useState('Blue Tees');
  const [backYardage, setBackYardage] = useState<number>(6620);
  const [backRating, setBackRating] = useState<number>(72.4);
  const [backSlope, setBackSlope] = useState<number>(130);

  // Optional Forward Tee
  const [includeForwardTee, setIncludeForwardTee] = useState(true);
  const [forwardTeeName, setForwardTeeName] = useState('Forward (Red)');
  const [forwardYardage, setForwardYardage] = useState<number>(5340);
  const [forwardRating, setForwardRating] = useState<number>(67.6);
  const [forwardSlope, setForwardSlope] = useState<number>(118);

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    const courseId = `course-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString().slice(-4)}`;

    const tees: TeeBox[] = [];

    if (includeBackTee) {
      tees.push({
        id: `${courseId}-back`,
        name: backTeeName.trim() || 'Blue Tees',
        color: '#2563EB',
        rating: Number(backRating) || 72.0,
        slope: Number(backSlope) || 128,
        totalYardage: Number(backYardage) || 6600,
      });
    }

    // White tee is ALWAYS included (the user default!)
    tees.push({
      id: `${courseId}-white`,
      name: 'White Tees',
      color: '#E5E7EB',
      rating: Number(whiteRating) || 70.2,
      slope: Number(whiteSlope) || 124,
      totalYardage: Number(whiteYardage) || 6150,
    });

    if (includeForwardTee) {
      tees.push({
        id: `${courseId}-forward`,
        name: forwardTeeName.trim() || 'Forward (Red)',
        color: '#DC2626',
        rating: Number(forwardRating) || 67.5,
        slope: Number(forwardSlope) || 118,
        totalYardage: Number(forwardYardage) || 5300,
      });
    }

    const newCourse: Course = {
      id: courseId,
      name: name.trim(),
      city: city.trim() || 'California, USA',
      region,
      notes: notes.trim() || `Custom course added by Bay Area Darts members. Par ${par}.`,
      tees,
      holes: generate18Holes(par, Number(whiteYardage) || 6150),
    };

    try {
      await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCourse),
      });
    } catch {}

    onCourseAdded(newCourse);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="card-elevated max-w-xl w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden my-6 shadow-2xl text-slate-900 dark:text-slate-100 transition-colors">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-xl text-slate-900 dark:text-slate-100">
                Add Custom Course
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Add any track to the Bay Area Darts library with White tees auto-defaulted
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* 1. Name & City */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              Course Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Pasatiempo Golf Club, Olympic Club, or Lincoln Park 9"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                City / Location
              </label>
              <input
                type="text"
                placeholder="e.g. Santa Cruz, CA or San Francisco, CA"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                Region
              </label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value as any)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none"
              >
                <option value="SF">San Francisco (SF)</option>
                <option value="East Bay">East Bay</option>
                <option value="Peninsula">Peninsula</option>
                <option value="South Bay">South Bay</option>
                <option value="North Bay">North Bay</option>
                <option value="Other">Monterey / NorCal / Other</option>
              </select>
            </div>
          </div>

          {/* 2. White Tees (Standard Member Defaults) */}
          <div className="p-3.5 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-200 border border-slate-400 inline-block" />
                <span className="text-xs font-bold text-emerald-950 dark:text-emerald-200">
                  White Tees (Default Selection)
                </span>
              </div>
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                Primary Tee
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">
                  Yardage
                </label>
                <input
                  type="number"
                  value={whiteYardage}
                  onChange={(e) => setWhiteYardage(parseInt(e.target.value) || 6000)}
                  className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">
                  Rating (e.g. 70.2)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={whiteRating}
                  onChange={(e) => setWhiteRating(parseFloat(e.target.value) || 70.0)}
                  className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">
                  Slope (e.g. 125)
                </label>
                <input
                  type="number"
                  value={whiteSlope}
                  onChange={(e) => setWhiteSlope(parseInt(e.target.value) || 120)}
                  className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>
          </div>

          {/* 3. Additional Tees Toggle */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={includeBackTee}
                  onChange={(e) => setIncludeBackTee(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>Include Blue / Back Tees</span>
              </label>
              {includeBackTee && (
                <span className="text-[11px] font-mono text-slate-500">
                  {backYardage} yds · R:{backRating} / S:{backSlope}
                </span>
              )}
            </div>

            {includeBackTee && (
              <div className="grid grid-cols-3 gap-2.5 pl-5">
                <div>
                  <input
                    type="number"
                    placeholder="Yardage"
                    value={backYardage}
                    onChange={(e) => setBackYardage(parseInt(e.target.value) || 6600)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Rating"
                    value={backRating}
                    onChange={(e) => setBackRating(parseFloat(e.target.value) || 72.0)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    placeholder="Slope"
                    value={backSlope}
                    onChange={(e) => setBackSlope(parseInt(e.target.value) || 130)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={includeForwardTee}
                  onChange={(e) => setIncludeForwardTee(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>Include Forward / Red Tees</span>
              </label>
              {includeForwardTee && (
                <span className="text-[11px] font-mono text-slate-500">
                  {forwardYardage} yds · R:{forwardRating} / S:{forwardSlope}
                </span>
              )}
            </div>
          </div>

          {/* 4. Notes & Par */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Total Par
              </label>
              <input
                type="number"
                value={par}
                onChange={(e) => setPar(parseInt(e.target.value) || 72)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-slate-100"
              />
            </div>
            <div className="sm:col-span-3">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Course Notes / Layout description
              </label>
              <input
                type="text"
                placeholder="e.g. Tree-lined fairways, fast greens, ocean wind..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving...' : 'Save & Select Course'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
