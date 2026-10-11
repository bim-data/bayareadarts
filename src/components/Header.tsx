import React from 'react';
import { 
  Trophy, 
  Plus, 
  Users, 
  Flag, 
  Camera, 
  Calendar, 
  Sun, 
  Moon,
  Sparkles,
  User,
  ChevronDown
} from 'lucide-react';
import { GameFormat, RoundSession, MemberProfile } from '../types';

interface HeaderProps {
  currentTab: 'clubhouse' | 'live' | 'rankings' | 'courses' | 'events' | 'future';
  setCurrentTab: (tab: 'clubhouse' | 'live' | 'rankings' | 'courses' | 'events' | 'future') => void;
  activeSession: RoundSession | null;
  activeUser?: MemberProfile;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenNewRound: () => void;
  onOpenJoinRoom: () => void;
  onOpenOcr: () => void;
  onOpenEditNickname: () => void;
  onOpenProfile: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  activeSession,
  activeUser,
  darkMode,
  onToggleDarkMode,
  onOpenNewRound,
  onOpenJoinRoom,
  onOpenOcr,
  onOpenEditNickname,
  onOpenProfile,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Comic Emblem Wordmark */}
        <div 
          onClick={() => setCurrentTab('clubhouse')}
          className="flex items-center gap-3 cursor-pointer select-none shrink-0"
        >
          <div className="w-10 h-10 rounded-full border border-slate-300 dark:border-slate-700 overflow-hidden shadow-sm hover:scale-105 transition-transform bg-white">
            <img 
              src="/src/assets/images/bay_area_darts_logo_1791561323731.jpg" 
              alt="Bay Area Darts Emblem"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-heading font-extrabold text-base sm:text-lg tracking-tight text-slate-900 dark:text-slate-100 leading-none">
              BAY AREA DARTS
            </span>
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 tracking-wider uppercase">
              Golf Club & Handicap
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold">
          <button
            onClick={() => setCurrentTab('clubhouse')}
            className={`whitespace-nowrap transition-colors pb-1 border-b-2 cursor-pointer ${
              currentTab === 'clubhouse'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 dark:border-emerald-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            Clubhouse
          </button>

          {activeSession && (
            <button
              onClick={() => setCurrentTab('live')}
              className={`whitespace-nowrap transition-colors pb-1 border-b-2 flex items-center gap-1.5 cursor-pointer ${
                currentTab === 'live'
                  ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 dark:border-emerald-400'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Round ({activeSession.roomCode})
            </button>
          )}

          <button
            onClick={() => setCurrentTab('future')}
            className={`whitespace-nowrap transition-colors pb-1 border-b-2 cursor-pointer ${
              currentTab === 'future'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 dark:border-emerald-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            Future Rounds
          </button>

          <button
            onClick={() => setCurrentTab('rankings')}
            className={`whitespace-nowrap transition-colors pb-1 border-b-2 cursor-pointer ${
              currentTab === 'rankings'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 dark:border-emerald-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            WHS Rankings
          </button>

          <button
            onClick={() => setCurrentTab('courses')}
            className={`whitespace-nowrap transition-colors pb-1 border-b-2 cursor-pointer ${
              currentTab === 'courses'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 dark:border-emerald-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            Courses
          </button>

          <button
            onClick={() => setCurrentTab('events')}
            className={`whitespace-nowrap transition-colors pb-1 border-b-2 cursor-pointer ${
              currentTab === 'events'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 dark:border-emerald-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            Scrambles & Events
          </button>
        </nav>

        {/* Zone 3: Actions, User Profile & Theme Toggle */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Light / Dark Mode Toggle */}
          <button
            onClick={onToggleDarkMode}
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Active Golfer Profile Pill */}
          {activeUser ? (
            <button
              onClick={onOpenProfile}
              title="My Golfer Profile & Scores"
              className="btn-modern px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <span className="text-sm">{activeUser.avatarEmoji}</span>
              <span className="hidden sm:inline max-w-[100px] truncate">{activeUser.nickname}</span>
              <span className="px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-mono text-[10px] font-bold">
                {activeUser.handicapIndex.toFixed(1)}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
          ) : (
            <button
              onClick={onOpenProfile}
              className="btn-modern px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 cursor-pointer"
            >
              <User className="w-4 h-4 text-emerald-600" />
              <span>Log In</span>
            </button>
          )}

          <button
            onClick={onOpenOcr}
            title="Scan Paper Scorecard"
            className="hidden md:flex btn-modern px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 items-center gap-1.5 cursor-pointer"
          >
            <Camera className="w-4 h-4 text-red-500" />
            <span>Scan Card</span>
          </button>

          <button
            onClick={onOpenJoinRoom}
            title="Join Live Round with PIN"
            className="hidden sm:flex btn-modern px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 items-center gap-1.5 cursor-pointer"
          >
            <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Join PIN</span>
          </button>

          <button
            onClick={onOpenNewRound}
            className="btn-modern px-2.5 sm:px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden xs:inline sm:inline">Start Round</span>
            <span className="xs:hidden sm:hidden">Round</span>
          </button>
        </div>
      </div>
    </header>
  );
};
