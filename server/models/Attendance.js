import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  presentStudents: [{
    name: String,
    email: String,
    timestamp: Date
  }],
  absentStudents: [{
    name: String,
    regNo: String
  }]
});

export default mongoose.model('Attendance', attendanceSchema);