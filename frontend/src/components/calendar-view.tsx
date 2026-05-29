import { format, isSameDay } from 'date-fns';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import type { EventItem } from '@/types/event';
import { buildMonthGrid, buildWeekRange, formatTimeRange, getMonthCursor, getTypeLabel, isSameCalendarDay } from '@/utils/date';
import { getEventId } from '@/utils/event-id';
import { Badge, Button, Card, CardBody } from './ui';

export function MonthCalendar({
  cursor,
  setCursor,
  events,
  onSelectDay,
  onEventClick,
}: {
  cursor: Date;
  setCursor: (date: Date) => void;
  events: EventItem[];
  onSelectDay: (date: Date) => void;
  onEventClick?: (event: EventItem) => void;
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
                    <div
                      key={getEventId(event)}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick?.(event);
                      }}
                      className="rounded-xl border border-slate-100 bg-slate-50/90 px-2 py-1.5 text-xs text-slate-600 cursor-pointer transition hover:bg-slate-100 hover:border-slate-200"
                    >
                      <p className="truncate font-medium text-slate-900">{event.title}</p>
                      <p className="mt-0.5 truncate">{formatTimeRange(event.start_time, event.end_time)}</p>
                    </div>
                  ))}
                  {dayEvents.length > 2 ? (
                    <p className="text-xs font-medium text-slate-400 cursor-pointer hover:text-slate-600">
                      +{dayEvents.length - 2} sự kiện
                    </p>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
}

export function WeekAgenda({ cursor, events, onEventClick }: { cursor: Date; events: EventItem[]; onEventClick?: (event: EventItem) => void }) {
  const days = buildWeekRange(cursor);
  const grouped = groupByDate(events);

  return (
    <Card>
      <CardBody className="space-y-6">
        <div>
          <p className="text-sm font-medium text-slate-500">Lịch tuần</p>
          <h3 className="text-2xl font-semibold text-slate-950">{format(days[0], 'dd/MM')} - {format(days[6], 'dd/MM/yyyy')}</h3>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          {days.map((day) => {
            const key = format(day, 'yyyy-MM-dd');
            const dayEvents = grouped[key] || [];
            const isTodayDay = isSameCalendarDay(day, new Date());

            return (
              <div key={key} className={`rounded-3xl border-2 p-5 transition ${isTodayDay ? 'border-brand-200 bg-brand-50/80 shadow-md' : 'border-slate-200 bg-white shadow-sm hover:shadow-md'}`}>
                <div className="flex flex-col gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">{format(day, 'EEE')}</p>
                    <h4 className="mt-2 text-2xl font-bold text-slate-950">{format(day, 'dd')}</h4>
                  </div>
                  {isTodayDay && <Badge tone="brand" className="w-fit">Hôm nay</Badge>}
                </div>
                
                <div className="mt-5 space-y-3">
                  {dayEvents.length === 0 ? (
                    <p className="text-sm text-slate-400 italic">Rỗng</p>
                  ) : (
                    dayEvents.map((event) => (
                      <div
                        key={getEventId(event)}
                        onClick={() => onEventClick?.(event)}
                        className={`rounded-2xl border-l-4 px-3 py-2.5 text-xs cursor-pointer transition hover:shadow-md ${
                          event.type === 'deadline' 
                            ? 'border-l-amber-400 bg-amber-50 hover:bg-amber-100'
                            : event.type === 'hoc'
                            ? 'border-l-brand-400 bg-brand-50 hover:bg-brand-100'
                            : 'border-l-violet-400 bg-violet-50 hover:bg-violet-100'
                        }`}
                      >
                        <p className="font-semibold text-slate-900 line-clamp-2">{event.title}</p>
                        <p className="mt-1 text-slate-600">{formatTimeRange(event.start_time, event.end_time)}</p>
                        {event.location && <p className="mt-1 text-slate-500">{event.location}</p>}
                      </div>
                    ))
                  )}
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