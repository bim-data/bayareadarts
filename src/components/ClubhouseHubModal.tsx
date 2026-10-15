import React, { useState, useEffect } from 'react';
import { 
  X, User, Users, Plus, Check, Trash2, Edit3, Shield, AlertCircle, Mail, FileCode, Star
} from 'lucide-react';
import { MemberProfile, TeamGroup, CompletedRoundRecord, Course, TeamEventRecord } from '../types';
import { calculateTeamScrambleHandicap } from './ScrambleTeamManagerModal';
import { ExpandableRoundCard } from './ExpandableRoundCard';
import { ExpandableTeamEventCard } from './TeamHistoryModal'; 

interface ClubhouseHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'profiles' | 'teams';
  members: MemberProfile[];
  activeUserId: string;
  onSelectActiveUser: (userId: string) => void;
  onUpdateProfile: (updatedProfile: MemberProfile) => void;
  onAddNewMember?: (newMember: MemberProfile) => void;
  completedRounds: CompletedRoundRecord[];
  teamEvents: TeamEventRecord[];
  teams: TeamGroup[];
  onTeamCreated: (team: TeamGroup) => void;
  onTeamUpdated: (team: TeamGroup) => void;
  onTeamDeleted: (teamId: string) => void;
  onSelectTeamForRound?: (team: TeamGroup) => void;
  onOpenYamlBackup?: () => void;
  courses: Course[];
  onUpdatePastRound?: (roundId: string, data: Partial<CompletedRoundRecord>) => void;
  onDeletePastRound?: (roundId: string, playerId: string) => void;
  onUpdateTeamEvent?: (eventId: string, data: Partial<TeamEventRecord>) => void;
  onDeleteTeamEvent?: (eventId: string) => void;
}

