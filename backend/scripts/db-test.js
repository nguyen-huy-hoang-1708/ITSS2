require('dotenv').config();
const mongoose = require('mongoose');
const User     = require('../models/User');
const Event    = require('../models/Event');

const PASS = (msg) => console.log(`  ✅ PASS: ${msg}`);
const FAIL = (msg) => console.log(`  ❌ FAIL: ${msg}`);
const HEAD = (msg) => console.log(`\n${'─'.repeat(55)}\n🧪 ${msg}\n${'─'.repeat(55)}`);

async function run() {
  console.log('\n🔌 Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected:', mongoose.connection.host);

  // ─── [1] Collections tồn tại ────────────────────────────────
  HEAD('[1] Kiểm tra collections trong DB');
  const cols = await mongoose.connection.db.listCollections().toArray();
  const colNames = cols.map(c => c.name);
  console.log('  Collections hiện có:', colNames);
  colNames.includes('users')  ? PASS('Collection "users" tồn tại')  : FAIL('Collection "users" KHÔNG tồn tại');
  colNames.includes('events') ? PASS('Collection "events" tồn tại') : FAIL('Collection "events" KHÔNG tồn tại');

  // ─── [2] Đếm documents ──────────────────────────────────────
  HEAD('[2] Đếm số documents');
  const userCount  = await User.countDocuments();
  const eventCount = await Event.countDocuments();
  console.log(`  Users:  ${userCount}`);
  console.log(`  Events: ${eventCount}`);
  userCount  > 0 ? PASS(`Có ${userCount} user trong DB`)   : FAIL('Không có user nào trong DB');
  eventCount > 0 ? PASS(`Có ${eventCount} event trong DB`) : FAIL('Không có event nào trong DB');

  // ─── [3] Kiểm tra schema User ───────────────────────────────
  HEAD('[3] Kiểm tra schema User');
  const user = await User.findOne().lean();
  if (user) {
    console.log('  Sample user document:');
    console.log('  ', JSON.stringify(user, null, 2).replace(/\n/g, '\n  '));
    user.full_name      ? PASS('Có trường full_name')      : FAIL('Thiếu trường full_name');
    user.email          ? PASS('Có trường email')           : FAIL('Thiếu trường email');
    user.password_hash  ? PASS('Có trường password_hash')  : FAIL('Thiếu trường password_hash');
    !user.password      ? PASS('Không lưu plain password')  : FAIL('⚠️ Đang lưu plain password!');
    !user.__v           ? PASS('versionKey bị tắt (__v)')  : FAIL('versionKey vẫn còn');
  } else {
    FAIL('Không tìm được user để kiểm tra schema');
  }

  // ─── [4] Kiểm tra schema Event ──────────────────────────────
  HEAD('[4] Kiểm tra schema Event');
  const events = await Event.find().lean();
  if (events.length > 0) {
    events.forEach((ev, i) => {
      console.log(`\n  Event #${i + 1}:`);
      console.log('  ', JSON.stringify(ev, null, 2).replace(/\n/g, '\n  '));
    });
    const ev0 = events[0];
    ev0.user_id    ? PASS('Có trường user_id (ref User)')  : FAIL('Thiếu user_id');
    ev0.title      ? PASS('Có trường title')               : FAIL('Thiếu title');
    ev0.type       ? PASS(`type hợp lệ: "${ev0.type}"`)   : FAIL('Thiếu type');
    ev0.event_date ? PASS(`event_date: ${ev0.event_date}`) : FAIL('Thiếu event_date');
    ev0.start_time ? PASS(`start_time: ${ev0.start_time}`) : FAIL('Thiếu start_time');
    ev0.end_time   ? PASS(`end_time: ${ev0.end_time}`)     : FAIL('Thiếu end_time');
    !ev0.__v       ? PASS('versionKey bị tắt (__v)')       : FAIL('versionKey vẫn còn');
  } else {
    FAIL('Không có event để kiểm tra');
  }

  // ─── [5] Kiểm tra sub-document deadline ─────────────────────
  HEAD('[5] Kiểm tra sub-document Deadline');
  const deadline = await Event.findOne({ type: 'deadline' }).lean();
  if (deadline) {
    console.log('  Deadline event:', deadline.title);
    deadline.deadline                  ? PASS('Có sub-doc deadline')                   : FAIL('Thiếu sub-doc deadline');
    deadline.deadline?.due_datetime    ? PASS(`due_datetime: ${deadline.deadline.due_datetime}`) : FAIL('Thiếu due_datetime');
    ['low','medium','high'].includes(deadline.deadline?.priority)
                                       ? PASS(`priority hợp lệ: "${deadline.deadline.priority}"`) : FAIL('priority không hợp lệ');
    typeof deadline.deadline?.is_completed === 'boolean'
                                       ? PASS(`is_completed: ${deadline.deadline.is_completed}`) : FAIL('is_completed không phải boolean');
  } else {
    console.log('  ⚠️  Không có event type=deadline để test (bỏ qua)');
  }

  // ─── [6] Kiểm tra event type=hoc KHÔNG có deadline ─────────
  HEAD('[6] Kiểm tra event "hoc" không có sub-doc deadline');
  const hocEv = await Event.findOne({ type: 'hoc' }).lean();
  if (hocEv) {
    hocEv.deadline === null ? PASS('"hoc" event có deadline = null (đúng)') : FAIL('"hoc" event không được có deadline');
  } else {
    console.log('  ⚠️  Không có event type=hoc để test (bỏ qua)');
  }

  // ─── [7] Kiểm tra index ─────────────────────────────────────
  HEAD('[7] Kiểm tra Indexes trên collection "events"');
  const indexes = await Event.collection.indexes();
  console.log('  Indexes:');
  indexes.forEach(idx => console.log(`    - ${JSON.stringify(idx.key)} (${idx.name})`));
  const hasCompound = indexes.some(i => i.key.user_id && i.key.event_date);
  hasCompound ? PASS('Có compound index {user_id, event_date}') : FAIL('Thiếu compound index {user_id, event_date}');

  // ─── [8] Kiểm tra unique email ──────────────────────────────
  HEAD('[8] Kiểm tra unique constraint trên email');
  try {
    const existingUser = await User.findOne().lean();
    if (existingUser) {
      await User.create({ full_name: 'Duplicate', email: existingUser.email, password_hash: 'xxx' });
      FAIL('Cho phép email trùng — unique constraint KHÔNG hoạt động!');
    }
  } catch (e) {
    e.code === 11000 ? PASS('Unique email constraint hoạt động đúng (E11000)') : FAIL(`Lỗi không mong đợi: ${e.message}`);
  }

  // ─── Kết thúc ────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(55));
  console.log('✅ DB Test hoàn tất!');
  console.log('═'.repeat(55) + '\n');
  await mongoose.disconnect();
}

run().catch(err => {
  console.error('❌ Lỗi:', err.message);
  process.exit(1);
});
