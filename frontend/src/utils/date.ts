import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  parseISO,
  startOfMonth,
  startOfWeek,
  isSameDay,
  isToday,
  isWithinInterval,
} from 'date-fns';
import type { EventItem } from '@/types/event';

export function formatDateLabel(input: string | Date) {
  return format(typeof input === 'string' ? parseISO(input) : input, 'dd MMM yyyy');
}

export function formatDateShort(input: string | Date) {
  return format(typeof input === 'string' ? parseISO(input) : input, 'EEE, dd/MM');
}

export function formatTimeRange(startTime: string, endTime: string) {
  return `${startTime.slice(0, 5)} - ${endTime.slice(0, 5)}`;
}

export function getMonthCursor(date: Date, direction: 'prev' | 'next') {
  return direction === 'prev' ? addMonths(date, -1) : addMonths(date, 1);
}

export function buildMonthGrid(date: Date) {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  return eachDayOfInterval({ start: gridStart, end: gridEnd });
}

export function buildWeekRange(date: Date) {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, index) => addDays(start, index));
  return days;
}

export function groupEventsByDate(events: EventItem[]) {
  return events.reduce<Record<string, EventItem[]>>((acc, event) => {
    if (!acc[event.event_date]) acc[event.event_date] = [];
    acc[event.event_date].push(event);
    return acc;
  }, {});
}

export function isEventToday(event: EventItem) {
  return isToday(parseISO(event.event_date));
}

export function isEventInRange(event: EventItem, start: Date, end: Date) {
  return isWithinInterval(parseISO(event.event_date), { start, end });
}

export function isSameCalendarDay(a: Date, b: Date) {
  return isSameDay(a, b);
}

export function getTypeLabel(type: EventItem['type']) {
  switch (type) {
    case 'hoc':
      return 'Học tập';
    case 'deadline':
      return 'Deadline';
    case 'lam_them':
      return 'Làm thêm';
    default:
      return type;
  }
}

export function getPriorityLabel(priority?: string | null) {
  switch (priority) {
    case 'high':
      return 'Cao';
    case 'medium':
      return 'Trung bình';
    case 'low':
      return 'Thấp';
    default:
      return '—';
  }
}