const COLOR_OPTIONS = [
  { id: 'emerald', label: 'Emerald', bg: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-500', ring: 'ring-emerald-500' },
  { id: 'amber', label: 'Amber', bg: 'bg-amber-500', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-500', ring: 'ring-amber-500' },
  { id: 'blue', label: 'Blue', bg: 'bg-blue-500', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-500', ring: 'ring-blue-500' },
  { id: 'purple', label: 'Purple', bg: 'bg-purple-500', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-500', ring: 'ring-purple-500' },
  { id: 'rose', label: 'Rose', bg: 'bg-rose-500', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-500', ring: 'ring-rose-500' },
  { id: 'slate', label: 'Slate', bg: 'bg-slate-700', text: 'text-slate-700 dark:text-slate-300', border: 'border-slate-700', ring: 'ring-slate-500' },
];

const EMOJI_OPTIONS = ['🎯', '🌉', '🚀', '🌁', '🦅', '⚡', '⛳', '🏆', '🔥', '🦁', '💣', '🌲', '⛳', '🧢', '🕶️', '👑'];

export const ClubhouseHubModal: React.FC<ClubhouseHubModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'profiles',
  members,
  activeUserId,
  onSelectActiveUser,
  onUpdateProfile,
  onAddNewMember,
  completedRounds,
  teamEvents,
  teams,
  onTeamCreated,
  onTeamUpdated,
  onTeamDeleted,
  onSelectTeamForRound,
  onOpenYamlBackup,
  courses,
  onUpdatePastRound,
  onDeletePastRound,
  onUpdateTeamEvent,
  onDeleteTeamEvent,
}) => {
  const [hubTab, setHubTab] = useState<'profiles' | 'teams'>(initialTab);
  const [profileSubTab, setProfileSubTab] = useState<'overview' | 'edit' | 'switch'>('overview');
  const [historyTab, setHistoryTab] = useState<'rounds' | 'differentials' | 'scrambles'>('rounds');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  const activeUser = members.find((m) => m.id === activeUserId) || members[0];

  const [editName, setEditName] = useState(activeUser?.name || '');
  const [editNickname, setEditNickname] = useState(activeUser?.nickname || '');
  const [editEmail, setEditEmail] = useState(activeUser?.email || '');
  const [editPhone, setEditPhone] = useState(activeUser?.phone || '');
  const [editAvatar, setEditAvatar] = useState(activeUser?.avatarEmoji || '🎯');
  const [editGoal, setEditGoal] = useState(activeUser?.handicapGoal ? String(activeUser.handicapGoal) : '');

  const [isAddingNewGolfer, setIsAddingNewGolfer] = useState(false);
  const [newGolferName, setNewGolferName] = useState('');
  const [newGolferNickname, setNewGolferNickname] = useState('');
  const [newGolferEmail, setNewGolferEmail] = useState('');
  const [newGolferHcp, setNewGolferHcp] = useState('12.0');

  const [isEditingTeam, setIsEditingTeam] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [teamName, setTeamName] = useState('');
  const [selectedTeamMemberIds, setSelectedTeamMemberIds] = useState<string[]>([]);
  const [teamTargetSize, setTeamTargetSize] = useState<number>(2);
  const [teamEmoji, setTeamEmoji] = useState('🎯');
  const [teamColor, setTeamColor] = useState('emerald');
  const [teamNotes, setTeamNotes] = useState('');
  const [teamFormError, setTeamFormError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIsEditingTeam(false);
      setEditingTeamId(null);
    }
    if (initialTab) {
      setHubTab(initialTab);
    }
  }, [initialTab, isOpen]);

  useEffect(() => {
    if (activeUser) {
      setEditName(activeUser.name);
      setEditNickname(activeUser.nickname);
      setEditEmail(activeUser.email || '');
      setEditPhone(activeUser.phone || '');
      setEditAvatar(activeUser.avatarEmoji || '🎯');
      setEditGoal(activeUser.handicapGoal ? String(activeUser.handicapGoal) : '');
    }
  }, [activeUser]);

  if (!isOpen || !activeUser) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated: MemberProfile = {
      ...activeUser,
      name: editName.trim() || activeUser.name,
      nickname: editNickname.trim() || activeUser.nickname,
      email: editEmail.trim() || undefined,
      phone: editPhone.trim() || undefined,
      avatarEmoji: editAvatar,
      handicapGoal: editGoal ? parseFloat(editGoal) : undefined,
    };

    await onUpdateProfile(updated);
    showToast('Profile updated successfully!');
    setProfileSubTab('overview');
  };

  const handleCreateGolfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGolferName.trim()) return;

    const newMem: MemberProfile = {
      id: `member-${Date.now()}`,
      name: newGolferName.trim(),
      nickname: newGolferNickname.trim() || newGolferName.trim(),
      email: newGolferEmail.trim() || undefined,
      avatarEmoji: '🎯',
      badgeTitle: 'Club Member',
      handicapIndex: parseFloat(newGolferHcp) || 12.0,
      roundsCount: 0,
      scoringAverage: 0,
      avgPutts: 0,
      firPercent: 0,
      girPercent: 0,
      bestRound: 0,
      bestRound9: 0,
      differentials: [],
    };

    if (onAddNewMember) {
      onAddNewMember(newMem);
    }
    onSelectActiveUser(newMem.id);
    setIsAddingNewGolfer(false);
    setNewGolferName('');
    setNewGolferNickname('');
    setNewGolferEmail('');
    showToast(`Added ${newMem.name} to the club!`);
    setProfileSubTab('overview');
  };

  const handleStartCreateTeam = (size: number = 2) => {
    setEditingTeamId(null);
    setTeamName('');
    const validSize = Math.max(1, Math.min(4, size));
    setTeamTargetSize(validSize);
    const initialIds = [activeUser.id];
    const otherMembers = members.filter((m) => m.id !== activeUser.id);
    for (let i = 0; i < validSize - 1 && i < otherMembers.length; i++) {
      initialIds.push(otherMembers[i].id);
    }
    setSelectedTeamMemberIds(initialIds);
    setTeamEmoji('🎯');
    setTeamColor('emerald');
    setTeamNotes('');
    setTeamFormError(null);
    setIsEditingTeam(true);
  };

  const handleStartEditTeam = (team: TeamGroup) => {
    setEditingTeamId(team.id);
    setTeamName(team.name);
    setTeamTargetSize(team.playerIds.length || 2);
    setSelectedTeamMemberIds([...team.playerIds]);
    setTeamEmoji(team.avatarEmoji || '🎯');
    setTeamColor(team.colorTag || 'emerald');
    setTeamNotes(team.notes || '');
    setTeamFormError(null);
    setIsEditingTeam(true);
  };

  const handleSelectTargetSize = (size: number) => {
    const validSize = Math.max(1, Math.min(4, size));
    setTeamTargetSize(validSize);
    if (selectedTeamMemberIds.length < validSize) {
      const remaining = members.filter((m) => !selectedTeamMemberIds.includes(m.id));
      setSelectedTeamMemberIds([
        ...selectedTeamMemberIds,
        ...remaining.slice(0, validSize - selectedTeamMemberIds.length).map((m) => m.id),
      ]);
    } else if (selectedTeamMemberIds.length > validSize) {
      setSelectedTeamMemberIds(selectedTeamMemberIds.slice(0, validSize));
    }
    setTeamFormError(null);
  };

  const toggleTeamMember = (memberId: string) => {
    if (selectedTeamMemberIds.includes(memberId)) {
      if (selectedTeamMemberIds.length <= 1) {
        setTeamFormError('A squad must have at least 1 golfer.');
        return;
      }
      setSelectedTeamMemberIds(selectedTeamMemberIds.filter((id) => id !== memberId));
      setTeamFormError(null);
    } else {
      if (selectedTeamMemberIds.length >= 4) {
        setTeamFormError('Maximum squad size is 4 players for a full scramble group.');
        return;
      }
      setSelectedTeamMemberIds([...selectedTeamMemberIds, memberId]);
      setTeamFormError(null);
    }
  };

  const handleSaveTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) {
      setTeamFormError('Please enter a team name');
      return;
    }
    if (selectedTeamMemberIds.length < 1) {
      setTeamFormError('Please select at least 1 golfer');
      return;
    }
    if (selectedTeamMemberIds.length > 4) {
      setTeamFormError('Maximum 4 players allowed per team');
      return;
    }

    const payload: TeamGroup = {
      id: editingTeamId || `team-${Date.now()}`,
      name: teamName.trim(),
      playerIds: selectedTeamMemberIds,
      avatarEmoji: teamEmoji,
      colorTag: teamColor,
      notes: teamNotes.trim() || undefined,
      stats: {
        roundsCount: 0,
        bestScore: 68,
        wins: 0,
      },
    };

    if (editingTeamId) {
      onTeamUpdated(payload);
      showToast(`Updated "${payload.name}"!`);
    } else {
      onTeamCreated(payload);
      showToast(`Created squad "${payload.name}"!`);
    }

    setIsEditingTeam(false);
  };

  const handleDeleteTeam = async (teamId: string) => {
    onTeamDeleted(teamId);
    showToast('Scramble team deleted');
  };

  const myRounds = completedRounds.filter(
    (r) => r.playerId === activeUser.id || r.playerName.toLowerCase() === activeUser.name.toLowerCase()
  );

  const myTeamEvents = teamEvents.filter((ev) =>
    ev.teamLeaderboard.some((t) =>
      t.playerNames.some(
        (pName) =>
          pName.toLowerCase().includes((activeUser.name || '').toLowerCase()) ||
          (activeUser.nickname && pName.toLowerCase().includes(activeUser.nickname.toLowerCase()))
      )
    )
  );

  const safeDifferentials = activeUser.differentials || [];

  const totalDrinks = myRounds.reduce((acc, r) => acc + (r.buzzballCount || 0), 0);
  const avgDrinks = myRounds.length > 0 ? (totalDrinks / myRounds.length).toFixed(1) : '0';

  const avgGirCount = myRounds.length > 0
    ? (myRounds.reduce((acc, r) => acc + Math.round(((r.girPercent || 0) / 100) * 18), 0) / myRounds.length).toFixed(1)
    : '0';

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex sm:items-center justify-center p-0 sm:p-4 overflow-hidden">
      <div className="w-full sm:max-w-3xl h-[100dvh] sm:h-auto sm:max-h-[88vh] sm:rounded-3xl bg-white dark:bg-slate-900 border-0 sm:border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden text-slate-900 dark:text-slate-100 transition-colors">
        
        {/* Sticky Header */}
        <div className="shrink-0 p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              {hubTab === 'profiles' ? <User className="w-5 h-5" /> : <Users className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <h3 className="font-heading font-extrabold text-lg sm:text-xl text-slate-900 dark:text-slate-100 truncate">
                Clubhouse Roster & Teams
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                Manage golfers, nicknames, WHS handicaps, and 2-to-4 player scramble squads
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Primary Segmented Tab Switcher */}
        <div className="shrink-0 p-2 sm:px-5 sm:py-2.5 bg-slate-100/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
          <div className={`grid ${onOpenYamlBackup ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-2'} p-1 bg-slate-200 dark:bg-slate-800 rounded-xl gap-1`}>
            <button
              onClick={() => {
                setHubTab('profiles');
                setIsEditingTeam(false);
                setEditingTeamId(null);
              }}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                hubTab === 'profiles'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Golfer Profiles & Handicaps</span>
            </button>
            <button
              onClick={() => {
                setHubTab('teams');
                setIsEditingTeam(false);
                setEditingTeamId(null);
              }}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                hubTab === 'teams'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <Users className="w-4 h-4 text-amber-500" />
              <span>Scramble Squads ({teams.length})</span>
            </button>
            {onOpenYamlBackup && (
              <button
                onClick={() => {
                  onClose();
                  onOpenYamlBackup();
                }}
                className="py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer text-emerald-700 dark:text-emerald-400 hover:bg-white dark:hover:bg-slate-900"
              >
                <FileCode className="w-4 h-4 text-emerald-500" />
                <span>YAML & Git Backup</span>
              </button>
            )}
          </div>
        </div>

        {/* Toast Notification */}
        {toastMessage && (
          <div className="shrink-0 mx-4 sm:mx-6 mt-3 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-200 animate-fadeIn">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Scrollable Main Content - NO INNER SCROLLBARS */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-6">

          {/* ================= SECTION 1: GOLFER PROFILES ================= */}
          {hubTab === 'profiles' && (
            <div className="space-y-6">
              
              {/* Profile Sub-Navigation */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setProfileSubTab('overview')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                      profileSubTab === 'overview'
                        ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    Active Profile
                  </button>
                  <button
                    onClick={() => setProfileSubTab('edit')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                      profileSubTab === 'edit'
                        ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    Edit Info & Email
                  </button>
                  <button
                    onClick={() => setProfileSubTab('switch')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                      profileSubTab === 'switch'
                        ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    Switch Golfer ({members.length})
                  </button>
                </div>

                <button
                  onClick={() => setIsAddingNewGolfer(!isAddingNewGolfer)}
                  className="btn-modern px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ New Golfer</span>
                </button>
              </div>

              {/* Add New Golfer Form */}
              {isAddingNewGolfer && (
                <form onSubmit={handleCreateGolfer} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-slate-100">
                      Add New Golfer to Club
                    </h4>
                    <button
                      type="button"
                      onClick={() => setIsAddingNewGolfer(false)}
                      className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold uppercase text-slate-500 block mb-1">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={newGolferName}
                        onChange={(e) => setNewGolferName(e.target.value)}
                        placeholder="e.g. Jordan Spieth"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold uppercase text-slate-500 block mb-1">Club Nickname</label>
                      <input
                        type="text"
                        value={newGolferNickname}
                        onChange={(e) => setNewGolferNickname(e.target.value)}
                        placeholder="e.g. Golden Child"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold uppercase text-slate-500 block mb-1">Email</label>
                      <input
                        type="email"
                        value={newGolferEmail}
                        onChange={(e) => setNewGolferEmail(e.target.value)}
                        placeholder="jordan@example.com"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold uppercase text-slate-500 block mb-1">Initial Handicap Index</label>
                      <input
                        type="number"
                        step="0.1"
                        value={newGolferHcp}
                        onChange={(e) => setNewGolferHcp(e.target.value)}
                        placeholder="12.0"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="btn-modern w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create & Switch to Golfer</span>
                  </button>
                </form>
              )}

              {/* Subtab 1: Overview */}
              {profileSubTab === 'overview' && (
                <div className="space-y-5">
                  {/* Active Golfer Card */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-slate-50 to-blue-500/5 dark:from-emerald-950/40 dark:via-slate-800/40 dark:to-blue-950/20 border border-emerald-300 dark:border-emerald-800/60 space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-3.5">
                        <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-800 border-2 border-emerald-500 flex items-center justify-center text-3xl shadow-sm shrink-0">
                          {activeUser.avatarEmoji}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-heading font-extrabold text-xl text-slate-900 dark:text-slate-100">
                              {activeUser.name}
                            </h4>
                            {activeUser.nickname && (
                              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                "{activeUser.nickname}"
                              </span>
                            )}
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white uppercase tracking-wider">
                              ACTIVE GOLFER
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Official WHS Index: <strong className="text-emerald-600 dark:text-emerald-400 font-stats">{activeUser.handicapIndex > 0 ? activeUser.handicapIndex.toFixed(1) : `+${Math.abs(activeUser.handicapIndex).toFixed(1)}`}</strong> · Badge: {activeUser.badgeTitle}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-2">
                      <div className="p-3 bg-white/80 dark:bg-slate-800/80 rounded-xl text-center border border-slate-200/80 dark:border-slate-700/80">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Scoring Avg</span>
                        <span className="font-stats font-extrabold text-lg text-slate-900 dark:text-slate-100">{activeUser.scoringAverage || 0}</span>
                      </div>
                      <div className="p-3 bg-white/80 dark:bg-slate-800/80 rounded-xl text-center border border-slate-200/80 dark:border-slate-700/80">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Avg Putts</span>
                        <span className="font-stats font-extrabold text-lg text-emerald-600 dark:text-emerald-400">{activeUser.avgPutts || 0}</span>
                      </div>
                      <div className="p-3 bg-white/80 dark:bg-slate-800/80 rounded-xl text-center border border-slate-200/80 dark:border-slate-700/80">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Avg GIR</span>
                        <span className="font-stats font-extrabold text-lg text-emerald-600 dark:text-emerald-400">{avgGirCount} / 18</span>
                      </div>
                      <div className="p-3 bg-white/80 dark:bg-slate-800/80 rounded-xl text-center border border-slate-200/80 dark:border-slate-700/80">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Low 18</span>
                        <span className="font-stats font-extrabold text-lg text-amber-500">{activeUser.bestRound || 0}</span>
                      </div>
                      <div className="p-3 bg-white/80 dark:bg-slate-800/80 rounded-xl text-center border border-slate-200/80 dark:border-slate-700/80">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Low 9</span>
                        <span className="font-stats font-extrabold text-lg text-amber-500">{activeUser.bestRound9 || 0}</span>
                      </div>
                      <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl text-center border border-amber-200/80 dark:border-amber-800/60">
                        <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-500 uppercase tracking-wide block">🍹 Avg Drinks</span>
                        <span className="font-stats font-bold text-lg text-amber-600 dark:text-amber-400">{avgDrinks}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                    <button onClick={() => setHistoryTab('rounds')} className={`btn-modern px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${historyTab === 'rounds' ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'}`}>
                      Round Records ({myRounds.length})
                    </button>
                    <button onClick={() => setHistoryTab('differentials')} className={`btn-modern px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${historyTab === 'differentials' ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'}`}>
                      WHS Differentials ({safeDifferentials.length})
                    </button>
                    <button onClick={() => setHistoryTab('scrambles')} className={`btn-modern px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${historyTab === 'scrambles' ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'}`}>
                      Team Events ({myTeamEvents.length})
                    </button>
                  </div>

                  {historyTab === 'rounds' && (
                    <div className="space-y-3">
                      {myRounds.length === 0 ? (
                        <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800">
                          No individual round cards saved yet for this player.
                        </div>
                      ) : (
                        myRounds.map((r) => (
                          <ExpandableRoundCard
                            key={r.id}
                            round={r}
                            member={activeUser}
                            courses={courses}
                            onUpdatePastRound={onUpdatePastRound}
                            onDeletePastRound={onDeletePastRound}
                          />
                        ))
                      )}
                    </div>
                  )}

                  {historyTab === 'differentials' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500 dark:text-slate-400">Formula: (113 / Slope) * (Gross - Rating).</span>
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                          <Star className="w-3 h-3 fill-current" /> ★ Lowest 8 count in Index
                        </span>
                      </div>
                      <div className="card-modern rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                        {safeDifferentials.length === 0 ? (
                          <div className="p-6 text-center text-xs text-slate-400">No differentials recorded yet.</div>
                        ) : (
                          safeDifferentials.map((diff, idx) => (
                            <div key={diff.roundId || idx} className={`p-3.5 flex items-center justify-between text-xs transition-colors ${diff.usedInIndex ? 'bg-emerald-50/50 dark:bg-emerald-950/20 font-semibold text-slate-900 dark:text-slate-100' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40'}`}>
                              <div className="flex items-center gap-3 min-w-0">
                                {diff.usedInIndex ? (
                                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] shrink-0 font-bold">★</span>
                                ) : (
                                  <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center text-[10px] shrink-0 font-stats">{idx + 1}</span>
                                )}
                                <div className="min-w-0">
                                  <span className="font-medium text-slate-900 dark:text-slate-100 truncate block">{diff.courseName}</span>
                                  <span className="text-[11px] text-slate-400 block">{diff.date}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-4 text-right shrink-0">
                                <span className="font-stats text-slate-800 dark:text-slate-200">{diff.grossScore} Gross</span>
                                <span className="font-stats font-bold text-emerald-600 dark:text-emerald-400 text-sm">{diff.differential} Diff</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {historyTab === 'scrambles' && (
                    <div className="space-y-3">
                      {myTeamEvents.length === 0 ? (
                        <div className="p-6 text-center text-xs text-slate-400 border border-slate-200 dark:border-slate-800 rounded-xl">
                          No scramble shootouts recorded for this player yet.
                        </div>
                      ) : (
                        myTeamEvents.map((ev) => (
                          <ExpandableTeamEventCard 
                            key={ev.id} 
                            event={ev} 
                            courses={courses}
                            onUpdateTeamEvent={onUpdateTeamEvent}
                            onDeleteTeamEvent={onDeleteTeamEvent}
                          />
                        ))
                      )}
                    </div>
                  )}

                </div>
              )}

              {/* Subtab 2: Edit Profile Form */}
              {profileSubTab === 'edit' && (
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs text-blue-700 dark:text-blue-300 flex items-center gap-2">
                    <Mail className="w-4 h-4 shrink-0" />
                    <span>Adding your email enables 7-day advance muni tee time alert notifications!</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Full Legal Name</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Club Nickname</label>
                      <input
                        type="text"
                        value={editNickname}
                        onChange={(e) => setEditNickname(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Email Address</label>
                      <input
                        type="email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        placeholder="dwong@example.com"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Mobile Phone (Optional)</label>
                      <input
                        type="tel"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        placeholder="(408) 555-0199"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Handicap Goal</label>
                      <input
                        type="number"
                        step="0.1"
                        value={editGoal}
                        onChange={(e) => setEditGoal(e.target.value)}
                        placeholder="e.g. 9.5"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold"
                      />
                    </div>
                  </div>

                  {/* Avatar Picker */}
                  <div>
                    <label className="text-xs font-bold uppercase text-slate-500 block mb-1.5">Avatar Mascot Emoji</label>
                    <div className="flex items-center gap-2 flex-wrap">
                      {EMOJI_OPTIONS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setEditAvatar(emoji)}
                          className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center border cursor-pointer transition-transform ${
                            editAvatar === emoji
                              ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950 scale-110 shadow-xs'
                              : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn-modern w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Save Profile Changes</span>
                  </button>
                </form>
              )}

              {/* Subtab 3: Switch Active Golfer */}
              {profileSubTab === 'switch' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Switch which player you are scoring and tracking as in the clubhouse:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {members.map((m) => {
                      const isCurrent = m.id === activeUser.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            onSelectActiveUser(m.id);
                            showToast(`Switched active golfer to ${m.nickname}!`);
                            setProfileSubTab('overview');
                          }}
                          className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                            isCurrent
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-700 shadow-2xs'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{m.avatarEmoji}</span>
                            <div>
                              <div className="font-heading font-bold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                                <span>{m.name}</span>
                                {isCurrent && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-600 text-white">
                                    YOU
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-slate-500">"{m.nickname}"</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 block uppercase">Index</span>
                            <span className="font-stats font-bold text-xs text-emerald-600 dark:text-emerald-400">
                              {m.handicapIndex.toFixed(1)}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= SECTION 2: SCRAMBLE SQUADS ================= */}
          {hubTab === 'teams' && (
            <div className="space-y-6">
              {!isEditingTeam ? (
                <>
                  {/* Action Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <h4 className="font-heading font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                        Registered Scramble Squads ({teams.length})
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Pre-configured 1 to 4 player teams for Scramble & Team Match Play
                      </p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => handleStartCreateTeam(1)}
                        className="btn-modern py-2 px-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                        title="Create 1-Person Practice/Solo Squad"
                      >
                        <User className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">Solo (1P)</span>
                      </button>
                      <button
                        onClick={() => handleStartCreateTeam(2)}
                        className="btn-modern py-2 px-2.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                        title="Create 2-Man Duo"
                      >
                        <Plus className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">Duo (2P)</span>
                      </button>
                      <button
                        onClick={() => handleStartCreateTeam(3)}
                        className="btn-modern py-2 px-2.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                        title="Create 3-Man Trio"
                      >
                        <Users className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">Trio (3P)</span>
                      </button>
                      <button
                        onClick={() => handleStartCreateTeam(4)}
                        className="btn-modern py-2 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                        title="Create 4-Man Full Scramble Squad"
                      >
                        <Users className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">4-Man (4P)</span>
                      </button>
                    </div>
                  </div>

                  {/* Advantage Notice */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-300">
                    <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      <strong>Pre-Built Teams Advantage:</strong> In round setup, select these squads in 1-tap instead of configuring up to 4 players manually every time.
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
                          className="card-modern p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3.5 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="text-2xl shrink-0">{team.avatarEmoji || '🎯'}</span>
                                <div className="min-w-0">
                                  <h5 className="font-heading font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100 truncate">
                                    {team.name}
                                  </h5>
                                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 flex-wrap">
                                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                      {squadLabel}
                                    </span>
                                    <span>·</span>
                                    <span>Scramble Hcp: <strong className="font-stats text-slate-900 dark:text-slate-100">{teamHcp.toFixed(1)}</strong></span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={() => handleStartEditTeam(team)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                                  title="Edit Team"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteTeam(team.id)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                                  title="Delete Team"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Roster Badges */}
                            <div className="flex items-center gap-1.5 flex-wrap pt-2">
                              {roster.map((p) => (
                                <span
                                  key={p.id}
                                  className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300"
                                >
                                  {p.avatarEmoji} {p.name.split(' ')[0]} ({p.handicapIndex.toFixed(1)})
                                </span>
                              ))}
                            </div>
                          </div>

                          {onSelectTeamForRound && (
                            <button
                              onClick={() => {
                                onSelectTeamForRound(team);
                                onClose();
                              }}
                              className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Select Squad for Round</span>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                /* Team Builder / Editor Form */
                <form onSubmit={handleSaveTeam} className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <h4 className="font-heading font-extrabold text-base text-slate-900 dark:text-slate-100">
                      {editingTeamId ? 'Edit Scramble Squad' : 'Build New Scramble Squad'}
                    </h4>
                    <button
                      type="button"
                      onClick={() => setIsEditingTeam(false)}
                      className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>

                  {teamFormError && (
                    <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-xs font-semibold text-red-700 dark:text-red-300 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{teamFormError}</span>
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Squad Name *</label>
                    <input
                      type="text"
                      required
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      placeholder="e.g. The Dart Slingers, Bay Area Bombers"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold"
                    />
                  </div>

                  {/* Squad Target Size */}
                  <div>
                    <label className="text-xs font-bold uppercase text-slate-500 block mb-1.5">Target Squad Size</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { size: 1, label: '1 Solo' },
                        { size: 2, label: '2-Man Duo' },
                        { size: 3, label: '3-Man Trio' },
                        { size: 4, label: '4-Man Full' },
                      ].map(({ size, label }) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => handleSelectTargetSize(size)}
                          className={`py-2 px-1 text-center rounded-xl text-xs font-bold border cursor-pointer transition-all ${
                            teamTargetSize === size
                              ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-slate-900 shadow-xs'
                              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Player Selection Checklist */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold uppercase text-slate-500 block">
                        Select Golfers ({selectedTeamMemberIds.length} of {teamTargetSize})
                      </label>
                      <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                        Projected Team Hcp: {calculateTeamScrambleHandicap(selectedTeamMemberIds, members).toFixed(1)}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {members.map((m) => {
                        const isSelected = selectedTeamMemberIds.includes(m.id);
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => toggleTeamMember(m.id)}
                            className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-700 shadow-2xs'
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="text-xl">{m.avatarEmoji}</span>
                              <div>
                                <span className="font-heading font-bold text-xs text-slate-900 dark:text-slate-100 block">
                                  {m.name}
                                </span>
                                <span className="text-[10px] text-slate-500">Index: {m.handicapIndex.toFixed(1)}</span>
                              </div>
                            </div>
                            <div className={`w-5 h-5 rounded-lg border flex items-center justify-center ${
                              isSelected ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 dark:border-slate-600'
                            }`}>
                              {isSelected && <Check className="w-3.5 h-3.5" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Team Emoji & Color */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Squad Mascot</label>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {EMOJI_OPTIONS.slice(0, 8).map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => setTeamEmoji(emoji)}
                            className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center border cursor-pointer ${
                              teamEmoji === emoji ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950 scale-105' : 'border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Color Badge</label>
                      <div className="flex items-center gap-2">
                        {COLOR_OPTIONS.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => setTeamColor(c.id)}
                            className={`w-7 h-7 rounded-full ${c.bg} cursor-pointer transition-transform ${
                              teamColor === c.id ? 'ring-2 ring-offset-2 ring-emerald-500 scale-110' : ''
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn-modern w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>{editingTeamId ? 'Save Squad Changes' : 'Create Scramble Squad'}</span>
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Sticky Action Footer */}
        <div className="shrink-0 p-3.5 sm:p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
            {hubTab === 'profiles'
              ? `Logged in as ${activeUser.nickname} (${activeUser.handicapIndex.toFixed(1)} HCP)`
              : `${teams.length} Scramble Squads registered`}
          </span>
          <button
            onClick={onClose}
            className="btn-modern px-5 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-bold cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
