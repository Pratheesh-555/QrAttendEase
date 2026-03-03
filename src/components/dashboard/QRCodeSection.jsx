import { Eye, EyeOff, RefreshCw, Play, Square } from 'lucide-react';

const QRCodeSection = ({
  showQR,
  isGeneratingQR,
  onStartAttendance,
  onStopAttendance,
  onQRClick,
  onRefresh
}) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <h2 className="text-base font-semibold text-gray-900">Attendance QR Code</h2>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <button
            onClick={() => showQR ? onStopAttendance() : onStartAttendance()}
            className={`${showQR
                ? 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200'
                : 'bg-green-50 hover:bg-green-100 text-green-700 border-green-200'
              } border px-4 py-2 rounded-lg transition-colors flex items-center text-sm font-medium flex-1 sm:flex-initial justify-center`}
          >
            {showQR ? (
              <>
                <Square className="w-4 h-4 mr-2" />
                Stop Session
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Start Session
              </>
            )}
          </button>
        </div>
      </div>

      {showQR && (
        <div className="flex flex-col items-center">
          <div
            className="bg-white p-4 rounded-lg border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
            onClick={onQRClick}
          >
            <div
              id="qr-code"
              className="flex items-center justify-center w-[250px] h-[250px] sm:w-[300px] sm:h-[300px]"
            />
            {isGeneratingQR && (
              <div className="absolute inset-0 bg-white/75 flex items-center justify-center rounded-lg">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={onRefresh}
              disabled={isGeneratingQR}
              className="bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 px-4 py-2 rounded-lg transition-colors flex items-center disabled:opacity-50 text-sm font-medium"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh QR
            </button>
          </div>

          <p className="text-xs text-gray-400 mt-3">Click QR to enlarge • Auto-refreshes every 30s</p>
        </div>
      )}

      {!showQR && (
        <div className="text-center py-8 text-gray-400 text-sm">
          Click "Start Session" to generate a QR code for students to scan
        </div>
      )}
    </div>
  );
};

export default QRCodeSection;