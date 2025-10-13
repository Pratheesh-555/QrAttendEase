import { motion } from 'framer-motion';

export const CardSkeleton = () => (
  <div className="bg-gray-800 rounded-xl p-6 animate-pulse">
    <div className="h-4 bg-gray-700 rounded w-3/4 mb-4"></div>
    <div className="h-4 bg-gray-700 rounded w-1/2"></div>
  </div>
);

export const ListSkeleton = ({ count = 3 }) => (
  <div className="space-y-3">
    {[...Array(count)].map((_, idx) => (
      <div key={idx} className="bg-gray-800 rounded-lg p-4 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-700 rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-700 rounded w-3/4"></div>
            <div className="h-3 bg-gray-700 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

export const TableSkeleton = ({ rows = 5, columns = 4 }) => (
  <div className="bg-gray-800 rounded-lg overflow-hidden">
    <div className="divide-y divide-gray-700">
      {/* Header */}
      <div className="grid gap-4 p-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {[...Array(columns)].map((_, idx) => (
          <div key={idx} className="h-4 bg-gray-700 rounded animate-pulse"></div>
        ))}
      </div>
      {/* Rows */}
      {[...Array(rows)].map((_, rowIdx) => (
        <div key={rowIdx} className="grid gap-4 p-4 animate-pulse" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {[...Array(columns)].map((_, colIdx) => (
            <div key={colIdx} className="h-4 bg-gray-700 rounded"></div>
          ))}
        </div>
      ))}
    </div>
  </div>
);

export const ChartSkeleton = () => (
  <div className="bg-gray-800 rounded-lg p-6">
    <div className="h-6 bg-gray-700 rounded w-1/3 mb-6 animate-pulse"></div>
    <div className="space-y-3">
      {[...Array(8)].map((_, idx) => (
        <div key={idx} className="flex items-end gap-2" style={{ height: '40px' }}>
          <div 
            className="bg-gray-700 rounded-t animate-pulse" 
            style={{ 
              width: '100%', 
              height: `${Math.random() * 80 + 20}%` 
            }}
          ></div>
        </div>
      ))}
    </div>
  </div>
);

export const QRSkeleton = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="bg-gray-800 rounded-xl p-6"
  >
    <div className="aspect-square bg-gray-700 rounded-lg animate-pulse max-w-xs mx-auto"></div>
    <div className="mt-4 space-y-3">
      <div className="h-4 bg-gray-700 rounded w-3/4 mx-auto animate-pulse"></div>
      <div className="h-4 bg-gray-700 rounded w-1/2 mx-auto animate-pulse"></div>
    </div>
  </motion.div>
);

export const DashboardSkeleton = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
    </div>
    <div className="grid lg:grid-cols-2 gap-6">
      <div>
        <ListSkeleton count={4} />
      </div>
      <div>
        <QRSkeleton />
      </div>
    </div>
  </div>
);
