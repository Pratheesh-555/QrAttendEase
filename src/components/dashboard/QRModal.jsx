import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, X } from 'lucide-react';

const QRModal = ({ 
  isOpen, 
  onClose, 
  onRefresh, 
  timeLeft, 
  isGeneratingQR 
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-[600px] relative"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <h2 className="text-xl font-semibold text-purple-300 mb-6">QR Code</h2>
            
            <div className="bg-white p-4 rounded-lg relative mb-6 flex justify-center items-center min-h-[400px]">
              <div 
                id="qr-code-modal" 
                className="flex items-center justify-center"
              />
              <motion.div 
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                className="absolute top-4 right-4 bg-purple-600 text-white rounded-full w-10 h-10 flex items-center justify-center text-lg font-semibold"
              >
                {timeLeft}
              </motion.div>
              {isGeneratingQR && (
                <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
                  <div className="animate-spin rounded-full h-10 w-10 border-4 border-purple-500 border-t-transparent"></div>
                </div>
              )}
            </div>

            <div className="flex justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onRefresh}
                disabled={isGeneratingQR}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 text-lg font-medium"
              >
                <RefreshCw className="w-5 h-5" />
                Refresh QR Code
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default QRModal;