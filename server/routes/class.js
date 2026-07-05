import express from 'express';
import multer from 'multer';
import * as XLSX from 'xlsx';
import mongoose from 'mongoose';
import Class from '../models/Class.js';
import { generateId, normalizeStudentList, readStore, writeStore } from '../config/localStore.js';

const router = express.Router();
const upload = multer();

const useLocalStore = () => mongoose.connection.readyState !== 1;

const mapClassRecord = (record) => ({
  _id: record._id,
  teacherEmail: record.teacherEmail,
  className: record.className,
  time: record.time || '09:00',
  studentCount: record.studentCount || record.studentList?.length || 0,
  studentList: record.studentList || [],
  gracePeriodMinutes: record.gracePeriodMinutes ?? 10,
  isActive: record.isActive !== false,
  createdAt: record.createdAt || new Date().toISOString(),
  updatedAt: record.updatedAt || new Date().toISOString()
});

// Get classes for a teacher
router.get('/:teacherEmail', async (req, res) => {
  try {
    if (useLocalStore()) {
      const store = await readStore();
      const classes = store.classes
        .filter((item) => item.teacherEmail === req.params.teacherEmail && item.isActive !== false)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .map(mapClassRecord);

      return res.json(classes);
    }

    const classes = await Class.find({ teacherEmail: req.params.teacherEmail, isActive: true })
      .sort({ createdAt: -1 });
    res.json(classes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new class
router.post('/', async (req, res) => {
  try {
    const { teacherEmail, className, time } = req.body;
    if (!teacherEmail || !className) {
      return res.status(400).json({ message: 'Teacher email and class name are required' });
    }

    if (useLocalStore()) {
      const store = await readStore();
      const now = new Date().toISOString();
      const newClass = mapClassRecord({
        _id: generateId(),
        teacherEmail,
        className,
        time: time || '09:00',
        studentCount: 0,
        studentList: [],
        gracePeriodMinutes: 10,
        isActive: true,
        createdAt: now,
        updatedAt: now
      });

      store.classes.unshift(newClass);
      await writeStore(store);
      return res.status(201).json(newClass);
    }

    const newClass = new Class({
      teacherEmail,
      className,
      time: time || '09:00',
      studentCount: 0,
      studentList: []
    });

    const savedClass = await newClass.save();
    res.status(201).json(savedClass);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a class (soft delete)
router.delete('/:classId', async (req, res) => {
  try {
    if (useLocalStore()) {
      const store = await readStore();
      const existing = store.classes.find((item) => item._id === req.params.classId);

      if (!existing) return res.status(404).json({ message: 'Class not found' });

      existing.isActive = false;
      existing.updatedAt = new Date().toISOString();
      await writeStore(store);
      return res.json({ success: true, message: 'Class deleted successfully' });
    }

    const deletedClass = await Class.findByIdAndUpdate(
      req.params.classId,
      { isActive: false },
      { new: true }
    );
    if (!deletedClass) return res.status(404).json({ message: 'Class not found' });
    res.json({ success: true, message: 'Class deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get student list for a class
router.get('/:classId/students', async (req, res) => {
  try {
    if (useLocalStore()) {
      const store = await readStore();
      const classData = store.classes.find((item) => item._id === req.params.classId);
      if (!classData) return res.status(404).json({ message: 'Class not found' });
      return res.json({ studentList: classData.studentList || [] });
    }

    const classData = await Class.findById(req.params.classId);
    if (!classData) return res.status(404).json({ message: 'Class not found' });
    res.json({ studentList: classData.studentList || [] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update student list for a class (from Excel upload on frontend)
router.put('/:classId/students', async (req, res) => {
  try {
    const { studentList } = req.body;

    if (!studentList || !Array.isArray(studentList)) {
      return res.status(400).json({ message: 'Invalid student list' });
    }

    const formattedList = normalizeStudentList(studentList);

    if (useLocalStore()) {
      const store = await readStore();
      const classData = store.classes.find((item) => item._id === req.params.classId);

      if (!classData) {
        return res.status(404).json({ message: 'Class not found' });
      }

      classData.studentList = formattedList;
      classData.studentCount = formattedList.length;
      classData.updatedAt = new Date().toISOString();
      await writeStore(store);

      return res.json({
        success: true,
        message: 'Student list updated successfully',
        studentList: classData.studentList
      });
    }

    const updatedClass = await Class.findByIdAndUpdate(
      req.params.classId,
      {
        $set: {
          studentList: formattedList,
          studentCount: formattedList.length
        }
      },
      { new: true }
    );

    if (!updatedClass) {
      return res.status(404).json({ message: 'Class not found' });
    }

    res.json({
      success: true,
      message: 'Student list updated successfully',
      studentList: updatedClass.studentList
    });
  } catch (error) {
    console.error('Update student list error:', error);
    res.status(500).json({ message: 'Failed to update student list', error: error.message });
  }
});

// Upload student list from file
router.post('/upload-students/:classId', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const workbook = XLSX.read(req.file.buffer);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet);

    if (!data || data.length === 0) {
      return res.status(400).json({ message: 'No data found in Excel file' });
    }

    const students = data.map(row => ({
      name: row.Name || row.name || row.NAME || '',
      regNo: row.RegNo || row.Regno || row.REGNO || row.Registration || ''
    })).filter(student => student.name);

    if (useLocalStore()) {
      const store = await readStore();
      const classData = store.classes.find((item) => item._id === req.params.classId);

      if (!classData) return res.status(404).json({ message: 'Class not found' });

      classData.studentList = normalizeStudentList(students);
      classData.studentCount = classData.studentList.length;
      classData.updatedAt = new Date().toISOString();
      await writeStore(store);

      return res.json({ success: true, studentList: classData.studentList });
    }

    const updatedClass = await Class.findByIdAndUpdate(
      req.params.classId,
      {
        $set: {
          studentList: students,
          studentCount: students.length
        }
      },
      { new: true }
    );

    if (!updatedClass) return res.status(404).json({ message: 'Class not found' });
    res.json({ success: true, studentList: updatedClass.studentList });
  } catch (error) {
    res.status(500).json({ message: 'Failed to process student list', error: error.message });
  }
});

export default router;