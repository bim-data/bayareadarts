import React, { useState } from 'react';
import { X, Users, Search, ChevronRight, Trophy, ShieldCheck, UserCheck } from 'lucide-react';
import { MemberProfile, TeamGroup } from '../types';

interface PlayerListModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: MemberProfile[];
  teams?: TeamGroup[];
  onSelectMember: (member: MemberProfile) => void;
  onSelectTeam?: (team: TeamGroup) => void;
}

export const PlayerListModal: React.FC<PlayerListModalProps> = ({
  isOpen,
  onClose,
  members,
  teams = [],
  onSelectMember,
  onSelectTeam
}) => {
  const [activeTab, setActiveTab] = useState<'players' | 'squads' | 'guests'>('players');
  const [searchTerm, setSearchTerm] = useState('');

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
            onClick={onClose} 
            className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer shrink-0"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3 Tabs Bar */}
        <div className="shrink-0 px-4 pt-3 pb-2 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setActiveTab('players')}
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
            onClick={() => setActiveTab('squads')}
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
            onClick={() => setActiveTab('guests')}
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
              filteredOfficial.map(member => (
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
                        Index: <strong className="font-mono text-slate-700 dark:text-slate-300">{member.handicapIndex.toFixed(1)}</strong> · {member.roundsCount} rounds
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-emerald-500 transition-colors shrink-0" />
                </div>
              ))
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
                          {team.stats?.roundsCount || 0} scramble rounds
                          {team.stats?.bestScore ? ` · Best: ${team.stats.bestScore}` : ''}
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
              filteredGuests.map(member => (
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
                        Index: <strong className="font-mono text-slate-700 dark:text-slate-300">{member.handicapIndex.toFixed(1)}</strong> · {member.roundsCount} rounds
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-emerald-500 transition-colors shrink-0" />
                </div>
              ))
            )
          )}
        </div>
      </div>
    </div>
  );
};
