import React, { useState } from 'react';
import { X, Users, Search, ChevronRight } from 'lucide-react';
import { MemberProfile } from '../types';

interface PlayerListModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: MemberProfile[];
  onSelectMember: (member: MemberProfile) => void;
}

export const PlayerListModal: React.FC<PlayerListModalProps> = ({
  isOpen,
  onClose,
  members,
  onSelectMember
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (m.nickname && m.nickname.toLowerCase().includes(searchTerm.toLowerCase()))
  ).sort((a, b) => {
    // Sort official members first, then guests, then alphabetically
    if (a.isGuest === b.isGuest) {
      return a.name.localeCompare(b.name);
    }
    return a.isGuest ? 1 : -1;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex sm:items-center justify-center p-0 sm:p-4 overflow-hidden">
      <div className="w-full sm:max-w-2xl h-[100dvh] sm:h-auto sm:max-h-[88vh] sm:rounded-3xl bg-white dark:bg-slate-900 border-0 sm:border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden text-slate-900 dark:text-slate-100 transition-colors">
        
        {/* Header */}
        <div className="shrink-0 p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-lg sm:text-xl text-slate-900 dark:text-slate-100 truncate">
                Club Player List
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                Directory of official members and manual guests
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="shrink-0 p-3 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by name or nickname..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-2">
          {filteredMembers.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 border border-slate-200 dark:border-slate-800 rounded-xl">
              No players found matching "{searchTerm}".
            </div>
          ) : (
            filteredMembers.map(member => (
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
                      {member.isGuest && (
                        <span className="px-1.5 py-0.5 rounded text-[8px] bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold uppercase">
                          Guest Member
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 truncate block mt-0.5">
                      Index: <strong className="font-stats text-slate-700 dark:text-slate-300">{member.handicapIndex.toFixed(1)}</strong> · {member.roundsCount} rounds
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-emerald-500 transition-colors shrink-0" />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
