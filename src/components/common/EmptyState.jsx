import { motion } from 'framer-motion';

const EmptyState = ({ 
  icon: Icon,
  title = 'No Data',
  message = 'No items to display',
  className = ''
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`bg-gray-800 rounded-lg shadow-xl p-12 text-center ${className}`}
    >
      {Icon && <Icon className="w-12 h-12 mx-auto mb-4 text-gray-500" />}
      <h3 className="text-lg font-medium text-gray-300 mb-2">{title}</h3>
      <p className="text-gray-400">{message}</p>
    </motion.div>
  );
};

export default EmptyState;