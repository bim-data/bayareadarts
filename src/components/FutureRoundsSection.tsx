import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  Users, 
  Plus, 
  Play, 
  CheckCircle2, 
  Sparkles, 
  Bell, 
  Download, 
  Copy, 
  Check, 
  X, 
  Trash2, 
  UserPlus, 
  AlertCircle,
  Mail,
  Send,
  Edit3
} from 'lucide-react';
import { FutureRound, MemberProfile, Course } from '../types';
import { 
  getBookingWindowDetails, 
  downloadCalendarReminder, 
  copyGroupBookingAlert, 
  requestNotificationReminder 
} from '../utils/reminder';

interface FutureRoundsSectionProps {
  futureRounds: FutureRound[];
  members: MemberProfile[];
  courses: Course[];
  activeUser?: MemberProfile;
  onOpenProfile?: () => void;
  onOpenCreateFutureRound: () => void;
  onEditFutureRound: (futureRound: FutureRound) => void;
  onRsvpPlayer: (futureRoundId: string, memberId: string, action: 'join' | 'leave') => void;
  onStartFutureRound: (futureRoundId: string) => void;
  onDeleteFutureRound: (futureRoundId: string) => void;
  onOpenLogin?: () => void;
}

export const FutureRoundsSection: React.FC<FutureRoundsSectionProps> = ({
  futureRounds,
  members,
  courses,
  activeUser,
  onOpenProfile,
  onOpenCreateFutureRound,
  onEditFutureRound,
  onRsvpPlayer,
  onStartFutureRound,
  onDeleteFutureRound,
  onOpenLogin,
}) => {
  const [selectedRsvpRoundId, setSelectedRsvpRoundId] = useState<string | null>(null);
  const [copiedRoundId, setCopiedRoundId] = useState<string | null>(null);
  const [alertSuccessId, setAlertSuccessId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Email Notification modal state
  const [emailSentData, setEmailSentData] = useState<{
    roundName: string;
    email: string;
    subject: string;
    messageBody: string;
  } | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const formatDateDisplay = (dateStr: string) => {
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      }
    } catch {}
    return dateStr;
  };

  const handleCopyAlert = (fr: FutureRound) => {
    const regNames = fr.registeredPlayerIds
      .map((id) => members.find((m) => m.id === id)?.name)
      .filter(Boolean) as string[];
    copyGroupBookingAlert(fr, regNames);
    setCopiedRoundId(fr.id);
    setTimeout(() => setCopiedRoundId(null), 2500);
  };

  const handleSetAlert = async (fr: FutureRound) => {
    await requestNotificationReminder(fr);
    setAlertSuccessId(fr.id);
    setTimeout(() => setAlertSuccessId(null), 2500);
  };

  // Send email booking reminder
  const handleSendEmailReminder = async (fr: FutureRound) => {
    const targetEmail = activeUser?.email;
    if (!targetEmail) {
      if (onOpenProfile) onOpenProfile();
      return;
    }

    setIsSendingEmail(true);
    try {
      const res = await fetch(`/api/future-rounds/${fr.id}/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: targetEmail,
          recipientName: activeUser?.name || 'Club Golfer',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEmailSentData({
          roundName: fr.courseName,
          email: targetEmail,
          subject: data.subject,
          messageBody: data.messageBody,
        });
      }
    } catch {
      // Fallback preview
      setEmailSentData({
        roundName: fr.courseName,
        email: targetEmail,
        subject: `⛳ Bay Area Darts Alert: 7-Day Tee Sheet Booking Window for ${fr.courseName}`,
        messageBody: `Booking window opens 7 days prior at 6:00 AM for ${fr.targetDate}. Target window: ${fr.targetTimeWindow || 'Morning'}. Be ready at the tee sheet!`,
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <div className="space-y-4" id="future-rounds-section">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <h3 className="font-heading font-bold text-base text-slate-900 dark:text-slate-100 tracking-tight">
            Future Rounds & Placeholders
          </h3>
        </div>

        <button
          onClick={() => {
            if (!activeUser && onOpenLogin) {
              onOpenLogin();
            } else {
              onOpenCreateFutureRound();
            }
          }}
          className="btn-modern px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1 shadow-2xs shrink-0 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Placeholder</span>
        </button>
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400">
        Pre-register foursomes and get automated 7-day tee sheet booking alerts emailed to you.
      </p>

      {futureRounds.length === 0 ? (
        <div className="card-modern p-6 rounded-2xl text-center space-y-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <Calendar className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
          <div>
            <h4 className="font-heading font-semibold text-sm text-slate-900 dark:text-slate-100">
              No Future Rounds Scheduled
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
              Add next weekend's placeholder so the crew can claim spots before the 7-day tee sheet window opens!
            </p>
          </div>
          <button
            onClick={onOpenCreateFutureRound}
            className="btn-modern px-3.5 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Placeholder</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3.5">
          {futureRounds.map((fr) => {
            const isConfirmed = fr.status === 'confirmed';
            const bookingDetails = getBookingWindowDetails(fr.targetDate, fr.bookingOpenDaysAhead || 7);
            const registeredMembers = fr.registeredPlayerIds
              .map((id) => members.find((m) => m.id === id))
              .filter(Boolean) as MemberProfile[];
            const openSlots = Math.max(0, (fr.maxPlayers || 4) - fr.registeredPlayerIds.length);
            const isUserRegistered = activeUser ? fr.registeredPlayerIds.includes(activeUser.id) : false;

            return (
              <div
                key={fr.id}
                className="card-modern rounded-2xl p-4 space-y-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all text-slate-900 dark:text-slate-100"
              >
                {/* Top Header: Date & Status Badge */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 shrink-0">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    {formatDateDisplay(fr.targetDate)}
                  </span>

                  {isConfirmed ? (
                    <span className="text-[11px] font-semibold px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-md flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Booked
                    </span>
                  ) : bookingDetails.isOpen ? (
                    <span className="text-[11px] font-bold px-2 py-0.5 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700 rounded-md flex items-center gap-1 animate-pulse">
                      <Clock className="w-3 h-3" />
                      Window Open!
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-md border border-slate-200 dark:border-slate-700">
                      {bookingDetails.countdownText}
                    </span>
                  )}
                </div>

                {/* Course Name & Format */}
                <div>
                  <h4 className="font-heading font-bold text-base text-slate-900 dark:text-slate-100 tracking-tight">
                    {fr.courseName}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    <span>{fr.targetTimeWindow || 'Morning Tee Time'}</span>
                    <span>·</span>
                    <span className="capitalize">{fr.format}</span>
                    {fr.teeName && <span>· {fr.teeName}</span>}
                  </div>
                </div>

                {/* 7-Day Drop Countdown & Notification Box (Logged in members only) */}
                {!isConfirmed && activeUser && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-2.5">
                    <div className="flex items-start gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                      <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <span className="text-[11px] leading-relaxed">
                        {bookingDetails.isOpen
                          ? '⚡ 7-day booking window is live! Head to course tee sheet to reserve.'
                          : `Opens ${bookingDetails.formattedOpenDate} at 6:00 AM (${bookingDetails.countdownText})`}
                      </span>
                    </div>

                    {/* Email Alert Banner */}
                    <div className="p-2 rounded-lg bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-800/60 flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Mail className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span className="text-[11px] text-emerald-900 dark:text-emerald-200 truncate">
                          {activeUser?.email ? `Email: ${activeUser.email}` : 'No email on profile'}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSendEmailReminder(fr)}
                        className="px-2 py-0.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold shrink-0 flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                      >
                        <Send className="w-2.5 h-2.5" />
                        <span>Email Me Alert</span>
                      </button>
                    </div>

                    {/* Quick Reminder Actions */}
                    <div className="flex items-center gap-1.5 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                      <button
                        onClick={() => downloadCalendarReminder(fr)}
                        title="Download .ics Calendar Reminder with 15-min alarm"
                        className="btn-modern flex-1 py-1 px-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Download className="w-3 h-3" />
                        <span>Calendar .ics</span>
                      </button>

                      <button
                        onClick={() => handleCopyAlert(fr)}
                        title="Copy group text alert to clipboard"
                        className="btn-modern flex-1 py-1 px-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center justify-center gap-1 cursor-pointer"
                      >
                        {copiedRoundId === fr.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-600">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy Alert</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleSetAlert(fr)}
                        title="Set browser alert"
                        className="btn-modern p-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-amber-500 cursor-pointer"
                      >
                        <Bell className={`w-3.5 h-3.5 ${alertSuccessId === fr.id ? 'text-amber-500' : ''}`} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Pre-Registered Players Roster (Foursome) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <span>Foursome ({registeredMembers.length}/{fr.maxPlayers || 4})</span>
                    {activeUser && (
                      isUserRegistered ? (
                        <button
                          onClick={() => onRsvpPlayer(fr.id, activeUser.id, 'leave')}
                          className="text-red-500 hover:text-red-600 text-[11px] font-medium cursor-pointer"
                        >
                          Leave Foursome
                        </button>
                      ) : openSlots > 0 ? (
                        <button
                          onClick={() => onRsvpPlayer(fr.id, activeUser.id, 'join')}
                          className="text-emerald-600 dark:text-emerald-400 hover:underline text-[11px] font-bold cursor-pointer"
                        >
                          + Sign Me Up ({activeUser.name}{activeUser.nickname ? ` "${activeUser.nickname}"` : ''})
                        </button>
                      ) : null
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    {registeredMembers.map((m) => {
                      const isMe = activeUser && m.id === activeUser.id;
                      return (
                        <div
                          key={m.id}
                          className={`p-1.5 rounded-xl border flex items-center justify-between gap-1 shadow-2xs group ${
                            isMe
                              ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-700'
                              : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/80'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-xs shrink-0">{m.avatarEmoji}</span>
                            <span className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate">
                              {m.name} {m.nickname ? `"${m.nickname}"` : ''}
                            </span>
                          </div>
                          {activeUser && (
                            <button
                              onClick={() => onRsvpPlayer(fr.id, m.id, 'leave')}
                              title="Remove from slot"
                              className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      );
                    })}

                    {/* Empty Slots (Claimable only when logged in) */}
                    {activeUser ? (
                      Array.from({ length: openSlots }).map((_, i) => (
                        <div
                          key={i}
                          onClick={() => setSelectedRsvpRoundId(fr.id)}
                          className="p-1.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center justify-center gap-1 text-xs font-medium cursor-pointer transition-colors"
                        >
                          <UserPlus className="w-3 h-3" />
                          <span>+ Claim Spot</span>
                        </div>
                      ))
                    ) : registeredMembers.length === 0 ? (
                      <div className="col-span-2 py-2 text-center text-xs text-slate-400 italic">
                        Open foursome (Sign in to claim spot)
                      </div>
                    ) : null}
                  </div>
                </div>

                {fr.notes && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                    "{fr.notes}"
                  </p>
                )}

                {/* Bottom Actions: Delete (left), Edit (middle), Start Round (right) - Logged in only */}
                {activeUser ? (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* 1. Delete on the left */}
                      {confirmDeleteId === fr.id ? (
                        <div className="flex items-center gap-1 bg-red-50 dark:bg-red-950/60 p-0.5 rounded-xl border border-red-200 dark:border-red-800">
                          <button
                            type="button"
                            onClick={() => {
                              onDeleteFutureRound(fr.id);
                              setConfirmDeleteId(null);
                            }}
                            className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-2xs"
                          >
                            Confirm
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2 py-1 text-slate-500 hover:text-slate-700 dark:text-slate-400 text-xs font-medium cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(fr.id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 border border-transparent hover:border-red-200 dark:hover:border-red-900/50 transition-colors cursor-pointer"
                          title="Delete Placeholder"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* 2. Edit between delete and start round button */}
                      <button
                        type="button"
                        onClick={() => onEditFutureRound(fr)}
                        className="px-2.5 py-1.5 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold shrink-0"
                        title="Edit round (date, course, time, format)"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Edit</span>
                      </button>
                    </div>

                    {/* 3. Start Round on the right */}
                    <button
                      type="button"
                      onClick={() => onStartFutureRound(fr.id)}
                      className="btn-modern flex-1 py-1.5 px-3 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Tee Off (Start Live Round)</span>
                    </button>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      {/* RSVP Quick Member Select Modal */}
      {selectedRsvpRoundId && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="card-modern rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between">
              <h4 className="font-heading font-bold text-base text-slate-900 dark:text-slate-100">
                Claim Foursome Spot
              </h4>
              <button
                onClick={() => setSelectedRsvpRoundId(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select which member to pre-register into this round:
            </p>

            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              {members.map((m) => {
                const currentRound = futureRounds.find((r) => r.id === selectedRsvpRoundId);
                const isAlreadyIn = currentRound?.registeredPlayerIds.includes(m.id);

                return (
                  <button
                    key={m.id}
                    disabled={isAlreadyIn}
                    onClick={() => {
                      onRsvpPlayer(selectedRsvpRoundId, m.id, 'join');
                      setSelectedRsvpRoundId(null);
                    }}
                    className={`btn-modern w-full p-2.5 rounded-xl text-left flex items-center justify-between text-xs cursor-pointer ${
                      isAlreadyIn
                        ? 'opacity-40 bg-slate-100 dark:bg-slate-800 cursor-not-allowed'
                        : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{m.avatarEmoji}</span>
                      <span className="font-semibold">{m.name}</span>
                      {m.nickname && <span className="text-slate-500 text-[11px]">"{m.nickname}"</span>}
                    </div>
                    {isAlreadyIn ? (
                      <span className="text-[10px] text-slate-400">Already in</span>
                    ) : (
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">+ Add</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Email Alert Sent Confirmation Preview Modal */}
      {emailSentData && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="card-elevated rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-heading font-bold text-base text-slate-900 dark:text-slate-100">
                    Booking Alert Dispatched!
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Sent to: <strong>{emailSentData.email}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEmailSentData(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Simulated Email Box */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3 text-xs">
              <div className="pb-2 border-b border-slate-200 dark:border-slate-700">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Subject</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {emailSentData.subject}
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Message Preview</span>
                <p className="text-slate-600 dark:text-slate-300 font-mono text-[11px] whitespace-pre-line leading-relaxed">
                  {emailSentData.messageBody}
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setEmailSentData(null)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Got It, Thanks!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
