import React from 'react';
import { dartsLogo, fairwayBanner } from '../assets';
import { 
  Trophy, 
  Target, 
  Play, 
  Users, 
  Camera, 
  Calendar, 
  Clock, 
  ArrowRight, 
  ChevronRight, 
  ShieldCheck, 
  Sparkles,
  Edit3,
  Award,
  Flag,
  Flame,
  FileText,
  FileCode
} from 'lucide-react';
import { MemberProfile, CompletedRoundRecord, TeamEventRecord, RoundSession, FutureRound, Course, TeamGroup } from '../types';
import { FutureRoundsSection } from './FutureRoundsSection';

interface ClubhouseDashboardProps {
  members: MemberProfile[];
  completedRounds: CompletedRoundRecord[];
  teamEvents: TeamEventRecord[];
  futureRounds: FutureRound[];
  courses: Course[];
  teams?: TeamGroup[];
  activeSession: RoundSession | null;
  activeUser?: MemberProfile;
  onOpenProfile: () => void;
  onStartRound: () => void;
  onLogPastRound?: () => void;
  onOpenTeamManager?: () => void;
  onJoinRoom: () => void;
  onScanScorecard: () => void;
  onViewRankings: () => void;
  onViewCourses: () => void;
  onResumeLiveRound: () => void;
  onOpenBadgeCustomizer: () => void;
  onOpenCreateFutureRound: () => void;
  onRsvpPlayer: (futureRoundId: string, memberId: string, action: 'join' | 'leave') => void;
  onStartFutureRound: (futureRoundId: string) => void;
  onDeleteFutureRound: (futureRoundId: string) => void;
  onOpenEditNickname: () => void;
  onSelectMemberForHistory: (member: MemberProfile) => void;
  onSelectTeamForHistory: (event: TeamEventRecord, teamName?: string) => void;
}

