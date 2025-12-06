interface AvatarProps {
  src?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function Avatar({ src, name, size = 'md', className = '' }: AvatarProps) {
  const sizeStyles = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-lg',
  };

  const getInitials = (fullName?: string) => {
    if (!fullName) return '?';
    return fullName
      .split(' ')
      .map((name) => name[0])
      .join('')
      .toUpperCase();
  };

  if (src) {
    return (
      <img
        src={src}
        alt={name || 'Avatar'}
        className={`rounded-full object-cover bg-gray-300 ${sizeStyles[size]} ${className}`}
      />
    );
  }

  return (
    <div
      className={`rounded-full bg-blue-600 text-white font-bold flex items-center justify-center ${sizeStyles[size]} ${className}`}
    >
      {getInitials(name)}
    </div>
  );
}
