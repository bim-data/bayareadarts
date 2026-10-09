import React, { useState } from 'react';
import { X, Sparkles, Check, User } from 'lucide-react';
import { MemberProfile } from '../types';

interface EditNicknameModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: MemberProfile[];
  onSaveMemberNickname: (memberId: string, nickname: string, avatarEmoji: string, badgeTitle: string) => void;
}

export const EditNicknameModal: React.FC<EditNicknameModalProps> = ({
  isOpen,
  onClose,
  members,
  onSaveMemberNickname,
}) => {
  const [selectedMemberId, setSelectedMemberId] = useState(members[0]?.id || '');
  const activeMember = members.find((m) => m.id === selectedMemberId) || members[0];

  const [nickname, setNickname] = useState(activeMember?.nickname || '');
  const [avatarEmoji, setAvatarEmoji] = useState(activeMember?.avatarEmoji || '🎯');
  const [badgeTitle, setBadgeTitle] = useState(activeMember?.badgeTitle || 'Dart Sniper');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const popularEmojis = ['🎯', '⚡', '🪄', '🏹', '🏌️', '🦅', '⛳', '🔥', '👑', '💣', '⭐', '🦾'];
  const suggestedNicknames = [
    'The Dart Slinger',
    'Left Coast Bomber',
    'Flatstick Wizard',
    'Pin Seeker',
    'Birdie Hunter',
    'Fairway Assassin',
    'The Wedge Doctor',
    'Pure Strike',
    'The Sandman',
  ];

  const handleMemberChange = (id: string) => {
    setSelectedMemberId(id);
    const m = members.find((item) => item.id === id);
    if (m) {
      setNickname(m.nickname || '');
      setAvatarEmoji(m.avatarEmoji || '🎯');
      setBadgeTitle(m.badgeTitle || 'Dart Sniper');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveMemberNickname(selectedMemberId, nickname.trim(), avatarEmoji, badgeTitle.trim());
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="card-modern rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-heading font-bold text-lg text-slate-900 dark:text-slate-100">
              Set Custom Nickname
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Give yourself a custom course nickname and golf avatar
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Select Player */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              Player
            </label>
            <select
              value={selectedMemberId}
              onChange={(e) => handleMemberChange(e.target.value)}
              className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} {m.nickname ? `("${m.nickname}")` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Nickname Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              Custom Nickname
            </label>
            <input
              type="text"
              required
              placeholder="e.g. The Dart Slinger"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100"
            />
            {/* Suggested Nickname Chips */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              {suggestedNicknames.slice(0, 5).map((sugg) => (
                <button
                  key={sugg}
                  type="button"
                  onClick={() => setNickname(sugg)}
                  className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-medium hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                >
                  "{sugg}"
                </button>
              ))}
            </div>
          </div>

          {/* Avatar Emoji */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              Player Icon / Avatar
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {popularEmojis.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setAvatarEmoji(emoji)}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg cursor-pointer transition-all ${
                    avatarEmoji === emoji
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 ring-2 ring-emerald-500 scale-110'
                      : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Live Preview Card */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl flex items-center gap-3">
            <span className="text-2xl">{avatarEmoji}</span>
            <div>
              <span className="text-[10px] text-slate-400 font-semibold uppercase block">Leaderboard Preview</span>
              <span className="font-heading font-bold text-sm text-slate-900 dark:text-slate-100">
                {activeMember?.name} <span className="text-emerald-600 dark:text-emerald-400 font-medium">"{nickname || 'No Nickname'}"</span>
              </span>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-modern px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-modern px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              {savedSuccess ? <Check className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>{savedSuccess ? 'Saved!' : 'Update Nickname'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
