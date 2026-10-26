import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Plus, Check, Users, Mail, Bell, ShieldCheck } from 'lucide-react';
import { Course, GameFormat, MemberProfile, FutureRound } from '../types';
import { SearchableCourseSelect } from './SearchableCourseSelect';
import { findWhiteOrEquivalentTee } from '../utils/teeUtils';

export const TEE_TIME_WINDOWS = [
  '6:00 AM – 6:30 AM',
  '6:30 AM – 7:00 AM',
  '7:00 AM – 7:30 AM',
  '7:30 AM – 8:00 AM',
  '8:00 AM – 8:30 AM',
  '8:30 AM – 9:00 AM',
  '9:00 AM – 9:30 AM',
  '9:30 AM – 10:00 AM',
  '10:00 AM – 10:30 AM',
  '10:30 AM – 11:00 AM',
  '11:00 AM – 11:30 AM',
  '11:30 AM – 12:00 PM',
  '12:00 PM – 12:30 PM',
  '12:30 PM – 1:00 PM',
  '1:00 PM – 1:30 PM',
  '1:30 PM – 2:00 PM',
  '2:00 PM – 2:30 PM',
  '2:30 PM – 3:00 PM',
  '3:00 PM – 3:30 PM',
  '3:30 PM – 4:00 PM',
  '4:00 PM – 4:30 PM',
  '4:30 PM – 5:00 PM',
  '5:00 PM – 5:30 PM',
  '5:30 PM – 6:00 PM',
];

interface CreateFutureRoundModalProps {
  isOpen: boolean;
  onClose: () => void;
  courses: Course[];
  members: MemberProfile[];
  activeUserId?: string;
  initialSelectedCourseId?: string;
  roundToEdit?: FutureRound | null;
  onCourseAdded?: (course: Course) => void;
  onCreateFutureRound: (roundData: Partial<FutureRound>) => void;
  onUpdateFutureRound?: (futureRoundId: string, roundData: Partial<FutureRound>) => void;
}

