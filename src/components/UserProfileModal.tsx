import React, { useState } from 'react';
import { 
  X, 
  User, 
  Trophy, 
  ShieldCheck, 
  Mail, 
  Phone, 
  Sparkles, 
  Check, 
  Calendar, 
  Lock, 
  UserCheck, 
  Edit3, 
  ArrowRight,
  Target,
  Plus,
  AlertCircle
} from 'lucide-react';
import { MemberProfile, CompletedRoundRecord } from '../types';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: MemberProfile[];
  activeUserId: string;
  onSelectActiveUser: (userId: string) => void;
  onUpdateProfile: (updatedProfile: MemberProfile) => void;
  onAddNewMember?: (newMember: MemberProfile) => void;
  completedRounds: CompletedRoundRecord[];
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  members,
  activeUserId,
  onSelectActiveUser,
  onUpdateProfile,
  onAddNewMember,
  completedRounds,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'manage' | 'switch'>('overview');

  const activeUser = members.find((m) => m.id === activeUserId) || members[0];

  // Profile Edit State
  const [editName, setEditName] = useState(activeUser?.name || '');
  const [editNickname, setEditNickname] = useState(activeUser?.nickname || '');
  const [editEmail, setEditEmail] = useState(activeUser?.email || '');
  const [editPhone, setEditPhone] = useState(activeUser?.phone || '');
  const [editAvatar, setEditAvatar] = useState(activeUser?.avatarEmoji || '🎯');
  const [editGoal, setEditGoal] = useState(activeUser?.handicapGoal ? String(activeUser.handicapGoal) : '');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // New Golfer creation state
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newGolferName, setNewGolferName] = useState('');
  const [newGolferNickname, setNewGolferNickname] = useState('');
  const [newGolferEmail, setNewGolferEmail] = useState('');
  const [newGolferHcp, setNewGolferHcp] = useState('12.0');

  // Reset form when activeUser changes
  React.useEffect(() => {
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

  // Filter personal rounds
  const myRounds = completedRounds.filter(
    (r) => r.playerId === activeUser.id || r.playerName.toLowerCase() === activeUser.name.toLowerCase()
  );

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

    try {
      await fetch(`/api/members/${activeUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
    } catch {}

    onUpdateProfile(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleCreateGolfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGolferName.trim()) return;

    const newMem: MemberProfile = {
      id: `member-${Date.now()}`,
      name: newGolferName.trim(),
      nickname: newGolferNickname.trim() || newGolferName.trim(),
      email: newGolferEmail.trim() || undefined,
      avatarEmoji: '⛳',
      badgeTitle: 'Club Member',
      handicapIndex: parseFloat(newGolferHcp) || 12.0,
      roundsCount: 0,
      scoringAverage: 82.0,
      avgPutts: 32.0,
      firPercent: 55,
      girPercent: 50,
      bestRound: 80,
      differentials: [],
    };

    if (onAddNewMember) {
      onAddNewMember(newMem);
    }
    onSelectActiveUser(newMem.id);
    setIsAddingNew(false);
    setNewGolferName('');
    setNewGolferNickname('');
    setNewGolferEmail('');
    setActiveTab('overview');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="card-elevated max-w-2xl w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden my-6 shadow-2xl text-slate-900 dark:text-slate-100 transition-colors">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600/10 dark:bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-2xl shadow-xs">
              {activeUser.avatarEmoji}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-extrabold text-xl text-slate-900 dark:text-slate-100">
                  {activeUser.nickname}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  Active Golfer
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {activeUser.name} · WHS Index: <strong className="text-slate-900 dark:text-slate-100">{activeUser.handicapIndex.toFixed(1)}</strong>
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

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 bg-white dark:bg-slate-900 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'overview'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 dark:border-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            My Stats & Scores ({myRounds.length})
          </button>
          <button
            onClick={() => setActiveTab('manage')}
            className={`py-3 px-2 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'manage'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 dark:border-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit My Profile & Email</span>
          </button>
          <button
            onClick={() => setActiveTab('switch')}
            className={`py-3 px-2 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'switch'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 dark:border-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Switch Golfer ({members.length})</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 sm:p-6 max-h-[70vh] overflow-y-auto">
          {/* TAB 1: OVERVIEW & PERSONAL SCORES */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Quick Stat Tiles */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="card-modern p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-center">
                  <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
                    Handicap Index
                  </div>
                  <div className="font-heading font-extrabold text-2xl text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {activeUser.handicapIndex.toFixed(1)}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Official WHS</div>
                </div>

                <div className="card-modern p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-center">
                  <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
                    Scoring Avg
                  </div>
                  <div className="font-heading font-extrabold text-2xl text-slate-900 dark:text-slate-100 mt-0.5">
                    {activeUser.scoringAverage.toFixed(1)}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Best: {activeUser.bestRound}</div>
                </div>

                <div className="card-modern p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-center">
                  <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
                    Fairways Hit
                  </div>
                  <div className="font-heading font-extrabold text-2xl text-slate-900 dark:text-slate-100 mt-0.5">
                    {activeUser.firPercent}%
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">GIR: {activeUser.girPercent}%</div>
                </div>

                <div className="card-modern p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-center">
                  <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
                    Avg Putts
                  </div>
                  <div className="font-heading font-extrabold text-2xl text-slate-900 dark:text-slate-100 mt-0.5">
                    {activeUser.avgPutts.toFixed(1)}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">per 18 holes</div>
                </div>
              </div>

              {/* Email Alert Banner */}
              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-semibold text-emerald-950 dark:text-emerald-200 block">
                      Booking Email: {activeUser.email || 'No email configured'}
                    </span>
                    <span className="text-[11px] text-emerald-700 dark:text-emerald-300">
                      Used to send 7-day tee sheet booking alerts and reminder notices.
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('manage')}
                  className="px-2.5 py-1 bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer hover:bg-emerald-100"
                >
                  {activeUser.email ? 'Change Email' : 'Add Email'}
                </button>
              </div>

              {/* Recent Personal Scores List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-slate-100">
                    My Scoring History
                  </h4>
                  <span className="text-xs text-slate-400">{myRounds.length} Completed Rounds</span>
                </div>

                {myRounds.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      No personal rounds recorded for {activeUser.name} yet.
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Start a new round or scan a scorecard to begin tracking your stats!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {myRounds.map((round) => (
                      <div
                        key={round.id}
                        className="p-3.5 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between gap-3 transition-colors"
                      >
                        <div className="min-w-0">
                          <div className="font-heading font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                            {round.courseName}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                            <span>{round.date}</span>
                            <span>•</span>
                            <span>{round.teeName}</span>
                            <span>•</span>
                            <span className="capitalize">{round.format.replace('_', ' ')}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <div className="font-heading font-black text-base text-slate-900 dark:text-slate-100">
                              {round.grossScore}
                            </div>
                            <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                              Diff: +{round.differential.toFixed(1)}
                            </div>
                          </div>
                          <div className="hidden sm:block text-right text-[11px] text-slate-400 border-l border-slate-200 dark:border-slate-700 pl-3">
                            <div>Putts: {round.totalPutts || '—'}</div>
                            <div>GIR: {round.girCount || '—'}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Differentials Used for Index */}
              <div className="space-y-2">
                <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-slate-100">
                  WHS Differentials (Top 8 of Last 20)
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {activeUser.differentials.slice(0, 8).map((diff, i) => (
                    <div
                      key={diff.roundId || i}
                      className={`p-2.5 rounded-xl border text-xs ${
                        diff.usedInIndex
                          ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700/60'
                          : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          +{diff.differential.toFixed(1)}
                        </span>
                        {diff.usedInIndex && (
                          <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                            COUNTED
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate mt-0.5">
                        {diff.courseName}
                      </div>
                      <div className="text-[10px] text-slate-400">{diff.grossScore} gross</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MANAGE PROFILE & EMAIL (Protected: Active user only) */}
          {activeTab === 'manage' && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-xs flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>Authorized Session:</strong> You are currently managing your personal profile. Changes are stored immediately.
                </span>
              </div>

              {saveSuccess && (
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/40 border border-emerald-300 dark:border-emerald-700 rounded-xl text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Profile updated successfully!</span>
                </div>
              )}

              {/* Name & Nickname */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                    Full Legal / Official Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                    Custom Nickname (Shown on Leaderboards)
                  </label>
                  <input
                    type="text"
                    required
                    value={editNickname}
                    onChange={(e) => setEditNickname(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Email Address & Phone Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Notification Email Address</span>
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. dave.wong@example.com"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="text-[10px] text-slate-400">
                    Required to receive automated 7-day booking window alerts.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Mobile Phone Number</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. (415) 555-0182"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400">
                    Used for group chat tee time broadcasts.
                  </p>
                </div>
              </div>

              {/* Avatar Emoji Selector */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  Select Golfer Avatar Emoji
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {['🎯', '⚡', '🪄', '🏹', '🦅', '⛳', '🔥', '🏆', '🎩', '🐻', '💣', '👑'].map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setEditAvatar(emoji)}
                      className={`w-10 h-10 rounded-xl text-lg flex items-center justify-center cursor-pointer transition-transform ${
                        editAvatar === emoji
                          ? 'bg-emerald-600 text-white scale-110 shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Handicap Goal */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  Season Handicap Goal
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 6.0"
                  value={editGoal}
                  onChange={(e) => setEditGoal(e.target.value)}
                  className="w-full sm:w-48 p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-slate-100"
                />
              </div>

              {/* Save Button */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Profile Changes</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: SWITCH GOLFER PROFILE */}
          {activeTab === 'switch' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-slate-100">
                    Club Roster & Profiles
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Select your golfer identity to view your personal stats and manage your rounds.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddingNew(!isAddingNew)}
                  className="btn-modern px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isAddingNew ? 'Cancel' : 'Add New Golfer'}</span>
                </button>
              </div>

              {/* Add New Golfer Form */}
              {isAddingNew && (
                <form
                  onSubmit={handleCreateGolfer}
                  className="p-4 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl space-y-3"
                >
                  <h5 className="font-heading font-bold text-xs text-emerald-950 dark:text-emerald-200">
                    Add New Bay Area Darts Golfer
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Jordan Spieth"
                        value={newGolferName}
                        onChange={(e) => setNewGolferName(e.target.value)}
                        className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                        Nickname
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Golden Child"
                        value={newGolferNickname}
                        onChange={(e) => setNewGolferNickname(e.target.value)}
                        className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                        Email Address (for booking alerts)
                      </label>
                      <input
                        type="email"
                        placeholder="e.g. jordan@example.com"
                        value={newGolferEmail}
                        onChange={(e) => setNewGolferEmail(e.target.value)}
                        className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                        Current Handicap Index
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="12.0"
                        value={newGolferHcp}
                        onChange={(e) => setNewGolferHcp(e.target.value)}
                        className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Add Golfer & Log In
                  </button>
                </form>
              )}

              {/* Members List */}
              <div className="space-y-2">
                {members.map((member) => {
                  const isActive = member.id === activeUserId;
                  return (
                    <div
                      key={member.id}
                      onClick={() => {
                        onSelectActiveUser(member.id);
                        setActiveTab('overview');
                      }}
                      className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                        isActive
                          ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-500 ring-2 ring-emerald-500/30 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-xl shrink-0 shadow-2xs">
                          {member.avatarEmoji}
                        </div>
                        <div className="truncate">
                          <div className="flex items-center gap-2">
                            <span className="font-heading font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                              {member.nickname}
                            </span>
                            {isActive && (
                              <span className="px-2 py-0.2 rounded-full text-[9px] font-bold bg-emerald-600 text-white uppercase tracking-wider">
                                YOU
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {member.name} {member.email ? `• ${member.email}` : ''}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <div className="font-heading font-black text-sm text-slate-900 dark:text-slate-100">
                            {member.handicapIndex.toFixed(1)}
                          </div>
                          <div className="text-[10px] text-slate-400">HCP Index</div>
                        </div>
                        {isActive ? (
                          <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        ) : (
                          <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <span>Switch</span>
                            <ArrowRight className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
