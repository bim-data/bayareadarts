import React, { useState } from 'react';
import { Course } from '../types';
import { Search, MapPin, Flag, X, ArrowLeft, Calendar } from 'lucide-react';

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
  onPlanFutureRound,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  
  if (!isOpen) return null;

  // Filter existing courses already in Firestore
  const filteredLocalCourses = courses.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.region.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl relative my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
          <div>
            <h2 className="font-heading font-extrabold text-xl text-slate-900 dark:text-white flex items-center gap-2">
              <Flag className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>Course Directory</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Browse your saved club courses
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

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
      </div>
    </div>
  );
};
