interface TextareaProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  error?: string;
  disabled?: boolean;
  className?: string;
  rows?: number;
  maxLength?: number;
}

export default function Textarea({
  label,
  placeholder,
  value,
  onChange,
  error,
  disabled = false,
  className = '',
  rows = 4,
  maxLength,
}: TextareaProps) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <textarea
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        rows={rows}
        maxLength={maxLength}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50 disabled:cursor-not-allowed resize-vertical"
      />
      <div className="flex justify-between items-center mt-1">
        {error && (
          <p className="text-red-600 text-sm">{error}</p>
        )}
        {maxLength && (
          <p className="text-gray-500 text-sm ml-auto">
            {value?.length || 0}/{maxLength}
          </p>
        )}
      </div>
    </div>
  );
}