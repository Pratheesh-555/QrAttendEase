import Class from '../models/Class.js';

export const createClass = async (req, res) => {
  try {
    const { teacherEmail, className, students } = req.body;
    const newClass = new Class({ teacherEmail, className, students });
    await newClass.save();
    res.status(201).json(newClass);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getTeacherClasses = async (req, res) => {
  try {
    const { teacherEmail } = req.params;
    const classes = await Class.find({ teacherEmail });
    res.status(200).json(classes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};