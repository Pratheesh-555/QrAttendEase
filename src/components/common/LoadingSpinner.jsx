import { motion } from 'framer-motion';

const LoadingSpinner = ({ size = 'md', color = 'purple' }) => {
  const sizes = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  };

  const colors = {
    purple: 'border-purple-500',
    white: 'border-white'
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <motion.div
        className={`animate-spin rounded-full border-t-2 border-b-2 ${sizes[size]} ${colors[color]}`}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
      <p className="text-gray-400 mt-4">Loading...</p>
    </div>
  );
};

export default LoadingSpinner;