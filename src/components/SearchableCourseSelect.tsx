import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Plus, MapPin, ChevronDown, Check, Flag, Sparkles, X } from 'lucide-react';
import { Course } from '../types';
import { findWhiteOrEquivalentTee } from '../utils/teeUtils';

interface SearchableCourseSelectProps {
  courses: Course[];
  selectedCourseId: string;
  onSelectCourse: (course: Course) => void;
  onOpenAddCourse?: () => void;
  label?: string;
  compact?: boolean;
}

export function normalizeRegionName(raw?: string): string {
  if (!raw) return 'Other';
  const trimmed = raw.trim();
  const lower = trimmed.toLowerCase();
  if (lower === 'penninsula' || lower === 'peninsula' || lower === 'the peninsula') return 'Peninsula';
  if (lower === 'east bay' || lower === 'easy bay' || lower === 'eastbay') return 'East Bay';
  if (lower === 'south bay' || lower === 'southbay') return 'South Bay';
  if (lower === 'north bay' || lower === 'northbay') return 'North Bay';
  if (lower === 'sf' || lower === 'san francisco' || lower === 'san francisco bay') return 'SF';
  if (lower === 'santa cruz' || lower === 'santacruz') return 'Santa Cruz';
  if (lower === 'monterey' || lower === 'monterey bay' || lower === 'monterey peninsula') return 'Monterey';
  if (lower === 'other' || lower === 'none' || lower === '') return 'Other';
  return trimmed.split(/\s+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

const STANDARD_REGIONS = [
  'East Bay',
  'Monterey',
  'North Bay',
  'Peninsula',
  'SF',
  'Santa Cruz',
  'South Bay',
];

export const SearchableCourseSelect: React.FC<SearchableCourseSelectProps> = ({
  courses,
  selectedCourseId,
  onSelectCourse,
  label = '1. Select Course',
  compact = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedCourse = useMemo(() => {
    return courses.find((c) => c.id === selectedCourseId) || courses[0];
  }, [courses, selectedCourseId]);

  // Compute canonical deduplicated and alphabetized regions aligned with Course Directory
  const availableRegionChips = useMemo(() => {
    const set = new Set<string>(STANDARD_REGIONS);
    courses.forEach((c) => {
      const norm = normalizeRegionName(c.region);
      if (norm && norm !== 'Other') set.add(norm);
    });
    const sorted = Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
    return [
      { id: 'all', label: 'All Regions' },
      ...sorted.map((r) => ({ id: r, label: r })),
    ];
  }, [courses]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter courses
  const filteredCourses = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return courses.filter((c) => {
      const matchSearch =
        !term ||
        c.name.toLowerCase().includes(term) ||
        c.city.toLowerCase().includes(term) ||
        (c.region && c.region.toLowerCase().includes(term)) ||
        (c.notes && c.notes.toLowerCase().includes(term));

      const courseNormRegion = normalizeRegionName(c.region);
      const matchRegion =
        regionFilter === 'all' ||
        courseNormRegion === regionFilter;

      return matchSearch && matchRegion;
    });
  }, [courses, searchTerm, regionFilter]);

  const handleSelect = (course: Course) => {
    onSelectCourse(course);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="space-y-1.5 relative" ref={dropdownRef}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <Flag className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>{label}</span>
          <span className="text-[10px] font-normal text-slate-400">({courses.length} in library)</span>
        </label>
      </div>

      {/* Trigger Button */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full p-3 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer flex items-center justify-between transition-colors shadow-2xs ${
          isOpen ? 'ring-2 ring-emerald-500 border-transparent' : ''
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 text-sm">
            ⛳
          </div>
          <div className="text-left truncate">
            <div className="font-heading font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
              {selectedCourse ? selectedCourse.name : 'Choose a course...'}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <span>{selectedCourse?.city}</span>
              <span>•</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-medium">
                {selectedCourse?.region}
              </span>
              <span>•</span>
              <span>{selectedCourse?.tees.length || 0} tees (White ready)</span>
            </div>
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          {/* Search Bar & Region Pills */}
          <div className="p-3 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                autoFocus
                placeholder="Search by course name or city (e.g. Pasatiempo, Corica, San Jose)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Region Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-[11px] no-scrollbar">
              {availableRegionChips.map((rf) => (
                <button
                  key={rf.id}
                  type="button"
                  onClick={() => setRegionFilter(rf.id)}
                  className={`px-2 py-0.5 rounded-lg font-medium whitespace-nowrap cursor-pointer transition-colors ${
                    regionFilter === rf.id
                      ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold shadow-2xs'
                      : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                  }`}
                >
                  {rf.label}
                </button>
              ))}
            </div>
          </div>

          {/* Results List */}
          <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
            {filteredCourses.length === 0 ? (
              <div className="p-6 text-center space-y-1">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  No courses found matching "{searchTerm}".
                </p>
                <p className="text-[11px] text-slate-400">
                  Try searching by course name, city, or clearing the region filter.
                </p>
              </div>
            ) : (
              filteredCourses.map((c) => {
                const isSelected = c.id === selectedCourseId;
                const whiteTeeId = findWhiteOrEquivalentTee(c);
                const whiteTee = c.tees.find((t) => t.id === whiteTeeId);

                return (
                  <div
                    key={c.id}
                    onClick={() => handleSelect(c)}
                    className={`p-3 cursor-pointer flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/30'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="min-w-0 pr-3">
                      <div className="flex items-center gap-2">
                        <span className="font-heading font-semibold text-xs text-slate-900 dark:text-slate-100 truncate">
                          {c.name}
                        </span>
                        <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {normalizeRegionName(c.region)}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>{c.city}</span>
                        {whiteTee && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-700 dark:text-emerald-300 font-medium">
                              White: {whiteTee.totalYardage} yds (R: {whiteTee.rating} / S: {whiteTee.slope})
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
