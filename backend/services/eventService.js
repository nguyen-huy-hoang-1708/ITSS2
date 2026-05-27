const Event = require('../models/Event');

// ─── Helper: kiem tra trung lich ─────────────────────────────────────────────
// Logic: event A trung voi event B neu: A.start < B.end VA A.end > B.start
const checkConflict = async (user_id, event_date, start_time, end_time, exclude_id = null) => {
  const query = {
    user_id,
    event_date,
    start_time: { $lt: end_time },
    end_time:   { $gt: start_time },
  };
  if (exclude_id) query._id = { $ne: exclude_id };

  return await Event.find(query).select('title start_time end_time');
};

const throwIfConflict = (conflicts) => {
  if (conflicts.length > 0) {
    const names = conflicts
      .map(e => `"${e.title}" (${e.start_time} - ${e.end_time})`)
      .join(', ');
    throw new Error(`Trùng lịch với: ${names}`);
  }
};

// ─── Create ───────────────────────────────────────────────────────────────────
const createEvent = async (data) => {
  const {
    user_id, title, description, type, tag_label,
    event_date, start_time, end_time, location, priority,
  } = data;

  throwIfConflict(await checkConflict(user_id, event_date, start_time, end_time));

  const payload = {
    user_id, title, description, type, tag_label,
    event_date, start_time, end_time, location,
  };

  // Neu type la deadline thi embed luon sub-document deadline
  if (type === 'deadline') {
    payload.deadline = {
      due_datetime: new Date(`${event_date}T${end_time}`),
      priority:     priority || 'medium',
      is_completed: false,
      completed_at: null,
    };
  }

  const newEvent = await Event.create(payload);
  return newEvent;
};

// ─── Read ─────────────────────────────────────────────────────────────────────
const getEventById = async (event_id, user_id) => {
  const found = await Event.findOne({ _id: event_id, user_id });
  if (!found) throw new Error('Sự kiện không tồn tại');
  return found;
};

const getAllEvents = async (user_id) => {
  return await Event.find({ user_id }).sort({ event_date: 1, start_time: 1 });
};

const getEventsByMonth = async (user_id, year, month) => {
  const p     = (n) => String(n).padStart(2, '0');
  const start = `${year}-${p(month)}-01`;
  const end   = `${year}-${p(month)}-31`;

  return await Event.find({
    user_id,
    event_date: { $gte: start, $lte: end },
  }).sort({ event_date: 1, start_time: 1 });
};

const getEventsByWeek = async (user_id, week_start, week_end) => {
  return await Event.find({
    user_id,
    event_date: { $gte: week_start, $lte: week_end },
  }).sort({ event_date: 1, start_time: 1 });
};

const getEventsToday = async (user_id) => {
  const today = new Date().toISOString().split('T')[0];
  return await Event.find({ user_id, event_date: today }).sort({ start_time: 1 });
};

// Lay tat ca deadline chua hoan thanh, sap xep gan han nhat len dau
const getUpcomingDeadlines = async (user_id) => {
  return await Event.find({
    user_id,
    type: 'deadline',
    'deadline.is_completed': false,
  }).sort({ 'deadline.due_datetime': 1 });
};

// ─── Update ───────────────────────────────────────────────────────────────────
const updateEvent = async (event_id, user_id, data) => {
  const {
    title, description, type, tag_label,
    event_date, start_time, end_time, location, priority,
  } = data;

  const found = await Event.findOne({ _id: event_id, user_id });
  if (!found) throw new Error('Sự kiện không tồn tại');

  throwIfConflict(await checkConflict(user_id, event_date, start_time, end_time, event_id));

  const updatePayload = {
    title, description, type, tag_label,
    event_date, start_time, end_time, location,
  };

  // Xu ly deadline sub-document
  if (type === 'deadline') {
    // Neu da co deadline thi giu nguyen is_completed/completed_at, chi update due_datetime va priority
    if (found.deadline) {
      updatePayload['deadline.due_datetime'] = new Date(`${event_date}T${end_time}`);
      if (priority) updatePayload['deadline.priority'] = priority;
    } else {
      // Chua co deadline -> tao moi
      updatePayload.deadline = {
        due_datetime: new Date(`${event_date}T${end_time}`),
        priority:     priority || 'medium',
        is_completed: false,
        completed_at: null,
      };
    }
  } else {
    // Doi type khong phai deadline -> xoa deadline neu co
    updatePayload.deadline = null;
  }

  const updated = await Event.findOneAndUpdate(
    { _id: event_id, user_id },
    { $set: updatePayload },
    { new: true, runValidators: true }
  );
  return updated;
};

// ─── Delete ───────────────────────────────────────────────────────────────────
const deleteEvent = async (event_id, user_id) => {
  const found = await Event.findOneAndDelete({ _id: event_id, user_id });
  if (!found) throw new Error('Sự kiện không tồn tại');
};

// ─── Deadline actions ─────────────────────────────────────────────────────────
const markDeadlineCompleted = async (event_id, user_id) => {
  const found = await Event.findOne({ _id: event_id, user_id, type: 'deadline' });
  if (!found) throw new Error('Deadline không tồn tại');

  const updated = await Event.findOneAndUpdate(
    { _id: event_id, user_id },
    { $set: { 'deadline.is_completed': true, 'deadline.completed_at': new Date() } },
    { new: true }
  );
  return updated;
};

const updateDeadlinePriority = async (event_id, user_id, priority) => {
  const found = await Event.findOne({ _id: event_id, user_id, type: 'deadline' });
  if (!found) throw new Error('Deadline không tồn tại');

  const updated = await Event.findOneAndUpdate(
    { _id: event_id, user_id },
    { $set: { 'deadline.priority': priority } },
    { new: true }
  );
  return updated;
};

module.exports = {
  createEvent,
  getEventById,
  getAllEvents,
  getEventsByMonth,
  getEventsByWeek,
  getEventsToday,
  getUpcomingDeadlines,
  updateEvent,
  deleteEvent,
  markDeadlineCompleted,
  updateDeadlinePriority,
};
