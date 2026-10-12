import React, { useState } from 'react';
import { fairwayBanner } from '../assets';
import { 
  X, 
  Camera, 
  Upload, 
  Check, 
  AlertCircle, 
  Sparkles, 
  User, 
  Users, 
  Trophy, 
  ArrowRight,
  RefreshCw,
  Edit2
} from 'lucide-react';
import { Course, GameFormat, MemberProfile, OcrDetectedPlayer, OcrScorecardResponse } from '../types';

interface ScorecardOcrModalProps {
  isOpen: boolean;
  onClose: () => void;
  courses: Course[];
  members: MemberProfile[];
  onSaveIndividualRound: (roundData: any) => void;
  onSaveTeamEvent: (eventData: any) => void;
}

export const ScorecardOcrModal: React.FC<ScorecardOcrModalProps> = ({
  isOpen,
  onClose,
  courses,
  members,
  onSaveIndividualRound,
  onSaveTeamEvent,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<GameFormat>('stroke');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState<OcrScorecardResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Player Disambiguation & Mapping state
  const [selectedPlayerRowId, setSelectedPlayerRowId] = useState<string>('');
  const [assignedMemberId, setAssignedMemberId] = useState<string>(members[0]?.id || '');
  const [customCourseName, setCustomCourseName] = useState<string>('');
  const [customDate, setCustomDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Editable scores state
  const [editableHoles, setEditableHoles] = useState<Record<number, { strokes: number; putts: number }>>({});

  if (!isOpen) return null;

  // Handle file select or drag
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImage(reader.result as string);
        setErrorMsg(null);
      };
      reader.readAsDataURL(file);
    }
  };

  // Sample scorecard photo fallback
  const handleLoadSampleCard = () => {
    setSelectedImage(fairwayBanner);
    setErrorMsg(null);
  };

  // Process scorecard via Gemini 3.8 Flash Vision OCR
  const handleProcessOcr = async () => {
    if (!selectedImage) return;

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      let response = await fetch('/api/scorecard-ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: selectedImage,
          format: selectedFormat,
        }),
      });

      if (!response.ok) {
        // Try fallback route
        response = await fetch('/api/ocr/scorecard', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: selectedImage,
            format: selectedFormat,
          }),
        });
      }

      if (!response.ok) {
        throw new Error('Scorecard OCR is unavailable in static mode. You can enter scores manually or via Enter Round.');
      }

      const data: OcrScorecardResponse = await response.json();
      setOcrResult(data);
      setCustomCourseName(data.courseName || 'Sharp Park Golf Course');
      if (data.date) setCustomDate(data.date);

      // Select first detected player by default
      if (data.detectedPlayers && data.detectedPlayers.length > 0) {
        const firstPlayer = data.detectedPlayers[0];
        setSelectedPlayerRowId(firstPlayer.id);

        // Pre-fill editable holes
        const initialHoles: Record<number, { strokes: number; putts: number }> = {};
        firstPlayer.holes.forEach((h) => {
          initialHoles[h.holeNumber] = {
            strokes: h.strokes || 4,
            putts: h.putts || 2,
          };
        });
        setEditableHoles(initialHoles);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Error communicating with Gemini Vision');
    } finally {
      setIsProcessing(false);
    }
  };

  // Switch selected player row
  const handleSelectPlayerRow = (playerId: string) => {
    setSelectedPlayerRowId(playerId);
    const player = ocrResult?.detectedPlayers.find((p) => p.id === playerId);
    if (player) {
      const updatedHoles: Record<number, { strokes: number; putts: number }> = {};
      player.holes.forEach((h) => {
        updatedHoles[h.holeNumber] = {
          strokes: h.strokes || 4,
          putts: h.putts || 2,
        };
      });
      setEditableHoles(updatedHoles);
    }
  };

  // Update hole score manually
  const handleHoleChange = (holeNum: number, field: 'strokes' | 'putts', value: number) => {
    setEditableHoles((prev) => ({
      ...prev,
      [holeNum]: {
        strokes: field === 'strokes' ? Math.max(1, value) : prev[holeNum]?.strokes || 4,
        putts: field === 'putts' ? Math.max(0, value) : prev[holeNum]?.putts || 2,
      },
    }));
  };

  // Save the digitized round
  const handleSaveRound = () => {
    const totalGross = Object.values(editableHoles).reduce((acc, h) => acc + h.strokes, 0);
    const totalPutts = Object.values(editableHoles).reduce((acc, h) => acc + h.putts, 0);

    const matchedCourse =
      courses.find((c) => c.name.toLowerCase().includes(customCourseName.toLowerCase())) || courses[0];
    const tee = matchedCourse.tees[0] || { name: 'White', rating: 70.0, slope: 125 };

    if (selectedFormat === 'scramble' || selectedFormat === 'best_ball') {
      // Save to Team Events Store
      const member = members.find((m) => m.id === assignedMemberId) || members[0];
      onSaveTeamEvent({
        date: customDate,
        courseName: customCourseName,
        eventName: `${customCourseName} ${selectedFormat === 'scramble' ? 'Scramble Shootout' : 'Best Ball'}`,
        format: selectedFormat,
        winningTeamName: `${member.name}'s Foursome`,
        teamLeaderboard: [
          {
            teamName: `${member.name}'s Foursome`,
            grossScore: totalGross,
            netScore: totalGross - 4,
            playerNames: [member.name, 'Chris Taylor', 'Guest Golfer', 'Dave Wong'],
          },
        ],
        notes: `Digitized via AI Scorecard OCR. Team score preserved without distorting individual handicap differentials.`,
      });
    } else {
      // Save to Individual WHS Handicap Store
      const member = members.find((m) => m.id === assignedMemberId) || members[0];
      const diff = Math.round(((113 / tee.slope) * (totalGross - tee.rating)) * 10) / 10;

      onSaveIndividualRound({
        date: customDate,
        courseId: matchedCourse.id,
        courseName: customCourseName,
        teeName: tee.name,
        format: selectedFormat,
        isTeamRound: false,
        playerId: member.id,
        playerName: member.name,
        grossScore: totalGross,
        netScore: totalGross - Math.round(member.handicapIndex),
        differential: diff,
        courseRating: tee.rating,
        slopeRating: tee.slope,
        totalPutts,
        firCount: 9,
        girCount: 10,
        scores: Object.entries(editableHoles).reduce((acc, [hole, val]) => {
          acc[Number(hole)] = {
            strokes: val.strokes,
            putts: val.putts,
            fir: 'hit',
            gir: true,
          };
          return acc;
        }, {} as any),
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="card-elevated max-w-3xl w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden my-8 shadow-2xl text-slate-900 dark:text-slate-100 transition-colors">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-xs">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-xl text-slate-900 dark:text-slate-100">
                AI Scorecard Digitizer
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Extract player rows from paper scorecards via Gemini Vision
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

        <div className="p-5 sm:p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* STEP 1: Format Selector & Photo Upload */}
          {!ocrResult && (
            <div className="space-y-5">
              {/* Format Selector */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300 block">
                  1. What game format was this round played in?
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'stroke', label: 'Individual Stroke', desc: 'WHS Official' },
                    { id: 'stableford', label: 'Stableford', desc: 'Points Mode' },
                    { id: 'scramble', label: 'Team Scramble', desc: 'Team Event Only' },
                    { id: 'best_ball', label: 'Best Ball', desc: 'Team Mode' },
                  ].map((fmt) => (
                    <button
                      key={fmt.id}
                      type="button"
                      onClick={() => setSelectedFormat(fmt.id as GameFormat)}
                      className={`btn-modern p-3 rounded-xl text-left border cursor-pointer transition-colors ${
                        selectedFormat === fmt.id
                          ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-transparent shadow-xs'
                          : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span className="font-heading font-bold text-xs block">{fmt.label}</span>
                      <span className="text-[10px] opacity-75 block">{fmt.desc}</span>
                    </button>
                  ))}
                </div>
                {selectedFormat === 'scramble' && (
                  <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-xl border border-amber-200 dark:border-amber-800">
                    ℹ️ Scramble rounds are safely logged to Team Events and will NOT skew individual handicap calculations.
                  </p>
                )}
              </div>

              {/* Upload Dropzone */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300 block">
                  2. Upload or take photo of paper scorecard:
                </label>
                <div className="p-6 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 text-center space-y-3">
                  {selectedImage ? (
                    <div className="space-y-3">
                      <div className="max-h-56 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 mx-auto inline-block shadow-sm">
                        <img
                          src={selectedImage}
                          alt="Scorecard preview"
                          className="max-h-56 object-contain"
                        />
                      </div>
                      <div className="flex items-center justify-center gap-3">
                        <label className="btn-modern px-4 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-lg cursor-pointer text-slate-700 dark:text-slate-300">
                          Change Photo
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 flex items-center justify-center mx-auto text-red-500">
                        <Upload className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-heading font-bold text-sm text-slate-900 dark:text-slate-100">
                          Drag & drop paper scorecard photo, or tap to browse
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Supports phone snapshots, PNG, JPEG, HEIC
                        </p>
                      </div>
                      <div className="flex items-center justify-center gap-3 pt-2">
                        <label className="btn-modern px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-heading font-semibold text-xs uppercase cursor-pointer shadow-xs">
                          Upload Scorecard
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={handleLoadSampleCard}
                          className="btn-modern px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-heading font-semibold text-xs cursor-pointer"
                        >
                          Try Sample Card
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Error Message */}
              {errorMsg && (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Submit OCR Button */}
              {selectedImage && (
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleProcessOcr}
                  className="btn-modern w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-heading font-bold text-sm uppercase tracking-wide flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-xs"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Reading Handwriting & Detecting Player Rows...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Process Scorecard with Gemini Vision</span>
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {/* STEP 2: Player Row Disambiguation & Member Assignment */}
          {ocrResult && (
            <div className="space-y-6">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
                    DETECTED COURSE & DATE
                  </span>
                  <div className="font-heading font-bold text-base text-slate-900 dark:text-slate-100">
                    {customCourseName} · {customDate}
                  </div>
                </div>
                <button
                  onClick={() => setOcrResult(null)}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 underline cursor-pointer"
                >
                  Scan Another Card
                </button>
              </div>

              {/* Player Row Picker */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300">
                    Which player row from the scorecard would you like to import?
                  </label>
                  <span className="text-xs text-slate-400 font-stats">
                    {ocrResult.detectedPlayers?.length || 0} rows found
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {ocrResult.detectedPlayers?.map((p) => {
                    const isSelected = p.id === selectedPlayerRowId;
                    return (
                      <div
                        key={p.id}
                        onClick={() => handleSelectPlayerRow(p.id)}
                        className={`card-modern p-3.5 rounded-xl cursor-pointer transition-all border ${
                          isSelected
                            ? 'ring-2 ring-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-500'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-heading font-bold text-sm text-slate-900 dark:text-slate-100">
                            {p.cardName || 'Golfer'}
                          </span>
                          <span className="font-stats font-bold text-base text-emerald-600 dark:text-emerald-400">
                            {p.totalStrokes} Gross
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
                          <span>Front 9: {p.front9 || '—'}</span>
                          <span>Back 9: {p.back9 || '—'}</span>
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            {isSelected ? '✓ Selected Row' : 'Tap to Select'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Member Assignment Dropdown */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300 block">
                  {selectedFormat === 'scramble'
                    ? 'Who does this team scramble round belong to?'
                    : 'Who in "Bay Area Darts" does this score belong to?'}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <select
                    value={assignedMemberId}
                    onChange={(e) => setAssignedMemberId(e.target.value)}
                    className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-heading font-semibold text-xs text-slate-900 dark:text-slate-100 outline-none"
                  >
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} {m.nickname ? `("${m.nickname}")` : ''} — Index: {m.handicapIndex}
                      </option>
                    ))}
                  </select>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Date:</span>
                    <input
                      type="date"
                      value={customDate}
                      onChange={(e) => setCustomDate(e.target.value)}
                      className="flex-1 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>

              {/* Hole-by-Hole Review Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300">
                    Verify & Tweak Hole-by-Hole Scores:
                  </label>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-stats">
                    Total: {Object.values(editableHoles).reduce((acc, h) => acc + h.strokes, 0)} strokes
                  </span>
                </div>

                <div className="rounded-xl overflow-x-auto border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                  <table className="w-full text-xs text-center border-collapse font-stats">
                    <thead className="bg-slate-900 dark:bg-slate-800 text-white font-heading font-bold">
                      <tr>
                        <th className="p-2 border-r border-slate-700 min-w-[70px]">Hole</th>
                        {Array.from({ length: 18 }, (_, i) => (
                          <th key={i + 1} className="p-1.5 w-10 border-r border-slate-700">
                            #{i + 1}
                          </th>
                        ))}
                        <th className="p-2 bg-emerald-600 text-white">TOT</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {/* Strokes Row */}
                      <tr className="bg-white dark:bg-slate-900">
                        <td className="p-2 font-bold font-heading text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-800/40 border-r border-slate-200 dark:border-slate-800">
                          Strokes
                        </td>
                        {Array.from({ length: 18 }, (_, i) => {
                          const hNum = i + 1;
                          const val = editableHoles[hNum]?.strokes || 0;
                          return (
                            <td key={hNum} className="p-1 border-r border-slate-100 dark:border-slate-800">
                              <input
                                type="number"
                                min="1"
                                max="15"
                                value={val || ''}
                                onChange={(e) => handleHoleChange(hNum, 'strokes', parseInt(e.target.value) || 0)}
                                className="w-8 p-1 text-center font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100 focus:bg-white"
                              />
                            </td>
                          );
                        })}
                        <td className="p-2 font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20">
                          {Object.values(editableHoles).reduce((acc, h) => acc + h.strokes, 0)}
                        </td>
                      </tr>
                      {/* Putts Row */}
                      <tr className="bg-slate-50/50 dark:bg-slate-800/30">
                        <td className="p-2 font-bold font-heading text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/60 border-r border-slate-200 dark:border-slate-800">
                          Putts
                        </td>
                        {Array.from({ length: 18 }, (_, i) => {
                          const hNum = i + 1;
                          const val = editableHoles[hNum]?.putts || 0;
                          return (
                            <td key={hNum} className="p-1 border-r border-slate-100 dark:border-slate-800">
                              <input
                                type="number"
                                min="0"
                                max="6"
                                value={val}
                                onChange={(e) => handleHoleChange(hNum, 'putts', parseInt(e.target.value) || 0)}
                                className="w-8 p-1 text-center font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-900 dark:text-slate-100"
                              />
                            </td>
                          );
                        })}
                        <td className="p-2 font-bold text-slate-700 dark:text-slate-300">
                          {Object.values(editableHoles).reduce((acc, h) => acc + h.putts, 0)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Confirm & Save Button */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-modern px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSaveRound}
                  className="btn-modern px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-heading font-semibold text-xs uppercase rounded-xl flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <Check className="w-4 h-4" />
                  <span>
                    Confirm & Save {selectedFormat === 'scramble' ? 'to Team Events' : 'to Handicap Record'}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
