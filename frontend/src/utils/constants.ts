export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const STORAGE_KEYS = {
  token: 'calendar_pro_token',
  user: 'calendar_pro_user',
} as const;

export const NAV_ITEMS = [
  { label: 'Dashboard', href: '/app', icon: 'LayoutDashboard' },
  { label: 'Lịch tháng', href: '/app/calendar', icon: 'CalendarRange' },
  { label: 'Sự kiện', href: '/app/events', icon: 'ListTodo' },
] as const;