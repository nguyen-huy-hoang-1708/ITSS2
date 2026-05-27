import { format, isSameDay } from 'date-fns';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import type { EventItem } from '@/types/event';
import { buildMonthGrid, buildWeekRange, formatTimeRange, getMonthCursor, getTypeLabel, isSameCalendarDay } from '@/utils/date';
import { Badge, Button, Card, CardBody } from './ui';

export function MonthCalendar({
  cursor,
  setCursor,
  events,
  onSelectDay,
}: {
  cursor: Date;
  setCursor: (date: Date) => void;
  events: EventItem[];
  onSelectDay: (date: Date) => void;
}) {
  const grid = buildMonthGrid(cursor);
  const grouped = groupByDate(events);

  return (
    <Card>
      <CardBody className="space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Lịch tháng</p>
            <h3 className="text-2xl font-semibold text-slate-950">{format(cursor, 'MMMM yyyy')}</h3>
          </div>
          <div className="flex items-center gap-2">
            <IconButton onClick={() => setCursor(getMonthCursor(cursor, 'prev'))}>
              <ChevronLeft className="h-4 w-4" />
            </IconButton>
            <Button variant="secondary" onClick={() => setCursor(new Date())}>
              <CalendarDays className="h-4 w-4" />
              Hôm nay
            </Button>
            <IconButton onClick={() => setCursor(getMonthCursor(cursor, 'next'))}>
              <ChevronRight className="h-4 w-4" />
            </IconButton>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
          {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day) => (
            <div key={day} className="py-2">{day}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {grid.map((day) => {
            const dayKey = format(day, 'yyyy-MM-dd');
            const dayEvents = grouped[dayKey] || [];
            const currentMonth = day.getMonth() === cursor.getMonth();
            const today = isSameDay(day, new Date());

            return (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => onSelectDay(day)}
                className={`min-h-28 rounded-2xl border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-md ${currentMonth ? 'border-slate-200 bg-white' : 'border-slate-100 bg-slate-50/70 text-slate-400'} ${today ? 'ring-2 ring-brand-200' : ''}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-sm font-semibold ${today ? 'text-brand-600' : ''}`}>{format(day, 'd')}</span>
                  {dayEvents.length > 0 ? <span className="rounded-full bg-slate-950 px-2 py-0.5 text-[11px] font-semibold text-white">{dayEvents.length}</span> : null}
                </div>
                <div className="mt-3 space-y-2">
                  {dayEvents.slice(0, 2).map((event) => (
                    <div key={event._id} className="rounded-xl border border-slate-100 bg-slate-50/90 px-2 py-1.5 text-xs text-slate-600">
                      <p className="truncate font-medium text-slate-900">{event.title}</p>
                      <p className="mt-0.5 truncate">{formatTimeRange(event.start_time, event.end_time)}</p>
                    </div>
                  ))}
                  {dayEvents.length > 2 ? <p className="text-xs font-medium text-slate-400">+{dayEvents.length - 2} sự kiện</p> : null}
                </div>
              </button>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
}

export function WeekAgenda({ cursor, events }: { cursor: Date; events: EventItem[] }) {
  const days = buildWeekRange(cursor);
  const grouped = groupByDate(events);

  return (
    <Card>
      <CardBody className="space-y-5">
        <div>
          <p className="text-sm font-medium text-slate-500">Lịch tuần</p>
          <h3 className="text-2xl font-semibold text-slate-950">{format(days[0], 'dd/MM')} - {format(days[6], 'dd/MM/yyyy')}</h3>
        </div>

        <div className="grid gap-4 xl:grid-cols-7">
          {days.map((day) => {
            const key = format(day, 'yyyy-MM-dd');
            const dayEvents = grouped[key] || [];
            const isTodayDay = isSameCalendarDay(day, new Date());

            return (
              <div key={key} className={`rounded-3xl border p-4 ${isTodayDay ? 'border-brand-200 bg-brand-50/60' : 'border-slate-200 bg-white'}`}>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{format(day, 'EEE')}</p>
                    <h4 className="mt-1 text-lg font-semibold text-slate-950">{format(day, 'dd')}</h4>
                  </div>
                  {isTodayDay ? <Badge tone="brand">Today</Badge> : null}
                </div>
                <div className="mt-4 space-y-3">
                  {dayEvents.length === 0 ? <p className="text-sm text-slate-400">Rỗng</p> : null}
                  {dayEvents.map((event) => (
                    <div key={event._id} className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-950">{event.title}</p>
                          <p className="mt-1 text-xs text-slate-500">{formatTimeRange(event.start_time, event.end_time)}</p>
                        </div>
                        <Badge tone={event.type === 'deadline' ? 'warning' : event.type === 'hoc' ? 'brand' : 'purple'}>{getTypeLabel(event.type)}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
}

function groupByDate(events: EventItem[]) {
  return events.reduce<Record<string, EventItem[]>>((acc, event) => {
    if (!acc[event.event_date]) acc[event.event_date] = [];
    acc[event.event_date].push(event);
    return acc;
  }, {});
}

function IconButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 hover:text-slate-950">
      {children}
    </button>
  );
}