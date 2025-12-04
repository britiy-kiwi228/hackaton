interface AlertProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  onClose?: () => void;
}

export default function Alert({ type, message, onClose }: AlertProps) {
  const typeStyles = {
    success: 'bg-green-100 border-l-4 border-green-500 text-green-700',
    error: 'bg-red-100 border-l-4 border-red-500 text-red-700',
    warning: 'bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700',
    info: 'bg-blue-100 border-l-4 border-blue-500 text-blue-700',
  };

  return (
    <div className={`p-4 rounded-r flex justify-between items-center ${typeStyles[type]}`}>
      <span>{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          className="ml-4 font-bold hover:opacity-70"
        >
          ✕
        </button>
      )}
    </div>
  );
}
