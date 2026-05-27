export type EventType = 'hoc' | 'deadline' | 'lam_them';
export type EventPriority = 'low' | 'medium' | 'high';

export interface DeadlineInfo {
  due_datetime: string;
  priority: EventPriority;
  is_completed: boolean;
  completed_at: string | null;
}

export interface EventItem {
  _id: string;
  user_id: string;
  title: string;
  description: string;
  type: EventType;
  tag_label: string;
  event_date: string;
  start_time: string;
  end_time: string;
  location: string;
  deadline: DeadlineInfo | null;
  created_at?: string;
  updated_at?: string;
}

export interface EventPayload {
  title: string;
  description: string;
  type: EventType;
  tag_label: string;
  event_date: string;
  start_time: string;
  end_time: string;
  location: string;
  priority?: EventPriority;
}

export interface MonthParams {
  year: number;
  month: number;
}

export interface WeekParams {
  week_start: string;
  week_end: string;
}