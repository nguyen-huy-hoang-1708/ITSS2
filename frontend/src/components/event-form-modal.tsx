import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Badge, Button, Modal, Input, Select, Textarea } from './ui';
import type { EventItem, EventPayload, EventPriority, EventType } from '@/types/event';

interface Props {
  open: boolean;
  mode: 'create' | 'edit';
  initialValue?: Partial<EventItem> | null;
  onClose: () => void;
  onSubmit: (payload: EventPayload) => Promise<void>;
}

const defaultDate = format(new Date(), 'yyyy-MM-dd');

export function EventFormModal({ open, mode, initialValue, onClose, onSubmit }: Props) {
  const initialType = (initialValue?.type || 'hoc') as EventType;
  const [form, setForm] = useState<EventPayload>({
    title: '',
    description: '',
    type: initialType,
    tag_label: '',
    event_date: defaultDate,
    start_time: '08:00',
    end_time: '09:00',
    location: '',
    priority: 'medium',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm({
      title: initialValue?.title || '',
      description: initialValue?.description || '',
      type: (initialValue?.type || 'hoc') as EventType,
      tag_label: initialValue?.tag_label || '',
      event_date: initialValue?.event_date || defaultDate,
      start_time: (initialValue?.start_time || '08:00').slice(0, 5),
      end_time: (initialValue?.end_time || '09:00').slice(0, 5),
      location: initialValue?.location || '',
      priority: initialValue?.deadline?.priority || 'medium',
    });
    setErrors({});
  }, [initialValue, open]);

  const isDeadline = useMemo(() => form.type === 'deadline', [form.type]);

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!form.title.trim()) nextErrors.title = 'Tiêu đề là bắt buộc';
    if (!form.event_date) nextErrors.event_date = 'Ngày là bắt buộc';
    if (!form.start_time) nextErrors.start_time = 'Giờ bắt đầu là bắt buộc';
    if (!form.end_time) nextErrors.end_time = 'Giờ kết thúc là bắt buộc';
    if (form.end_time && form.start_time && form.end_time <= form.start_time) nextErrors.end_time = 'Giờ kết thúc phải lớn hơn giờ bắt đầu';
    if (isDeadline && !form.priority) nextErrors.priority = 'Priority là bắt buộc';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleChange = <K extends keyof EventPayload>(key: K, value: EventPayload[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      await onSubmit({
        ...form,
        priority: form.type === 'deadline' ? (form.priority || 'medium') : undefined,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      title={mode === 'create' ? 'Tạo sự kiện mới' : 'Chỉnh sửa sự kiện'}
      description="Thiết kế form gọn, rõ ràng, tối ưu thao tác cho người dùng."
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Huỷ
          </Button>
          <Button type="submit" form="event-form" isLoading={submitting}>
            {mode === 'create' ? 'Tạo sự kiện' : 'Lưu thay đổi'}
          </Button>
        </>
      }
    >
      <form id="event-form" onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Tiêu đề" error={errors.title}>
            <Input value={form.title} onChange={(e) => handleChange('title', e.target.value)} placeholder="Nhập tiêu đề" />
          </Field>
          <Field label="Loại" hint={<Badge tone="brand">{isDeadline ? 'Deadline mode' : 'Standard event'}</Badge>}>
            <Select value={form.type} onChange={(e) => handleChange('type', e.target.value as EventType)}>
              <option value="hoc">Học tập</option>
              <option value="deadline">Deadline</option>
              <option value="lam_them">Làm thêm</option>
            </Select>
          </Field>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Ngày" error={errors.event_date}>
            <Input type="date" value={form.event_date} onChange={(e) => handleChange('event_date', e.target.value)} />
          </Field>
          <Field label="Tag">
            <Input value={form.tag_label} onChange={(e) => handleChange('tag_label', e.target.value)} placeholder="Ví dụ: Toán cao cấp" />
          </Field>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Giờ bắt đầu" error={errors.start_time}>
            <Input type="time" value={form.start_time} onChange={(e) => handleChange('start_time', e.target.value)} />
          </Field>
          <Field label="Giờ kết thúc" error={errors.end_time}>
            <Input type="time" value={form.end_time} onChange={(e) => handleChange('end_time', e.target.value)} />
          </Field>
        </div>

        <Field label="Mô tả">
          <Textarea rows={4} value={form.description} onChange={(e) => handleChange('description', e.target.value)} placeholder="Nhập mô tả chi tiết..." />
        </Field>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Địa điểm">
            <Input value={form.location} onChange={(e) => handleChange('location', e.target.value)} placeholder="Phòng học, địa chỉ..." />
          </Field>
          {isDeadline ? (
            <Field label="Priority" error={errors.priority}>
              <Select value={form.priority || 'medium'} onChange={(e) => handleChange('priority', e.target.value as EventPriority)}>
                <option value="low">Thấp</option>
                <option value="medium">Trung bình</option>
                <option value="high">Cao</option>
              </Select>
            </Field>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
              Priority chỉ áp dụng cho deadline.
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
}

function Field({ label, hint, error, children }: { label: string; hint?: React.ReactNode; error?: string; children: React.ReactNode }) {
  return (
    <label className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        {hint}
      </div>
      {children}
      {error ? <p className="text-xs font-medium text-rose-500">{error}</p> : null}
    </label>
  );
}