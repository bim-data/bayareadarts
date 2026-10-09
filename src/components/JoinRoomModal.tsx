import React, { useState } from 'react';
import { X, Users, ArrowRight, AlertCircle, RefreshCw } from 'lucide-react';
import { MemberProfile } from '../types';

interface JoinRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: MemberProfile[];
  onJoinRoom: (roomCode: string, playerName: string, handicapIndex: number, memberId?: string) => Promise<boolean>;
}

export const JoinRoomModal: React.FC<JoinRoomModalProps> = ({
  isOpen,
  onClose,
  members,
  onJoinRoom,
}) => {
  const [roomCode, setRoomCode] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState<string>(members[0]?.id || '');
  const [isGuest, setIsGuest] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestHcp, setGuestHcp] = useState('10.0');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCode.trim()) {
      setErrorMsg('Please enter a room code');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      let pName = '';
      let pHcp = 10;
      let mId: string | undefined = undefined;

      if (isGuest) {
        pName = guestName.trim() || 'Guest Golfer';
        pHcp = parseFloat(guestHcp) || 10;
      } else {
        const mem = members.find((m) => m.id === selectedMemberId) || members[0];
        pName = mem.name;
        pHcp = mem.handicapIndex;
        mId = mem.id;
      }

      const success = await onJoinRoom(roomCode.trim().toUpperCase(), pName, pHcp, mId);
      if (success) {
        onClose();
      } else {
        setErrorMsg('Room not found or invalid PIN');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to join live round');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="card-elevated max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-2xl text-slate-900 dark:text-slate-100 transition-colors">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-xl text-slate-900 dark:text-slate-100">
                Join Live Round
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Connect your phone to your friend's group
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

        <form onSubmit={handleJoin} className="p-5 sm:p-6 space-y-4">
          {/* Room PIN Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300 block">
              Enter Room PIN
            </label>
            <input
              type="text"
              placeholder="e.g. DART-18"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              className="w-full p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl font-stats font-extrabold text-xl tracking-widest text-center text-slate-900 dark:text-slate-100 placeholder-slate-400 uppercase outline-none focus:bg-white dark:focus:bg-slate-800"
              autoFocus
            />
          </div>

          {/* Profile Choice */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300 block">
              Who is playing?
            </label>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsGuest(false)}
                className={`btn-modern p-2.5 rounded-xl text-xs font-semibold cursor-pointer border transition-colors ${
                  !isGuest
                    ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-transparent shadow-xs'
                    : 'bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                Bay Area Darts Member
              </button>
              <button
                type="button"
                onClick={() => setIsGuest(true)}
                className={`btn-modern p-2.5 rounded-xl text-xs font-semibold cursor-pointer border transition-colors ${
                  isGuest
                    ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-transparent shadow-xs'
                    : 'bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                Guest Golfer
              </button>
            </div>

            {!isGuest ? (
              <select
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} {m.nickname ? `("${m.nickname}")` : ''} · Idx: {m.handicapIndex}
                  </option>
                ))}
              </select>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Your Name"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="flex-1 p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
                />
                <input
                  type="number"
                  placeholder="Hcp"
                  value={guestHcp}
                  onChange={(e) => setGuestHcp(e.target.value)}
                  className="w-20 p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-stats"
                />
              </div>
            )}
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-modern px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-modern px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
            >
              {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>Connect to Group</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
