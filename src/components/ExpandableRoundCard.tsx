import React, { useState } from 'react';
import { CompletedRoundRecord, MemberProfile, Course, HoleScore } from '../types';
import { ChevronDown, Edit3, Check, Trash2 } from 'lucide-react';

interface ExpandableRoundCardProps {
  round: CompletedRoundRecord;
  member: MemberProfile;
  courses: Course[];
  index?: number;
  onUpdatePastRound?: (roundId: string, data: Partial<CompletedRoundRecord>) => void;
  onDeletePastRound?: (roundId: string, playerId: string) => void;
  defaultExpanded?: boolean;
}

export const ExpandableRoundCard: React.FC<ExpandableRoundCardProps> = ({ round, member, courses, index, onUpdatePastRound, onDeletePastRound, defaultExpanded = false }) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isEditing, setIsEditing] = useState(false);
  const [editScores, setEditScores] = useState<Record<number, HoleScore>>(round.holeScores || {});
  const [editBuzzballs, setEditBuzzballs] = useState<number>(round.buzzballCount || 0);
  const [editDate, setEditDate] = useState<string>(round.date || '');

  const course = courses.find(c => c.id === round.courseId);
  const getPar = (hNum: number) => course?.holes?.find((h) => h.number === hNum)?.par || 4;

  const matchingDiff = member?.differentials?.find(
    (d) =>
      d.roundId === round.id ||
      (d.courseName === round.courseName &&
        d.date === round.date &&
        d.grossScore === round.grossScore)
  );
  const isCountedInIndex = Boolean(matchingDiff?.usedInIndex);

  const isFront9 = round.holesPlayed !== 'back_9';
  const isBack9 = round.holesPlayed !== 'front_9';
  const is18 = isFront9 && isBack9;

  const handleStartEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    let startingScores: Record<number, HoleScore> = {};
    if (round.holeScores) {
      startingScores = JSON.parse(JSON.stringify(round.holeScores));
    }
    
    if (Object.keys(startingScores).length < (is18 ? 18 : 9)) {
      Array.from({length: 18}, (_, i) => i + 1).forEach((i) => {
        if (is18 || (isFront9 && i <= 9) || (isBack9 && i >= 10)) {
          if (!startingScores[i]) {
            const par = getPar(i);
            startingScores[i] = { strokes: par, putts: 2, fir: par === 3 ? 'none' : 'hit', gir: true };
          }
        }
      });
    }
    
    setEditScores(startingScores);
    setEditBuzzballs(round.buzzballCount || 0);
    setEditDate(round.date || '');
    setIsEditing(true);
    setIsExpanded(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditScores(round.holeScores || {});
    setEditBuzzballs(round.buzzballCount || 0);
    setEditDate(round.date || '');
  };

  const updateHole = (holeNum: number, field: keyof HoleScore, value: any) => {
    setEditScores(prev => ({
      ...prev,
      [holeNum]: { ...(prev[holeNum] || { strokes: 4, putts: 2, fir: 'none', gir: false }), [field]: value }
    }));
  };

  const handleSaveEdit = () => {
    if (!onUpdatePastRound) return;
    
    const tee = course?.tees?.find(t => t.id === round.teeId);
    
    const is9Hole = !is18;
    const baseRating = tee?.rating || 72;
    const rating = is9Hole ? baseRating / 2 : baseRating;
    const slope = tee?.slope || 113;

    let gross = 0; let putts = 0; let firHits = 0; let firEligible = 0; let girHits = 0;

    Object.entries(editScores).forEach(([h, score]) => {
      const hNum = Number(h);
      if (is9Hole) {
        if (round.holesPlayed === 'front_9' && hNum > 9) return;
        if (round.holesPlayed === 'back_9' && hNum < 10) return;
      }
      
      gross += (score.strokes || 4);
      putts += (score.putts || 2);
      if (score.fir !== 'none') {
        firEligible++;
        if (score.fir === 'hit') firHits++;
      }
      if (score.gir) girHits++;
    });

    const firPercent = firEligible > 0 ? Math.round((firHits / firEligible) * 100) : 50;
    const girPercent = Math.round((girHits / (is9Hole ? 9 : 18)) * 100);
    const courseHandicap = Math.round(((member.handicapIndex || 0) / (is9Hole ? 2 : 1)) * (slope / 113) + (rating - (is9Hole ? 36 : 72)));
    const netScore = gross - courseHandicap;
    const differential = Number((((gross - rating) * 113) / slope).toFixed(1));

    const rawPayload = {
      date: editDate,
      holeScores: editScores,
      grossScore: gross,
      netScore: netScore,
      differential: differential,
      totalPutts: putts,
      firPercent: firPercent,
      girPercent: girPercent,
      buzzballCount: editBuzzballs
    };
    
    const cleanPayload = JSON.parse(JSON.stringify(rawPayload));

    onUpdatePastRound(round.id, cleanPayload);
    setIsEditing(false);
  };

  const renderScore = (strokes: number | undefined, par: number) => {
    if (!strokes) return <span className="text-slate-400">-</span>;
    const diff = strokes - par;
    
    if (diff <= -2) return <span className="inline-flex items-center justify-center w-6 h-6 rounded-full border-2 border-amber-400 text-amber-500 font-bold bg-amber-50 dark:bg-amber-950/30">{strokes}</span>; // Eagle
    if (diff === -1) return <span className="inline-flex items-center justify-center w-6 h-6 rounded-full border border-emerald-400 text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/30">{strokes}</span>; // Birdie
    if (diff === 0) return <span className="font-bold text-slate-700 dark:text-slate-300">{strokes}</span>; // Par
    if (diff === 1) return <span className="inline-flex items-center justify-center w-6 h-6 border border-slate-400 text-slate-800 dark:text-slate-200 font-bold">{strokes}</span>; // Bogey
    return <span className="inline-flex items-center justify-center w-6 h-6 border-2 border-slate-500 text-slate-900 dark:text-white font-bold">{strokes}</span>; // Double+
  };

  return (
    <div className={`transition-colors ${isCountedInIndex ? 'bg-emerald-50/40 dark:bg-emerald-950/20' : ''}`}>
      <div 
        onClick={() => !isEditing && setIsExpanded(!isExpanded)} 
        className={`p-3.5 flex items-center justify-between gap-3 text-xs transition-colors ${!isEditing ? 'cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/40' : 'bg-slate-50 dark:bg-slate-800/40'}`}
      >
        <div className="flex items-center gap-3 min-w-0">
          {isCountedInIndex ? (
            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] shrink-0 font-bold shadow-2xs" title="Counted in WHS Index">★</span>
          ) : (
            <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center text-[10px] shrink-0 font-stats">{index ?? 1}</span>
          )}
          <div className="min-w-0">
            <span className="font-medium text-slate-900 dark:text-slate-100 truncate block">{round.courseName}</span>
            <span className="text-[11px] text-slate-400 block truncate">
              {round.date} · {round.teeName} Tee
              {(round.buzzballCount || 0) > 0 && !isEditing && (
                <span className="ml-1 text-amber-600 dark:text-amber-500 font-semibold">· 🍹 {round.buzzballCount}</span>
              )}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4 text-right shrink-0">
          <div className="text-right">
            <span className="font-stats font-extrabold text-sm text-slate-900 dark:text-slate-100">{round.grossScore}</span>
            {round.netScore !== undefined && (
              <span className="font-stats text-[11px] text-slate-400 dark:text-slate-500 ml-1">({round.netScore})</span>
            )}
          </div>
          {round.differential !== undefined && (
            <span className="font-stats font-bold text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm whitespace-nowrap">
              {round.differential.toFixed(1)} Diff
            </span>
          )}
          <div className="flex items-center gap-1 shrink-0">
            {!isEditing && onUpdatePastRound && (
              <button 
                type="button" 
                onClick={handleStartEdit} 
                className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer" 
                title="Edit Scorecard"
                aria-label="Edit Scorecard"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}
            {!isEditing && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
                className={`w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 transition-all cursor-pointer ${isExpanded ? 'rotate-180' : ''}`}
                title={isExpanded ? 'Collapse scorecard' : 'Expand scorecard'}
                aria-label={isExpanded ? 'Collapse scorecard' : 'Expand scorecard'}
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 animate-fadeIn overflow-x-auto">
          {isEditing && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 border-b border-slate-200 dark:border-slate-700/60 pb-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Edit Round</span>
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100"
                />
                <div className="flex items-center gap-1.5 bg-amber-100/50 dark:bg-amber-900/30 px-2 py-1 rounded-lg border border-amber-200/50 dark:border-amber-800/50">
                  <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-500">🍹 Drinks</span>
                  <button
                    type="button"
                    onClick={() => setEditBuzzballs(Math.max(0, editBuzzballs - 1))}
                    className="w-5 h-5 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs shadow-2xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700"
                  >
                    -
                  </button>
                  <span className="font-stats font-bold text-xs w-4 text-center text-slate-900 dark:text-slate-100">{editBuzzballs}</span>
                  <button
                    type="button"
                    onClick={() => setEditBuzzballs(editBuzzballs + 1)}
                    className="w-5 h-5 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs shadow-2xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700"
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="flex gap-2 self-end sm:self-auto">
                {onDeletePastRound && (
                  <button
                    onClick={() => { if(window.confirm('Are you sure you want to permanently delete this round?')) onDeletePastRound(round.id, round.playerId); }}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 cursor-pointer flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5"/> Delete
                  </button>
                )}
                <button
                  onClick={handleCancelEdit}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 cursor-pointer shadow-2xs"
                >
                  <Check className="w-3 h-3"/> Save
                </button>
              </div>
            </div>
          )}

          {/* Unified Scorecard Window */}
          {(!isEditing && !round.holeScores) ? (
            <div className="text-xs text-slate-500 text-center italic py-4">
              No hole-by-hole scorecard was saved for this round. Click the edit icon to add scores!
            </div>
          ) : (
            <div className="w-fit mx-auto border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-2xs">
              {isFront9 && isBack9 ? (
                <div className="flex w-fit">
                  {/* Front 9 and Back 9 Table */}
                  <div className="shrink-0">
                    {/* Front 9 */}
                    <div className="border-b border-slate-200 dark:border-slate-800">
                      {/* Header */}
                      <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/80">
                        <div className="w-16 shrink-0 p-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-left border-r border-slate-200 dark:border-slate-700">Hole</div>
                        {Array.from({length: 9}, (_, i) => i + 1).map(h => (
                          <div key={h} className="w-12 shrink-0 p-2 text-center text-[11px] font-bold text-slate-600 dark:text-slate-300 border-r border-slate-200 dark:border-slate-700">{h}</div>
                        ))}
                        <div className="w-12 shrink-0 p-2 text-center text-[11px] font-extrabold text-slate-700 dark:text-white bg-slate-200 dark:bg-slate-700 border-r border-slate-200 dark:border-slate-700">
                          OUT
                        </div>
                      </div>
                      {/* Par */}
                      <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                        <div className="w-16 shrink-0 p-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-left border-r border-slate-200 dark:border-slate-700">Par</div>
                        {Array.from({length: 9}, (_, i) => i + 1).map(h => (
                          <div key={h} className="w-12 shrink-0 p-2 text-center text-[11px] font-bold text-slate-500 border-r border-slate-200 dark:border-slate-700">{getPar(h)}</div>
                        ))}
                        <div className="w-12 shrink-0 p-2 text-center text-[11px] font-extrabold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 border-r border-slate-200 dark:border-slate-700">
                          {Array.from({length: 9}, (_, i) => getPar(i + 1)).reduce((a, b) => a + b, 0)}
                        </div>
                      </div>
                      {/* Score */}
                      <div className="flex items-center bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                        <div className="w-16 shrink-0 p-2 border-r border-slate-200 dark:border-slate-700 flex flex-col justify-center">
                          <span className="text-[11px] font-bold text-slate-900 dark:text-white leading-tight truncate">
                            {isEditing ? 'Score' : round.playerName.split(' ')[0]}
                          </span>
                        </div>
                        {Array.from({length: 9}, (_, i) => i + 1).map(h => {
                          const editStrokes = editScores[h]?.strokes || getPar(h);
                          const scoreVal = isEditing ? editStrokes : round.holeScores?.[h]?.strokes;
                          return (
                            <div key={h} className="w-12 h-10 shrink-0 flex items-center justify-center font-stats text-sm border-r border-slate-100 dark:border-slate-800/50">
                              {isEditing ? (
                                <div className="flex items-center justify-center gap-0.5">
                                  <button
                                    type="button"
                                    onClick={() => updateHole(h, 'strokes', Math.max(1, editStrokes - 1))}
                                    className="w-3.5 h-6 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center cursor-pointer transition-colors"
                                  >
                                    -
                                  </button>
                                  <span className="font-stats font-bold text-xs w-3.5 text-center text-slate-900 dark:text-slate-100">
                                    {editStrokes}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => updateHole(h, 'strokes', editStrokes + 1)}
                                    className="w-3.5 h-6 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center cursor-pointer transition-colors"
                                  >
                                    +
                                  </button>
                                </div>
                              ) : (
                                renderScore(scoreVal, getPar(h))
                              )}
                            </div>
                          );
                        })}
                        <div className="w-12 shrink-0 h-10 flex items-center justify-center font-stats text-sm font-bold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/30 border-r border-slate-200 dark:border-slate-700">
                          {isEditing
                            ? Array.from({length: 9}, (_, i) => editScores[i + 1]?.strokes || getPar(i + 1)).reduce((a, b) => a + b, 0)
                            : (Array.from({length: 9}, (_, i) => round.holeScores?.[i + 1]?.strokes || 0).reduce((a, b) => a + b, 0) || '-')}
                        </div>
                      </div>
                      {/* Putts Row */}
                      <div className="flex items-center bg-slate-50/70 dark:bg-slate-900/40">
                        <div className="w-16 shrink-0 p-1.5 border-r border-slate-200 dark:border-slate-700 text-left">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Putts</span>
                        </div>
                        {Array.from({length: 9}, (_, i) => i + 1).map(h => {
                          const editPutts = editScores[h]?.putts ?? 2;
                          const puttsVal = isEditing ? editPutts : round.holeScores?.[h]?.putts;
                          return (
                            <div key={h} className="w-12 h-8 shrink-0 flex items-center justify-center font-stats text-xs border-r border-slate-100 dark:border-slate-800/50">
                              {isEditing ? (
                                <div className="flex items-center justify-center gap-0.5">
                                  <button
                                    type="button"
                                    onClick={() => updateHole(h, 'putts', Math.max(0, editPutts - 1))}
                                    className="w-3.5 h-5 rounded bg-slate-200/70 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 font-bold text-[10px] flex items-center justify-center cursor-pointer transition-colors"
                                  >
                                    -
                                  </button>
                                  <span className="font-stats font-bold text-xs w-3.5 text-center text-emerald-600 dark:text-emerald-400">
                                    {editPutts}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => updateHole(h, 'putts', editPutts + 1)}
                                    className="w-3.5 h-5 rounded bg-slate-200/70 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 font-bold text-[10px] flex items-center justify-center cursor-pointer transition-colors"
                                  >
                                    +
                                  </button>
                                </div>
                              ) : (
                                <span className={puttsVal !== undefined ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-400'}>
                                  {puttsVal !== undefined ? puttsVal : '-'}
                                </span>
                              )}
                            </div>
                          );
                        })}
                        <div className="w-12 shrink-0 h-8 flex items-center justify-center font-stats text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-slate-100/50 dark:bg-slate-800/40 border-r border-slate-200 dark:border-slate-700">
                          {isEditing
                            ? Array.from({length: 9}, (_, i) => editScores[i + 1]?.putts ?? 2).reduce((a, b) => a + b, 0)
                            : (Array.from({length: 9}, (_, i) => round.holeScores?.[i + 1]?.putts ?? 0).reduce((a, b) => a + b, 0) || '-')}
                        </div>
                      </div>
                    </div>

                    {/* Back 9 */}
                    <div>
                      {/* Header */}
                      <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/80">
                        <div className="w-16 shrink-0 p-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-left border-r border-slate-200 dark:border-slate-700">Hole</div>
                        {Array.from({length: 9}, (_, i) => i + 10).map(h => (
                          <div key={h} className="w-12 shrink-0 p-2 text-center text-[11px] font-bold text-slate-600 dark:text-slate-300 border-r border-slate-200 dark:border-slate-700">{h}</div>
                        ))}
                        <div className="w-12 shrink-0 p-2 text-center text-[11px] font-extrabold text-slate-700 dark:text-white bg-slate-200 dark:bg-slate-700 border-r border-slate-200 dark:border-slate-700">
                          IN
                        </div>
                      </div>
                      {/* Par */}
                      <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                        <div className="w-16 shrink-0 p-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-left border-r border-slate-200 dark:border-slate-700">Par</div>
                        {Array.from({length: 9}, (_, i) => i + 10).map(h => (
                          <div key={h} className="w-12 shrink-0 p-2 text-center text-[11px] font-bold text-slate-500 border-r border-slate-200 dark:border-slate-700">{getPar(h)}</div>
                        ))}
                        <div className="w-12 shrink-0 p-2 text-center text-[11px] font-extrabold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 border-r border-slate-200 dark:border-slate-700">
                          {Array.from({length: 9}, (_, i) => getPar(i + 10)).reduce((a, b) => a + b, 0)}
                        </div>
                      </div>
                      {/* Score */}
                      <div className="flex items-center bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                        <div className="w-16 shrink-0 p-2 border-r border-slate-200 dark:border-slate-700 flex flex-col justify-center">
                          <span className="text-[11px] font-bold text-slate-900 dark:text-white leading-tight truncate">
                            {isEditing ? 'Score' : round.playerName.split(' ')[0]}
                          </span>
                        </div>
                        {Array.from({length: 9}, (_, i) => i + 10).map(h => {
                          const editStrokes = editScores[h]?.strokes || getPar(h);
                          const scoreVal = isEditing ? editStrokes : round.holeScores?.[h]?.strokes;
                          return (
                            <div key={h} className="w-12 h-10 shrink-0 flex items-center justify-center font-stats text-sm border-r border-slate-100 dark:border-slate-800/50">
                              {isEditing ? (
                                <div className="flex items-center justify-center gap-0.5">
                                  <button
                                    type="button"
                                    onClick={() => updateHole(h, 'strokes', Math.max(1, editStrokes - 1))}
                                    className="w-3.5 h-6 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center cursor-pointer transition-colors"
                                  >
                                    -
                                  </button>
                                  <span className="font-stats font-bold text-xs w-3.5 text-center text-slate-900 dark:text-slate-100">
                                    {editStrokes}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => updateHole(h, 'strokes', editStrokes + 1)}
                                    className="w-3.5 h-6 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center cursor-pointer transition-colors"
                                  >
                                    +
                                  </button>
                                </div>
                              ) : (
                                renderScore(scoreVal, getPar(h))
                              )}
                            </div>
                          );
                        })}
                        <div className="w-12 shrink-0 h-10 flex items-center justify-center font-stats text-sm font-bold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/30 border-r border-slate-200 dark:border-slate-700">
                          {isEditing
                            ? Array.from({length: 9}, (_, i) => editScores[i + 10]?.strokes || getPar(i + 10)).reduce((a, b) => a + b, 0)
                            : (Array.from({length: 9}, (_, i) => round.holeScores?.[i + 10]?.strokes || 0).reduce((a, b) => a + b, 0) || '-')}
                        </div>
                      </div>
                      {/* Putts Row */}
                      <div className="flex items-center bg-slate-50/70 dark:bg-slate-900/40">
                        <div className="w-16 shrink-0 p-1.5 border-r border-slate-200 dark:border-slate-700 text-left">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Putts</span>
                        </div>
                        {Array.from({length: 9}, (_, i) => i + 10).map(h => {
                          const editPutts = editScores[h]?.putts ?? 2;
                          const puttsVal = isEditing ? editPutts : round.holeScores?.[h]?.putts;
                          return (
                            <div key={h} className="w-12 h-8 shrink-0 flex items-center justify-center font-stats text-xs border-r border-slate-100 dark:border-slate-800/50">
                              {isEditing ? (
                                <div className="flex items-center justify-center gap-0.5">
                                  <button
                                    type="button"
                                    onClick={() => updateHole(h, 'putts', Math.max(0, editPutts - 1))}
                                    className="w-3.5 h-5 rounded bg-slate-200/70 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 font-bold text-[10px] flex items-center justify-center cursor-pointer transition-colors"
                                  >
                                    -
                                  </button>
                                  <span className="font-stats font-bold text-xs w-3.5 text-center text-emerald-600 dark:text-emerald-400">
                                    {editPutts}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => updateHole(h, 'putts', editPutts + 1)}
                                    className="w-3.5 h-5 rounded bg-slate-200/70 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 font-bold text-[10px] flex items-center justify-center cursor-pointer transition-colors"
                                  >
                                    +
                                  </button>
                                </div>
                              ) : (
                                <span className={puttsVal !== undefined ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-400'}>
                                  {puttsVal !== undefined ? puttsVal : '-'}
                                </span>
                              )}
                            </div>
                          );
                        })}
                        <div className="w-12 shrink-0 h-8 flex items-center justify-center font-stats text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-slate-100/50 dark:bg-slate-800/40 border-r border-slate-200 dark:border-slate-700">
                          {isEditing
                            ? Array.from({length: 9}, (_, i) => editScores[i + 10]?.putts ?? 2).reduce((a, b) => a + b, 0)
                            : (Array.from({length: 9}, (_, i) => round.holeScores?.[i + 10]?.putts ?? 0).reduce((a, b) => a + b, 0) || '-')}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Total Column spanning top to bottom */}
                  <div className="w-14 sm:w-16 shrink-0 flex flex-col bg-emerald-50/50 dark:bg-emerald-950/20">
                    {/* Header */}
                    <div className="p-2 text-center text-[11px] font-extrabold text-white bg-emerald-600 border-b border-emerald-700/60">
                      TOT
                    </div>
                    {/* Par */}
                    <div className="p-2 text-center text-[11px] font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-100/70 dark:bg-emerald-900/40 border-b border-emerald-200/60 dark:border-emerald-800/50">
                      {Array.from({length: 18}, (_, i) => getPar(i + 1)).reduce((a, b) => a + b, 0)}
                    </div>
                    {/* Total Score spanning top-to-bottom across the remaining height */}
                    <div className="flex-1 flex flex-col items-center justify-center p-2 text-center">
                      <span className="font-stats font-extrabold text-base sm:text-lg text-emerald-600 dark:text-emerald-400 leading-none">
                        {isEditing
                          ? Array.from({length: 18}, (_, i) => editScores[i + 1]?.strokes || getPar(i + 1)).reduce((a, b) => a + b, 0)
                          : round.grossScore}
                      </span>
                      {!isEditing && round.netScore !== undefined && round.netScore !== null && (
                        <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 font-stats mt-1">
                          ({round.netScore})
                        </span>
                      )}
                      <span className="text-[9px] font-bold text-emerald-700/80 dark:text-emerald-400/80 font-stats mt-1">
                        {isEditing
                          ? `${Array.from({length: 18}, (_, i) => editScores[i + 1]?.putts ?? 2).reduce((a, b) => a + b, 0)} Putts`
                          : `${round.totalPutts ?? Array.from({length: 18}, (_, i) => round.holeScores?.[i + 1]?.putts ?? 0).reduce((a, b) => a + b, 0)} Putts`}
                      </span>
                    </div>
                  </div>
                </div>
              ) : isFront9 ? (
                /* 9-hole Front 9 */
                <div className="overflow-hidden">
                  <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/80">
                    <div className="w-16 shrink-0 p-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-left border-r border-slate-200 dark:border-slate-700">Hole</div>
                    {Array.from({length: 9}, (_, i) => i + 1).map(h => (
                      <div key={h} className="w-12 shrink-0 p-2 text-center text-[11px] font-bold text-slate-600 dark:text-slate-300 border-r border-slate-200 dark:border-slate-700">{h}</div>
                    ))}
                    <div className="w-12 shrink-0 p-2 text-center text-[11px] font-extrabold text-white bg-emerald-600">TOT</div>
                  </div>
                  <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                    <div className="w-16 shrink-0 p-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-left border-r border-slate-200 dark:border-slate-700">Par</div>
                    {Array.from({length: 9}, (_, i) => i + 1).map(h => (
                      <div key={h} className="w-12 shrink-0 p-2 text-center text-[11px] font-bold text-slate-500 border-r border-slate-200 dark:border-slate-700">{getPar(h)}</div>
                    ))}
                    <div className="w-12 shrink-0 p-2 text-center text-[11px] font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20">
                      {Array.from({length: 9}, (_, i) => getPar(i + 1)).reduce((a, b) => a + b, 0)}
                    </div>
                  </div>
                  <div className="flex items-center bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                    <div className="w-16 shrink-0 p-2 border-r border-slate-200 dark:border-slate-700 flex flex-col justify-center">
                      <span className="text-[11px] font-bold text-slate-900 dark:text-white leading-tight truncate">
                        {isEditing ? 'Score' : round.playerName.split(' ')[0]}
                      </span>
                    </div>
                    {Array.from({length: 9}, (_, i) => i + 1).map(h => {
                      const editStrokes = editScores[h]?.strokes || getPar(h);
                      const scoreVal = isEditing ? editStrokes : round.holeScores?.[h]?.strokes;
                      return (
                        <div key={h} className="w-12 h-10 shrink-0 flex items-center justify-center font-stats text-sm border-r border-slate-100 dark:border-slate-800/50">
                          {isEditing ? (
                            <div className="flex items-center justify-center gap-0.5">
                              <button
                                type="button"
                                onClick={() => updateHole(h, 'strokes', Math.max(1, editStrokes - 1))}
                                className="w-3.5 h-6 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center cursor-pointer"
                              >
                                -
                              </button>
                              <span className="font-stats font-bold text-xs w-3.5 text-center text-slate-900 dark:text-slate-100">
                                {editStrokes}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateHole(h, 'strokes', editStrokes + 1)}
                                className="w-3.5 h-6 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                          ) : (
                            renderScore(scoreVal, getPar(h))
                          )}
                        </div>
                      );
                    })}
                    <div className="w-12 shrink-0 h-10 flex items-center justify-center font-stats text-sm font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/10">
                      {isEditing
                        ? Array.from({length: 9}, (_, i) => editScores[i + 1]?.strokes || getPar(i + 1)).reduce((a, b) => a + b, 0)
                        : round.grossScore}
                    </div>
                  </div>
                  {/* Putts row */}
                  <div className="flex items-center bg-slate-50/70 dark:bg-slate-900/40">
                    <div className="w-16 shrink-0 p-1.5 border-r border-slate-200 dark:border-slate-700 text-left">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Putts</span>
                    </div>
                    {Array.from({length: 9}, (_, i) => i + 1).map(h => {
                      const editPutts = editScores[h]?.putts ?? 2;
                      const puttsVal = isEditing ? editPutts : round.holeScores?.[h]?.putts;
                      return (
                        <div key={h} className="w-12 h-8 shrink-0 flex items-center justify-center font-stats text-xs border-r border-slate-100 dark:border-slate-800/50">
                          {isEditing ? (
                            <div className="flex items-center justify-center gap-0.5">
                              <button
                                type="button"
                                onClick={() => updateHole(h, 'putts', Math.max(0, editPutts - 1))}
                                className="w-3.5 h-5 rounded bg-slate-200/70 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 font-bold text-[10px] flex items-center justify-center cursor-pointer"
                              >
                                -
                              </button>
                              <span className="font-stats font-bold text-xs w-3.5 text-center text-emerald-600 dark:text-emerald-400">
                                {editPutts}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateHole(h, 'putts', editPutts + 1)}
                                className="w-3.5 h-5 rounded bg-slate-200/70 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 font-bold text-[10px] flex items-center justify-center cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                          ) : (
                            <span className={puttsVal !== undefined ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-400'}>
                              {puttsVal !== undefined ? puttsVal : '-'}
                            </span>
                          )}
                        </div>
                      );
                    })}
                    <div className="w-12 shrink-0 h-8 flex items-center justify-center font-stats text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-slate-100/50 dark:bg-slate-800/40">
                      {isEditing
                        ? Array.from({length: 9}, (_, i) => editScores[i + 1]?.putts ?? 2).reduce((a, b) => a + b, 0)
                        : (Array.from({length: 9}, (_, i) => round.holeScores?.[i + 1]?.putts ?? 0).reduce((a, b) => a + b, 0) || '-')}
                    </div>
                  </div>
                </div>
              ) : (
                /* 9-hole Back 9 */
                <div className="overflow-hidden">
                  <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/80">
                    <div className="w-16 shrink-0 p-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-left border-r border-slate-200 dark:border-slate-700">Hole</div>
                    {Array.from({length: 9}, (_, i) => i + 10).map(h => (
                      <div key={h} className="w-12 shrink-0 p-2 text-center text-[11px] font-bold text-slate-600 dark:text-slate-300 border-r border-slate-200 dark:border-slate-700">{h}</div>
                    ))}
                    <div className="w-12 shrink-0 p-2 text-center text-[11px] font-extrabold text-white bg-emerald-600">TOT</div>
                  </div>
                  <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                    <div className="w-16 shrink-0 p-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-left border-r border-slate-200 dark:border-slate-700">Par</div>
                    {Array.from({length: 9}, (_, i) => i + 10).map(h => (
                      <div key={h} className="w-12 shrink-0 p-2 text-center text-[11px] font-bold text-slate-500 border-r border-slate-200 dark:border-slate-700">{getPar(h)}</div>
                    ))}
                    <div className="w-12 shrink-0 p-2 text-center text-[11px] font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20">
                      {Array.from({length: 9}, (_, i) => getPar(i + 10)).reduce((a, b) => a + b, 0)}
                    </div>
                  </div>
                  <div className="flex items-center bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                    <div className="w-16 shrink-0 p-2 border-r border-slate-200 dark:border-slate-700 flex flex-col justify-center">
                      <span className="text-[11px] font-bold text-slate-900 dark:text-white leading-tight truncate">
                        {isEditing ? 'Score' : round.playerName.split(' ')[0]}
                      </span>
                    </div>
                    {Array.from({length: 9}, (_, i) => i + 10).map(h => {
                      const editStrokes = editScores[h]?.strokes || getPar(h);
                      const scoreVal = isEditing ? editStrokes : round.holeScores?.[h]?.strokes;
                      return (
                        <div key={h} className="w-12 h-10 shrink-0 flex items-center justify-center font-stats text-sm border-r border-slate-100 dark:border-slate-800/50">
                          {isEditing ? (
                            <div className="flex items-center justify-center gap-0.5">
                              <button
                                type="button"
                                onClick={() => updateHole(h, 'strokes', Math.max(1, editStrokes - 1))}
                                className="w-3.5 h-6 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center cursor-pointer"
                              >
                                -
                              </button>
                              <span className="font-stats font-bold text-xs w-3.5 text-center text-slate-900 dark:text-slate-100">
                                {editStrokes}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateHole(h, 'strokes', editStrokes + 1)}
                                className="w-3.5 h-6 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                          ) : (
                            renderScore(scoreVal, getPar(h))
                          )}
                        </div>
                      );
                    })}
                    <div className="w-12 shrink-0 h-10 flex items-center justify-center font-stats text-sm font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/10">
                      {isEditing
                        ? Array.from({length: 9}, (_, i) => editScores[i + 10]?.strokes || getPar(i + 10)).reduce((a, b) => a + b, 0)
                        : round.grossScore}
                    </div>
                  </div>
                  {/* Putts row */}
                  <div className="flex items-center bg-slate-50/70 dark:bg-slate-900/40">
                    <div className="w-16 shrink-0 p-1.5 border-r border-slate-200 dark:border-slate-700 text-left">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Putts</span>
                    </div>
                    {Array.from({length: 9}, (_, i) => i + 10).map(h => {
                      const editPutts = editScores[h]?.putts ?? 2;
                      const puttsVal = isEditing ? editPutts : round.holeScores?.[h]?.putts;
                      return (
                        <div key={h} className="w-12 h-8 shrink-0 flex items-center justify-center font-stats text-xs border-r border-slate-100 dark:border-slate-800/50">
                          {isEditing ? (
                            <div className="flex items-center justify-center gap-0.5">
                              <button
                                type="button"
                                onClick={() => updateHole(h, 'putts', Math.max(0, editPutts - 1))}
                                className="w-3.5 h-5 rounded bg-slate-200/70 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 font-bold text-[10px] flex items-center justify-center cursor-pointer"
                              >
                                -
                              </button>
                              <span className="font-stats font-bold text-xs w-3.5 text-center text-emerald-600 dark:text-emerald-400">
                                {editPutts}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateHole(h, 'putts', editPutts + 1)}
                                className="w-3.5 h-5 rounded bg-slate-200/70 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 font-bold text-[10px] flex items-center justify-center cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                          ) : (
                            <span className={puttsVal !== undefined ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-400'}>
                              {puttsVal !== undefined ? puttsVal : '-'}
                            </span>
                          )}
                        </div>
                      );
                    })}
                    <div className="w-12 shrink-0 h-8 flex items-center justify-center font-stats text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-slate-100/50 dark:bg-slate-800/40">
                      {isEditing
                        ? Array.from({length: 9}, (_, i) => editScores[i + 10]?.putts ?? 2).reduce((a, b) => a + b, 0)
                        : (Array.from({length: 9}, (_, i) => round.holeScores?.[i + 10]?.putts ?? 0).reduce((a, b) => a + b, 0) || '-')}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
