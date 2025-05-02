import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const QRModal = ({ 
  isOpen, 
  onClose, 
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
            
            <div className="bg-white p-4 rounded-lg relative mb-6">
              <div 
                id="qr-code-modal" 
                className="mx-auto flex items-center justify-center min-h-[400px] min-w-[400px]"
              />
              {isGeneratingQR && (
                <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
                  <div className="animate-spin rounded-full h-10 w-10 border-4 border-purple-500 border-t-transparent"></div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default QRModal;