export const CreateFutureRoundModal: React.FC<CreateFutureRoundModalProps> = ({
  isOpen,
  onClose,
  courses,
  members,
  activeUserId,
  initialSelectedCourseId,
  roundToEdit,
  onCourseAdded,
  onCreateFutureRound,
  onUpdateFutureRound,
}) => {
  const [courseId, setCourseId] = useState(courses[0]?.id || '');
  const selectedCourse = courses.find((c) => c.id === courseId) || courses[0];

  // Default White Tee
  const [selectedTeeId, setSelectedTeeId] = useState(() => findWhiteOrEquivalentTee(selectedCourse));
  const selectedTee = selectedCourse?.tees.find((t) => t.id === selectedTeeId) || selectedCourse?.tees[0];

  // Active user default
  const activeUser = members.find((m) => m.id === activeUserId) || members[0];

  // Default target date is next Saturday
  const getNextSaturday = () => {
    const d = new Date();
    d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7 || 7));
    return d.toISOString().split('T')[0];
  };

  const [targetDate, setTargetDate] = useState(getNextSaturday());
  const [timeWindow, setTimeWindow] = useState('8:00 AM – 8:30 AM');
  const [confirmedTeeTime, setConfirmedTeeTime] = useState('8:00 AM');
  const [format, setFormat] = useState<GameFormat>('stroke');
  const [status, setStatus] = useState<'placeholder' | 'confirmed'>('placeholder');
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [emailAlertEnabled, setEmailAlertEnabled] = useState(true);
  const [notes, setNotes] = useState('');

  // Update tee when course changes, or sync with roundToEdit
  useEffect(() => {
    if (selectedCourse) {
      if (roundToEdit?.teeName) {
        const matchingTee = selectedCourse.tees.find((t) => t.name === roundToEdit.teeName);
        if (matchingTee) {
          setSelectedTeeId(matchingTee.id);
          return;
        }
      }
      setSelectedTeeId(findWhiteOrEquivalentTee(selectedCourse));
    }
  }, [courseId, selectedCourse, roundToEdit]);

  // Memory Wipe or Edit Pre-fill when modal opens
  useEffect(() => {
    if (isOpen) {
      if (roundToEdit) {
        setCourseId(roundToEdit.courseId);
        setTargetDate(roundToEdit.targetDate);
        const existingWindow = roundToEdit.targetTimeWindow || '8:00 AM – 8:30 AM';
        setTimeWindow(existingWindow.includes('–') ? existingWindow : '8:00 AM – 8:30 AM');
        setConfirmedTeeTime(
          roundToEdit.status === 'confirmed'
            ? (roundToEdit.targetTimeWindow || '8:00 AM')
            : (existingWindow.split('–')[0]?.trim() || '8:00 AM')
        );
        setFormat(roundToEdit.format || 'stroke');
        setStatus(roundToEdit.status === 'confirmed' ? 'confirmed' : 'placeholder');
        setSelectedPlayerIds(roundToEdit.registeredPlayerIds || []);
        setEmailAlertEnabled(false);
        setNotes(roundToEdit.notes || '');

        const targetCourse = courses.find((c) => c.id === roundToEdit.courseId);
        if (targetCourse && roundToEdit.teeName) {
          const matchingTee = targetCourse.tees.find((t) => t.name === roundToEdit.teeName);
          if (matchingTee) setSelectedTeeId(matchingTee.id);
        }
      } else {
        setTargetDate(getNextSaturday());
        setTimeWindow('8:00 AM – 8:30 AM');
        setConfirmedTeeTime('8:00 AM');
        setFormat('stroke');
        setStatus('placeholder');
        setEmailAlertEnabled(true);
        setNotes('');
        
        if (activeUserId) {
          setSelectedPlayerIds([activeUserId]);
        } else if (members.length > 0) {
          setSelectedPlayerIds([members[0].id]);
        } else {
          setSelectedPlayerIds([]);
        }

        if (initialSelectedCourseId) {
          setCourseId(initialSelectedCourseId);
        } else if (courses.length > 0) {
          setCourseId(courses[0].id);
        }
      }
    }
  }, [isOpen, initialSelectedCourseId, activeUserId, members, courses, roundToEdit]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const windowText = `Booking opens ${calculateWindowOpensText(targetDate)}`;
    const finalTeeTime = status === 'confirmed' ? (confirmedTeeTime.trim() || '8:00 AM') : timeWindow;

    const roundPayload: Partial<FutureRound> = {
      courseId: selectedCourse.id,
      courseName: selectedCourse.name,
      targetDate,
      targetTimeWindow: finalTeeTime,
      status,
      bookingOpenDaysAhead: roundToEdit?.bookingOpenDaysAhead || 7,
      bookingOpensAt: windowText,
      teeName: selectedTee?.name || roundToEdit?.teeName || 'White Tees',
      format,
      registeredPlayerIds: selectedPlayerIds,
      maxPlayers: 4,
      notes: notes.trim() || undefined,
    };

    if (roundToEdit && onUpdateFutureRound) {
      onUpdateFutureRound(roundToEdit.id, roundPayload);
    } else {
      onCreateFutureRound(roundPayload);

      // If email alerts enabled and user has email, trigger alert dispatch
      if (emailAlertEnabled && activeUser?.email) {
        try {
          fetch(`/api/future-rounds/${roundPayload.id || 'new'}/notify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: activeUser.email,
              recipientName: activeUser.name,
              roundId: roundPayload.id,
            }),
          }).catch(() => {});
        } catch {}
      }
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
                  {roundToEdit ? 'Edit Future Round' : 'Schedule Future Round'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 flex-wrap">
                  {roundToEdit
                    ? `Update course, date, tee, or golfers for this round`
                    : 'Set placeholder or confirmed tee time'} · Logged in as <strong>{activeUser?.name}</strong>
                  {activeUser?.nickname && <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">"{activeUser.nickname}"</span>}
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
              label="Select Course (Search by name or city)"
            />

            {/* 2. Target Date & Tee Time */}
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

              {status === 'confirmed' ? (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                      Tee Time *
                    </label>
                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200/60 dark:border-emerald-800/60">
                      Booked Time
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={confirmedTeeTime}
                      onChange={(e) => setConfirmedTeeTime(e.target.value)}
                      placeholder="e.g. 8:15 AM"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                    Tee Time Window *
                  </label>
                  <select
                    value={timeWindow}
                    onChange={(e) => setTimeWindow(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100"
                  >
                    {/* If existing round had custom timeWindow not in standard list, show it */}
                    {timeWindow && !TEE_TIME_WINDOWS.includes(timeWindow) && (
                      <option value={timeWindow}>{timeWindow} (Custom)</option>
                    )}
                    {TEE_TIME_WINDOWS.map((tw) => (
                      <option key={tw} value={tw}>
                        {tw}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* 3. Status Callout / 7-Day Window Info */}
            {status === 'confirmed' ? (
              <div className="p-3.5 bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-950 dark:text-emerald-200 flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Tee Time Confirmed ({confirmedTeeTime || 'Booked'})</span>
                  </span>
                  <span className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-300 uppercase">
                    Ready to Play
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                  Tee time is locked in for this round. Pre-registered golfers can view the details and start scoring on round day.
                </p>
              </div>
            ) : (
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
            )}

            {/* 4. Format, Status & Tee Box */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  Tee Box
                </label>
                <select
                  value={selectedTeeId}
                  onChange={(e) => setSelectedTeeId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100"
                >
                  {selectedCourse?.tees && selectedCourse.tees.length > 0 ? (
                    selectedCourse.tees.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.totalYardage ? `${t.totalYardage}y · ` : ''}{t.rating}/{t.slope})
                      </option>
                    ))
                  ) : (
                    <option value="white">White Tees</option>
                  )}
                </select>
              </div>

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
                  onChange={(e) => {
                    const newStatus = e.target.value as 'placeholder' | 'confirmed';
                    setStatus(newStatus);
                    if (newStatus === 'confirmed' && (!confirmedTeeTime || confirmedTeeTime === '8:00 AM')) {
                      const startTime = timeWindow.split('–')[0]?.trim();
                      if (startTime) setConfirmedTeeTime(startTime);
                    }
                  }}
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
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-lg shrink-0">
                          {m.avatarEmoji}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-heading font-bold text-xs text-slate-900 dark:text-slate-100 truncate leading-tight">
                            {m.name} {isMe && '(You)'}
                          </span>
                          {m.nickname && (
                            <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 truncate leading-tight">
                              "{m.nickname}"
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400 font-stats block mt-0.5">
                            Index: {m.handicapIndex.toFixed(1)}
                          </span>
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
              <span>{roundToEdit ? 'Save Changes' : 'Save Future Round'}</span>
            </button>
          </div>
          </form>
        </div>
      </div>
    </>
  );
};
