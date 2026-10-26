import React, { useState } from 'react';
import { X, Users, Search, ChevronRight, Trophy, ShieldCheck, UserCheck } from 'lucide-react';
import { MemberProfile, TeamGroup, CompletedRoundRecord, TeamEventRecord } from '../types';

interface PlayerListModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: MemberProfile[];
  teams?: TeamGroup[];
  completedRounds?: CompletedRoundRecord[];
  teamEvents?: TeamEventRecord[];
  onSelectMember: (member: MemberProfile) => void;
  onSelectTeam?: (team: TeamGroup) => void;
  initialTab?: 'players' | 'squads' | 'guests';
  onTabChange?: (tab: 'players' | 'squads' | 'guests') => void;
}

export const PlayerListModal: React.FC<PlayerListModalProps> = ({
  isOpen,
  onClose,
  members,
  teams = [],
  completedRounds = [],
  teamEvents = [],
  onSelectMember,
  onSelectTeam,
  initialTab = 'players',
  onTabChange,
}) => {
  const [activeTab, setActiveTab] = useState<'players' | 'squads' | 'guests'>(initialTab);
  const [searchTerm, setSearchTerm] = useState('');

  // Reset to default state whenever modal is closed
  React.useEffect(() => {
    if (!isOpen) {
      setActiveTab('players');
      setSearchTerm('');
    } else if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  const handleClose = () => {
    setActiveTab('players');
    setSearchTerm('');
    if (onTabChange) onTabChange('players');
    onClose();
  };

  const handleTabChange = (tab: 'players' | 'squads' | 'guests') => {
    setActiveTab(tab);
    if (onTabChange) onTabChange(tab);
  };

  if (!isOpen) return null;

  const officialMembers = members.filter(m => !m.isGuest);
  const guestMembers = members.filter(m => m.isGuest);

  // Search filter per tab
  const searchLower = searchTerm.toLowerCase().trim();

  const filteredOfficial = officialMembers.filter(m => 
    !searchLower ||
    m.name.toLowerCase().includes(searchLower) || 
    (m.nickname && m.nickname.toLowerCase().includes(searchLower))
  ).sort((a, b) => a.name.localeCompare(b.name));

  const filteredGuests = guestMembers.filter(m => 
    !searchLower ||
    m.name.toLowerCase().includes(searchLower) || 
    (m.nickname && m.nickname.toLowerCase().includes(searchLower))
  ).sort((a, b) => a.name.localeCompare(b.name));

  const filteredSquads = teams.filter(t => {
    if (!searchLower) return true;
    if (t.name.toLowerCase().includes(searchLower)) return true;
    return t.playerIds.some(id => {
      const mem = members.find(m => m.id === id);
      return mem && (mem.name.toLowerCase().includes(searchLower) || (mem.nickname && mem.nickname.toLowerCase().includes(searchLower)));
    });
  }).sort((a, b) => a.name.localeCompare(b.name));

  // Dynamic stats calculators for accurate rounds count and best scores
  const getPlayerStats = (member: MemberProfile) => {
    const memberRounds = completedRounds.filter(
      (r) =>
        (r.playerId === member.id ||
          (r.playerName && member.name && r.playerName.toLowerCase() === member.name.toLowerCase())) &&
        !r.isTeamRound &&
        r.format !== 'scramble' &&
        r.format !== 'best_ball'
    );

    const roundsCount = Math.max(
      memberRounds.length,
      member.differentials?.length || 0,
      member.roundsCount || 0
    );

    const scores: number[] = [];
    memberRounds.forEach((r) => {
      const s = Number(r.grossScore);
      if (s > 0 && (!r.holesPlayed || r.holesPlayed === '18')) {
        scores.push(s);
      }
    });
    (member.differentials || []).forEach((d) => {
      if (d.grossScore && d.grossScore > 0) {
        scores.push(d.grossScore);
      }
    });
    if (member.bestRound && member.bestRound > 0) {
      scores.push(member.bestRound);
    }

    const bestScore = scores.length > 0 ? Math.min(...scores) : null;
    return { roundsCount, bestScore };
  };

  const getTeamStats = (team: TeamGroup) => {
    const matchingEvents = teamEvents.filter((ev) => {
      return (
        ev.winningTeamName?.toLowerCase() === team.name.toLowerCase() ||
        ev.teamLeaderboard?.some(
          (t) =>
            t.teamName?.toLowerCase() === team.name.toLowerCase() ||
            (t.playerNames?.length === team.playerIds?.length &&
              team.playerIds.every((pid) => {
                const m = members.find((mem) => mem.id === pid);
                return m && t.playerNames.some((pn) => pn.toLowerCase().includes(m.name.toLowerCase()));
              }))
        )
      );
    });

    const matchingCompletedTeamRounds = completedRounds.filter((r) => {
      return (
        (r.isTeamRound || r.format === 'scramble') &&
        ((r as any).teamId === team.id ||
          (r as any).teamName?.toLowerCase() === team.name.toLowerCase() ||
          (r.playerName && r.playerName.toLowerCase() === team.name.toLowerCase()))
      );
    });

    const teamScores: number[] = [];

    matchingEvents.forEach((ev) => {
      ev.teamLeaderboard?.forEach((t) => {
        const isThisTeam =
          t.teamName?.toLowerCase() === team.name.toLowerCase() ||
          ev.winningTeamName?.toLowerCase() === team.name.toLowerCase();
        if (isThisTeam && t.grossScore && t.grossScore > 0) {
          teamScores.push(t.grossScore);
        }
      });
    });

    matchingCompletedTeamRounds.forEach((r) => {
      const gs = Number(r.grossScore);
      if (gs > 0) teamScores.push(gs);
    });

    if (team.stats?.bestScore && team.stats.bestScore > 0) {
      teamScores.push(team.stats.bestScore);
    }

    const roundsCount = Math.max(
      matchingEvents.length + matchingCompletedTeamRounds.length,
      team.stats?.roundsCount || 0
    );

    const bestScore = teamScores.length > 0 ? Math.min(...teamScores) : null;
    return { roundsCount, bestScore };
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex sm:items-center justify-center p-0 sm:p-4 overflow-hidden">
      <div className="w-full sm:max-w-2xl h-[100dvh] sm:h-auto sm:max-h-[88vh] sm:rounded-3xl bg-white dark:bg-slate-900 border-0 sm:border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden text-slate-900 dark:text-slate-100 transition-colors">
        
        {/* Header (Read-Only) */}
        <div className="shrink-0 p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-lg sm:text-xl text-slate-900 dark:text-slate-100 truncate">
                Clubhouse Roster & Teams
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                Directory of official members, scramble squads, and guest players
              </p>
            </div>
          </div>
          <button 
            onClick={handleClose} 
            className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer shrink-0"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3 Tabs Bar */}
        <div className="shrink-0 px-4 pt-3 pb-2 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => handleTabChange('players')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'players'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Registered Players</span>
            <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
              activeTab === 'players' ? 'bg-emerald-700 text-emerald-100' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}>
              {officialMembers.length}
            </span>
          </button>

          <button
            onClick={() => handleTabChange('squads')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'squads'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Squads</span>
            <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
              activeTab === 'squads' ? 'bg-emerald-700 text-emerald-100' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}>
              {teams.length}
            </span>
          </button>

          <button
            onClick={() => handleTabChange('guests')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'guests'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Guest Members</span>
            <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
              activeTab === 'guests' ? 'bg-emerald-700 text-emerald-100' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}>
              {guestMembers.length}
            </span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="shrink-0 p-3 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder={
                activeTab === 'players' 
                  ? "Search registered members by name or nickname..." 
                  : activeTab === 'squads'
                    ? "Search squads by team name or golfer..."
                    : "Search guest players..."
              } 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
            />
          </div>
        </div>

        {/* Tab Content List */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-2">
          {/* 1. REGISTERED PLAYERS TAB */}
          {activeTab === 'players' && (
            filteredOfficial.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 border border-slate-200 dark:border-slate-800 rounded-2xl">
                No registered players found{searchTerm ? ` matching "${searchTerm}"` : ''}.
              </div>
            ) : (
              filteredOfficial.map(member => {
                const { roundsCount, bestScore } = getPlayerStats(member);
                return (
                  <div 
                    key={member.id}
                    onClick={() => onSelectMember(member)}
                    className="p-3.5 bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center text-2xl shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                        {member.avatarEmoji}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-heading font-bold text-sm text-slate-900 dark:text-slate-100 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                            {member.name}
                          </span>
                          {member.nickname && (
                            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                              "{member.nickname}"
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-500 dark:text-slate-400 truncate block mt-0.5">
                          Index: <strong className="font-mono text-slate-700 dark:text-slate-300">{member.handicapIndex.toFixed(1)}</strong> · {roundsCount} {roundsCount === 1 ? 'round' : 'rounds'}{bestScore ? ` · Best: ${bestScore}` : ''}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-emerald-500 transition-colors shrink-0" />
                  </div>
                );
              })
            )
          )}

          {/* 2. SQUADS TAB */}
          {activeTab === 'squads' && (
            filteredSquads.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 border border-slate-200 dark:border-slate-800 rounded-2xl">
                No scramble squads found{searchTerm ? ` matching "${searchTerm}"` : ''}.
              </div>
            ) : (
              filteredSquads.map(team => {
                const teamMembers = team.playerIds
                  .map(id => members.find(m => m.id === id))
                  .filter(Boolean) as MemberProfile[];
                const { roundsCount: squadRoundsCount, bestScore: squadBestScore } = getTeamStats(team);

                return (
                  <div 
                    key={team.id}
                    onClick={() => {
                      if (onSelectTeam) onSelectTeam(team);
                    }}
                    className="p-3.5 bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center text-2xl shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                        {team.avatarEmoji || '⚡'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-heading font-bold text-sm text-slate-900 dark:text-slate-100 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                            {team.name}
                          </span>
                          {team.colorTag && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                              {team.colorTag}
                            </span>
                          )}
                        </div>

                        {/* Roster Badges */}
                        <div className="flex items-center gap-1.5 flex-wrap mt-1">
                          {teamMembers.map(m => (
                            <span 
                              key={m.id}
                              className="text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-1 bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded-md border border-slate-200/60 dark:border-slate-700/60"
                            >
                              <span>{m.avatarEmoji}</span>
                              <span className="font-medium truncate max-w-[80px]">{m.name.split(' ')[0]}</span>
                            </span>
                          ))}
                        </div>

                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1">
                          {squadRoundsCount} scramble {squadRoundsCount === 1 ? 'round' : 'rounds'}
                          {squadBestScore ? ` · Best: ${squadBestScore}` : ''}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-emerald-500 transition-colors shrink-0" />
                  </div>
                );
              })
            )
          )}

          {/* 3. GUEST MEMBERS TAB */}
          {activeTab === 'guests' && (
            filteredGuests.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 border border-slate-200 dark:border-slate-800 rounded-2xl">
                No guest members found{searchTerm ? ` matching "${searchTerm}"` : ''}.
              </div>
            ) : (
              filteredGuests.map(member => {
                const { roundsCount, bestScore } = getPlayerStats(member);
                return (
                  <div 
                    key={member.id}
                    onClick={() => onSelectMember(member)}
                    className="p-3.5 bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center text-2xl shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                        {member.avatarEmoji}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-heading font-bold text-sm text-slate-900 dark:text-slate-100 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                            {member.name}
                          </span>
                          {member.nickname && (
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                              "{member.nickname}"
                            </span>
                          )}
                          <span className="px-1.5 py-0.5 rounded text-[8px] bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold uppercase">
                            Guest Member
                          </span>
                        </div>
                        <span className="text-xs text-slate-500 dark:text-slate-400 truncate block mt-0.5">
                          Index: <strong className="font-mono text-slate-700 dark:text-slate-300">{member.handicapIndex.toFixed(1)}</strong> · {roundsCount} {roundsCount === 1 ? 'round' : 'rounds'}{bestScore ? ` · Best: ${bestScore}` : ''}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-emerald-500 transition-colors shrink-0" />
                  </div>
                );
              })
            )
          )}
        </div>
      </div>
    </div>
  );
};
