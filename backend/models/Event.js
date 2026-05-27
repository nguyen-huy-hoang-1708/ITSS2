const mongoose = require('mongoose');

// Sub-document cho deadline (embed truc tiep vao event, khong can bang rieng)
const deadlineSchema = new mongoose.Schema(
  {
    due_datetime: { type: Date, required: true },
    priority:     { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    is_completed: { type: Boolean, default: false },
    completed_at: { type: Date, default: null },
  },
  { _id: false, versionKey: false }
);

const eventSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Tiêu đề là bắt buộc'],
      trim: true,
      maxlength: 256,
    },
    description: {
      type: String,
      default: '',
    },
    type: {
      type: String,
      enum: ['hoc', 'deadline', 'lam_them'],
      required: [true, 'Loại sự kiện là bắt buộc'],
    },
    tag_label: {
      type: String,
      default: '',
      maxlength: 100,
    },
    event_date: {
      type: String,           // luu dang 'YYYY-MM-DD' de de query
      required: [true, 'Ngày là bắt buộc'],
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Định dạng ngày phải là YYYY-MM-DD'],
    },
    start_time: {
      type: String,           // luu dang 'HH:MM:SS'
      required: [true, 'Giờ bắt đầu là bắt buộc'],
      match: [/^\d{2}:\d{2}(:\d{2})?$/, 'Định dạng giờ phải là HH:MM hoặc HH:MM:SS'],
    },
    end_time: {
      type: String,
      required: [true, 'Giờ kết thúc là bắt buộc'],
      match: [/^\d{2}:\d{2}(:\d{2})?$/, 'Định dạng giờ phải là HH:MM hoặc HH:MM:SS'],
    },
    location: {
      type: String,
      default: '',
      maxlength: 256,
    },
    // Neu type === 'deadline' thi truong nay se duoc dien, nguoc lai la null
    deadline: {
      type: deadlineSchema,
      default: null,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    versionKey: false,
  }
);

// Index giup query nhanh theo user + ngay
eventSchema.index({ user_id: 1, event_date: 1 });

module.exports = mongoose.model('Event', eventSchema);
