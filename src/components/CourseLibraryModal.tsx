import React, { useState } from 'react';
import { Course, TeeBox, HoleInfo } from '../types';
import { Search, Plus, MapPin, Flag, Check, X, Globe, Download, Loader2, ArrowLeft, Calendar } from 'lucide-react';
import { searchExternalCourses, fetchExternalCourseDetails, ApiSearchResult } from '../services/golfCourseApi';

interface CourseLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  courses: Course[];
  onAddCourse: (course: Course) => Promise<void>;
  onPlanFutureRound?: (courseId: string) => void;
}

export const CourseLibraryModal: React.FC<CourseLibraryModalProps> = ({
  isOpen,
  onClose,
  courses,
  onAddCourse,
  onPlanFutureRound,
}) => {
  const [activeTab, setActiveTab] = useState<'local' | 'api' | 'manual'>('local');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  
  // API State
  const [apiQuery, setApiQuery] = useState('');
  const [apiResults, setApiResults] = useState<ApiSearchResult[]>([]);
  const [searchingApi, setSearchingApi] = useState(false);
  const [importingId, setImportingId] = useState<string | null>(null);
  const [apiError, setApiError] = useState('');

  // Manual Add State
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [region, setRegion] = useState<'SF' | 'East Bay' | 'Peninsula' | 'North Bay' | 'South Bay' | 'Other'>('South Bay');
  const [notes, setNotes] = useState('');
  const [teeName, setTeeName] = useState('Blue');
  const [teeColor, setTeeColor] = useState('#2563EB');
  const [rating, setRating] = useState(72.0);
  const [slope, setSlope] = useState(113);

  if (!isOpen) return null;

  // Filter existing courses already in Firestore
  const filteredLocalCourses = courses.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.region.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Trigger API search
  const handleApiSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiQuery.trim()) return;

    setSearchingApi(true);
    setApiError('');
    try {
      const results = await searchExternalCourses(apiQuery);
      setApiResults(results);
      if (results.length === 0) setApiError('No matching courses found in GolfCourseAPI directory.');
    } catch (err: any) {
      setApiError(err.message || 'Failed to search GolfCourseAPI.');
    } finally {
      setSearchingApi(false);
    }
  };

  // Import course from API directly into Firestore
  const handleImportApiCourse = async (apiCourseId: string) => {
    setImportingId(apiCourseId);
    setApiError('');
    try {
      const fullCourseData = await fetchExternalCourseDetails(apiCourseId);
      await onAddCourse(fullCourseData);
      
      // Reset view to local list so user sees their new course
      setActiveTab('local');
      setSearchTerm(fullCourseData.name);
    } catch (err: any) {
      setApiError(err.message || 'Error importing course details.');
    } finally {
      setImportingId(null);
    }
  };

  const handleCreateManualCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !city) return;

    setSaving(true);
    const courseId = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');

    const defaultHoles: HoleInfo[] = Array.from({ length: 18 }, (_, i) => {
      const num = i + 1;
      const par = [3, 7, 12, 16].includes(num) ? 3 : [5, 9, 14, 18].includes(num) ? 5 : 4;
      return {
        number: num,
        par,
        yardage: par === 3 ? 165 : par === 5 ? 510 : 380,
        handicapIndex: num,
      };
    });

    const defaultTee: TeeBox = {
      id: `${courseId}-default`,
      name: teeName,
      color: teeColor,
      rating: Number(rating),
      slope: Number(slope),
      totalYardage: defaultHoles.reduce((acc, h) => acc + h.yardage, 0),
    };

    const newCourse: Course = {
      id: courseId,
      name,
      city,
      region,
      notes: notes || 'Custom user course.',
      tees: [defaultTee],
      holes: defaultHoles,
    };

    try {
      await onAddCourse(newCourse);
      setActiveTab('local');
      setSearchTerm(name);
      setName('');
      setCity('');
      setNotes('');
    } catch (err) {
      console.error('Failed to add course manually', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl relative my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
          <div>
            <h2 className="font-heading font-extrabold text-xl text-slate-900 dark:text-white flex items-center gap-2">
              <Flag className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>Course Directory & API Importer</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Browse saved courses or fetch new ones via GolfCourseAPI
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 dark:bg-slate-800/60 p-1 rounded-2xl mb-6">
          <button
            onClick={() => { setActiveTab('local'); setSelectedCourse(null); }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'local'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Saved Courses ({courses.length})
          </button>
          <button
            onClick={() => { setActiveTab('api'); setSelectedCourse(null); }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'api'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Search GolfCourseAPI</span>
          </button>
          <button
            onClick={() => { setActiveTab('manual'); setSelectedCourse(null); }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'manual'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            + Manual Add
          </button>
        </div>

        {/* TAB 1: LOCAL FIRESTORE COURSES */}
        {activeTab === 'local' && (
          <div className="space-y-4">
            {selectedCourse ? (
              <div className="animate-fadeIn space-y-4">
                <button
                  onClick={() => setSelectedCourse(null)}
                  className="text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to Directory
                </button>
                
                <div className="p-5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                    <Flag className="w-24 h-24" />
                  </div>
                  
                  <div className="relative z-10">
                    <h3 className="font-heading font-extrabold text-xl text-slate-900 dark:text-white">
                      {selectedCourse.name}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{selectedCourse.city}</span>
                      <span>&middot;</span>
                      <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded font-semibold text-[10px]">
                        {selectedCourse.region}
                      </span>
                    </div>

                    {selectedCourse.notes && (
                      <div className="mt-4 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 italic">
                        {selectedCourse.notes}
                      </div>
                    )}

                    <div className="mt-5">
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Available Tees ({selectedCourse.tees.length})</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {selectedCourse.tees.map(tee => (
                          <div key={tee.id} className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full border border-slate-200 dark:border-slate-600 shrink-0" style={{ backgroundColor: tee.color }}></div>
                              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{tee.name}</span>
                            </div>
                            <span className="text-[10px] text-slate-500 font-stats ml-5">
                              {tee.totalYardage}y &middot; {tee.rating}/{tee.slope}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-6 flex justify-end border-t border-slate-200 dark:border-slate-700 pt-4">
                      <button
                        onClick={() => {
                          if (onPlanFutureRound) onPlanFutureRound(selectedCourse.id);
                        }}
                        className="btn-modern py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-colors shadow-sm cursor-pointer"
                      >
                        <Calendar className="w-4 h-4" />
                        Plan Future Round Here
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="Filter saved courses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 dark:text-white"
                  />
                </div>

                <div className="max-h-96 overflow-y-auto space-y-3 pr-1">
                  {filteredLocalCourses.length === 0 ? (
                    <div className="text-center py-10 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                      <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                        No saved courses match "{searchTerm}"
                      </p>
                      <button
                        onClick={() => {
                          setApiQuery(searchTerm);
                          setActiveTab('api');
                        }}
                        className="mt-3 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 mx-auto cursor-pointer"
                      >
                        <Globe className="w-3.5 h-3.5" />
                        <span>Search GolfCourseAPI for "{searchTerm}"</span>
                      </button>
                    </div>
                  ) : (
                    filteredLocalCourses.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => setSelectedCourse(c)}
                        className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between gap-4 cursor-pointer hover:border-emerald-500 dark:hover:border-emerald-500 transition-colors"
                      >
                        <div>
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                            {c.name}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              {c.city}
                            </span>
                            <span>&middot;</span>
                            <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded font-semibold text-[10px]">
                              {c.region}
                            </span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 block">
                            {c.tees.length} Tees
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {c.holes.length} Holes
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* TAB 2: GOLFCOURSEAPI SEARCH & IMPORT */}
        {activeTab === 'api' && (
          <div className="space-y-4">
            <form onSubmit={handleApiSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search 30,000+ courses (e.g., San Ramon Golf Club)..."
                  value={apiQuery}
                  onChange={(e) => setApiQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 dark:text-white"
                />
              </div>
              <button
                type="submit"
                disabled={searchingApi}
                className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-colors disabled:opacity-50 shrink-0 cursor-pointer"
              >
                {searchingApi ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                <span>Search API</span>
              </button>
            </form>

            {apiError && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs rounded-xl">
                {apiError}
              </div>
            )}

            <div className="max-h-96 overflow-y-auto space-y-3 pr-1">
              {apiResults.length === 0 && !searchingApi && (
                <div className="text-center py-10 text-xs text-slate-400 border border-slate-100 dark:border-slate-800 rounded-2xl">
                  Search GolfCourseAPI to import official layouts directly into your database.
                </div>
              )}

              {apiResults.map((item) => {
                const isAlreadySaved = courses.some((c) => c.id === item.id);
                const isImporting = importingId === item.id;

                return (
                  <div
                    key={item.id}
                    className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between gap-4"
                  >
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        {item.course_name || item.club_name}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {item.location?.address || `${item.location?.city || ''}, ${item.location?.state || ''}`}
                      </p>
                    </div>

                    <div>
                      {isAlreadySaved ? (
                        <span className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-xl flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Saved
                        </span>
                      ) : (
                        <button
                          onClick={() => handleImportApiCourse(item.id)}
                          disabled={isImporting}
                          className="py-1.5 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          {isImporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                          <span>{isImporting ? 'Importing...' : 'Import'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: MANUAL FORM */}
        {activeTab === 'manual' && (
          <form onSubmit={handleCreateManualCourse} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Course Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. San Ramon Golf Club"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  City, State *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. San Ramon, CA"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Region
                </label>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white cursor-pointer"
                >
                  <option value="SF">SF</option>
                  <option value="East Bay">East Bay</option>
                  <option value="Peninsula">Peninsula</option>
                  <option value="North Bay">North Bay</option>
                  <option value="South Bay">South Bay</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Default Tee Name & Color
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={teeName}
                    onChange={(e) => setTeeName(e.target.value)}
                    placeholder="Blue"
                    className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white"
                  />
                  <input
                    type="color"
                    value={teeColor}
                    onChange={(e) => setTeeColor(e.target.value)}
                    className="w-10 h-9 p-1 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Course Rating
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={rating}
                  onChange={(e) => setRating(parseFloat(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Slope Rating
                </label>
                <input
                  type="number"
                  value={slope}
                  onChange={(e) => setSlope(parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="submit"
                disabled={saving}
                className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save Manual Course'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
