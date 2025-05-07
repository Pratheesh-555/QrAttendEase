import mongoose from 'mongoose';

const classSchema = new mongoose.Schema({
  teacherEmail: String,
  className: String,
  studentList: [{
    name: String,
    regNo: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Class', classSchema);