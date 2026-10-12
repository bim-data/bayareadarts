import React, { useState } from 'react';
import { 
  X, 
  Users, 
  Plus, 
  Trophy, 
  Sparkles, 
  Check, 
  Trash2, 
  Edit3, 
  Shield, 
  ChevronRight,
  Flag,
  Flame,
  AlertCircle
} from 'lucide-react';
import { MemberProfile, TeamGroup } from '../types';

interface ScrambleTeamManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  teams: TeamGroup[];
  members: MemberProfile[];
  onTeamCreated: (team: TeamGroup) => void;
  onTeamUpdated: (team: TeamGroup) => void;
  onTeamDeleted: (teamId: string) => void;
  onSelectTeamForRound?: (team: TeamGroup) => void;
}

const COLOR_OPTIONS = [
  { id: 'emerald', label: 'Emerald', bg: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-500', ring: 'ring-emerald-500' },
  { id: 'amber', label: 'Amber', bg: 'bg-amber-500', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-500', ring: 'ring-amber-500' },
  { id: 'blue', label: 'Blue', bg: 'bg-blue-500', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-500', ring: 'ring-blue-500' },
  { id: 'purple', label: 'Purple', bg: 'bg-purple-500', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-500', ring: 'ring-purple-500' },
  { id: 'rose', label: 'Rose', bg: 'bg-rose-500', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-500', ring: 'ring-rose-500' },
  { id: 'slate', label: 'Slate', bg: 'bg-slate-700', text: 'text-slate-700 dark:text-slate-300', border: 'border-slate-700', ring: 'ring-slate-500' },
];

const EMOJI_OPTIONS = ['🎯', '🌉', '🚀', '🌁', '🦅', '⚡', '⛳', '🏆', '🔥', '🦁', '💣', '🌲'];

/**
 * Calculates a scramble team course handicap approximation.
 * For 2-man: 35% low + 15% high
 * For 3-man: 20% low + 15% mid + 10% high
 * For 4-man: 20% A + 15% B + 10% C + 5% D
 */
export function calculateTeamScrambleHandicap(memberIds: string[], members: MemberProfile[]): number {
  const handicaps = memberIds
    .map((id) => members.find((m) => m.id === id)?.handicapIndex ?? 15)
    .sort((a, b) => a - b);

  if (handicaps.length === 0) return 0;
  if (handicaps.length === 1) return handicaps[0];
  if (handicaps.length === 2) {
    return Math.round((handicaps[0] * 0.35 + handicaps[1] * 0.15) * 10) / 10;
  }
  if (handicaps.length === 3) {
    return Math.round((handicaps[0] * 0.20 + handicaps[1] * 0.15 + handicaps[2] * 0.10) * 10) / 10;
  }
  // 4 or more players
  return Math.round((handicaps[0] * 0.20 + handicaps[1] * 0.15 + handicaps[2] * 0.10 + handicaps[3] * 0.05) * 10) / 10;
}

export const ScrambleTeamManagerModal: React.FC<ScrambleTeamManagerModalProps> = ({
  isOpen,
  onClose,
  teams,
  members,
  onTeamCreated,
  onTeamUpdated,
  onTeamDeleted,
  onSelectTeamForRound,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);

  // Form state
  const [teamName, setTeamName] = useState('');
  const [teamSize, setTeamSize] = useState<number>(2); // 1, 2, 3, or 4
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [selectedColor, setSelectedColor] = useState('emerald');
  const [selectedEmoji, setSelectedEmoji] = useState('🎯');
  const [teamNotes, setTeamNotes] = useState('');
  const [formError, setFormError] = useState('');
  const [successToast, setSuccessToast] = useState('');

  if (!isOpen) return null;

  const handleStartCreate = (size: number = 2) => {
    setIsEditing(true);
    setEditingTeamId(null);
    setTeamName('');
    const validSize = Math.max(1, Math.min(4, size));
    setTeamSize(validSize);
    // pre-fill with first `validSize` members
    setSelectedMemberIds(members.slice(0, validSize).map((m) => m.id));
    setSelectedColor('emerald');
    setSelectedEmoji('🎯');
    setTeamNotes('');
    setFormError('');
  };

  const handleStartEdit = (team: TeamGroup) => {
    setIsEditing(true);
    setEditingTeamId(team.id);
    setTeamName(team.name);
    setTeamSize(team.playerIds.length || 2);
    setSelectedMemberIds(team.playerIds);
    setSelectedColor(team.color || 'emerald');
    setSelectedEmoji(team.avatarEmoji || '🎯');
    setTeamNotes(team.notes || '');
    setFormError('');
  };

  const handleToggleMember = (memberId: string) => {
    if (selectedMemberIds.includes(memberId)) {
      if (selectedMemberIds.length <= 1) {
        setFormError('A scramble squad must have at least 1 player');
        return;
      }
      setSelectedMemberIds((prev) => prev.filter((id) => id !== memberId));
      setFormError('');
    } else {
      if (selectedMemberIds.length >= 4) {
        setFormError('A scramble team can have at most 4 players for a full group round');
        return;
      }
      setSelectedMemberIds((prev) => [...prev, memberId]);
      setFormError('');
    }
  };

  const handleSaveTeam = async () => {
    if (!teamName.trim()) {
      setFormError('Please enter a team name');
      return;
    }
    if (selectedMemberIds.length < 1) {
      setFormError('Please select at least 1 player for the scramble squad');
      return;
    }
    if (selectedMemberIds.length > 4) {
      setFormError('Maximum 4 players allowed per scramble team');
      return;
    }

    const payload: TeamGroup = {
      id: editingTeamId || `team-${Date.now()}`,
      name: teamName.trim(),
      playerIds: selectedMemberIds,
      color: selectedColor,
      avatarEmoji: selectedEmoji,
      notes: teamNotes.trim(),
      stats: {
        roundsCount: 0,
        bestScore: 0,
        wins: 0,
      },
    };

    try {
      if (editingTeamId) {
        await fetch(`/api/teams/${editingTeamId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        onTeamUpdated(payload);
        setSuccessToast(`Updated ${payload.name}`);
      } else {
        const res = await fetch('/api/teams', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        const created = data.team || payload;
        onTeamCreated(created);
        setSuccessToast(`Created ${created.name}`);
      }
      setIsEditing(false);
      setEditingTeamId(null);
      setTimeout(() => setSuccessToast(''), 3000);
    } catch {
      // Local fallback
      if (editingTeamId) {
        onTeamUpdated(payload);
      } else {
        onTeamCreated(payload);
      }
      setIsEditing(false);
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    try {
      await fetch(`/api/teams/${teamId}`, { method: 'DELETE' });
    } catch {}
    onTeamDeleted(teamId);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex sm:items-center justify-center p-0 sm:p-4 overflow-hidden">
      <div className="card-elevated w-full sm:max-w-3xl h-[100dvh] sm:h-auto sm:max-h-[88vh] sm:rounded-3xl bg-white dark:bg-slate-900 border-0 sm:border border-slate-200 dark:border-slate-800 rounded-none sm:rounded-3xl flex flex-col overflow-hidden shadow-2xl text-slate-900 dark:text-slate-100 transition-colors">
        {/* Header */}
        <div className="shrink-0 p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-xl text-slate-900 dark:text-slate-100">
                Scramble Teams & Squads
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Manage 1 to 4 player teams for group scrambles, match play battles & practice
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

        {/* Success Toast */}
        {successToast && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-200 animate-fadeIn">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{successToast}</span>
          </div>
        )}

        <div className="p-4 sm:p-6 space-y-6 flex-1 overflow-y-auto overscroll-contain">
          {!isEditing ? (
            <>
              {/* Action bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h4 className="font-heading font-bold text-base text-slate-900 dark:text-slate-100">
                    Registered Scramble Squads ({teams.length})
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Select whole teams as players in round setup or track team scrambles
                  </p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => handleStartCreate(1)}
                    className="btn-modern py-2 px-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>+ Solo (1P)</span>
                  </button>
                  <button
                    onClick={() => handleStartCreate(2)}
                    className="btn-modern py-2 px-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Duo (2P)</span>
                  </button>
                  <button
                    onClick={() => handleStartCreate(3)}
                    className="btn-modern py-2 px-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>+ Trio (3P)</span>
                  </button>
                  <button
                    onClick={() => handleStartCreate(4)}
                    className="btn-modern py-2 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>+ 4-Man</span>
                  </button>
                </div>
              </div>

              {/* Info banner */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-300">
                <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>Pre-Built Teams Advantage:</strong> In the New Round modal, switch to "Teams" to pick any solo, duo, trio or 4-man squad in one tap without re-adding each golfer.
                </span>
              </div>

              {/* Teams Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {teams.map((team) => {
                  const teamHcp = calculateTeamScrambleHandicap(team.playerIds, members);
                  const roster = team.playerIds.map((id) => members.find((m) => m.id === id)).filter(Boolean) as MemberProfile[];
                  const squadLabel =
                    team.playerIds.length === 1
                      ? 'Solo (1P)'
                      : team.playerIds.length === 2
                      ? 'Duo (2P)'
                      : team.playerIds.length === 3
                      ? 'Trio (3P)'
                      : 'Full Foursome (4P)';

                  return (
                    <div
                      key={team.id}
                      className="card-modern p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3.5 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-xs"
                    >
                      {/* Top bar with emoji, name, size badge */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xl shrink-0 border border-slate-200 dark:border-slate-700">
                            {team.avatarEmoji || '🎯'}
                          </div>
                          <div className="min-w-0">
                            <h5 className="font-heading font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100 truncate">
                              {team.name}
                            </h5>
                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                              <span className="font-medium text-emerald-600 dark:text-emerald-400">
                                {squadLabel}
                              </span>
                              <span>·</span>
                              <span className="font-stats font-bold text-slate-700 dark:text-slate-300">
                                Team Hcp: {teamHcp}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleStartEdit(team)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:text-slate-400 cursor-pointer"
                            title="Edit Team"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteTeam(team.id)}
                            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-400 hover:text-red-600 cursor-pointer"
                            title="Delete Team"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Roster Members */}
                      <div className="space-y-1 bg-slate-50/70 dark:bg-slate-800/30 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                          Roster Golfers
                        </span>
                        <div className="grid grid-cols-2 gap-1.5">
                          {roster.map((player) => (
                            <div key={player.id} className="flex items-center gap-1.5 text-xs truncate">
                              <span className="text-sm shrink-0">{player.avatarEmoji}</span>
                              <span className="font-medium text-slate-700 dark:text-slate-300 truncate">{player.name}</span>
                              <span className="font-stats text-[10px] text-slate-400 shrink-0">({player.handicapIndex.toFixed(1)})</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Team Stats & Notes */}
                      {team.notes && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 italic">
                          "{team.notes}"
                        </p>
                      )}

                      {/* Quick Select Button (if called from New Round Modal) */}
                      {onSelectTeamForRound && (
                        <button
                          onClick={() => {
                            onSelectTeamForRound(team);
                            onClose();
                          }}
                          className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Select Team for Round</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            /* Create / Edit Form */
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <h4 className="font-heading font-extrabold text-lg text-slate-900 dark:text-slate-100">
                  {editingTeamId ? 'Edit Scramble Team' : 'Build New Scramble Team'}
                </h4>
                <button
                  onClick={() => setIsEditing(false)}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              {formError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-xs font-semibold text-red-700 dark:text-red-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Team Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                  Team Name *
                </label>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="e.g. The Dart Slingers, Bay Area Bombers"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Team Size Selector: 1, 2, 3, or 4 */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                  Target Squad Size
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => {
                        setTeamSize(size);
                        // Adjust selected ids if needed
                        if (selectedMemberIds.length < size) {
                          const remaining = members.filter((m) => !selectedMemberIds.includes(m.id));
                          setSelectedMemberIds([...selectedMemberIds, ...remaining.slice(0, size - selectedMemberIds.length).map((m) => m.id)]);
                        } else if (selectedMemberIds.length > size) {
                          setSelectedMemberIds(selectedMemberIds.slice(0, size));
                        }
                      }}
                      className={`btn-modern py-2.5 rounded-xl text-xs font-bold border cursor-pointer transition-all ${
                        selectedMemberIds.length === size
                          ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 shadow-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {size === 1 ? '1 Solo' : size === 2 ? '2-Man Duo' : size === 3 ? '3-Man Trio' : '4-Man Full'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Member Selection from Roster */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Select Golfers ({selectedMemberIds.length} of {teamSize} chosen) *
                  </label>
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-stats font-bold">
                    Est. Scramble Hcp: {calculateTeamScrambleHandicap(selectedMemberIds, members)}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto p-1">
                  {members.map((member) => {
                    const isSelected = selectedMemberIds.includes(member.id);
                    return (
                      <button
                        key={member.id}
                        type="button"
                        onClick={() => handleToggleMember(member.id)}
                        className={`p-2.5 rounded-xl border text-left flex items-center justify-between gap-2.5 cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500 text-slate-900 dark:text-slate-100'
                            : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-lg shrink-0">{member.avatarEmoji}</span>
                          <div className="min-w-0">
                            <span className="text-xs font-bold block truncate">{member.name}</span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-stats">
                              WHS: {member.handicapIndex.toFixed(1)}
                            </span>
                          </div>
                        </div>
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border ${
                          isSelected ? 'bg-emerald-600 text-white border-emerald-600' : 'border-slate-300 dark:border-slate-600'
                        }`}>
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Emoji Mascot & Color */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                    Team Mascot Emoji
                  </label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {EMOJI_OPTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setSelectedEmoji(emoji)}
                        className={`w-9 h-9 rounded-xl border text-lg flex items-center justify-center cursor-pointer transition-transform ${
                          selectedEmoji === emoji
                            ? 'scale-110 border-emerald-500 bg-emerald-50 dark:bg-emerald-950 ring-2 ring-emerald-500'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:scale-105'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                    Accent Color
                  </label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {COLOR_OPTIONS.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSelectedColor(c.id)}
                        className={`w-7 h-7 rounded-full ${c.bg} cursor-pointer transition-transform flex items-center justify-center ${
                          selectedColor === c.id ? 'ring-2 ring-offset-2 ring-slate-900 dark:ring-white scale-110' : 'hover:scale-105'
                        }`}
                      >
                        {selectedColor === c.id && <Check className="w-3.5 h-3.5 text-white" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Optional Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                  Team Bio / Notes (Optional)
                </label>
                <input
                  type="text"
                  value={teamNotes}
                  onChange={(e) => setTeamNotes(e.target.value)}
                  placeholder="e.g. Always plays the Corica South scramble or Saturday twilight showdowns"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Form Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="btn-modern px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveTeam}
                  className="btn-modern px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingTeamId ? 'Save Changes' : 'Create Team'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
