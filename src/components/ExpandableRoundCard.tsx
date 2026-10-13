import React, { useState } from 'react';
import { CompletedRoundRecord, MemberProfile, Course, HoleScore } from '../types';
import { ChevronDown, Edit3, Check } from 'lucide-react';

interface ExpandableRoundCardProps {
  round: CompletedRoundRecord;
  member: MemberProfile;
  courses: Course[];
  onUpdatePastRound?: (roundId: string, data: Partial<CompletedRoundRecord>) => void;
}

export const ExpandableRoundCard: React.FC<ExpandableRoundCardProps> = ({ round, member, courses, onUpdatePastRound }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editScores, setEditScores] = useState<Record<number, HoleScore>>(round.holeScores || {});

  const handleStartEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditScores(round.holeScores || {});
    setIsEditing(true);
    setIsExpanded(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditScores(round.holeScores || {});
  };

  const updateHole = (holeNum: number, field: keyof HoleScore, value: any) => {
    setEditScores(prev => ({
      ...prev,
      [holeNum]: { ...(prev[holeNum] || { strokes: 4, putts: 2, fir: 'none', gir: false }), [field]: value }
    }));
  };

  const handleSaveEdit = () => {
    if (!onUpdatePastRound) return;
    
    // Find the course to recalculate differential
    const course = courses.find(c => c.id === round.courseId);
    const tee = course?.tees.find(t => t.id === round.teeId);
    const rating = tee?.rating || 72;
    const slope = tee?.slope || 113;

    let gross = 0; let putts = 0; let firHits = 0; let firEligible = 0; let girHits = 0;
    const finalScores = Object.keys(editScores).length > 0 ? editScores : round.holeScores;

    if (finalScores) {
      Object.entries(finalScores).forEach(([h, score]) => {
        gross += (score.strokes || 4);
        putts += (score.putts || 2);
        if (score.fir !== 'none') {
          firEligible++;
          if (score.fir === 'hit') firHits++;
        }
        if (score.gir) girHits++;
      });
    } else {
      gross = round.grossScore;
      putts = round.totalPutts || 36;
    }

    const firPercent = firEligible > 0 ? Math.round((firHits / firEligible) * 100) : 50;
    const girPercent = Math.round((girHits / 18) * 100);
    const courseHandicap = Math.round(member.handicapIndex * (slope / 113) + (rating - 72));
    const netScore = gross - courseHandicap;
    const differential = Number((((gross - rating) * 113) / slope).toFixed(1));

    onUpdatePastRound(round.id, {
      holeScores: finalScores,
      grossScore: gross,
      netScore,
      differential,
      totalPutts: putts,
      firPercent,
      girPercent
    });

    setIsEditing(false);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden transition-all shadow-xs">
      {/* Clickable Header Row */}
      <div onClick={() => !isEditing && setIsExpanded(!isExpanded)} className={`p-3 sm:p-3.5 flex items-center justify-between gap-3 text-xs ${!isEditing ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50' : 'bg-slate-50 dark:bg-slate-800/30'} transition-colors`}>
        <div>
          <div className="font-heading font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            {round.courseName}
            {!isEditing && onUpdatePastRound && (
              <button onClick={handleStartEdit} className="p-1 text-slate-400 hover:text-emerald-600 transition-colors" title="Edit Scorecard">
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            {round.date} · {round.teeName} Tee
          </div>
        </div>
        <div className="text-right flex items-center gap-3">
          <div>
            <span className="font-stats font-extrabold text-sm text-slate-900 dark:text-slate-100">{round.grossScore}</span>
            <span className="text-[11px] text-slate-400 ml-1">({round.netScore} net)</span>
            <div className="text-[10px] font-stats text-emerald-600 dark:text-emerald-400 font-bold">Diff: {round.differential?.toFixed(1)}</div>
          </div>
          {!isEditing && (
            <div className={`w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
              <ChevronDown className="w-3.5 h-3.5" />
            </div>
          )}
        </div>
      </div>

      {/* Expanded Accordion Body */}
      {isExpanded && (
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 animate-fadeIn">
          {isEditing ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Edit Hole-by-Hole Scores</span>
                <div className="flex gap-2">
                  <button onClick={handleCancelEdit} className="px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 cursor-pointer">Cancel</button>
                  <button onClick={handleSaveEdit} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 cursor-pointer"><Check className="w-3 h-3"/> Save</button>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Array.from({length: 18}, (_, i) => i + 1).map(hNum => {
                  const score = editScores[hNum] || { strokes: 4, putts: 2, fir: 'none', gir: false };
                  return (
                    <div key={hNum} className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900">
                      <div className="text-[10px] font-bold text-slate-500 mb-1.5 text-center">Hole {hNum}</div>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">Score</span>
                        <div className="flex items-center gap-1.5">
                          <button type="button" onClick={() => updateHole(hNum, 'strokes', Math.max(1, (score.strokes||4)-1))} className="w-5 h-5 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700">-</button>
                          <span className="w-4 text-center font-bold text-slate-900 dark:text-slate-100">{score.strokes || 4}</span>
                          <button type="button" onClick={() => updateHole(hNum, 'strokes', (score.strokes||4)+1)} className="w-5 h-5 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700">+</button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">Putts</span>
                        <div className="flex items-center gap-1.5">
                          <button type="button" onClick={() => updateHole(hNum, 'putts', Math.max(0, (score.putts||2)-1))} className="w-5 h-5 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700">-</button>
                          <span className="w-4 text-center font-bold text-slate-900 dark:text-slate-100">{score.putts || 2}</span>
                          <button type="button" onClick={() => updateHole(hNum, 'putts', (score.putts||2)+1)} className="w-5 h-5 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700">+</button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <>
              {round.holeScores ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-9 gap-1">
                    {Array.from({length: 9}, (_, i) => i + 1).map(h => (
                      <div key={h} className="text-center">
                        <div className="text-[9px] font-bold text-slate-400 mb-1">#{h}</div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white py-1.5 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 shadow-2xs">
                          {round.holeScores![h]?.strokes || '-'}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-9 gap-1">
                    {Array.from({length: 9}, (_, i) => i + 10).map(h => (
                      <div key={h} className="text-center">
                        <div className="text-[9px] font-bold text-slate-400 mb-1">#{h}</div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white py-1.5 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 shadow-2xs">
                          {round.holeScores![h]?.strokes || '-'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-500 text-center italic py-2">
                  No hole-by-hole scorecard was saved for this round. Click the edit icon to add scores!
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
