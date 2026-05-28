import { Calendar, CheckCircle2, Edit3, MoreHorizontal, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import type { EventItem } from '@/types/event';
import { cn } from '@/utils/cn';
import { Badge, Button, Card, CardBody, EmptyState, Input } from './ui';
import { formatTimeRange, getPriorityLabel, getRecurrenceLabel, getTypeLabel } from '@/utils/date';
import { getEventId } from '@/utils/event-id';

export type EventFilterMode = 'all' | EventItem['type'] | 'today' | 'week' | 'month' | 'completed';

export function EventToolbar({
  search,
  setSearch,
  filter,
  setFilter,
  onCreate,
  onExportExcel,
}: {
  search: string;
  setSearch: (value: string) => void;
  filter: EventFilterMode;
  setFilter: (value: EventFilterMode) => void;
  onCreate: () => void;
  onExportExcel?: () => void;
}) {
  return (
    <Card>
      <CardBody className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex-1">
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm kiếm theo tiêu đề, tag, mô tả..." />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {(['all', 'hoc', 'deadline', 'lam_them', 'today', 'week', 'month', 'completed'] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${filter === item ? 'bg-slate-950 text-white shadow-glow' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {item === 'all' ? 'Tất cả' : item === 'today' ? 'Hôm nay' : item === 'week' ? 'Tuần này' : item === 'month' ? 'Tháng này' : item === 'completed' ? 'Hoàn thành' : getTypeLabel(item)}
            </button>
          ))}
          {onExportExcel ? <Button variant="secondary" onClick={onExportExcel}>Excel</Button> : null}
          <Button onClick={onCreate}>
            <Calendar className="h-4 w-4" />
            Tạo mới
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

export function EventTable({
  events,
  onEdit,
  onDelete,
  onComplete,
  onOpen,
  emptyTitle = 'Chưa có sự kiện nào',
}: {
  events: EventItem[];
  onEdit: (event: EventItem) => void;
  onDelete: (event: EventItem) => void;
  onComplete: (event: EventItem) => void;
  onOpen: (event: EventItem) => void;
  emptyTitle?: string;
}) {
  if (events.length === 0) {
    return <EmptyState title={emptyTitle} description="Hãy thêm sự kiện để bắt đầu quản lý lịch." />;
  }

  return (
    <div className="space-y-4">
      <div className="hidden overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm lg:block">
        <table className="min-w-full divide-y divide-slate-100">
          <thead className="bg-slate-50/80">
            <tr className="text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              <th className="px-6 py-4">Sự kiện</th>
              <th className="px-6 py-4">Ngày giờ</th>
              <th className="px-6 py-4">Loại</th>
              <th className="px-6 py-4">Priority</th>
              <th className="px-6 py-4">Địa điểm</th>
              <th className="px-6 py-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {events.map((event) => (
              <tr key={getEventId(event)} className="transition hover:bg-slate-50/90">
                <td className="px-6 py-5">
                  <button className="text-left" onClick={() => onOpen(event)}>
                    <p className="font-semibold text-slate-950">{event.title}</p>
                    <p className="mt-1 line-clamp-1 text-sm text-slate-500">{event.description || 'Không có mô tả'}</p>
                  </button>
                </td>
                <td className="px-6 py-5 text-sm text-slate-600">
                  <div>{format(new Date(event.event_date), 'dd/MM/yyyy')}</div>
                  <div className="mt-1 text-slate-400">{formatTimeRange(event.start_time, event.end_time)}</div>
                </td>
                <td className="px-6 py-5">
                  <Badge tone={event.type === 'deadline' ? 'warning' : event.type === 'hoc' ? 'brand' : 'purple'}>{getTypeLabel(event.type)}</Badge>
                </td>
                <td className="px-6 py-5 text-sm text-slate-600">{getPriorityLabel(event.deadline?.priority)}</td>
                <td className="px-6 py-5 text-sm text-slate-600">{event.location || '—'}</td>
                <td className="px-6 py-5 text-right">
                  <div className="inline-flex items-center gap-2">
                    {event.type === 'deadline' && !event.deadline?.is_completed ? (
                      <ActionButton title="Hoàn thành" onClick={() => onComplete(event)}>
                        <CheckCircle2 className="h-4 w-4" />
                      </ActionButton>
                    ) : null}
                    <ActionButton title="Chỉnh sửa" onClick={() => onEdit(event)}>
                      <Edit3 className="h-4 w-4" />
                    </ActionButton>
                    <ActionButton title="Xoá" onClick={() => onDelete(event)} danger>
                      <Trash2 className="h-4 w-4" />
                    </ActionButton>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-4 lg:hidden">
        {events.map((event) => (
          <Card key={getEventId(event)}>
            <CardBody>
              <div className="flex items-start justify-between gap-4">
                <button className="text-left" onClick={() => onOpen(event)}>
                  <h3 className="text-base font-semibold text-slate-950">{event.title}</h3>
                  <p className="mt-1 text-sm text-slate-500">{event.description || 'Không có mô tả'}</p>
                </button>
                <button className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-950">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge tone={event.type === 'deadline' ? 'warning' : event.type === 'hoc' ? 'brand' : 'purple'}>{getTypeLabel(event.type)}</Badge>
                {event.deadline?.is_completed ? <Badge tone="success">Hoàn thành</Badge> : null}
                {event.recurrence_frequency && event.recurrence_frequency !== 'none' ? <Badge tone="brand">{getRecurrenceLabel(event.recurrence_frequency, event.recurrence_interval || 1)}</Badge> : null}
              </div>
              <div className="mt-4 grid gap-2 text-sm text-slate-600">
                <p>{format(new Date(event.event_date), 'dd/MM/yyyy')} • {formatTimeRange(event.start_time, event.end_time)}</p>
                <p>{event.location || '—'}</p>
                <p>Priority: {getPriorityLabel(event.deadline?.priority)}</p>
              </div>
              <div className="mt-4 flex gap-2">
                {event.type === 'deadline' && !event.deadline?.is_completed ? (
                  <Button variant="secondary" className="flex-1" onClick={() => onComplete(event)}>
                    <CheckCircle2 className="h-4 w-4" />
                    Done
                  </Button>
                ) : null}
                <Button variant="secondary" className="flex-1" onClick={() => onEdit(event)}>
                  <Edit3 className="h-4 w-4" />
                  Sửa
                </Button>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ActionButton({ children, title, onClick, danger = false }: { children: React.ReactNode; title: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-xl border transition',
        danger ? 'border-rose-200 text-rose-600 hover:bg-rose-50' : 'border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-950'
      )}
    >
      {children}
    </button>
  );
}