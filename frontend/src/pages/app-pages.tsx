import { useEffect, useMemo, useState, useCallback, memo, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { AlertCircle, Calendar, CheckCircle2, Clock3, Sparkles } from 'lucide-react';
import { AppShell } from '@/components/layout';
import { MonthCalendar, WeekAgenda } from '@/components/calendar-view';
import { DayEventsModal } from '@/components/day-events-modal';
import { EventFormModal } from '@/components/event-form-modal';
import { EventTable, EventToolbar, type EventFilterMode } from '@/components/event-list';
import { Badge, Button, Card, CardBody, EmptyState, Input, PageShell, Skeleton } from '@/components/ui';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/context/toast-context';
import { completeDeadline, createEvent, deleteEvent, getAllEvents, getEventById, getMonthEvents, getTodayEvents, getUpcomingDeadlines, getWeekEvents, toggleEventCompletion, updateEvent } from '@/services/events';
import type { EventItem, EventPayload } from '@/types/event';
import { formatDateShort, formatTimeRange, getDeadlineCountdownLabel, getFreeTimeSuggestions, getMonthCursor, getPriorityLabel, getRecurrenceLabel, getTimeStatistics, getTypeLabel, isEventCompleted, isEventInCurrentMonth, isEventInCurrentWeek, isEventToday } from '@/utils/date';
import { exportEventsToExcel } from '@/utils/export';
import { getEventId } from '@/utils/event-id';
import { useNavigateSafe } from './helpers';

export function DashboardPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [todayEvents, setTodayEvents] = useState<EventItem[]>([]);
  const [deadlines, setDeadlines] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { pushToast } = useToast();
  const { user } = useAuth();

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
    const completedCount = events.filter((event) => event.is_completed).length;
    const timeStats = getTimeStatistics(events);
    return [
      { label: 'Tổng sự kiện', value: events.length, icon: Calendar, tone: 'brand' as const },
      { label: 'Hôm nay', value: todayEvents.length, icon: Clock3, tone: 'success' as const },
      { label: 'Deadline', value: deadlineCount, icon: AlertCircle, tone: 'warning' as const },
      { label: 'Hoàn thành', value: completedCount, icon: CheckCircle2, tone: 'purple' as const },
      { label: 'Giờ học', value: `${timeStats.studyHours}h`, icon: Calendar, tone: 'brand' as const },
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
      <div className="space-y-6 animate-fadeIn">
        <Card className="overflow-hidden border-brand-100 bg-[linear-gradient(135deg,rgba(15,23,42,0.98)_0%,rgba(30,41,59,0.94)_45%,rgba(14,165,233,0.84)_100%)] text-white shadow-2xl">
          <CardBody className="relative overflow-hidden">
            <div className="pointer-events-none absolute inset-0 opacity-20">
              <div className="absolute -right-10 top-0 h-44 w-44 rounded-full bg-white/20 blur-3xl" />
              <div className="absolute left-10 bottom-0 h-36 w-36 rounded-full bg-brand-300/30 blur-3xl" />
            </div>
            <div className="relative grid gap-6 lg:grid-cols-[1.35fr_0.65fr] lg:items-end">
              <div className="space-y-4">
                <Badge tone="brand">Tổng quan hôm nay</Badge>
                <div>
                  <p className="text-sm text-slate-300">Xin chào, {user?.full_name || 'bạn'}!</p>
                  <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Lịch trình của bạn đang rất rõ ràng.</h1>
                  <p className="mt-3 max-w-2xl text-sm text-slate-300 sm:text-base">Theo dõi deadline, thời gian rảnh, sự kiện lặp lại và các điểm nhấn trong ngày bằng giao diện gọn, sáng, dễ demo.</p>
                </div>
                <div className="flex flex-wrap gap-3 text-sm">
                  <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
                    <p className="text-slate-300">Hôm nay</p>
                    <p className="mt-1 text-lg font-semibold">{todayEvents.length} sự kiện</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
                    <p className="text-slate-300">Deadline gấp</p>
                    <p className="mt-1 text-lg font-semibold">{todayEvents.filter((event) => event.type === 'deadline' && !event.deadline?.is_completed).length} việc</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
                    <p className="text-slate-300">Mục tiêu tiếp theo</p>
                    <p className="mt-1 text-lg font-semibold">{deadlines[0] ? getDeadlineCountdownLabel(deadlines[0].deadline?.due_datetime) : 'Không có'}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-[28px] border border-white/10 bg-white/10 p-5 backdrop-blur-xl">
                <p className="text-sm text-slate-300">Phiên làm việc</p>
                <div className="mt-3 space-y-3">
                  {stats.slice(0, 4).map((stat) => {
                    const Icon = stat.icon;
                    return (
                      <div key={stat.label} className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3">
                        <div>
                          <p className="text-sm text-slate-300">{stat.label}</p>
                          <p className="text-xl font-semibold">{stat.value}</p>
                        </div>
                        <Icon className="h-5 w-5 text-sky-200" />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

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
                    <div key={getEventId(event)} className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-slate-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-slate-950">{event.title}</h3>
                          <Badge tone={event.type === 'deadline' ? 'warning' : event.type === 'hoc' ? 'brand' : 'purple'}>{getTypeLabel(event.type)}</Badge>
                        </div>
                        <p className="mt-1 text-sm text-slate-500">{event.description || 'Không có mô tả'}</p>
                        <p className="mt-2 text-sm text-slate-600">{formatTimeRange(event.start_time, event.end_time)} • {event.location || '—'}</p>
                      </div>
                      <Button variant="secondary" onClick={() => navigate(`/app/events/${getEventId(event)}`)}>
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
                    <div key={getEventId(event)} className="rounded-3xl border border-slate-200 bg-white p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-950">{event.title}</p>
                          <p className="mt-1 text-sm text-slate-500">{formatDateShort(event.event_date)} • {formatTimeRange(event.start_time, event.end_time)}</p>
                          <p className="mt-1 text-sm font-medium text-rose-600">{getDeadlineCountdownLabel(event.deadline?.due_datetime)}</p>
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

        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <Card>
            <CardBody className="space-y-4">
              <div>
                <p className="text-sm font-medium text-slate-500">Today Focus</p>
                <h2 className="text-2xl font-semibold text-slate-950">Mục tiêu hôm nay</h2>
              </div>
              {todayEvents.length === 0 ? (
                <EmptyState title="Chưa có mục tiêu hôm nay" description="Hãy tạo lịch để hệ thống đề xuất ưu tiên." />
              ) : (
                <div className="space-y-3">
                  {todayEvents.slice(0, 4).map((event) => (
                    <div key={getEventId(event)} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-950">{event.title}</p>
                          <p className="mt-1 text-sm text-slate-500">{formatTimeRange(event.start_time, event.end_time)}</p>
                        </div>
                        <Badge tone={event.type === 'deadline' ? 'warning' : event.type === 'hoc' ? 'brand' : 'purple'}>{getTypeLabel(event.type)}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardBody className="space-y-4">
              <div>
                <p className="text-sm font-medium text-slate-500">Gợi ý thời gian rảnh</p>
                <h2 className="text-2xl font-semibold text-slate-950">Khoảng trống trong ngày</h2>
              </div>
              {getFreeTimeSuggestions(todayEvents).length === 0 ? (
                <EmptyState title="Không có khoảng trống đủ lớn" description="Lịch hôm nay khá kín hoặc chỉ còn các khoảng rất ngắn." />
              ) : (
                <div className="space-y-3">
                  {getFreeTimeSuggestions(todayEvents).map((slot) => (
                    <div key={`${slot.start}-${slot.end}`} className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-3">
                      <p className="font-semibold text-slate-950">{slot.start} - {slot.end}</p>
                      <p className="text-sm text-slate-500">{slot.label}</p>
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
  const [filter, setFilter] = useState<EventFilterMode>('all');
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
      const matchesFilter = (() => {
        switch (filter) {
          case 'all':
            return true;
          case 'hoc':
          case 'deadline':
          case 'lam_them':
            return event.type === filter;
          case 'today':
            return isEventToday(event);
          case 'week':
            return isEventInCurrentWeek(event);
          case 'month':
            return isEventInCurrentMonth(event);
          case 'completed':
            return isEventCompleted(event);
          default:
            return true;
        }
      })();
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
      await updateEvent(getEventId(editingEvent), payload);
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
    await deleteEvent(getEventId(event));
    pushToast({ title: 'Đã xoá sự kiện', description: event.title, variant: 'success' });
    await loadEvents();
  };

  const handleComplete = async (event: EventItem) => {
    await toggleEventCompletion(getEventId(event));
    pushToast({ title: 'Đã cập nhật trạng thái', description: event.title, variant: 'success' });
    await loadEvents();
  };

  return (
    <AppShell onCreateEvent={() => setFormOpen(true)}>
      <div className="space-y-6 animate-fadeIn">
        <EventToolbar
          search={search}
          setSearch={setSearch}
          filter={filter}
          setFilter={setFilter}
          onCreate={() => setFormOpen(true)}
          onExportExcel={() => exportEventsToExcel(filteredEvents)}
        />
        {loading ? <EventsSkeleton /> : <EventTable events={filteredEvents} onEdit={(event) => setEditingEvent(event)} onDelete={handleDelete} onComplete={handleComplete} onOpen={(event) => navigate(`/app/events/${getEventId(event)}`)} />}
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
  const [typeFilter, setTypeFilter] = useState<'all' | 'hoc' | 'deadline' | 'lam_them'>('all');
  const [dayEventsModalOpen, setDayEventsModalOpen] = useState(false);
  const [selectedDayEvents, setSelectedDayEvents] = useState<EventItem[]>([]);
  const [selectedDay, setSelectedDay] = useState(new Date());
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

  const filteredMonthEvents = useMemo(() => {
    if (typeFilter === 'all') return monthEvents;
    return monthEvents.filter((e) => e.type === typeFilter);
  }, [monthEvents, typeFilter]);

  const filteredWeekEvents = useMemo(() => {
    if (typeFilter === 'all') return weekEvents;
    return weekEvents.filter((e) => e.type === typeFilter);
  }, [weekEvents, typeFilter]);

  const handleEventClick = useCallback((event: EventItem) => {
    const dayDate = new Date(event.event_date);
    setSelectedDay(dayDate);
    const dayEvents = (typeFilter === 'all' ? monthEvents : monthEvents.filter((e) => e.type === typeFilter))
      .filter((e) => e.event_date === event.event_date);
    setSelectedDayEvents(dayEvents);
    setDayEventsModalOpen(true);
  }, [typeFilter, monthEvents]);

  if (loading) {
    return <CalendarSkeleton />;
  }

  return (
    <AppShell onCreateEvent={() => navigate('/app/events')}>
      <div className="space-y-6 animate-fadeIn">
        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant={typeFilter === 'all' ? 'primary' : 'secondary'}
            onClick={() => setTypeFilter('all')}
            className="flex items-center gap-2"
          >
            Tất cả ({monthEvents.length})
          </Button>
          <Button
            variant={typeFilter === 'hoc' ? 'primary' : 'secondary'}
            onClick={() => setTypeFilter('hoc')}
            className="flex items-center gap-2"
          >
            <div className="h-2 w-2 rounded-full bg-brand-500" />
            Lịch học ({monthEvents.filter((e) => e.type === 'hoc').length})
          </Button>
          <Button
            variant={typeFilter === 'deadline' ? 'primary' : 'secondary'}
            onClick={() => setTypeFilter('deadline')}
            className="flex items-center gap-2"
          >
            <div className="h-2 w-2 rounded-full bg-amber-500" />
            Deadline ({monthEvents.filter((e) => e.type === 'deadline').length})
          </Button>
          <Button
            variant={typeFilter === 'lam_them' ? 'primary' : 'secondary'}
            onClick={() => setTypeFilter('lam_them')}
            className="flex items-center gap-2"
          >
            <div className="h-2 w-2 rounded-full bg-violet-500" />
            Làm thêm ({monthEvents.filter((e) => e.type === 'lam_them').length})
          </Button>
        </div>

        {/* Calendar Section */}
        <div className="space-y-6">
          {/* Month Calendar - Full Width */}
          <MonthCalendar
            cursor={cursor}
            setCursor={setCursor}
            events={filteredMonthEvents}
            onSelectDay={(day) => setWeekCursor(day)}
            onEventClick={handleEventClick}
          />

          {/* Week Agenda - Full Width */}
          <WeekAgenda cursor={weekCursor} events={filteredWeekEvents} onEventClick={handleEventClick} />

          {/* Selected Day Info Card */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="md:col-span-2 lg:col-span-1">
              <CardBody className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">Ngày được chọn</p>
                  <h3 className="mt-2 text-lg font-semibold text-slate-950">{format(weekCursor, 'EEEE')}</h3>
                  <h4 className="text-3xl font-bold text-brand-600">{format(weekCursor, 'dd/MM/yyyy')}</h4>
                </div>
                <Button 
                  variant="secondary" 
                  onClick={() => navigate('/app/events')}
                  className="w-full"
                >
                  Xem danh sách
                </Button>
              </CardBody>
            </Card>

            {/* Quick Stats */}
            <Card className="md:col-span-2 lg:col-span-2">
              <CardBody className="space-y-4">
                <p className="text-sm font-medium text-slate-500">Thống kê ngày</p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-2xl bg-brand-50 p-3">
                    <p className="text-xs text-slate-600">Tổng</p>
                    <p className="mt-2 text-2xl font-bold text-brand-600">{filteredWeekEvents.filter(e => e.event_date === format(weekCursor, 'yyyy-MM-dd')).length}</p>
                  </div>
                  <div className="rounded-2xl bg-amber-50 p-3">
                    <p className="text-xs text-slate-600">Deadline</p>
                    <p className="mt-2 text-2xl font-bold text-amber-600">{filteredWeekEvents.filter(e => e.type === 'deadline' && e.event_date === format(weekCursor, 'yyyy-MM-dd')).length}</p>
                  </div>
                  <div className="rounded-2xl bg-violet-50 p-3">
                    <p className="text-xs text-slate-600">Làm thêm</p>
                    <p className="mt-2 text-2xl font-bold text-violet-600">{filteredWeekEvents.filter(e => e.type === 'lam_them' && e.event_date === format(weekCursor, 'yyyy-MM-dd')).length}</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>

        <DayEventsModal
          open={dayEventsModalOpen}
          date={selectedDay}
          events={selectedDayEvents}
          onClose={() => setDayEventsModalOpen(false)}
          onEventClick={(event) => {
            setDayEventsModalOpen(false);
            // Small delay to let modal animation complete smoothly
            setTimeout(() => {
              navigate(`/app/events/${event.id}`);
            }, 150);
          }}
        />
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
    const updated = await updateEvent(getEventId(event), payload);
    setEvent(updated);
    setEditing(false);
    pushToast({ title: 'Cập nhật thành công', description: updated.title, variant: 'success' });
  };

  const handleComplete = async () => {
    if (!event) return;
    const updated = await toggleEventCompletion(getEventId(event));
    setEvent(updated);
    pushToast({ title: 'Đã cập nhật trạng thái', description: updated.title, variant: 'success' });
  };

  const handleDelete = async () => {
    if (!event) return;
    if (!window.confirm(`Xóa sự kiện "${event.title}"?`)) return;
    await deleteEvent(getEventId(event));
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
                <InfoBox label="Lặp lại" value={getRecurrenceLabel(event.recurrence_frequency, event.recurrence_interval || 1)} />
              </div>

              {event.is_completed ? (
                <div className="rounded-3xl border-2 border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-sm font-semibold text-emerald-700">Đã hoàn thành</p>
                  {event.completed_at && (
                    <p className="mt-1 text-xs text-emerald-600">
                      {format(new Date(event.completed_at), 'HH:mm - dd/MM/yyyy')}
                    </p>
                  )}
                </div>
              ) : null}

              {event.deadline ? (
                <Card className="border-slate-200 bg-slate-50/80">
                  <CardBody>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-slate-500">Deadline info</p>
                        <p className="mt-1 text-lg font-semibold text-slate-950">Priority: {getPriorityLabel(event.deadline.priority)}</p>
                        <p className="mt-1 text-sm text-slate-500">Trạng thái: {event.is_completed ? 'Hoàn thành' : 'Đang chờ'}</p>
                      </div>
                      <div className="flex gap-2">
                        {!event.is_completed ? (
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

export function ProfilePage() {
  const { user, updateProfile, changePassword } = useAuth();
  const { pushToast } = useToast();
  const navigate = useNavigate();
  const [profileForm, setProfileForm] = useState({ full_name: '', email: '' });
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    setProfileForm({
      full_name: user?.full_name || '',
      email: user?.email || '',
    });
  }, [user]);

  const handleProfileSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setSavingProfile(true);
      await updateProfile({ full_name: profileForm.full_name.trim(), email: profileForm.email.trim() });
      pushToast({ title: 'Đã cập nhật hồ sơ', description: 'Thông tin cá nhân đã được lưu.', variant: 'success' });
    } catch (error) {
      pushToast({ title: 'Cập nhật thất bại', description: error instanceof Error ? error.message : 'Vui lòng thử lại', variant: 'error' });
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      pushToast({ title: 'Mật khẩu không khớp', description: 'Vui lòng kiểm tra lại mật khẩu mới.', variant: 'error' });
      return;
    }

    try {
      setSavingPassword(true);
      await changePassword({ current_password: passwordForm.current_password, new_password: passwordForm.new_password });
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
      pushToast({ title: 'Đã đổi mật khẩu', description: 'Mật khẩu mới đã được lưu.', variant: 'success' });
    } catch (error) {
      pushToast({ title: 'Đổi mật khẩu thất bại', description: error instanceof Error ? error.message : 'Vui lòng thử lại', variant: 'error' });
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <AppShell onCreateEvent={() => navigate('/app/events')}>
      <PageShell
        title="Hồ sơ cá nhân"
        description="Cập nhật thông tin tài khoản và thay đổi mật khẩu tại đây."
      >
        <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
          <Card>
            <CardBody className="space-y-6">
              <div>
                <p className="text-sm font-medium text-slate-500">Thông tin cá nhân</p>
                <h2 className="text-2xl font-semibold text-slate-950">Chỉnh sửa hồ sơ</h2>
              </div>

              <form className="space-y-4" onSubmit={handleProfileSubmit}>
                <Field label="Họ và tên">
                  <Input value={profileForm.full_name} onChange={(e) => setProfileForm((current) => ({ ...current, full_name: e.target.value }))} />
                </Field>
                <Field label="Email">
                  <Input type="email" value={profileForm.email} onChange={(e) => setProfileForm((current) => ({ ...current, email: e.target.value }))} />
                </Field>

                <Button type="submit" isLoading={savingProfile}>Lưu thay đổi</Button>
              </form>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="space-y-6">
              <div>
                <p className="text-sm font-medium text-slate-500">Bảo mật</p>
                <h2 className="text-2xl font-semibold text-slate-950">Đổi mật khẩu</h2>
              </div>

              <form className="space-y-4" onSubmit={handlePasswordSubmit}>
                <Field label="Mật khẩu hiện tại">
                  <Input type="password" value={passwordForm.current_password} onChange={(e) => setPasswordForm((current) => ({ ...current, current_password: e.target.value }))} />
                </Field>
                <Field label="Mật khẩu mới">
                  <Input type="password" value={passwordForm.new_password} onChange={(e) => setPasswordForm((current) => ({ ...current, new_password: e.target.value }))} />
                </Field>
                <Field label="Nhập lại mật khẩu mới">
                  <Input type="password" value={passwordForm.confirm_password} onChange={(e) => setPasswordForm((current) => ({ ...current, confirm_password: e.target.value }))} />
                </Field>

                <Button type="submit" variant="secondary" isLoading={savingPassword}>Đổi mật khẩu</Button>
              </form>
            </CardBody>
          </Card>
        </div>

        <Card>
          <CardBody>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-slate-500">Tài khoản đang dùng</p>
                <h3 className="text-xl font-semibold text-slate-950">{user?.full_name || '—'}</h3>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                {user?.email || '—'}
              </div>
            </div>
          </CardBody>
        </Card>
      </PageShell>
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

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
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