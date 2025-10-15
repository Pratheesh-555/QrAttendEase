import express from 'express';
import multer from 'multer';
import * as XLSX from 'xlsx';
import Class from '../models/Class.js';

const router = express.Router();
const upload = multer();

router.get('/:teacherEmail', async (req, res) => {
  try {
    const classes = await Class.find({ teacherEmail: req.params.teacherEmail });
    res.json(classes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', async (req, res) => {
  const newClass = new Class({
    teacherEmail: req.body.teacherEmail,
    className: req.body.className,
    students: req.body.students
  });
  try {
    const savedClass = await newClass.save();
    res.status(201).json(savedClass);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post('/upload-students', upload.single('file'), async (req, res) => {
  try {
    const { teacherEmail, className } = req.body;
    const workbook = XLSX.read(req.file.buffer);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const students = XLSX.utils.sheet_to_json(sheet);

    const newClass = new Class({
      teacherEmail,
      className,
      students: students.map(student => ({
        name: student.Name || student.name,
        regNo: student.RegNo || student.Registration || student.regNo || '',
        email: student.Email || student.email || ''
      })),
      totalStudents: students.length
    });

    await newClass.save();
    res.status(201).json(newClass);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

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

    const updatedClass = await Class.findByIdAndUpdate(
      req.params.classId,
      { $set: { studentList: students } },
      { new: true }
    );

    if (!updatedClass) return res.status(404).json({ message: 'Class not found' });
    res.json(updatedClass);
  } catch (error) {
    res.status(500).json({ message: 'Failed to process student list', error: error.message });
  }
});

router.get('/:classId/students', async (req, res) => {
  try {
    const classData = await Class.findById(req.params.classId);
    if (!classData) return res.status(404).json({ message: 'Class not found' });
    res.json(classData.students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;