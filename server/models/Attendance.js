import mongoose from 'mongoose';

const attendanceRecordSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['present', 'late', 'absent'],
    default: 'present'
  },
  isLate: {
    type: Boolean,
    default: false
  }
}, { _id: false });

const attendanceSchema = new mongoose.Schema({
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  className: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return today;
    }
  },
  sessionStartTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  sessionEndTime: {
    type: Date
  },
  presentStudents: [attendanceRecordSchema],
  absentStudents: [{
    name: String,
    regNo: String
  }],
  totalStudents: {
    type: Number,
    default: 0
  },
  attendanceRate: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
attendanceSchema.index({ classId: 1, date: -1 });
attendanceSchema.index({ date: -1 });
attendanceSchema.index({ 'presentStudents.email': 1 });

// Calculate attendance rate before saving
attendanceSchema.pre('save', function(next) {
  if (this.totalStudents > 0) {
    this.attendanceRate = ((this.presentStudents.length / this.totalStudents) * 100).toFixed(2);
  }
  next();
});

export default mongoose.model('Attendance', attendanceSchema);