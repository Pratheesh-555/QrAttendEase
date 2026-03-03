const LoadingSpinner = ({ size = 'md', color = 'blue' }) => {
  const sizes = {
    sm: 'h-6 w-6',
    md: 'h-10 w-10',
    lg: 'h-14 w-14'
  };

  const colors = {
    blue: 'border-blue-500',
    white: 'border-white',
    gray: 'border-gray-500'
  };

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div
        className={`animate-spin rounded-full border-2 border-t-transparent ${sizes[size]} ${colors[color]}`}
      />
      <p className="text-gray-400 mt-4 text-sm">Loading...</p>
    </div>
  );
};

export default LoadingSpinner;