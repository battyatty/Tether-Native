import { Task } from '../types';

export interface CalendarEvent {
  summary: string;
  description?: string;
  dtstart: string;
  dtend: string;
  location?: string;
  rrule?: string;
  scheduledDate: string;
  uid?: string;
  categories?: string;
  isRecurring?: boolean;
  originalStart?: string; // For recurring event instances
}

function cleanRRuleString(raw: string): string {
  const mainComponents = ['FREQ', 'UNTIL', 'BYDAY', 'WKST', 'INTERVAL', 'COUNT'];
  const parts = raw.split(';');
  const cleaned = parts
    .map(part => {
      const [key] = part.split('=');
      if (!mainComponents.includes(key)) return null;

      if (key === 'BYDAY') {
        const value = part.split('=')[1];
        const days = value.split(',')
          .map(day => day.match(/^(MO|TU|WE|TH|FR|SA|SU)$/)?.[0])
          .filter(Boolean);
        return days.length ? `BYDAY=${days.join(',')}` : null;
      }

      if (key === 'UNTIL') {
        const value = part.split('=')[1];
        const match = value.match(/(\d{8}T\d{6}Z?)/);
        return match ? `UNTIL=${match[1]}` : null;
      }

      return part.split('\n')[0];
    })
    .filter(Boolean)
    .join(';');

  return cleaned;
}

// Validate ICS content before parsing
const validateICSContent = (icsContent: string): { isValid: boolean; error?: string } => {
  if (!icsContent || icsContent.trim().length === 0) {
    return { isValid: false, error: 'Calendar file is empty' };
  }
  
  if (!icsContent.includes('BEGIN:VCALENDAR')) {
    return { isValid: false, error: 'Not a valid calendar file (missing VCALENDAR)' };
  }
  
  if (!icsContent.includes('END:VCALENDAR')) {
    return { isValid: false, error: 'Calendar file appears to be corrupted (missing end tag)' };
  }
  
  const eventCount = (icsContent.match(/BEGIN:VEVENT/g) || []).length;
  const eventEndCount = (icsContent.match(/END:VEVENT/g) || []).length;
  
  if (eventCount !== eventEndCount) {
    return { isValid: false, error: 'Calendar file has malformed events' };
  }
  
  if (eventCount === 0) {
    return { isValid: false, error: 'No events found in calendar file' };
  }
  
  return { isValid: true };
};

const parseICalDate = (value: string): string => {
  const basicDate = value.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})Z?)?$/);
  if (basicDate) {
    const [_, year, month, day, hour = '00', minute = '00', second = '00'] = basicDate;
    const date = new Date(Date.UTC(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hour),
      parseInt(minute),
      parseInt(second)
    ));
    return date.toISOString();
  }
  
  const date = new Date(value);
  if (!isNaN(date.getTime())) {
    return date.toISOString();
  }
  
  throw new Error(`Invalid date format: ${value}`);
};

// Expand recurring events for a given date range
const expandRecurringEvents = (event: CalendarEvent, startDate: Date, endDate: Date): CalendarEvent[] => {
  if (!event.rrule || !event.isRecurring) {
    return [event];
  }

  const instances: CalendarEvent[] = [];
  const eventStart = new Date(event.dtstart);
  const eventEnd = new Date(event.dtend);
  const duration = eventEnd.getTime() - eventStart.getTime();

  // Simple recurring event expansion - handle daily, weekly patterns
  const rruleParts = event.rrule.split(';');
  const freqMatch = rruleParts.find(part => part.startsWith('FREQ='));
  const intervalMatch = rruleParts.find(part => part.startsWith('INTERVAL='));
  const countMatch = rruleParts.find(part => part.startsWith('COUNT='));
  const untilMatch = rruleParts.find(part => part.startsWith('UNTIL='));

  if (!freqMatch) return [event];

  const freq = freqMatch.split('=')[1];
  const interval = intervalMatch ? parseInt(intervalMatch.split('=')[1]) : 1;
  const count = countMatch ? parseInt(countMatch.split('=')[1]) : null;
  const until = untilMatch ? new Date(parseICalDate(untilMatch.split('=')[1])) : null;

  let currentDate = new Date(eventStart);
  let instanceCount = 0;
  const maxInstances = count || 100; // Limit to prevent infinite loops

  while (currentDate <= endDate && instanceCount < maxInstances) {
    if (currentDate >= startDate) {
      const instanceEnd = new Date(currentDate.getTime() + duration);
      
      instances.push({
        ...event,
        dtstart: currentDate.toISOString(),
        dtend: instanceEnd.toISOString(),
        scheduledDate: currentDate.toISOString(),
        originalStart: event.dtstart,
        uid: `${event.uid || 'recurring'}_${instanceCount}`,
      });
    }

    // Increment based on frequency
    switch (freq) {
      case 'DAILY':
        currentDate.setDate(currentDate.getDate() + interval);
        break;
      case 'WEEKLY':
        currentDate.setDate(currentDate.getDate() + (7 * interval));
        break;
      case 'MONTHLY':
        currentDate.setMonth(currentDate.getMonth() + interval);
        break;
      case 'YEARLY':
        currentDate.setFullYear(currentDate.getFullYear() + interval);
        break;
      default:
        break;
    }

    instanceCount++;

    if (until && currentDate > until) {
      break;
    }
    if (count && instanceCount >= count) {
      break;
    }
  }

  return instances;
};

