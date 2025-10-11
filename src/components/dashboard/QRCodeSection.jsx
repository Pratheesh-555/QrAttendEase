import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Send, RefreshCw } from 'lucide-react';

const QRCodeSection = ({ 
  showQR, 
  isGeneratingQR,
  isSendingEmail,
  onStartAttendance,
  onStopAttendance,
  onQRClick,
  onCloseAttendance,
  onRefresh
}) => {
  return (
    <div className="bg-gray-800 rounded-lg shadow-xl p-4 sm:p-6 overflow-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <h2 className="text-lg sm:text-xl font-semibold text-purple-300">Attendance QR Code</h2>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onCloseAttendance}
            disabled={!showQR || isSendingEmail}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors flex items-center disabled:opacity-50 text-sm sm:text-base flex-1 sm:flex-initial justify-center"
          >
            <Send className="w-4 h-4 mr-2" />
            {isSendingEmail ? 'Sending...' : 'Close'}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => showQR ? onStopAttendance() : onStartAttendance()}
            className={`${
              showQR 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-green-600 hover:bg-green-700'
            } text-white px-3 sm:px-4 py-2 rounded-lg transition-colors flex items-center text-sm sm:text-base flex-1 sm:flex-initial justify-center`}
          >
            {showQR ? (
              <>
                <EyeOff className="w-4 h-4 mr-2" />
                Stop
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 mr-2" />
                Start
              </>
            )}
          </motion.button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {showQR && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, height: 0 }}
            animate={{ opacity: 1, scale: 1, height: 'auto' }}
            exit={{ opacity: 0, scale: 0.9, height: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center overflow-hidden"
          >
            <div 
              className="bg-white p-4 sm:p-6 rounded-lg relative cursor-pointer hover:shadow-lg transition-shadow"
              onClick={onQRClick}
            >
              <div 
                id="qr-code" 
                className="flex items-center justify-center w-[250px] h-[250px] sm:w-[300px] sm:h-[300px]"
              />
              {isGeneratingQR && (
                <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-purple-500 border-t-transparent"></div>
                </div>
              )}
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onRefresh}
              disabled={isGeneratingQR}
              className="mt-4 mb-2 bg-purple-600 hover:bg-purple-700 text-white px-4 sm:px-6 py-2 rounded-lg transition-colors flex items-center disabled:opacity-50 text-sm sm:text-base"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh QR Code
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default QRCodeSection;