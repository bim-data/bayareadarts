import React, { useState, useEffect } from 'react';
import { X, Play, Plus, Trash2, Flag, Shield, Check, History, Sparkles } from 'lucide-react';
import { Course, GameFormat, MemberProfile, PlayerRoundData, RoundSession, TeeBox } from '../types';
import { SearchableCourseSelect } from './SearchableCourseSelect';
import { AddCourseModal } from './AddCourseModal';
import { findWhiteOrEquivalentTee } from '../utils/teeUtils';

interface NewRoundModalProps {
  isOpen: boolean;
  onClose: () => void;
  courses: Course[];
  members: MemberProfile[];
  activeUserId?: string;
  onCourseAdded?: (newCourse: Course) => void;
  onCreateSession: (sessionData: Partial<RoundSession>) => void;
}

export const NewRoundModal: React.FC<NewRoundModalProps> = ({
  isOpen,
  onClose,
  courses,
  members,
  activeUserId,
  onCourseAdded,
  onCreateSession,
}) => {
  const [selectedCourseId, setSelectedCourseId] = useState<string>(courses[0]?.id || '');
  const selectedCourse = courses.find((c) => c.id === selectedCourseId) || courses[0];

  // Default to White tee or equivalent!
  const [selectedTeeId, setSelectedTeeId] = useState<string>(() => findWhiteOrEquivalentTee(selectedCourse));
  const selectedTee = selectedCourse?.tees.find((t) => t.id === selectedTeeId) || selectedCourse?.tees[0];

  const [selectedFormat, setSelectedFormat] = useState<GameFormat>('stroke');
  const [roundDate, setRoundDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isAddCourseModalOpen, setIsAddCourseModalOpen] = useState(false);

  // Active user / host
  const activeUser = members.find((m) => m.id === activeUserId) || members[0];

  // Selected Players list - starts with activeUser as Player 1!
  const [selectedPlayers, setSelectedPlayers] = useState<PlayerRoundData[]>([]);

  // Update tee when course changes, ensuring White is picked!
  useEffect(() => {
    if (selectedCourse) {
      const defaultTee = findWhiteOrEquivalentTee(selectedCourse);
      setSelectedTeeId(defaultTee);
    }
  }, [selectedCourseId]);

  // Initialize players with active user
  useEffect(() => {
    if (members.length > 0 && selectedPlayers.length === 0) {
      const p1 = activeUser || members[0];
      const p2 = members.find((m) => m.id !== p1.id) || members[1];
      const slope = selectedTee?.slope || 124;
      const rating = selectedTee?.rating || 70.2;

      const initial: PlayerRoundData[] = [
        {
          playerId: p1.id,
          name: p1.name,
          handicapIndex: p1.handicapIndex,
          courseHandicap: Math.round(p1.handicapIndex * (slope / 113) + (rating - 72)),
          scores: {},
        },
      ];

      if (p2) {
        initial.push({
          playerId: p2.id,
          name: p2.name,
          handicapIndex: p2.handicapIndex,
          courseHandicap: Math.round(p2.handicapIndex * (slope / 113) + (rating - 72)),
          scores: {},
        });
      }

      setSelectedPlayers(initial);
    }
  }, [isOpen, activeUserId]);

  // Recalculate course handicaps when selected tee changes
  useEffect(() => {
    if (!selectedTee) return;
    setSelectedPlayers((prev) =>
      prev.map((p) => {
        const mem = members.find((m) => m.id === p.playerId);
        const hcp = mem ? mem.handicapIndex : p.handicapIndex;
        const ch = Math.round(hcp * (selectedTee.slope / 113) + (selectedTee.rating - 72));
        return { ...p, courseHandicap: ch };
      })
    );
  }, [selectedTeeId]);

  const [newGuestName, setNewGuestName] = useState('');
  const [newGuestHcp, setNewGuestHcp] = useState('12.0');

  if (!isOpen) return null;

  // Add member from roster
  const handleAddMember = (member: MemberProfile) => {
    if (selectedPlayers.some((p) => p.playerId === member.id)) return;
    const slope = selectedTee?.slope || 124;
    const rating = selectedTee?.rating || 70.2;
    const ch = Math.round(member.handicapIndex * (slope / 113) + (rating - 72));

    setSelectedPlayers((prev) => [
      ...prev,
      {
        playerId: member.id,
        name: member.name,
        handicapIndex: member.handicapIndex,
        courseHandicap: ch,
        scores: {},
      },
    ]);
  };

  // Add custom guest golfer
  const handleAddGuest = () => {
    if (!newGuestName.trim()) return;
    const hcp = parseFloat(newGuestHcp) || 10;
    const slope = selectedTee?.slope || 124;
    const rating = selectedTee?.rating || 70.2;
    const ch = Math.round(hcp * (slope / 113) + (rating - 72));

    setSelectedPlayers((prev) => [
      ...prev,
      {
        playerId: `guest-${Date.now()}`,
        name: newGuestName.trim(),
        handicapIndex: hcp,
        courseHandicap: ch,
        scores: {},
      },
    ]);
    setNewGuestName('');
  };

  const handleRemovePlayer = (playerId: string) => {
    if (selectedPlayers.length <= 1) return;
    setSelectedPlayers((prev) => prev.filter((p) => p.playerId !== playerId));
  };

  // Handle course added from modal
  const handleCourseAdded = (newCourse: Course) => {
    if (onCourseAdded) {
      onCourseAdded(newCourse);
    }
    setSelectedCourseId(newCourse.id);
    setSelectedTeeId(findWhiteOrEquivalentTee(newCourse));
  };

  // Submit start round
  const handleSubmit = () => {
    onCreateSession({
      courseId: selectedCourse.id,
      courseName: selectedCourse.name,
      teeId: selectedTee?.id,
      teeName: selectedTee?.name,
      rating: selectedTee?.rating,
      slope: selectedTee?.slope,
      date: roundDate,
      format: selectedFormat,
      isTeamRound: selectedFormat === 'scramble' || selectedFormat === 'best_ball',
      players: selectedPlayers,
    });
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        <div className="card-elevated max-w-2xl w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden my-6 shadow-2xl text-slate-900 dark:text-slate-100 transition-colors">
          {/* Header */}
          <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <Play className="w-5 h-5 fill-current" />
              </div>
              <div>
                <h3 className="font-heading font-extrabold text-xl text-slate-900 dark:text-slate-100">
                  Start Live Round
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Host a real-time multi-player session · Logged in as <strong>{activeUser.nickname}</strong>
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

          <div className="p-5 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto">
            {/* Quick Select: Recent Courses */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Recent Courses Played</span>
              </label>
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {courses.slice(0, 6).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setSelectedCourseId(c.id);
                      setSelectedTeeId(findWhiteOrEquivalentTee(c));
                    }}
                    className={`btn-modern px-3 py-1.5 rounded-xl border text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                      selectedCourseId === c.id
                        ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-transparent shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    ⛳ {c.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 1. Searchable Course Selection */}
            <SearchableCourseSelect
              courses={courses}
              selectedCourseId={selectedCourseId}
              onSelectCourse={(c) => {
                setSelectedCourseId(c.id);
                setSelectedTeeId(findWhiteOrEquivalentTee(c));
              }}
              onOpenAddCourse={() => setIsAddCourseModalOpen(true)}
              label="1. Select Course & Location"
            />

            {/* 2. Tee Box Selection (White Tees Auto-Selected) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300 block">
                  2. Select Tee Box
                </label>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                  ✓ White Tees Defaulted
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {selectedCourse?.tees.map((tee) => {
                  const isSelected = tee.id === selectedTeeId;
                  const isWhiteTee = tee.name.toLowerCase().includes('white') || tee.color === '#E5E7EB';

                  return (
                    <button
                      key={tee.id}
                      type="button"
                      onClick={() => setSelectedTeeId(tee.id)}
                      className={`btn-modern p-2.5 rounded-xl text-left border cursor-pointer transition-colors relative ${
                        isSelected
                          ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-transparent shadow-xs'
                          : 'bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-700/60 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <div className="font-heading font-bold text-xs truncate">{tee.name}</div>
                        {isWhiteTee && (
                          <span className={`text-[9px] font-bold px-1 rounded uppercase ${
                            isSelected ? 'bg-emerald-500 text-white' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          }`}>
                            White
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-mono opacity-75 mt-0.5">
                        {tee.totalYardage ? `${tee.totalYardage}y · ` : ''}R: {tee.rating} / S: {tee.slope}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Game Format Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300 block">
                3. Select Scoring Format
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { id: 'stroke', name: 'Stroke Play', desc: 'Gross & Net (Official WHS)' },
                  { id: 'stableford', name: 'Stableford', desc: 'Points per hole system' },
                  { id: 'match_play', name: 'Match Play', desc: 'Holes up / down duel' },
                  { id: 'scramble', name: 'Team Scramble', desc: 'Team best shot shootout' },
                  { id: 'best_ball', name: 'Best Ball', desc: 'Low ball of each pair' },
                ].map((fmt) => {
                  const isSelected = selectedFormat === fmt.id;
                  return (
                    <button
                      key={fmt.id}
                      type="button"
                      onClick={() => setSelectedFormat(fmt.id as GameFormat)}
                      className={`btn-modern p-2.5 rounded-xl text-left border cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-emerald-600 text-white border-transparent shadow-xs'
                          : 'bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-700/60 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100'
                      }`}
                    >
                      <div className="font-heading font-bold text-xs">{fmt.name}</div>
                      <div className={`text-[10px] truncate mt-0.5 ${isSelected ? 'text-emerald-100' : 'text-slate-500 dark:text-slate-400'}`}>
                        {fmt.desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300 block">
                4. Round Date
              </label>
              <input
                type="date"
                value={roundDate}
                onChange={(e) => setRoundDate(e.target.value)}
                className="w-full sm:w-48 p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100"
              />
            </div>

            {/* 5. Golfers in Group */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300 block">
                  5. Golfers in Group ({selectedPlayers.length})
                </label>
                <span className="text-[11px] text-slate-500">
                  Course Hcp computed using {selectedTee?.name} (Slope: {selectedTee?.slope})
                </span>
              </div>

              {/* Selected Players Pills */}
              <div className="space-y-2">
                {selectedPlayers.map((player, idx) => (
                  <div
                    key={player.playerId}
                    className="p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                        {idx + 1}
                      </div>
                      <div>
                        <div className="font-heading font-bold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          <span>{player.name}</span>
                          {idx === 0 && (
                            <span className="text-[9px] font-bold px-1.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 uppercase">
                              Marker / Host
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                          HCP Index: {player.handicapIndex.toFixed(1)} → Course HCP: <strong>{player.courseHandicap}</strong>
                        </div>
                      </div>
                    </div>

                    {selectedPlayers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemovePlayer(player.playerId)}
                        className="text-slate-400 hover:text-red-500 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Add More Members from Roster */}
              <div className="space-y-2">
                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Add Club Member to Foursome:
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {members.map((m) => {
                    const alreadyIn = selectedPlayers.some((p) => p.playerId === m.id);
                    return (
                      <button
                        key={m.id}
                        type="button"
                        disabled={alreadyIn}
                        onClick={() => handleAddMember(m)}
                        className={`btn-modern px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1 border transition-colors ${
                          alreadyIn
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-transparent cursor-not-allowed'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer'
                        }`}
                      >
                        <span>{m.avatarEmoji}</span>
                        <span>{m.nickname}</span>
                        {alreadyIn ? <Check className="w-3 h-3 text-emerald-600" /> : <Plus className="w-3 h-3" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Add Custom Guest Golfer */}
              <div className="p-3 bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Guest golfer name..."
                  value={newGuestName}
                  onChange={(e) => setNewGuestName(e.target.value)}
                  className="flex-1 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
                <input
                  type="number"
                  placeholder="HCP"
                  value={newGuestHcp}
                  onChange={(e) => setNewGuestHcp(e.target.value)}
                  className="w-16 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
                />
                <button
                  type="button"
                  onClick={handleAddGuest}
                  className="btn-modern px-3 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-xs font-bold cursor-pointer shrink-0"
                >
                  Add Guest
                </button>
              </div>
            </div>
          </div>

          {/* Footer Submit */}
          <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Starts synced live room with code generated for mobile syncing
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="btn-modern px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Launch Live Round</span>
              </button>
            </div>
          </div>
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
