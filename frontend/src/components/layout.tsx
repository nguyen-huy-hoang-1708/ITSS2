import { useMemo, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Bell, CalendarRange, LayoutDashboard, ListTodo, LogOut, Menu, Plus, X } from 'lucide-react';
import { cn } from '@/utils/cn';
import { NAV_ITEMS } from '@/utils/constants';
import { Button, Card } from './ui';
import { useAuth } from '@/context/auth-context';

const iconMap = {
  LayoutDashboard,
  CalendarRange,
  ListTodo,
};

export function AppShell({ children, onCreateEvent }: { children: React.ReactNode; onCreateEvent: () => void }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, signOut } = useAuth();
  const location = useLocation();

  const activeSection = useMemo(() => {
    const match = NAV_ITEMS.find((item) => location.pathname.startsWith(item.href));
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
                <button className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:border-brand-200 hover:text-brand-600">
                  <Bell className="h-5 w-5" />
                </button>
                <Button onClick={onCreateEvent} className="px-4">
                  <Plus className="h-4 w-4" />
                  Thêm sự kiện
                </Button>
                <div className="hidden items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 md:flex">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-sm font-semibold text-white">
                    {user?.full_name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{user?.full_name || 'User'}</p>
                    <p className="text-xs text-slate-500">{user?.email || '—'}</p>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 xl:px-10">
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