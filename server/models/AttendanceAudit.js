import mongoose from 'mongoose';

const attendanceAuditSchema = new mongoose.Schema({
  classId: { type: String, index: true },
  className: { type: String, index: true },
  eventType: {
    type: String,
    required: true,
    enum: ['session_started', 'session_refreshed', 'mark_success', 'mark_duplicate', 'mark_rejected', 'mark_invalid', 'session_expired']
  },
  actorEmail: { type: String, trim: true, lowercase: true },
  actorName: { type: String, trim: true },
  detail: { type: String },
  qrTokenHashPrefix: { type: String },
  ipAddress: { type: String },
  userAgent: { type: String },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: false });

attendanceAuditSchema.index({ classId: 1, createdAt: -1 });
attendanceAuditSchema.index({ eventType: 1, createdAt: -1 });

export default mongoose.model('AttendanceAudit', attendanceAuditSchema);