export const parseICSContent = (icsContent: string, dateRange?: { start: Date; end: Date }): CalendarEvent[] => {
  // Validate content first
  const validation = validateICSContent(icsContent);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  const rawEvents: CalendarEvent[] = [];
  let currentEvent: Partial<CalendarEvent> = {};
  let currentRrule = '';
  let isEvent = false;
  
  const lines = icsContent.split(/\r\n|\n|\r/);
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    
    // Handle line continuations
    while (i + 1 < lines.length && (lines[i + 1].startsWith(' ') || lines[i + 1].startsWith('\t'))) {
      line += lines[i + 1].trim();
      i++;
    }

    if (line === 'BEGIN:VEVENT') {
      isEvent = true;
      currentEvent = {};
      currentRrule = '';
      continue;
    }
    
    if (line === 'END:VEVENT') {
      isEvent = false;
      if (currentEvent.summary && currentEvent.dtstart && currentEvent.dtend) {
        const event = currentEvent as CalendarEvent;
        event.scheduledDate = event.dtstart;
        rawEvents.push(event);
      }
      continue;
    }
    
    if (!isEvent) continue;

    const [key, ...values] = line.split(':');
    const value = values.join(':');
    const baseKey = key.split(';')[0];

    switch (baseKey) {
      case 'SUMMARY':
        currentEvent.summary = value.replace(/\\n/g, '\n').replace(/\\,/g, ',');
        break;
      case 'DESCRIPTION':
        currentEvent.description = value.replace(/\\n/g, '\n').replace(/\\,/g, ',');
        break;
      case 'DTSTART':
        currentEvent.dtstart = parseICalDate(value);
        break;
      case 'DTEND':
        currentEvent.dtend = parseICalDate(value);
        break;
      case 'LOCATION':
        currentEvent.location = value.replace(/\\,/g, ',');
        break;
      case 'RRULE':
        currentRrule = value;
        currentEvent.rrule = cleanRRuleString(value);
        currentEvent.isRecurring = true;
        break;
      case 'UID':
        currentEvent.uid = value;
        break;
      case 'CATEGORIES':
        currentEvent.categories = value.replace(/\\,/g, ',');
        break;
    }
  }
  
  // Expand recurring events if date range is provided
  const allEvents: CalendarEvent[] = [];
  const defaultStart = new Date();
  defaultStart.setDate(defaultStart.getDate() - 30); // 30 days ago
  const defaultEnd = new Date();
  defaultEnd.setDate(defaultEnd.getDate() + 365); // 1 year ahead
  
  const expandStart = dateRange?.start || defaultStart;
  const expandEnd = dateRange?.end || defaultEnd;
  
  for (const event of rawEvents) {
    const expandedEvents = expandRecurringEvents(event, expandStart, expandEnd);
    allEvents.push(...expandedEvents);
  }
  
  // Remove duplicates based on UID and start time
  const uniqueEvents = allEvents.filter((event, index, self) => {
    return index === self.findIndex(e => 
      e.uid === event.uid && 
      e.dtstart === event.dtstart &&
      e.summary === event.summary
    );
  });
  
  // Sort events by start time
  uniqueEvents.sort((a, b) => new Date(a.dtstart).getTime() - new Date(b.dtstart).getTime());
  
  return uniqueEvents;
};

export const convertEventsToTasks = (events: CalendarEvent[], options?: {
  minDurationMinutes?: number;
  includeCategories?: boolean;
  smartDuration?: boolean;
}): Omit<Task, 'id'>[] => {
  const {
    minDurationMinutes = 5,
    includeCategories = true,
    smartDuration = true
  } = options || {};

  // Filter out events that are 24 hours or longer
  const filteredEvents = events.filter(event => {
    const start = new Date(event.dtstart);
    const end = new Date(event.dtend);
    const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    return durationHours < 24;
  });

  // Convert remaining events to tasks
  return filteredEvents.map(event => {
    const start = new Date(event.dtstart);
    const end = new Date(event.dtend);
    let durationSeconds = Math.round((end.getTime() - start.getTime()) / 1000);
    
    // Smart duration adjustment for common meeting types
    if (smartDuration) {
      const summary = event.summary.toLowerCase();
      const originalMinutes = durationSeconds / 60;
      
      // Common meeting patterns and suggested durations
      if (summary.includes('standup') || summary.includes('daily')) {
        durationSeconds = Math.min(durationSeconds, 15 * 60); // Max 15 minutes
      } else if (summary.includes('1:1') || summary.includes('one-on-one')) {
        durationSeconds = Math.max(durationSeconds, 30 * 60); // Min 30 minutes
      } else if (summary.includes('interview')) {
        durationSeconds = Math.max(durationSeconds, 45 * 60); // Min 45 minutes
      } else if (summary.includes('lunch') || summary.includes('coffee')) {
        durationSeconds = Math.max(durationSeconds, 30 * 60); // Min 30 minutes
      }
    }
    
    const description = [
      event.description,
      event.location ? `📍 ${event.location}` : null,
      event.isRecurring ? '🔄 Recurring event' : null,
      event.categories && includeCategories ? `🏷️ ${event.categories}` : null
    ].filter(Boolean).join('\n\n');
    
    // Extract potential group label from categories or summary
    let groupLabel = '';
    if (event.categories && includeCategories) {
      groupLabel = event.categories.split(',')[0].trim();
    }
    
    return {
      name: event.summary,
      notes: description || '',
      duration: Math.max(durationSeconds, minDurationMinutes * 60), // Minimum duration
      isAnchored: false, // Default to false, will be set in the modal
      completed: false, // New tasks are not completed by default
      scheduledDate: event.dtstart, // Set the scheduled date from the event
      location: event.location,
      groupLabel: groupLabel || undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  });
};
