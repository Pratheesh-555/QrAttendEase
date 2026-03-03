import { X } from 'lucide-react';

const QRModal = ({
  isOpen,
  onClose,
  isGeneratingQR
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-[550px] relative border border-gray-200"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-lg font-semibold text-gray-900 mb-4">Attendance QR Code</h2>

        <div className="bg-gray-50 p-4 rounded-lg relative border border-gray-200">
          <div
            id="qr-code-modal"
            className="mx-auto flex items-center justify-center min-h-[400px] min-w-[400px]"
          />
          {isGeneratingQR && (
            <div className="absolute inset-0 bg-white/75 flex items-center justify-center rounded-lg">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent"></div>
            </div>
          )}
        </div>

        <p className="text-xs text-gray-400 text-center mt-3">Display this QR code to students for attendance</p>
      </div>
    </div>
  );
};

export default QRModal;