export const ClubhouseDashboard: React.FC<ClubhouseDashboardProps> = ({
  members,
  completedRounds,
  teamEvents,
  futureRounds,
  courses,
  teams = [],
  activeSession,
  activeUser,
  onOpenProfile,
  onStartRound,
  onLogPastRound,
  onOpenTeamManager,
  onJoinRoom,
  onScanScorecard,
  onViewRankings,
  onViewCourses,
  onResumeLiveRound,
  onOpenBadgeCustomizer,
  onOpenCreateFutureRound,
  onRsvpPlayer,
  onStartFutureRound,
  onDeleteFutureRound,
  onOpenEditNickname,
  onSelectMemberForHistory,
  onSelectTeamForHistory,
}) => {
  const sortedMembers = [...members].sort((a, b) => a.handicapIndex - b.handicapIndex);
  const lowGrossMember = [...members].sort((a, b) => a.bestRound - b.bestRound)[0];
  const dartSniperMember = [...members].sort((a, b) => b.girPercent - a.girPercent)[0];
  const flatstickMember = [...members].sort((a, b) => a.avgPutts - b.avgPutts)[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      {/* 1. Modern Clubhouse Hero Card */}
      <div className="card-elevated rounded-3xl overflow-hidden relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 transition-colors">
        <div className="relative min-h-[170px] sm:h-52 w-full overflow-hidden">
          <img
            src={fairwayBanner}
            alt="Bay Area Golf Banner"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent flex items-end p-4 sm:p-7">
            <div className="flex items-center gap-3 sm:gap-4 text-white">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border-2 border-white/80 overflow-hidden shadow-xl bg-white shrink-0">
                <img
                  src={dartsLogo}
                  alt="Bay Area Darts Mascot"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] sm:text-[11px] font-bold tracking-wider text-emerald-400 uppercase block">
                  Clubhouse & Tournament Hub
                </span>
                <h1 className="font-heading font-extrabold text-xl sm:text-3xl text-white tracking-tight truncate sm:whitespace-normal">
                  Bay Area Darts Golf Club
                </h1>
                <p className="text-xs sm:text-sm text-slate-200 font-normal mt-0.5 max-w-xl line-clamp-2 sm:line-clamp-none">
                  Live multi-device foursome scoring, official WHS handicaps, and upcoming tee time planning across Northern California munis.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Streamlined Clubhouse Action Grid */}
        <div className="p-3.5 sm:p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            onClick={onStartRound}
            className="btn-modern p-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-3.5 shadow-xs cursor-pointer text-left transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Play className="w-5 h-5 fill-current" />
            </div>
            <div className="min-w-0">
              <span className="font-heading font-extrabold text-sm block leading-tight">Start / Enter Round</span>
              <span className="text-[11px] text-emerald-100 truncate block mt-0.5">Live room · PIN · Past scores</span>
            </div>
          </button>

          <button
            onClick={onOpenProfile}
            className="btn-modern p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700/80 flex items-center gap-3.5 cursor-pointer text-left transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xl shrink-0">
              {activeUser?.avatarEmoji || '🎯'}
            </div>
            <div className="min-w-0">
              <span className="font-heading font-bold text-sm block leading-tight">Roster & Scramble Teams</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate block mt-0.5">
                {members.length} Golfers · {teams.length} Squads
              </span>
            </div>
          </button>

          <button
            onClick={onOpenCreateFutureRound}
            className="btn-modern p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700/80 flex items-center gap-3.5 cursor-pointer text-left transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="font-heading font-bold text-sm block leading-tight">Plan Future Round</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate block mt-0.5">
                7-day Muni Alert & RSVPs
              </span>
            </div>
          </button>

          <button
            onClick={onScanScorecard}
            className="btn-modern p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700/80 flex items-center gap-3.5 cursor-pointer text-left transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
              <Camera className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="font-heading font-bold text-sm block leading-tight">Scan Scorecard</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate block mt-0.5">
                Instant AI OCR digitize
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* 2. Active Round In-Progress Alert (if active) */}
      {activeSession && (
        <div className="card-modern p-4 sm:p-5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-emerald-700 text-white rounded">
                  ROUND IN PROGRESS
                </span>
                <span className="font-stats font-bold text-xs bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 px-2 py-0.5 rounded text-emerald-800 dark:text-emerald-300">
                  PIN: {activeSession.roomCode}
                </span>
              </div>
              <h3 className="font-heading font-bold text-base sm:text-lg text-slate-900 dark:text-slate-100 mt-1">
                {activeSession.courseName} · {activeSession.format.toUpperCase()}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {activeSession.players.length} players scoring live · Tee: {activeSession.teeName}
              </p>
            </div>
          </div>

          <button
            onClick={onResumeLiveRound}
            className="btn-modern w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-xs cursor-pointer"
          >
            <span>Resume Scoring</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 3. MAIN DASHBOARD SPLIT:
          LEFT: SCORE & PLAYER RELATED STUFF (PUSHED TO THE TOP)
          RIGHT: FUTURE ROUNDS & RECENT ROUNDS ON THE RIGHT SIDE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ================= LEFT / MAIN COLUMN (SCORE & PLAYER STUFF) ================= */}
        <div className="lg:col-span-7 xl:col-span-7 space-y-6">
          {/* A. Group Roster & WHS Handicap Index Leaderboard */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h2 className="font-heading font-bold text-lg sm:text-xl text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                  <span>Bay Area Darts Roster & Rankings</span>
                  <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                    (Click player for history)
                  </span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  World Handicap System (USGA) index calculation & custom player nicknames
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenProfile}
                  className="btn-modern px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>My Profile & Email</span>
                </button>
                <button
                  onClick={onViewRankings}
                  className="btn-modern px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 cursor-pointer"
                >
                  <span>Full Standings</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Members Roster Card */}
            <div className="card-elevated rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              {sortedMembers.map((member, index) => {
                const isMe = activeUser && member.id === activeUser.id;
                return (
                <div
                  key={member.id}
                  onClick={() => isMe ? onOpenProfile() : onSelectMemberForHistory(member)}
                  className={`p-4 flex items-center justify-between gap-3 transition-colors cursor-pointer group ${
                    isMe
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                  title={isMe ? 'Click to manage your profile, email, and view personal scores' : 'Click to view player score history (Read-Only)'}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-stats text-xs font-bold shrink-0">
                      #{index + 1}
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform">
                      {member.avatarEmoji}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-heading font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          {member.name}
                        </span>
                        {member.nickname && (
                          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                            "{member.nickname}"
                          </span>
                        )}
                        {isMe && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-600 text-white uppercase tracking-wider">
                            YOU
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 hidden sm:inline">
                          ({member.badgeTitle})
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        <span>Avg: <strong className="text-slate-700 dark:text-slate-300 font-stats">{member.scoringAverage}</strong></span>
                        <span>·</span>
                        <span>GIR: <strong className="text-slate-700 dark:text-slate-300 font-stats">{member.girPercent}%</strong></span>
                        <span>·</span>
                        <span>Putts: <strong className="text-slate-700 dark:text-slate-300 font-stats">{member.avgPutts}</strong></span>
                        <span>·</span>
                        <span>{member.roundsCount} rds</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="inline-block px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl">
                        <div className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                          WHS Index
                        </div>
                        <div className="font-stats font-bold text-base text-emerald-700 dark:text-emerald-300 leading-none">
                          {member.handicapIndex > 0 ? member.handicapIndex.toFixed(1) : `+${Math.abs(member.handicapIndex).toFixed(1)}`}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
                  </div>
                </div>
              );
            })}
            </div>
          </div>

          {/* B. Club Accolades Summary Cards (Clickable for History) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div 
              onClick={() => dartSniperMember && onSelectMemberForHistory(dartSniperMember)}
              className="card-modern p-4 rounded-2xl flex items-center gap-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-red-300 dark:hover:border-red-800 transition-all cursor-pointer group"
              title="Click to view history"
            >
              <div className="w-11 h-11 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform">
                🎯
              </div>
              <div className="truncate min-w-0">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  DART SNIPER (GIR %)
                </span>
                <span className="font-heading font-bold text-sm text-slate-900 dark:text-slate-100 truncate block group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                  {dartSniperMember?.name}
                </span>
                <span className="font-stats text-xs font-semibold text-slate-600 dark:text-slate-400">
                  {dartSniperMember?.girPercent || 58}% Greens Hit
                </span>
              </div>
            </div>

            <div 
              onClick={() => flatstickMember && onSelectMemberForHistory(flatstickMember)}
              className="card-modern p-4 rounded-2xl flex items-center gap-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-800 transition-all cursor-pointer group"
              title="Click to view history"
            >
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform">
                🪄
              </div>
              <div className="truncate min-w-0">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  FLATSTICK KING (PUTTS)
                </span>
                <span className="font-heading font-bold text-sm text-slate-900 dark:text-slate-100 truncate block group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                  {flatstickMember?.name}
                </span>
                <span className="font-stats text-xs font-semibold text-slate-600 dark:text-slate-400">
                  {flatstickMember?.avgPutts || 28.2} Putts / Rd
                </span>
              </div>
            </div>

            <div 
              onClick={() => lowGrossMember && onSelectMemberForHistory(lowGrossMember)}
              className="card-modern p-4 rounded-2xl flex items-center gap-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-800 transition-all cursor-pointer group"
              title="Click to view history"
            >
              <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform">
                ⚡
              </div>
              <div className="truncate min-w-0">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  LOW GROSS RECORD
                </span>
                <span className="font-heading font-bold text-sm text-slate-900 dark:text-slate-100 truncate block group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                  {lowGrossMember?.name}
                </span>
                <span className="font-stats text-xs font-semibold text-slate-600 dark:text-slate-400">
                  {lowGrossMember?.bestRound || 71} Gross
                </span>
              </div>
            </div>
          </div>

          {/* C. Clean WHS Handicap Data Integrity Notice */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-start gap-3 text-xs text-slate-600 dark:text-slate-400">
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="text-slate-900 dark:text-slate-200 block mb-0.5">Strict WHS Handicap Purity</strong>
              Individual gross scores from official tee boxes feed into the USGA differential formula. Scramble and team rounds are safely isolated in the Team Events Hall of Fame and never skew player handicap indexes.
            </div>
          </div>
        </div>

        {/* ================= RIGHT COLUMN (FUTURE & RECENT ROUNDS) ================= */}
        <div className="lg:col-span-5 xl:col-span-5 space-y-6">
          {/* A. Future Rounds Planner & 7-Day Window Reminder Widget */}
          <FutureRoundsSection
            futureRounds={futureRounds}
            members={members}
            courses={courses}
            activeUser={activeUser}
            onOpenProfile={onOpenProfile}
            onOpenCreateFutureRound={onOpenCreateFutureRound}
            onRsvpPlayer={onRsvpPlayer}
            onStartFutureRound={onStartFutureRound}
            onDeleteFutureRound={onDeleteFutureRound}
          />

          {/* B. Recent Individual Rounds (Clickable to open player history) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-bold text-base text-slate-900 dark:text-slate-100">
                Recent Rounds
              </h3>
              <span className="text-[11px] text-slate-400">
                Click round to view history
              </span>
            </div>

            <div className="card-elevated rounded-2xl divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              {completedRounds.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">No rounds recorded yet.</div>
              ) : (
                completedRounds.slice(0, 5).map((round) => {
                  const m = members.find((item) => item.id === round.playerId || item.name === round.playerName);
                  return (
                    <div
                      key={round.id}
                      onClick={() => m && onSelectMemberForHistory(m)}
                      className="p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                      title="Click to view player score history"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-heading font-semibold text-xs text-slate-900 dark:text-slate-100 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          {round.courseName}
                        </span>
                        <div className="flex items-baseline gap-1.5 shrink-0">
                          <span className="font-stats font-bold text-sm text-slate-900 dark:text-slate-100">
                            {round.grossScore}
                          </span>
                          <span className="font-stats text-[11px] text-slate-400">
                            ({round.netScore} net)
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
                        <span>{round.playerName} · {round.date}</span>
                        <span className="font-stats text-emerald-600 dark:text-emerald-400 font-semibold">
                          Diff: {round.differential}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* C. Team Scramble Hall of Fame (Clickable to open team history) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-bold text-base text-slate-900 dark:text-slate-100">
                Team Scramble Hall of Fame
              </h3>
              <span className="text-[11px] text-slate-400">
                Click team to view shootout
              </span>
            </div>

            <div className="space-y-3">
              {teamEvents.map((event) => (
                <div
                  key={event.id}
                  onClick={() => onSelectTeamForHistory(event, event.winningTeamName)}
                  className="card-modern p-4 rounded-2xl space-y-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer group"
                  title="Click to view team score history"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded uppercase">
                      {event.format}
                    </span>
                    <span className="text-slate-400 text-[11px]">{event.date} · {event.courseName}</span>
                  </div>
                  <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {event.eventName}
                  </h4>
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2 truncate">
                      <Trophy className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {event.winningTeamName}
                      </span>
                    </div>
                    <span className="font-stats font-bold text-xs text-emerald-600 dark:text-emerald-400 shrink-0 ml-2">
                      {event.teamLeaderboard[0]?.grossScore} Gross
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
