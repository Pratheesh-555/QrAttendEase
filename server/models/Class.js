import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  rollNumber: {
    type: String,
    trim: true
  }
}, { _id: false });

const classSchema = new mongoose.Schema({
  teacherEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  className: {
    type: String,
    required: true,
    trim: true
  },
  time: {
    type: String,
    default: '09:00'
  },
  studentCount: {
    type: Number,
    default: 0
  },
  studentList: [studentSchema],
  gracePeriodMinutes: {
    type: Number,
    default: 10
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
classSchema.index({ teacherEmail: 1, isActive: 1 });
classSchema.index({ createdAt: -1 });

export default mongoose.model('Class', classSchema);