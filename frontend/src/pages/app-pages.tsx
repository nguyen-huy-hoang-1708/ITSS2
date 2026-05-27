import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { AlertCircle, Calendar, CheckCircle2, Clock3, Sparkles } from 'lucide-react';
import { AppShell } from '@/components/layout';
import { MonthCalendar, WeekAgenda } from '@/components/calendar-view';
import { EventFormModal } from '@/components/event-form-modal';
import { EventTable, EventToolbar } from '@/components/event-list';
import { Badge, Button, Card, CardBody, EmptyState, Input, Skeleton } from '@/components/ui';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/context/toast-context';
import { completeDeadline, createEvent, deleteEvent, getAllEvents, getEventById, getMonthEvents, getTodayEvents, getUpcomingDeadlines, getWeekEvents, updateEvent } from '@/services/events';
import type { EventItem, EventPayload } from '@/types/event';
import { formatDateShort, formatTimeRange, getMonthCursor, getPriorityLabel, getTypeLabel } from '@/utils/date';
import { useNavigateSafe } from './helpers';

export function DashboardPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [todayEvents, setTodayEvents] = useState<EventItem[]>([]);
  const [deadlines, setDeadlines] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { pushToast } = useToast();

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [all, today, upcoming] = await Promise.all([getAllEvents(), getTodayEvents(), getUpcomingDeadlines()]);
        setEvents(all);
        setTodayEvents(today);
        setDeadlines(upcoming);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Không thể tải dashboard');
        pushToast({ title: 'Không thể tải dữ liệu', description: err instanceof Error ? err.message : 'Vui lòng thử lại', variant: 'error' });
      } finally {
        setLoading(false);
      }
    })();
  }, [pushToast]);

  const stats = useMemo(() => {
    const deadlineCount = events.filter((event) => event.type === 'deadline').length;
    const completedCount = events.filter((event) => event.deadline?.is_completed).length;
    return [
      { label: 'Tổng sự kiện', value: events.length, icon: Calendar, tone: 'brand' as const },
      { label: 'Hôm nay', value: todayEvents.length, icon: Clock3, tone: 'success' as const },
      { label: 'Deadline', value: deadlineCount, icon: AlertCircle, tone: 'warning' as const },
      { label: 'Hoàn thành', value: completedCount, icon: CheckCircle2, tone: 'purple' as const },
    ];
  }, [events, todayEvents.length]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return <ErrorPanel title="Không thể tải dashboard" description={error} onRetry={() => window.location.reload()} />;
  }

  return (
    <AppShell onCreateEvent={() => navigate('/app/events')}>
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="overflow-hidden">
                <CardBody>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm text-slate-500">{stat.label}</p>
                      <p className="mt-2 text-3xl font-semibold text-slate-950">{stat.value}</p>
                    </div>
                    <div className={`rounded-2xl p-3 ${stat.tone === 'brand' ? 'bg-brand-50 text-brand-600' : stat.tone === 'success' ? 'bg-emerald-50 text-emerald-600' : stat.tone === 'warning' ? 'bg-amber-50 text-amber-600' : 'bg-violet-50 text-violet-600'}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <Card>
            <CardBody>
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-500">Hôm nay</p>
                  <h2 className="text-2xl font-semibold text-slate-950">Lịch trình nổi bật</h2>
                </div>
                <Button variant="secondary" onClick={() => navigate('/app/calendar')}>
                  Xem lịch
                </Button>
              </div>

              {todayEvents.length === 0 ? (
                <EmptyState title="Không có sự kiện trong hôm nay" description="Hôm nay khá thoáng, hãy tạo thêm sự kiện nếu cần." />
              ) : (
                <div className="space-y-3">
                  {todayEvents.map((event) => (
                    <div key={event._id} className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-slate-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-slate-950">{event.title}</h3>
                          <Badge tone={event.type === 'deadline' ? 'warning' : event.type === 'hoc' ? 'brand' : 'purple'}>{getTypeLabel(event.type)}</Badge>
                        </div>
                        <p className="mt-1 text-sm text-slate-500">{event.description || 'Không có mô tả'}</p>
                        <p className="mt-2 text-sm text-slate-600">{formatTimeRange(event.start_time, event.end_time)} • {event.location || '—'}</p>
                      </div>
                      <Button variant="secondary" onClick={() => navigate(`/app/events/${event._id}`)}>
                        Chi tiết
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-500">Deadline</p>
                  <h2 className="text-2xl font-semibold text-slate-950">Sắp đến hạn</h2>
                </div>
                <Sparkles className="h-5 w-5 text-brand-500" />
              </div>

              {deadlines.length === 0 ? (
                <EmptyState title="Không có deadline pending" description="Mọi deadline hiện tại đều đã được xử lý." />
              ) : (
                <div className="space-y-3">
                  {deadlines.slice(0, 5).map((event) => (
                    <div key={event._id} className="rounded-3xl border border-slate-200 bg-white p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-950">{event.title}</p>
                          <p className="mt-1 text-sm text-slate-500">{formatDateShort(event.event_date)} • {formatTimeRange(event.start_time, event.end_time)}</p>
                        </div>
                        <Badge tone="warning">{getPriorityLabel(event.deadline?.priority)}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

export function EventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | EventItem['type']>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const navigate = useNavigate();
  const { pushToast } = useToast();

  const loadEvents = async () => {
    try {
      setLoading(true);
      setEvents(await getAllEvents());
    } catch (err) {
      pushToast({ title: 'Tải danh sách thất bại', description: err instanceof Error ? err.message : 'Vui lòng thử lại', variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadEvents();
  }, []);

  const filteredEvents = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return events.filter((event) => {
      const matchesFilter = filter === 'all' ? true : event.type === filter;
      const matchesSearch = !keyword
        ? true
        : [event.title, event.description, event.tag_label, event.location]
            .filter(Boolean)
            .some((value) => value.toLowerCase().includes(keyword));
      return matchesFilter && matchesSearch;
    });
  }, [events, filter, search]);

  const handleSubmit = async (payload: EventPayload) => {
    if (editingEvent) {
      await updateEvent(editingEvent._id, payload);
      pushToast({ title: 'Cập nhật thành công', description: editingEvent.title, variant: 'success' });
    } else {
      await createEvent(payload);
      pushToast({ title: 'Tạo sự kiện thành công', description: payload.title, variant: 'success' });
    }
    setEditingEvent(null);
    await loadEvents();
  };

  const handleDelete = async (event: EventItem) => {
    if (!window.confirm(`Xóa sự kiện "${event.title}"?`)) return;
    await deleteEvent(event._id);
    pushToast({ title: 'Đã xoá sự kiện', description: event.title, variant: 'success' });
    await loadEvents();
  };

  const handleComplete = async (event: EventItem) => {
    await completeDeadline(event._id);
    pushToast({ title: 'Đã đánh dấu hoàn thành', description: event.title, variant: 'success' });
    await loadEvents();
  };

  return (
    <AppShell onCreateEvent={() => setFormOpen(true)}>
      <div className="space-y-6">
        <EventToolbar search={search} setSearch={setSearch} filter={filter} setFilter={setFilter} onCreate={() => setFormOpen(true)} />
        {loading ? <EventsSkeleton /> : <EventTable events={filteredEvents} onEdit={(event) => setEditingEvent(event)} onDelete={handleDelete} onComplete={handleComplete} onOpen={(event) => navigate(`/app/events/${event._id}`)} />}
      </div>

      <EventFormModal
        open={formOpen || Boolean(editingEvent)}
        mode={editingEvent ? 'edit' : 'create'}
        initialValue={editingEvent}
        onClose={() => {
          setFormOpen(false);
          setEditingEvent(null);
        }}
        onSubmit={handleSubmit}
      />
    </AppShell>
  );
}

export function CalendarPage() {
  const [cursor, setCursor] = useState(new Date());
  const [monthEvents, setMonthEvents] = useState<EventItem[]>([]);
  const [weekEvents, setWeekEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekCursor, setWeekCursor] = useState(new Date());
  const navigate = useNavigate();
  const { pushToast } = useToast();

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const year = cursor.getFullYear();
        const month = cursor.getMonth() + 1;
        const weekStart = format(buildWeekStart(weekCursor), 'yyyy-MM-dd');
        const weekEnd = format(buildWeekEnd(weekCursor), 'yyyy-MM-dd');
        const [monthData, weekData] = await Promise.all([getMonthEvents({ year, month }), getWeekEvents(weekStart, weekEnd)]);
        setMonthEvents(monthData);
        setWeekEvents(weekData);
      } catch (err) {
        pushToast({ title: 'Không thể tải lịch', description: err instanceof Error ? err.message : 'Vui lòng thử lại', variant: 'error' });
      } finally {
        setLoading(false);
      }
    })();
  }, [cursor, pushToast, weekCursor]);

  if (loading) {
    return <CalendarSkeleton />;
  }

  return (
    <AppShell onCreateEvent={() => navigate('/app/events')}>
      <div className="space-y-6">
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <MonthCalendar
            cursor={cursor}
            setCursor={setCursor}
            events={monthEvents}
            onSelectDay={(day) => setWeekCursor(day)}
          />
          <WeekAgenda cursor={weekCursor} events={weekEvents} />
        </div>

        <Card>
          <CardBody>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-slate-500">Selected day</p>
                <h3 className="text-xl font-semibold text-slate-950">{format(weekCursor, 'EEEE, dd/MM/yyyy')}</h3>
              </div>
              <Button variant="secondary" onClick={() => navigate('/app/events')}>
                Mở danh sách
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </AppShell>
  );
}

export function EventDetailPage() {
  const params = useParams();
  const navigate = useNavigate();
  const { pushToast } = useToast();
  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  const load = async () => {
    if (!params.id) return;
    try {
      setLoading(true);
      setEvent(await getEventById(params.id));
    } catch (err) {
      pushToast({ title: 'Không tìm thấy sự kiện', description: err instanceof Error ? err.message : 'Vui lòng thử lại', variant: 'error' });
      navigate('/app/events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [params.id]);

  const handleSave = async (payload: EventPayload) => {
    if (!event) return;
    const updated = await updateEvent(event._id, payload);
    setEvent(updated);
    setEditing(false);
    pushToast({ title: 'Cập nhật thành công', description: updated.title, variant: 'success' });
  };

  const handleComplete = async () => {
    if (!event) return;
    const updated = await completeDeadline(event._id);
    setEvent(updated);
    pushToast({ title: 'Đánh dấu hoàn thành', description: updated.title, variant: 'success' });
  };

  const handleDelete = async () => {
    if (!event) return;
    if (!window.confirm(`Xóa sự kiện "${event.title}"?`)) return;
    await deleteEvent(event._id);
    pushToast({ title: 'Đã xoá sự kiện', description: event.title, variant: 'success' });
    navigate('/app/events');
  };

  return (
    <AppShell onCreateEvent={() => navigate('/app/events')}>
      {loading || !event ? <DetailSkeleton /> : (
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <Card>
            <CardBody className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <Badge tone={event.type === 'deadline' ? 'warning' : event.type === 'hoc' ? 'brand' : 'purple'}>{getTypeLabel(event.type)}</Badge>
                  <h1 className="mt-3 text-3xl font-semibold text-slate-950">{event.title}</h1>
                  <p className="mt-3 text-slate-600">{event.description || 'Không có mô tả'}</p>
                </div>
                <Button variant="secondary" onClick={() => setEditing(true)}>
                  Chỉnh sửa
                </Button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <InfoBox label="Ngày" value={format(new Date(event.event_date), 'dd/MM/yyyy')} />
                <InfoBox label="Giờ" value={formatTimeRange(event.start_time, event.end_time)} />
                <InfoBox label="Địa điểm" value={event.location || '—'} />
                <InfoBox label="Tag" value={event.tag_label || '—'} />
              </div>

              {event.deadline ? (
                <Card className="border-slate-200 bg-slate-50/80">
                  <CardBody>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-slate-500">Deadline info</p>
                        <p className="mt-1 text-lg font-semibold text-slate-950">Priority: {getPriorityLabel(event.deadline.priority)}</p>
                        <p className="mt-1 text-sm text-slate-500">Trạng thái: {event.deadline.is_completed ? 'Hoàn thành' : 'Đang chờ'}</p>
                      </div>
                      <div className="flex gap-2">
                        {!event.deadline.is_completed ? (
                          <Button onClick={handleComplete}>
                            <CheckCircle2 className="h-4 w-4" />
                            Hoàn thành
                          </Button>
                        ) : null}
                        <Button variant="secondary" onClick={() => navigate('/app/calendar')}>
                          <Calendar className="h-4 w-4" />
                          Lịch
                        </Button>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ) : null}

              <div className="flex flex-wrap gap-3">
                <Button variant="danger" onClick={handleDelete}>Xoá</Button>
                <Button variant="secondary" onClick={() => navigate('/app/events')}>Quay lại</Button>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="space-y-4">
              <p className="text-sm font-medium text-slate-500">Preview</p>
              <div className="rounded-3xl bg-gradient-to-br from-slate-950 to-slate-800 p-6 text-white shadow-2xl">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{format(new Date(event.event_date), 'EEE, dd MMM')}</p>
                <h2 className="mt-3 text-2xl font-semibold">{event.title}</h2>
                <p className="mt-3 text-sm text-slate-300">{event.description || 'Không có mô tả'}</p>
                <div className="mt-5 space-y-2 text-sm text-slate-300">
                  <p>{formatTimeRange(event.start_time, event.end_time)}</p>
                  <p>{event.location || '—'}</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      <EventFormModal
        open={editing && Boolean(event)}
        mode="edit"
        initialValue={event}
        onClose={() => setEditing(false)}
        onSubmit={handleSave}
      />
    </AppShell>
  );
}

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
      <div className="max-w-xl text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-slate-400">404</p>
        <h1 className="mt-4 text-4xl font-semibold">Không tìm thấy trang</h1>
        <p className="mt-3 text-slate-300">Đường dẫn này không tồn tại hoặc đã bị chuyển hướng.</p>
        <a href="/app" className="mt-8 inline-flex rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100">Về dashboard</a>
      </div>
    </div>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-32 rounded-3xl" />)}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <Skeleton className="h-[520px] rounded-3xl" />
        <Skeleton className="h-[520px] rounded-3xl" />
      </div>
    </div>
  );
}

function EventsSkeleton() {
  return <Skeleton className="h-[560px] rounded-3xl" />;
}

function CalendarSkeleton() {
  return <Skeleton className="h-[720px] rounded-3xl" />;
}

function DetailSkeleton() {
  return <Skeleton className="h-[700px] rounded-3xl" />;
}

function ErrorPanel({ title, description, onRetry }: { title: string; description: string; onRetry: () => void }) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <Card className="max-w-xl">
        <CardBody className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-2xl font-semibold text-slate-950">{title}</h2>
          <p className="mt-2 text-slate-500">{description}</p>
          <Button className="mt-6" onClick={onRetry}>Tải lại</Button>
        </CardBody>
      </Card>
    </div>
  );
}

function buildWeekStart(date: Date) {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = copy.getDate() - day + (day === 0 ? -6 : 1);
  copy.setDate(diff);
  return copy;
}

function buildWeekEnd(date: Date) {
  const start = buildWeekStart(new Date(date));
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return end;
}