import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Plus, MapPin, ChevronDown, Check, Flag, Sparkles, X } from 'lucide-react';
import { Course } from '../types';
import { findWhiteOrEquivalentTee } from '../utils/teeUtils';

interface SearchableCourseSelectProps {
  courses: Course[];
  selectedCourseId: string;
  onSelectCourse: (course: Course) => void;
  onOpenAddCourse: () => void;
  label?: string;
  compact?: boolean;
}

export const SearchableCourseSelect: React.FC<SearchableCourseSelectProps> = ({
  courses,
  selectedCourseId,
  onSelectCourse,
  onOpenAddCourse,
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
        c.region.toLowerCase().includes(term) ||
        (c.notes && c.notes.toLowerCase().includes(term));

      const matchRegion =
        regionFilter === 'all' ||
        (regionFilter === 'other' ? c.region === 'Other' || c.region === 'North Bay' : c.region === regionFilter);

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
        <button
          type="button"
          onClick={onOpenAddCourse}
          className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-1 cursor-pointer transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Custom Course</span>
        </button>
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
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-[11px]">
              {[
                { id: 'all', label: 'All Regions' },
                { id: 'SF', label: 'San Francisco' },
                { id: 'East Bay', label: 'East Bay' },
                { id: 'Peninsula', label: 'Peninsula' },
                { id: 'South Bay', label: 'South Bay' },
                { id: 'other', label: 'NorCal / Monterey' },
              ].map((rf) => (
                <button
                  key={rf.id}
                  type="button"
                  onClick={() => setRegionFilter(rf.id)}
                  className={`px-2 py-0.5 rounded-lg font-medium whitespace-nowrap cursor-pointer transition-colors ${
                    regionFilter === rf.id
                      ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                      : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
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
              <div className="p-6 text-center space-y-2">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  No courses found matching "{searchTerm}".
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onOpenAddCourse();
                  }}
                  className="btn-modern px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add "{searchTerm}" Now</span>
                </button>
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
                          {c.region}
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

          {/* Bottom Action Footer */}
          <div className="p-2.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Can't find your golf course?
            </span>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenAddCourse();
              }}
              className="px-2.5 py-1 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Custom Course</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
