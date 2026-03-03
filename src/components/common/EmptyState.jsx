const EmptyState = ({
  icon: Icon,
  title = 'No Data',
  message = 'No items to display',
  className = ''
}) => {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm p-12 text-center ${className}`}>
      {Icon && <Icon className="w-12 h-12 mx-auto mb-4 text-gray-300" />}
      <h3 className="text-lg font-medium text-gray-600 mb-2">{title}</h3>
      <p className="text-gray-400 text-sm">{message}</p>
    </div>
  );
};

export default EmptyState;