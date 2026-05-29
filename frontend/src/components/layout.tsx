import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Bell, CalendarRange, Clock3, LayoutDashboard, ListTodo, LogOut, Menu, Plus, UserCircle2, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/utils/cn';
import { NAV_ITEMS } from '@/utils/constants';
import { Badge, Button, Card } from './ui';
import { useAuth } from '@/context/auth-context';
import { getUpcomingNotifications } from '@/services/events';
import { formatTimeRange } from '@/utils/date';
import { getEventId } from '@/utils/event-id';
import type { EventItem } from '@/types/event';

const iconMap = {
  LayoutDashboard,
  CalendarRange,
  ListTodo,
  UserCircle2,
};

export function AppShell({ children, onCreateEvent }: { children: React.ReactNode; onCreateEvent: () => void }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, signOut } = useAuth();
  const location = useLocation();

  const activeSection = useMemo(() => {
    const match = [...NAV_ITEMS]
      .filter((item) => location.pathname === item.href || location.pathname.startsWith(`${item.href}/`))
      .sort((a, b) => b.href.length - a.href.length)[0];
    return match?.label || 'Dashboard';
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#f4f7fb_100%)] text-slate-950">
      <div className="mx-auto flex min-h-screen max-w-[1600px] gap-0 lg:gap-6 xl:gap-8">
        <aside className="hidden w-72 shrink-0 p-6 lg:block">
          <Sidebar onCreateEvent={onCreateEvent} onSignOut={signOut} userName={user?.full_name || 'Người dùng'} />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/75 px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 lg:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="flex-1">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Calendar Pro</p>
                <h1 className="mt-1 text-lg font-semibold text-slate-950">{activeSection}</h1>
              </div>
              <div className="hidden items-center gap-3 sm:flex">
                <NotificationBell />
                <Button onClick={onCreateEvent} className="px-4">
                  <Plus className="h-4 w-4" />
                  Thêm sự kiện
                </Button>
                <Link to="/app/profile" className="hidden items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 md:flex">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-sm font-semibold text-white">
                    {user?.full_name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{user?.full_name || 'User'}</p>
                    <p className="text-xs text-slate-500">{user?.email || '—'}</p>
                  </div>
                </Link>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 xl:px-10 transition-opacity duration-300">
            {children}
          </main>

          <footer className="border-t border-slate-200/80 px-4 py-4 text-center text-xs text-slate-500 sm:px-6 lg:px-8">
            Designed for fast planning, clean structure, and smooth demo presentation.
          </footer>
        </div>
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button type="button" className="absolute inset-0 bg-slate-950/50" onClick={() => setMobileOpen(false)} aria-label="Close menu" />
          <div className="absolute left-0 top-0 h-full w-[86vw] max-w-sm p-4">
            <Sidebar onCreateEvent={onCreateEvent} onSignOut={signOut} userName={user?.full_name || 'Người dùng'} mobile onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<EventItem[]>([]);

  useEffect(() => {
    let mounted = true;
    const storageKey = 'calendar_pro_notified_ids';

    const notify = async () => {
      try {
        const data = await getUpcomingNotifications(30);
        if (!mounted) return;
        setItems(data);

        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          const seen = new Set<string>(JSON.parse(localStorage.getItem(storageKey) || '[]'));
          const nextSeen = new Set(seen);

          data.forEach((event) => {
            const id = getEventId(event);
            if (nextSeen.has(id)) return;

            const timeLabel = format(new Date(event.event_date), 'dd/MM/yyyy') + ' • ' + formatTimeRange(event.start_time, event.end_time);
            new Notification('Sự kiện sắp diễn ra', {
              body: `${event.title} — ${timeLabel}`,
            });
            nextSeen.add(id);
          });

          localStorage.setItem(storageKey, JSON.stringify(Array.from(nextSeen).slice(-200)));
        }
      } catch {
        // silent
      }
    };

    void notify();
    const timer = window.setInterval(() => void notify(), 60_000);
    return () => {
      mounted = false;
      window.clearInterval(timer);
    };
  }, []);

  const requestPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission === 'default') {
      await Notification.requestPermission();
    }
    setOpen((current) => !current);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={requestPermission}
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:border-brand-200 hover:text-brand-600"
        aria-label="Thông báo"
      >
        <Bell className="h-5 w-5" />
        {items.length > 0 ? <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white" /> : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-14 z-40 w-96 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-slate-950">Thông báo 30 phút</p>
              <p className="text-xs text-slate-500">Các sự kiện sắp bắt đầu</p>
            </div>
            <Badge tone="brand">{items.length}</Badge>
          </div>
          <div className="max-h-96 overflow-y-auto p-3">
            {items.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                Không có sự kiện nào trong 30 phút tới.
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((event) => (
                  <div key={getEventId(event)} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 rounded-xl bg-slate-950 p-2 text-white">
                        <Clock3 className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-950">{event.title}</p>
                        <p className="mt-1 text-xs text-slate-500">{format(new Date(event.event_date), 'dd/MM/yyyy')} • {formatTimeRange(event.start_time, event.end_time)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Sidebar({
  onCreateEvent,
  onSignOut,
  userName,
  mobile = false,
  onClose,
}: {
  onCreateEvent: () => void;
  onSignOut: () => Promise<void> | void;
  userName: string;
  mobile?: boolean;
  onClose?: () => void;
}) {
  return (
    <Card className={cn('flex h-full flex-col overflow-hidden', mobile && 'shadow-2xl')}>
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Calendar Pro</p>
          <h2 className="mt-1 text-lg font-semibold text-slate-950">Planner Workspace</h2>
        </div>
        {mobile ? (
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900" aria-label="Close sidebar">
            <X className="h-5 w-5" />
          </button>
        ) : null}
      </div>

      <div className="space-y-2 px-4 py-4">
        {NAV_ITEMS.map((item) => {
          const Icon = iconMap[item.icon];
          return (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) => cn(
                'group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition',
                isActive ? 'bg-slate-950 text-white shadow-glow' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
              )}
              onClick={onClose}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>

      <div className="mt-auto border-t border-slate-100 p-4">
        <div className="rounded-3xl bg-slate-950 p-5 text-white">
          <p className="text-sm text-slate-300">Xin chào</p>
          <h3 className="mt-1 text-lg font-semibold">{userName}</h3>
          <p className="mt-2 text-sm text-slate-400">Quản lý lịch học, deadline và công việc cá nhân trong cùng một nơi.</p>
          <div className="mt-4 flex gap-2">
            <Button variant="secondary" className="flex-1 border-white/10 bg-white/10 text-white hover:bg-white/15" onClick={onCreateEvent}>
              <Plus className="h-4 w-4" />
              Mới
            </Button>
            <Button variant="ghost" className="border border-white/10 text-white hover:bg-white/10" onClick={onSignOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}