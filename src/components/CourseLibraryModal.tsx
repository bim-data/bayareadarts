import React, { useState, useEffect } from 'react';
import { Course, HoleInfo } from '../types';
import {
  Search,
  MapPin,
  Flag,
  X,
  ArrowLeft,
  Calendar,
  List,
  Map,
  Edit3,
  Save,
  CheckCircle,
  AlertCircle,
  Building,
} from 'lucide-react';
import { CourseScorecardTable } from './CourseScorecardTable';
import { CourseDirectoryMap } from './CourseDirectoryMap';
import { useAuth } from '../contexts/AuthContext';

interface CourseLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  courses: Course[];
  onAddCourse: (course: Course) => Promise<void>;
  onPlanFutureRound?: (courseId: string) => void;
  onUpdateCourse?: (course: Course) => Promise<void>;
  isAdmin?: boolean;
}

export const CourseLibraryModal: React.FC<CourseLibraryModalProps> = ({
  isOpen,
  onClose,
  courses,
  onPlanFutureRound,
  onUpdateCourse,
  isAdmin: propIsAdmin,
}) => {
  const { isAdmin: contextIsAdmin } = useAuth();
  const isAdmin = propIsAdmin ?? contextIsAdmin;

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  // Admin edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editState, setEditState] = useState('CA');
  const [editAddress, setEditAddress] = useState('');
  const [editRegion, setEditRegion] = useState<Course['region']>('Other');
  const [editNotes, setEditNotes] = useState('');
  const [editHoles, setEditHoles] = useState<HoleInfo[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Initialize edit fields when selectedCourse changes
  useEffect(() => {
    if (selectedCourse) {
      setEditName(selectedCourse.name || '');
      setEditCity(selectedCourse.city || '');
      setEditState(selectedCourse.state || 'CA');
      setEditAddress(selectedCourse.address || '');
      setEditRegion(selectedCourse.region || 'Other');
      setEditNotes(selectedCourse.notes || '');
      setEditHoles(selectedCourse.holes ? JSON.parse(JSON.stringify(selectedCourse.holes)) : []);
      setIsEditing(false);
      setSaveSuccess(false);
      setSaveError(null);
    }
  }, [selectedCourse]);

  if (!isOpen) return null;

  // Filter courses by search term
  const filteredLocalCourses = courses.filter((c) => {
    const term = searchTerm.toLowerCase();
    return (
      (c.name && c.name.toLowerCase().includes(term)) ||
      (c.city && c.city.toLowerCase().includes(term)) ||
      (c.region && c.region.toLowerCase().includes(term)) ||
      (c.address && c.address.toLowerCase().includes(term))
    );
  });

  const handleUpdateHole = (holeNum: number, field: keyof HoleInfo, value: number) => {
    setEditHoles((prev) => {
      const exists = prev.some((h) => h.number === holeNum);
      if (exists) {
        return prev.map((h) => (h.number === holeNum ? { ...h, [field]: value } : h));
      } else {
        const newHole: HoleInfo = {
          number: holeNum,
          par: 4,
          yardage: 350,
          handicapIndex: holeNum,
          [field]: value,
        };
        return [...prev, newHole];
      }
    });
  };

  const handleSaveCourse = async () => {
    if (!selectedCourse) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      // Ensure holes are sorted by hole number 1-18
      const sortedHoles = [...editHoles].sort((a, b) => a.number - b.number);

      let lat = selectedCourse.latitude;
      let lng = selectedCourse.longitude;

      // Automatically geocode the address if provided
      if (editAddress.trim()) {
        try {
          const query = `${editAddress.trim()}, ${editCity.trim()}, ${editState.trim()}`;
          const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
          if (res.ok) {
            const data = await res.json();
            if (data.lat && data.lng) {
              lat = data.lat;
              lng = data.lng;
            }
          }
        } catch (e) {
          console.warn('Geocoding during save skipped:', e);
        }
      }

      const updatedCourse: Course = {
        ...selectedCourse,
        name: editName.trim() || selectedCourse.name,
        city: editCity.trim() || selectedCourse.city,
        state: editState.trim() || 'CA',
        address: editAddress.trim(),
        region: editRegion,
        notes: editNotes.trim(),
        holes: sortedHoles,
        ...(lat && lng ? { latitude: lat, longitude: lng } : {}),
      };

      if (onUpdateCourse) {
        await onUpdateCourse(updatedCourse);
      }

      setSelectedCourse(updatedCourse);
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      console.error('Error updating course:', err);
      setSaveError(err.message || 'Failed to save course changes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (selectedCourse) {
      setEditName(selectedCourse.name || '');
      setEditCity(selectedCourse.city || '');
      setEditState(selectedCourse.state || 'CA');
      setEditAddress(selectedCourse.address || '');
      setEditRegion(selectedCourse.region || 'Other');
      setEditNotes(selectedCourse.notes || '');
      setEditHoles(selectedCourse.holes ? JSON.parse(JSON.stringify(selectedCourse.holes)) : []);
    }
    setIsEditing(false);
    setSaveError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl relative my-6 max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4 shrink-0">
          <div>
            <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-slate-900 dark:text-white flex items-center gap-2">
              <Flag className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Course Directory</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Browse saved club courses, verified scorecards, and local layouts
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close directory"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Toast */}
        {saveSuccess && (
          <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-xl flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300 animate-fadeIn shrink-0">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>Course layout and scorecard details successfully updated in database!</span>
          </div>
        )}

        {/* Error Toast */}
        {saveError && (
          <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 rounded-xl flex items-center gap-2 text-xs font-bold text-rose-800 dark:text-rose-300 animate-fadeIn shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
            <span>{saveError}</span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto pr-1">
          {selectedCourse ? (
            <div className="animate-fadeIn space-y-5">
              {/* Top Navigation & Edit Toggle */}
              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={() => {
                    setSelectedCourse(null);
                    setIsEditing(false);
                  }}
                  className="text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Directory</span>
                </button>

                {isAdmin && !isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Edit Course & Scorecard</span>
                  </button>
                )}
              </div>

              {/* Course Detail Card */}
              <div className="p-5 sm:p-6 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                  <Flag className="w-32 h-32" />
                </div>

                <div className="relative z-10 space-y-4">
                  {/* Title & Metadata (View vs Edit) */}
                  {isEditing ? (
                    <div className="space-y-3 bg-white dark:bg-slate-900/90 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                          <Edit3 className="w-3.5 h-3.5" />
                          Admin Course & Scorecard Editor
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Changes persist directly to Firebase
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Course Name
                          </label>
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold focus:ring-1 focus:ring-emerald-500 focus:outline-hidden text-slate-900 dark:text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Area / Region
                          </label>
                          <select
                            value={editRegion}
                            onChange={(e) => setEditRegion(e.target.value as Course['region'])}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold focus:ring-1 focus:ring-emerald-500 focus:outline-hidden text-slate-900 dark:text-white"
                          >
                            <option value="Peninsula">Peninsula</option>
                            <option value="East Bay">East Bay</option>
                            <option value="SF">SF</option>
                            <option value="South Bay">South Bay</option>
                            <option value="North Bay">North Bay</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                            City & State
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={editCity}
                              onChange={(e) => setEditCity(e.target.value)}
                              placeholder="City"
                              className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold focus:ring-1 focus:ring-emerald-500 focus:outline-hidden text-slate-900 dark:text-white"
                            />
                            <input
                              type="text"
                              value={editState}
                              onChange={(e) => setEditState(e.target.value)}
                              placeholder="CA"
                              className="w-16 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold focus:ring-1 focus:ring-emerald-500 focus:outline-hidden text-slate-900 dark:text-white text-center"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Address (for Mapping)
                          </label>
                          <input
                            type="text"
                            value={editAddress}
                            onChange={(e) => setEditAddress(e.target.value)}
                            placeholder="e.g. 1875 Embarcadero Rd"
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium focus:ring-1 focus:ring-emerald-500 focus:outline-hidden text-slate-900 dark:text-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Notes / Description
                        </label>
                        <textarea
                          rows={2}
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                          placeholder="Course notes or layout highlights..."
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden text-slate-900 dark:text-white resize-none"
                        />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h3 className="font-heading font-extrabold text-2xl text-slate-900 dark:text-white">
                        {selectedCourse.name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>
                            {(() => {
                              const city = (selectedCourse.city || '').trim();
                              const state = (selectedCourse.state || 'CA').trim();
                              if (city.toLowerCase().includes(state.toLowerCase()) || city.toLowerCase().includes('california')) {
                                return city;
                              }
                              return `${city}, ${state}`;
                            })()}
                          </span>
                        </span>
                        <span>&middot;</span>
                        <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded font-semibold text-[10px]">
                          {selectedCourse.region}
                        </span>
                        {selectedCourse.address && (
                          <>
                            <span>&middot;</span>
                            <span className="flex items-center gap-1 text-slate-400 text-[11px]">
                              <Building className="w-3 h-3 text-slate-400" />
                              {selectedCourse.address}
                            </span>
                          </>
                        )}
                      </div>

                      {selectedCourse.notes && (
                        <div className="mt-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 italic">
                          {selectedCourse.notes}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Available Tees */}
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Available Tees ({selectedCourse.tees.length})
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {selectedCourse.tees.map((tee) => (
                        <div
                          key={tee.id}
                          className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl flex flex-col gap-1 shadow-2xs"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full border border-slate-200 dark:border-slate-600 shrink-0"
                              style={{ backgroundColor: tee.color }}
                            />
                            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                              {tee.name}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono ml-5">
                            {tee.totalYardage}y &middot; {tee.rating}/{tee.slope}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Scorecard Table View & Editor */}
                  <div className="pt-2">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Course Scorecard & Hole Layout ({isEditing ? editHoles.length : selectedCourse.holes.length} Holes)
                      </h4>
                      {isEditing && (
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                          Editing Hole Pars, Yardages, and Handicaps
                        </span>
                      )}
                    </div>

                    <CourseScorecardTable
                      holes={isEditing ? editHoles : selectedCourse.holes}
                      isEditing={isEditing}
                      onUpdateHole={handleUpdateHole}
                    />
                  </div>

                  {/* Actions Bar */}
                  <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-700 pt-4">
                    {isEditing ? (
                      <div className="flex items-center gap-2 w-full sm:w-auto ml-auto">
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          disabled={isSaving}
                          className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveCourse}
                          disabled={isSaving}
                          className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>{isSaving ? 'Saving to Firebase...' : 'Save Changes'}</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs text-slate-400">
                          Official scorecard data verified for club handicapping
                        </span>
                        <button
                          onClick={() => {
                            if (onPlanFutureRound) onPlanFutureRound(selectedCourse.id);
                          }}
                          className="btn-modern py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-colors shadow-sm cursor-pointer ml-auto"
                        >
                          <Calendar className="w-4 h-4" />
                          Plan Future Round Here
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Controls: Search and List/Map Toggle */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="Filter courses by name, city, area, or address..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden dark:text-white"
                  />
                </div>

                {/* List / Map Segmented Control */}
                <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                      viewMode === 'list'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <List className="w-3.5 h-3.5" />
                    <span>List</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('map')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                      viewMode === 'map'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <Map className="w-3.5 h-3.5" />
                    <span>Map View</span>
                  </button>
                </div>
              </div>

              {/* View Content: List vs Map */}
              {viewMode === 'map' ? (
                <div className="animate-fadeIn">
                  <CourseDirectoryMap
                    courses={filteredLocalCourses}
                    onSelectCourse={(c) => setSelectedCourse(c)}
                    onUpdateCourseCoords={async (courseId, lat, lng) => {
                      const target = courses.find((c) => c.id === courseId);
                      if (target && onUpdateCourse) {
                        const updated = { ...target, latitude: lat, longitude: lng };
                        await onUpdateCourse(updated);
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="max-h-[500px] overflow-y-auto space-y-2.5 pr-1">
                  {filteredLocalCourses.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                      <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                        No saved courses match "{searchTerm}"
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Try searching for another Bay Area city or course name
                      </p>
                    </div>
                  ) : (
                    filteredLocalCourses.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => setSelectedCourse(c)}
                        className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between gap-4 cursor-pointer hover:border-emerald-500 dark:hover:border-emerald-500 transition-colors group shadow-2xs"
                      >
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
                            {c.name}
                          </h4>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                              <span>{c.city}</span>
                            </span>
                            <span>&middot;</span>
                            <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded font-semibold text-[10px]">
                              {c.region}
                            </span>
                            {c.address && (
                              <>
                                <span>&middot;</span>
                                <span className="text-[11px] text-slate-400 truncate">
                                  {c.address}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 block font-mono">
                            {c.tees.length} Tees
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {c.holes.length} Holes
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
