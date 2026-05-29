import { format } from 'date-fns';
import { Clock, MapPin, X } from 'lucide-react';
import { useMemo } from 'react';
import type { EventItem } from '@/types/event';
import { formatTimeRange, getPriorityLabel, getPriorityTone, getTypeLabel } from '@/utils/date';
import { getEventId } from '@/utils/event-id';
import { Badge, Button } from './ui';

interface DayEventsModalProps {
  open: boolean;
  date: Date;
  events: EventItem[];
  onClose: () => void;
  onEventClick?: (event: EventItem) => void;
}

export function DayEventsModal({
  open,
  date,
  events,
  onClose,
  onEventClick,
}: DayEventsModalProps) {
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      const timeA = a.start_time.split(':').map(Number);
      const timeB = b.start_time.split(':').map(Number);
      return timeA[0] - timeB[0] || timeA[1] - timeB[1];
    });
  }, [events]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl sm:w-full sm:max-w-2xl animate-slideUp sm:animate-fadeInScale">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between gap-4 border-b border-slate-200/80 bg-white/95 backdrop-blur px-6 py-5 sm:rounded-t-3xl">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">{format(date, 'EEEE')}</h2>
            <p className="mt-1 text-sm text-slate-500">{format(date, 'dd/MM/yyyy')}</p>
          </div>
          <button
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {events.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-lg text-slate-400">Không có sự kiện trong ngày này</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedEvents.map((event) => (
                <div
                  key={getEventId(event)}
                  onClick={() => onEventClick?.(event)}
                  className={`rounded-3xl border-2 border-slate-200/80 bg-white p-5 transition ${
                    onEventClick ? 'cursor-pointer hover:border-slate-400 hover:shadow-md' : ''
                  } ${
                    event.type === 'deadline'
                      ? 'border-l-4 border-l-amber-400'
                      : event.type === 'hoc'
                      ? 'border-l-4 border-l-brand-400'
                      : 'border-l-4 border-l-violet-400'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-slate-950 truncate">
                          {event.title}
                        </h3>
                        <Badge
                          tone={
                            event.type === 'deadline'
                              ? 'warning'
                              : event.type === 'hoc'
                              ? 'brand'
                              : 'purple'
                          }
                          className="shrink-0"
                        >
                          {getTypeLabel(event.type)}
                        </Badge>
                        {event.is_completed && (
                          <Badge tone="success" className="shrink-0">
                            Hoàn thành
                          </Badge>
                        )}
                      </div>

                      {event.description && (
                        <p className="mt-2 text-sm text-slate-600">{event.description}</p>
                      )}

                      <div className="mt-3 space-y-2">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Clock className="h-4 w-4 text-slate-400" />
                          <span>{formatTimeRange(event.start_time, event.end_time)}</span>
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <MapPin className="h-4 w-4 text-slate-400" />
                            <span>{event.location}</span>
                          </div>
                        )}
                        {event.tag_label && (
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <span className="inline-flex px-2 py-1 rounded-full bg-slate-100 text-xs font-medium text-slate-700">
                              {event.tag_label}
                            </span>
                          </div>
                        )}
                      </div>

                      {event.deadline && (
                        <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                          <p className="text-xs font-medium text-slate-500">Priority</p>
                          <div className="mt-2">
                            <Badge tone={getPriorityTone(event.deadline.priority)}>{getPriorityLabel(event.deadline.priority)}</Badge>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 border-t border-slate-200/80 bg-white/95 backdrop-blur px-6 py-4">
          <Button onClick={onClose} variant="secondary" className="w-full">
            Đóng
          </Button>
        </div>
      </div>
    </div>
  );
}
