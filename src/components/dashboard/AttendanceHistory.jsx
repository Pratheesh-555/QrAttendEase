import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Download, TrendingUp, Users, BarChart3, Filter, X } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isWithinInterval } from 'date-fns';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { toast } from 'react-hot-toast';

const COLORS = ['#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#3b82f6'];

const AttendanceHistory = ({ classes, onClose }) => {
  const [selectedClass, setSelectedClass] = useState('all');
  const [dateRange, setDateRange] = useState({
    start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    end: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });
  const [viewMode, setViewMode] = useState('chart'); // chart, table, stats

  // Generate mock historical data (replace with real API data)
  const generateHistoricalData = useMemo(() => {
    const data = [];
    const start = new Date(dateRange.start);
    const end = new Date(dateRange.end);
    
    const days = eachDayOfInterval({ start, end });
    
    days.forEach(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      classes.forEach(cls => {
        if (selectedClass === 'all' || selectedClass === cls.id.toString()) {
          // Generate random attendance (replace with real data)
          const totalStudents = cls.studentCount || 30;
          const presentCount = Math.floor(Math.random() * 10) + Math.floor(totalStudents * 0.7);
          
          data.push({
            date: dayStr,
            className: cls.name,
            classId: cls.id,
            present: presentCount,
            absent: totalStudents - presentCount,
            total: totalStudents,
            percentage: ((presentCount / totalStudents) * 100).toFixed(1)
          });
        }
      });
    });
    
    return data;
  }, [classes, selectedClass, dateRange]);

  // Aggregate data for charts
  const chartData = useMemo(() => {
    const dateMap = {};
    
    generateHistoricalData.forEach(record => {
      if (!dateMap[record.date]) {
        dateMap[record.date] = {
          date: format(new Date(record.date), 'MMM dd'),
          present: 0,
          absent: 0,
          total: 0
        };
      }
      dateMap[record.date].present += record.present;
      dateMap[record.date].absent += record.absent;
      dateMap[record.date].total += record.total;
    });
    
    return Object.values(dateMap).map(d => ({
      ...d,
      percentage: d.total > 0 ? ((d.present / d.total) * 100).toFixed(1) : 0
    }));
  }, [generateHistoricalData]);

  // Statistics
  const statistics = useMemo(() => {
    if (generateHistoricalData.length === 0) {
      return {
        totalClasses: 0,
        averageAttendance: 0,
        totalPresent: 0,
        totalAbsent: 0,
        bestClass: null,
        worstClass: null
      };
    }

    const classStats = {};
    
    generateHistoricalData.forEach(record => {
      if (!classStats[record.className]) {
        classStats[record.className] = {
          name: record.className,
          totalPresent: 0,
          totalAbsent: 0,
          sessions: 0
        };
      }
      classStats[record.className].totalPresent += record.present;
      classStats[record.className].totalAbsent += record.absent;
      classStats[record.className].sessions += 1;
    });

    const classArray = Object.values(classStats).map(cls => ({
      ...cls,
      percentage: ((cls.totalPresent / (cls.totalPresent + cls.totalAbsent)) * 100).toFixed(1)
    }));

    const totalPresent = generateHistoricalData.reduce((sum, r) => sum + r.present, 0);
    const totalAbsent = generateHistoricalData.reduce((sum, r) => sum + r.absent, 0);
    const total = totalPresent + totalAbsent;

    return {
      totalClasses: generateHistoricalData.length,
      averageAttendance: total > 0 ? ((totalPresent / total) * 100).toFixed(1) : 0,
      totalPresent,
      totalAbsent,
      bestClass: classArray.length > 0 ? classArray.reduce((a, b) => parseFloat(a.percentage) > parseFloat(b.percentage) ? a : b) : null,
      worstClass: classArray.length > 0 ? classArray.reduce((a, b) => parseFloat(a.percentage) < parseFloat(b.percentage) ? a : b) : null,
      classStats: classArray
    };
  }, [generateHistoricalData]);

  // Export to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(18);
    doc.text('Attendance Report', 14, 20);
    
    // Date range
    doc.setFontSize(11);
    doc.text(`Period: ${format(new Date(dateRange.start), 'MMM dd, yyyy')} - ${format(new Date(dateRange.end), 'MMM dd, yyyy')}`, 14, 30);
    
    // Statistics
    doc.setFontSize(12);
    doc.text('Summary Statistics', 14, 40);
    doc.setFontSize(10);
    doc.text(`Total Classes: ${statistics.totalClasses}`, 14, 48);
    doc.text(`Average Attendance: ${statistics.averageAttendance}%`, 14, 54);
    doc.text(`Total Present: ${statistics.totalPresent}`, 14, 60);
    doc.text(`Total Absent: ${statistics.totalAbsent}`, 14, 66);
    
    // Table
    const tableData = generateHistoricalData.map(record => [
      format(new Date(record.date), 'MMM dd, yyyy'),
      record.className,
      record.present,
      record.absent,
      record.total,
      `${record.percentage}%`
    ]);
    
    doc.autoTable({
      startY: 75,
      head: [['Date', 'Class', 'Present', 'Absent', 'Total', 'Percentage']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [139, 92, 246] }
    });
    
    doc.save(`attendance-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    toast.success('PDF exported successfully!');
  };

  // Export to Excel (CSV)
  const exportToCSV = () => {
    const headers = ['Date', 'Class', 'Present', 'Absent', 'Total', 'Percentage'];
    const rows = generateHistoricalData.map(record => [
      format(new Date(record.date), 'MMM dd, yyyy'),
      record.className,
      record.present,
      record.absent,
      record.total,
      `${record.percentage}%`
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast.success('CSV exported successfully!');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gray-800 rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Calendar className="w-7 h-7" />
                Attendance History & Analytics
              </h2>
              <p className="text-purple-100 text-sm mt-1">Track and analyze attendance trends</p>
            </div>
            <button
              onClick={onClose}
              className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-purple-100 mb-1 block">Class</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full bg-white/20 border border-white/30 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                <option value="all">All Classes</option>
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id.toString()}>{cls.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-purple-100 mb-1 block">Start Date</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="w-full bg-white/20 border border-white/30 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
              />
            </div>
            <div>
              <label className="text-xs text-purple-100 mb-1 block">End Date</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="w-full bg-white/20 border border-white/30 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
              />
            </div>
          </div>
        </div>

        {/* View Tabs */}
        <div className="bg-gray-700 px-6 py-3 flex gap-2 border-b border-gray-600">
          <button
            onClick={() => setViewMode('chart')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              viewMode === 'chart' ? 'bg-purple-600 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Charts
          </button>
          <button
            onClick={() => setViewMode('stats')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              viewMode === 'stats' ? 'bg-purple-600 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Statistics
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              viewMode === 'table' ? 'bg-purple-600 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
            }`}
          >
            <Filter className="w-4 h-4" />
            Table
          </button>
          <div className="ml-auto flex gap-2">
            <button
              onClick={exportToPDF}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
            >
              <Download className="w-4 h-4" />
              PDF
            </button>
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm"
            >
              <Download className="w-4 h-4" />
              CSV
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-280px)]">
          <AnimatePresence mode="wait">
            {viewMode === 'chart' && (
              <motion.div
                key="chart"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Line Chart */}
                <div className="bg-gray-700 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Attendance Trend</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="date" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                        labelStyle={{ color: '#f3f4f6' }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="present" stroke="#8b5cf6" strokeWidth={2} name="Present" />
                      <Line type="monotone" dataKey="absent" stroke="#ec4899" strokeWidth={2} name="Absent" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Bar Chart */}
                <div className="bg-gray-700 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Daily Attendance Rate</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="date" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                        labelStyle={{ color: '#f3f4f6' }}
                      />
                      <Legend />
                      <Bar dataKey="percentage" fill="#8b5cf6" name="Attendance %" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            )}

            {viewMode === 'stats' && (
              <motion.div
                key="stats"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg p-6 text-white">
                    <div className="flex items-center justify-between mb-2">
                      <Calendar className="w-8 h-8 opacity-80" />
                      <span className="text-3xl font-bold">{statistics.totalClasses}</span>
                    </div>
                    <p className="text-purple-100 text-sm">Total Sessions</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-lg p-6 text-white">
                    <div className="flex items-center justify-between mb-2">
                      <TrendingUp className="w-8 h-8 opacity-80" />
                      <span className="text-3xl font-bold">{statistics.averageAttendance}%</span>
                    </div>
                    <p className="text-green-100 text-sm">Average Attendance</p>
                  </div>
                  <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg p-6 text-white">
                    <div className="flex items-center justify-between mb-2">
                      <Users className="w-8 h-8 opacity-80" />
                      <span className="text-3xl font-bold">{statistics.totalPresent}</span>
                    </div>
                    <p className="text-blue-100 text-sm">Total Present</p>
                  </div>
                  <div className="bg-gradient-to-br from-pink-600 to-pink-700 rounded-lg p-6 text-white">
                    <div className="flex items-center justify-between mb-2">
                      <Users className="w-8 h-8 opacity-80" />
                      <span className="text-3xl font-bold">{statistics.totalAbsent}</span>
                    </div>
                    <p className="text-pink-100 text-sm">Total Absent</p>
                  </div>
                </div>

                {/* Best/Worst Classes */}
                <div className="grid md:grid-cols-2 gap-4">
                  {statistics.bestClass && (
                    <div className="bg-gray-700 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                        <span className="text-2xl">🏆</span>
                        Best Attendance
                      </h3>
                      <p className="text-2xl font-bold text-green-400">{statistics.bestClass.name}</p>
                      <p className="text-gray-300 mt-2">{statistics.bestClass.percentage}% attendance rate</p>
                      <p className="text-sm text-gray-400 mt-1">{statistics.bestClass.sessions} sessions</p>
                    </div>
                  )}
                  {statistics.worstClass && (
                    <div className="bg-gray-700 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                        <span className="text-2xl">📉</span>
                        Needs Attention
                      </h3>
                      <p className="text-2xl font-bold text-orange-400">{statistics.worstClass.name}</p>
                      <p className="text-gray-300 mt-2">{statistics.worstClass.percentage}% attendance rate</p>
                      <p className="text-sm text-gray-400 mt-1">{statistics.worstClass.sessions} sessions</p>
                    </div>
                  )}
                </div>

                {/* Class-wise Statistics */}
                <div className="bg-gray-700 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Class-wise Performance</h3>
                  <div className="space-y-3">
                    {statistics.classStats.map((cls, idx) => (
                      <div key={idx} className="bg-gray-600 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-white">{cls.name}</span>
                          <span className="text-purple-400 font-bold">{cls.percentage}%</span>
                        </div>
                        <div className="w-full bg-gray-500 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all"
                            style={{ width: `${cls.percentage}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-gray-400 mt-2">
                          <span>Present: {cls.totalPresent}</span>
                          <span>Absent: {cls.totalAbsent}</span>
                          <span>Sessions: {cls.sessions}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {viewMode === 'table' && (
              <motion.div
                key="table"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-gray-700 rounded-lg overflow-hidden"
              >
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-600">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Class</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Present</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Absent</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Total</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-600">
                      {generateHistoricalData.map((record, idx) => (
                        <tr key={idx} className="hover:bg-gray-600 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {format(new Date(record.date), 'MMM dd, yyyy')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                            {record.className}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-green-400">
                            {record.present}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-pink-400">
                            {record.absent}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {record.total}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              parseFloat(record.percentage) >= 75
                                ? 'bg-green-100 text-green-800'
                                : parseFloat(record.percentage) >= 60
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {record.percentage}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AttendanceHistory;
