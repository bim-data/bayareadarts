import { FutureRound } from '../types';

/**
 * Calculates the exact date and time when the booking window opens
 * Default: 7 days prior to targetDate at 6:00 AM local time.
 */
export function getBookingWindowDetails(targetDate: string, daysAhead: number = 7) {
  try {
    const parts = targetDate.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);

      // Round target date at 8:00 AM
      const roundDate = new Date(year, month, day, 8, 0, 0);

      // Booking window opens `daysAhead` days before at 6:00 AM
      const openDate = new Date(year, month, day - daysAhead, 6, 0, 0);

      const now = new Date();
      const diffMs = openDate.getTime() - now.getTime();
      const isOpen = diffMs <= 0;

      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);
      const remainingHours = diffHours % 24;

      let countdownText = '';
      if (isOpen) {
        countdownText = 'Tee sheet is open now!';
      } else if (diffDays > 0) {
        countdownText = `Opens in ${diffDays}d ${remainingHours}h`;
      } else if (diffHours > 0) {
        countdownText = `Opens in ${diffHours} hours`;
      } else {
        const diffMinutes = Math.max(1, Math.floor(diffMs / (1000 * 60)));
        countdownText = `Opens in ${diffMinutes} minutes!`;
      }

      const formattedOpenDate = openDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
      const formattedOpenTime = '6:00 AM';

      return {
        isOpen,
        openDate,
        countdownText,
        formattedOpenDate,
        formattedOpenTime,
        diffDays,
        diffHours,
      };
    }
  } catch (err) {
    console.error('Error calculating booking window:', err);
  }

  return {
    isOpen: false,
    openDate: new Date(),
    countdownText: 'Tee sheet opens 7 days out',
    formattedOpenDate: '7 days out',
    formattedOpenTime: '6:00 AM',
    diffDays: 7,
    diffHours: 168,
  };
}

/**
 * Generates and triggers download of an .ics calendar file
 * with an alarm set 15 minutes before the booking window opens.
 */
export function downloadCalendarReminder(futureRound: FutureRound) {
  const { openDate } = getBookingWindowDetails(futureRound.targetDate, futureRound.bookingOpenDaysAhead || 7);

  const startUtc = openDate.toISOString().replace(/-|:|\.\d+/g, '');
  const endUtc = new Date(openDate.getTime() + 30 * 60 * 1000).toISOString().replace(/-|:|\.\d+/g, '');
  const nowUtc = new Date().toISOString().replace(/-|:|\.\d+/g, '');

  const summary = `Book Golf Tee Time: ${futureRound.courseName}`;
  const description = `Tee sheet opens today at 6:00 AM for Bay Area Darts round on ${futureRound.targetDate}. Format: ${futureRound.format.toUpperCase()}. Remember to book for 4 players!`;

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Bay Area Darts//Golf Booking Reminder//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:bad-booking-${futureRound.id}@bayareadarts.com`,
    `DTSTAMP:${nowUtc}`,
    `DTSTART:${startUtc}`,
    `DTEND:${endUtc}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${futureRound.courseName}`,
    'BEGIN:VALARM',
    'TRIGGER:-PT15M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Golf booking window opens in 15 minutes!',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `tee-time-reminder-${futureRound.courseName.toLowerCase().replace(/[^a-z0-9]/g, '-')}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Prepares and copies a message for group chat
 */
export function copyGroupBookingAlert(futureRound: FutureRound, playerNames: string[]): string {
  const { formattedOpenDate, formattedOpenTime, isOpen } = getBookingWindowDetails(
    futureRound.targetDate,
    futureRound.bookingOpenDaysAhead || 7
  );

  const rosterStr = playerNames.length > 0 ? playerNames.join(', ') : 'Foursome pending';

  let message = '';
  if (isOpen) {
    message = `🚨 [BAY AREA DARTS ALERT] Tee times for ${futureRound.courseName} on ${futureRound.targetDate} are OPEN NOW! Book asap! Group: ${rosterStr}`;
  } else {
    message = `⏰ [BAY AREA DARTS REMINDER] Tee sheet for ${futureRound.courseName} on ${futureRound.targetDate} opens ${formattedOpenDate} at ${formattedOpenTime}! Confirmed group: ${rosterStr}`;
  }

  navigator.clipboard.writeText(message);
  return message;
}

/**
 * Requests browser notification permission and schedules a test alert
 */
export async function requestNotificationReminder(futureRound: FutureRound): Promise<boolean> {
  if (!('Notification' in window)) {
    return false;
  }

  if (Notification.permission === 'granted') {
    new Notification(`Bay Area Darts: Reminder Set!`, {
      body: `We will alert you when ${futureRound.courseName} booking opens!`,
      icon: '/src/assets/images/bay_area_darts_logo_1791561323731.jpg',
    });
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      new Notification(`Bay Area Darts: Reminder Enabled!`, {
        body: `You'll be notified when ${futureRound.courseName} tee sheet opens!`,
        icon: '/src/assets/images/bay_area_darts_logo_1791561323731.jpg',
      });
      return true;
    }
  }

  return false;
}
