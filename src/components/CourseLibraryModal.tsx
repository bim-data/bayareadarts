import React, { useState } from 'react';
import { X, Search, Plus, MapPin, Flag, ChevronDown, ChevronUp, History, Sparkles, Check, Globe } from 'lucide-react';
import { Course, HoleInfo, TeeBox } from '../types';

interface CourseLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  courses: Course[];
  onAddCourse: (course: Course) => void;
}

export const CourseLibraryModal: React.FC<CourseLibraryModalProps> = ({
  isOpen,
  onClose,
  courses,
  onAddCourse,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('All');
  const [expandedCourseId, setExpandedCourseId] = useState<string | null>(courses[0]?.id || null);
  const [showAddCourseForm, setShowAddCourseForm] = useState(false);

  // New course form state
  const [newCourseName, setNewCourseName] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newRegion, setNewRegion] = useState<'SF' | 'East Bay' | 'Peninsula' | 'North Bay' | 'Other'>('SF');
  const [newPar, setNewPar] = useState('72');
  const [newRating, setNewRating] = useState('71.5');
  const [newSlope, setNewSlope] = useState('125');

  if (!isOpen) return null;

  // Recent courses played (first 5 popular Bay Area tracks)
  const recentCourses = courses.slice(0, 5);

  const filteredCourses = courses.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.city.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRegion = selectedRegion === 'All' || c.region === selectedRegion;
    return matchesSearch && matchesRegion;
  });

  const handleCreateCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseName.trim()) return;

    const basePar = parseInt(newPar, 10) || 72;
    // Generate 18 default holes
    const holes: HoleInfo[] = Array.from({ length: 18 }, (_, i) => ({
      number: i + 1,
      par: i === 2 || i === 7 || i === 10 || i === 16 ? 3 : i === 4 || i === 8 || i === 13 || i === 17 ? 5 : 4,
      yardage: 380,
      handicapIndex: i + 1,
    }));

    const tees: TeeBox[] = [
      {
        id: `tee-white-${Date.now()}`,
        name: 'White Tees',
        color: '#E5E7EB',
        rating: parseFloat(newRating) || 70.4,
        slope: parseInt(newSlope, 10) || 124,
        totalYardage: 6150,
      },
      {
        id: `tee-blue-${Date.now()}`,
        name: 'Blue Tees',
        color: '#2563EB',
        rating: (parseFloat(newRating) || 70.4) + 1.8,
        slope: (parseInt(newSlope, 10) || 124) + 5,
        totalYardage: 6580,
      },
    ];

    const course: Course = {
      id: `custom-${Date.now()}`,
      name: newCourseName.trim(),
      city: newCity.trim() || 'Bay Area, CA',
      region: newRegion,
      holes,
      tees,
    };

    onAddCourse(course);
    setShowAddCourseForm(false);
    setNewCourseName('');
    setExpandedCourseId(course.id);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex sm:items-center justify-center p-0 sm:p-4 overflow-hidden">
      <div className="w-full sm:max-w-4xl h-[100dvh] sm:h-auto sm:max-h-[88vh] sm:rounded-3xl bg-white dark:bg-slate-900 border-0 sm:border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden text-slate-900 dark:text-slate-100 transition-colors">
        {/* Sticky Header */}
        <div className="shrink-0 p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <Flag className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-heading font-extrabold text-lg sm:text-xl text-slate-900 dark:text-slate-100 truncate">
                Course Scorecard Library
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                Preloaded scorecards with 18-hole pars, tee ratings, slopes, and handicap stroke indexes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-5">
          {/* Quick chips: Recent Courses Played */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <History className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Recent Courses Played</span>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {recentCourses.map((rc) => (
                <button
                  key={rc.id}
                  onClick={() => {
                    setExpandedCourseId(rc.id);
                    setSearchQuery('');
                  }}
                  className={`btn-modern px-3 py-1.5 rounded-xl border text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                    expandedCourseId === rc.id
                      ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-transparent'
                      : 'bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  ⛳ {rc.name}
                </button>
              ))}
            </div>
          </div>

          {/* Search Bar & Region Filter Strip */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="Search by course name, city, or region (e.g. Harding, Presidio, Pacifica)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-800 outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="py-2.5 px-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none cursor-pointer"
              >
                <option value="All">All Regions</option>
                <option value="SF">San Francisco</option>
                <option value="East Bay">East Bay</option>
                <option value="Peninsula">Peninsula</option>
                <option value="North Bay">North Bay</option>
                <option value="Other">South Bay & Monterey</option>
              </select>

              <button
                onClick={() => setShowAddCourseForm(!showAddCourseForm)}
                className="btn-modern px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs whitespace-nowrap cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Custom</span>
              </button>
            </div>
          </div>

          {/* Add Course Form Collapsible */}
          {showAddCourseForm && (
            <form onSubmit={handleCreateCourse} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-slate-100">
                  Add New Golf Course
                </h4>
                <button
                  type="button"
                  onClick={() => setShowAddCourseForm(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-1">Course Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Pasatiempo Golf Club"
                    value={newCourseName}
                    onChange={(e) => setNewCourseName(e.target.value)}
                    required
                    className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-1">City / Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Santa Cruz, CA"
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-1">Region</label>
                  <select
                    value={newRegion}
                    onChange={(e) => setNewRegion(e.target.value as any)}
                    className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  >
                    <option value="SF">San Francisco</option>
                    <option value="East Bay">East Bay</option>
                    <option value="Peninsula">Peninsula</option>
                    <option value="North Bay">North Bay</option>
                    <option value="Other">Other / Monterey</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-1">Course Par</label>
                  <input
                    type="number"
                    value={newPar}
                    onChange={(e) => setNewPar(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-1">USGA Rating</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newRating}
                    onChange={(e) => setNewRating(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-slate-600 dark:text-slate-400 font-semibold block mb-1">Slope (55-155)</label>
                  <input
                    type="number"
                    value={newSlope}
                    onChange={(e) => setNewSlope(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn-modern w-full py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Save Course to Library
              </button>
            </form>
          )}

          {/* Courses List */}
          <div className="space-y-3">
            <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">
              Showing {filteredCourses.length} courses with full 18-hole scorecards
            </span>

            {filteredCourses.map((c) => {
              const isExpanded = expandedCourseId === c.id;
              const totalPar = c.holes.reduce((acc, h) => acc + h.par, 0);

              return (
                <div
                  key={c.id}
                  className="card-modern rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 transition-all"
                >
                  <div
                    onClick={() => setExpandedCourseId(isExpanded ? null : c.id)}
                    className="p-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/80 flex items-center justify-center font-bold text-xs shrink-0 font-stats">
                        P{totalPar}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-slate-100">
                            {c.name}
                          </h4>
                          <span className="text-[10px] font-semibold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded">
                            {c.region}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{c.city}</span>
                          <span>·</span>
                          <span>{c.tees.length} Tee Boxes</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold hidden sm:inline">
                        {isExpanded ? 'Hide Card' : 'View Card'}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Scorecard Table */}
                  {isExpanded && (
                    <div className="p-4 pt-1 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 space-y-4">
                      {c.notes && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 italic">
                          "{c.notes}"
                        </p>
                      )}

                      {/* Tee Boxes Available */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                          Tee Boxes, Ratings & Slope
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {c.tees.map((t) => (
                            <div
                              key={t.id}
                              className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                            >
                              <div className="font-heading font-semibold text-slate-900 dark:text-slate-100 truncate">
                                {t.name}
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-stats mt-0.5">
                                Rating: <strong className="text-slate-700 dark:text-slate-300">{t.rating}</strong> / Slope: <strong className="text-slate-700 dark:text-slate-300">{t.slope}</strong>
                              </div>
                              <div className="text-[10px] text-slate-400 font-stats">
                                {t.totalYardage} Yards
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 18-Hole Matrix */}
                      <div className="overflow-x-auto pb-1">
                        <table className="w-full text-xs text-center border-collapse font-stats">
                          <thead>
                            <tr className="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-heading font-bold text-[11px]">
                              <th className="p-1.5 text-left border-r border-slate-300 dark:border-slate-700 min-w-[70px]">Hole</th>
                              {c.holes.map((h) => (
                                <th key={h.number} className="p-1 min-w-[28px]">{h.number}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 font-semibold text-slate-900 dark:text-slate-100">
                              <td className="p-1.5 text-left border-r border-slate-200 dark:border-slate-800">Par</td>
                              {c.holes.map((h) => (
                                <td key={h.number} className="p-1">{h.par}</td>
                              ))}
                            </tr>
                            <tr className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 text-slate-500 dark:text-slate-400">
                              <td className="p-1.5 text-left border-r border-slate-200 dark:border-slate-800">Yards</td>
                              {c.holes.map((h) => (
                                <td key={h.number} className="p-1">{h.yardage}</td>
                              ))}
                            </tr>
                            <tr className="bg-white dark:bg-slate-900/60 text-slate-400">
                              <td className="p-1.5 text-left border-r border-slate-200 dark:border-slate-800">Handicap</td>
                              {c.holes.map((h) => (
                                <td key={h.number} className="p-1">{h.handicapIndex}</td>
                              ))}
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="shrink-0 p-3.5 sm:p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="btn-modern px-5 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-semibold cursor-pointer shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
