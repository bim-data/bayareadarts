import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Plus, Check, Users, Mail, Bell, ShieldCheck } from 'lucide-react';
import { Course, GameFormat, MemberProfile, FutureRound } from '../types';
import { SearchableCourseSelect } from './SearchableCourseSelect';
import { AddCourseModal } from './AddCourseModal';
import { findWhiteOrEquivalentTee } from '../utils/teeUtils';

interface CreateFutureRoundModalProps {
  isOpen: boolean;
  onClose: () => void;
  courses: Course[];
  members: MemberProfile[];
  activeUserId?: string;
  initialSelectedCourseId?: string; // Add this
  onCourseAdded?: (course: Course) => void;
  onCreateFutureRound: (roundData: Partial<FutureRound>) => void;
}

export const CreateFutureRoundModal: React.FC<CreateFutureRoundModalProps> = ({
  isOpen,
  onClose,
  courses,
  members,
  activeUserId,
  initialSelectedCourseId,
  onCourseAdded,
  onCreateFutureRound,
}) => {
  const [courseId, setCourseId] = useState(courses[0]?.id || '');
  const selectedCourse = courses.find((c) => c.id === courseId) || courses[0];

  // Default White Tee
  const [selectedTeeId, setSelectedTeeId] = useState(() => findWhiteOrEquivalentTee(selectedCourse));
  const selectedTee = selectedCourse?.tees.find((t) => t.id === selectedTeeId) || selectedCourse?.tees[0];

  const [isAddCourseModalOpen, setIsAddCourseModalOpen] = useState(false);

  // Active user default
  const activeUser = members.find((m) => m.id === activeUserId) || members[0];

  // Default target date is next Saturday
  const getNextSaturday = () => {
    const d = new Date();
    d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7 || 7));
    return d.toISOString().split('T')[0];
  };

  const [targetDate, setTargetDate] = useState(getNextSaturday());
  const [timeWindow, setTimeWindow] = useState('8:00 AM – 9:30 AM');
  const [format, setFormat] = useState<GameFormat>('stroke');
  const [status, setStatus] = useState<'placeholder' | 'confirmed'>('placeholder');
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([activeUser?.id || members[0]?.id || '']);
  const [emailAlertEnabled, setEmailAlertEnabled] = useState(true);
  const [notes, setNotes] = useState('');

  // Update tee when course changes, ensuring White is picked!
  useEffect(() => {
    if (selectedCourse) {
      setSelectedTeeId(findWhiteOrEquivalentTee(selectedCourse));
    }
  }, [courseId]);

  // Set the course from the directory if provided
  useEffect(() => {
    if (isOpen && initialSelectedCourseId) {
      setCourseId(initialSelectedCourseId);
    }
  }, [isOpen, initialSelectedCourseId]);

  // Set active user on open
  useEffect(() => {
    if (activeUser && !selectedPlayerIds.includes(activeUser.id)) {
      setSelectedPlayerIds([activeUser.id]);
    }
  }, [isOpen, activeUserId]);

  if (!isOpen) return null;

  // Auto calculate when 7-day window opens (e.g. 7 days prior at 6:00 AM)
  const calculateWindowOpensText = (dateStr: string) => {
    try {
      const target = new Date(dateStr);
      const openDate = new Date(target);
      openDate.setDate(target.getDate() - 7);
      return `${openDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at 6:00 AM`;
    } catch {
      return '7 days prior at 6:00 AM';
    }
  };

  const handleTogglePlayer = (id: string) => {
    if (selectedPlayerIds.includes(id)) {
      setSelectedPlayerIds(selectedPlayerIds.filter((p) => p !== id));
    } else {
      if (selectedPlayerIds.length < 4) {
        setSelectedPlayerIds([...selectedPlayerIds, id]);
      }
    }
  };

  const handleCourseAdded = (newCourse: Course) => {
    if (onCourseAdded) {
      onCourseAdded(newCourse);
    }
    setCourseId(newCourse.id);
    setSelectedTeeId(findWhiteOrEquivalentTee(newCourse));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const windowText = `Booking opens ${calculateWindowOpensText(targetDate)}`;

    const newFutureRound: Partial<FutureRound> = {
      courseId: selectedCourse.id,
      courseName: selectedCourse.name,
      targetDate,
      targetTimeWindow: timeWindow,
      status,
      bookingOpenDaysAhead: 7,
      bookingOpensAt: windowText,
      teeName: selectedTee?.name || 'White Tees',
      format,
      registeredPlayerIds: selectedPlayerIds,
      maxPlayers: 4,
      notes: notes.trim() || undefined,
    };

    onCreateFutureRound(newFutureRound);

    // If email alerts enabled and user has email, trigger alert dispatch
    if (emailAlertEnabled && activeUser?.email) {
      try {
        fetch(`/api/future-rounds/${newFutureRound.id || 'new'}/notify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: activeUser.email,
            recipientName: activeUser.name,
            roundId: newFutureRound.id,
          }),
        }).catch(() => {});
      } catch {}
    }

    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex sm:items-center justify-center p-0 sm:p-4 overflow-hidden">
        <div className="w-full sm:max-w-xl h-[100dvh] sm:h-auto sm:max-h-[88vh] sm:rounded-3xl bg-white dark:bg-slate-900 border-0 sm:border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden text-slate-900 dark:text-slate-100 transition-colors">
          {/* Header */}
          <div className="shrink-0 p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-heading font-extrabold text-lg sm:text-xl text-slate-900 dark:text-slate-100 truncate">
                  Schedule Future Round
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  Set placeholder or confirmed tee time · Logged in as <strong>{activeUser?.nickname}</strong>
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

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto overscroll-contain flex flex-col justify-between">
            <div className="p-4 sm:p-6 space-y-4">
              {/* 1. Searchable Course */}
            <SearchableCourseSelect
              courses={courses}
              selectedCourseId={courseId}
              onSelectCourse={(c) => {
                setCourseId(c.id);
                setSelectedTeeId(findWhiteOrEquivalentTee(c));
              }}
              onOpenAddCourse={() => setIsAddCourseModalOpen(true)}
              label="Select Course (Search or Add New)"
            />

            {/* 2. Target Date & Time Window */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  Target Date *
                </label>
                <input
                  type="date"
                  required
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  Tee Time Window
                </label>
                <input
                  type="text"
                  placeholder="e.g. 8:30 AM – 9:15 AM"
                  value={timeWindow}
                  onChange={(e) => setTimeWindow(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            {/* 3. 7-Day Window Info Callout & Email Toggle */}
            <div className="p-3.5 bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-950 dark:text-emerald-200 flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>7-Day Tee Sheet Booking Rule</span>
                </span>
                <span className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-300">
                  {calculateWindowOpensText(targetDate)}
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                Tee sheet drops precisely 7 days prior at 6:00 AM. Pre-registering your foursome locks in who is playing.
              </p>

              {/* Email Alert Checkbox */}
              <label className="pt-1 border-t border-emerald-200/60 dark:border-emerald-800/40 flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailAlertEnabled}
                  onChange={(e) => setEmailAlertEnabled(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Email reminder to {activeUser?.email || 'my registered email'}
                </span>
              </label>
            </div>

            {/* 4. Format & Status */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  Game Format
                </label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value as GameFormat)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 capitalize"
                >
                  <option value="stroke">Individual Stroke Play</option>
                  <option value="stableford">Stableford Points</option>
                  <option value="match_play">Match Play</option>
                  <option value="scramble">Team Scramble</option>
                  <option value="best_ball">Best Ball (4-Ball)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  Booking Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100"
                >
                  <option value="placeholder">📅 Placeholder (Waiting for 7-day drop)</option>
                  <option value="confirmed">✅ Confirmed (Tee Time Booked)</option>
                </select>
              </div>
            </div>

            {/* 5. Pre-Registered Foursome */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span>Pre-Register Golfers ({selectedPlayerIds.length}/4)</span>
                <span className="text-[11px] text-slate-400">Click to add/remove</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {members.map((m) => {
                  const isSelected = selectedPlayerIds.includes(m.id);
                  const isMe = m.id === activeUser?.id;

                  return (
                    <button
                      type="button"
                      key={m.id}
                      onClick={() => handleTogglePlayer(m.id)}
                      className={`p-2.5 rounded-xl border text-left flex items-center justify-between cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-100'
                          : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-base">{m.avatarEmoji}</span>
                        <div className="truncate">
                          <div className="text-xs font-bold truncate">
                            {m.nickname} {isMe && '(You)'}
                          </div>
                          <div className="text-[10px] text-slate-400">Index: {m.handicapIndex.toFixed(1)}</div>
                        </div>
                      </div>
                      {isSelected ? (
                        <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      ) : (
                        <Plus className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 6. Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                Booking Notes / Details
              </label>
              <input
                type="text"
                placeholder="e.g. Trying for 8:15 AM slot; Mike has resident discount card"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Sticky Buttons Footer */}
          <div className="shrink-0 p-3.5 sm:p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              className="btn-modern px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Save Future Round</span>
            </button>
          </div>
          </form>
        </div>
      </div>

      {/* Add Custom Course Modal */}
      <AddCourseModal
        isOpen={isAddCourseModalOpen}
        onClose={() => setIsAddCourseModalOpen(false)}
        onCourseAdded={handleCourseAdded}
      />
    </>
  );
};
