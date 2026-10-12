import React, { useState } from 'react';
import { dartsLogo, sniperBadge } from '../assets';
import { X, Target, Sparkles, Check, Palette, Award, Download } from 'lucide-react';
import { MemberProfile } from '../types';

interface ClubLogoCustomizerProps {
  isOpen: boolean;
  onClose: () => void;
  members: MemberProfile[];
  onUpdateMemberNickname: (memberId: string, nickname: string, badgeTitle: string) => void;
}

export const ClubLogoCustomizer: React.FC<ClubLogoCustomizerProps> = ({
  isOpen,
  onClose,
  members,
  onUpdateMemberNickname,
}) => {
  const [selectedTheme, setSelectedTheme] = useState('classic');
  const [clubMotto, setClubMotto] = useState('Hit the Pin. Throw Darts. Take Their Quarters!');
  const [selectedMemberId, setSelectedMemberId] = useState(members[0]?.id || '');
  const [newNickname, setNewNickname] = useState(members[0]?.nickname || 'The Dart Slinger');
  const [newBadge, setNewBadge] = useState(members[0]?.badgeTitle || 'Dart Sniper');
  const [savedAlert, setSavedAlert] = useState(false);

  if (!isOpen) return null;

  const themes = [
    { id: 'classic', name: 'Classic Fairway & Bullseye', primary: '#DC2626', secondary: '#1E5631' },
    { id: 'sunset', name: 'Golden Gate Sunset', primary: '#F59E0B', secondary: '#DC2626' },
    { id: 'stealth', name: 'Stealth Ink & Charcoal', primary: '#141413', secondary: '#4B5563' },
    { id: 'neon', name: 'Electric Turf & Emerald', primary: '#10B981', secondary: '#047857' },
  ];

  const handleSaveMember = () => {
    onUpdateMemberNickname(selectedMemberId, newNickname, newBadge);
    setSavedAlert(true);
    setTimeout(() => setSavedAlert(false), 2000);
  };

  const currentMember = members.find((m) => m.id === selectedMemberId) || members[0];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="card-elevated max-w-3xl w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden my-6 shadow-2xl text-slate-900 dark:text-slate-100 transition-colors">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-xs">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-xl text-slate-900 dark:text-slate-100">
                Bay Area Darts — Club Identity & Badges
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Custom club emblems, mottos, and player nicknames
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
          {/* Logo Showcase Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Primary Clubhouse Crest */}
            <div className="card-modern p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex flex-col items-center text-center space-y-3">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Official Clubhouse Crest
              </span>
              <div className="w-28 h-28 rounded-full border-2 border-slate-300 dark:border-slate-600 overflow-hidden shadow-md bg-white">
                <img
                  src={dartsLogo}
                  alt="Bay Area Darts Mascot Logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h4 className="font-heading font-extrabold text-lg text-slate-900 dark:text-slate-100">
                  Bay Area Darts
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Comic Bullseye & Flagstick Emblem
                </p>
              </div>
            </div>

            {/* Dart Sniper Achievement Badge */}
            <div className="card-modern p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex flex-col items-center text-center space-y-3">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Member Badge: Dart Sniper
              </span>
              <div className="w-28 h-28 rounded-full border-2 border-slate-300 dark:border-slate-600 overflow-hidden shadow-md bg-white">
                <img
                  src={sniperBadge}
                  alt="Dart Sniper Badge"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h4 className="font-heading font-extrabold text-lg text-slate-900 dark:text-slate-100">
                  Pin Seeker Honors
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Awarded for Greens in Regulation & Hole-Outs
                </p>
              </div>
            </div>
          </div>

          {/* Club Motto Customizer */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300 block">
              Official Foursome Motto
            </label>
            <input
              type="text"
              value={clubMotto}
              onChange={(e) => setClubMotto(e.target.value)}
              className="w-full p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl font-heading font-semibold text-xs text-slate-900 dark:text-slate-100 outline-none"
            />
          </div>

          {/* Member Nickname & Badge Editor */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
              <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Customize Player Nickname & Badge</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1 font-semibold">Select Member</label>
                <select
                  value={selectedMemberId}
                  onChange={(e) => {
                    setSelectedMemberId(e.target.value);
                    const m = members.find((item) => item.id === e.target.value);
                    if (m) {
                      setNewNickname(m.nickname || '');
                      setNewBadge(m.badgeTitle || 'Dart Sniper');
                    }
                  }}
                  className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100"
                >
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1 font-semibold">Custom Nickname</label>
                <input
                  type="text"
                  value={newNickname}
                  onChange={(e) => setNewNickname(e.target.value)}
                  placeholder="e.g. The Wedge Doctor"
                  className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1 font-semibold">Badge Title</label>
                <input
                  type="text"
                  value={newBadge}
                  onChange={(e) => setNewBadge(e.target.value)}
                  placeholder="e.g. Fairway Assassin"
                  className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-slate-400">
                Current: {currentMember?.name} "{newNickname}" ({newBadge})
              </span>
              <button
                type="button"
                onClick={handleSaveMember}
                className="btn-modern px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                {savedAlert ? <Check className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>{savedAlert ? 'Updated!' : 'Save Badge'}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="btn-modern px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-semibold cursor-pointer shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
