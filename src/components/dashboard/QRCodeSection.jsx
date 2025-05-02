import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Send } from 'lucide-react';

const QRCodeSection = ({ 
  showQR, 
  isGeneratingQR,
  isSendingEmail,
  onStartAttendance,
  onStopAttendance,
  onQRClick,
  onCloseAttendance
}) => {
  return (
    <div className="bg-gray-800 rounded-lg shadow-xl p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-purple-300">Attendance QR Code</h2>
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onCloseAttendance}
            disabled={!showQR || isSendingEmail}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center disabled:opacity-50"
          >
            <Send className="w-4 h-4 mr-2" />
            {isSendingEmail ? 'Sending...' : 'Close Attendance'}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => showQR ? onStopAttendance() : onStartAttendance()}
            className={`${
              showQR 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-green-600 hover:bg-green-700'
            } text-white px-4 py-2 rounded-lg transition-colors flex items-center`}
          >
            {showQR ? (
              <>
                <EyeOff className="w-4 h-4 mr-2" />
                Stop Attendance
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 mr-2" />
                Start Attendance
              </>
            )}
          </motion.button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {showQR && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="text-center"
          >
            <div 
              className="bg-white p-6 rounded-lg inline-block relative cursor-pointer hover:shadow-lg transition-shadow"
              onClick={onQRClick}
            >
              <div 
                id="qr-code" 
                className="mx-auto flex items-center justify-center min-h-[300px] min-w-[300px]"
              />
              {isGeneratingQR && (
                <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-purple-500 border-t-transparent"></div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default QRCodeSection;