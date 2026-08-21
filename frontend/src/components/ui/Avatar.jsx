import { useState, useEffect } from 'react';

/**
 * Avatar con soporte para imagen y fallback con iniciales.
 */
export default function Avatar({
  src,
  alt = '',
  name = '',
  size = 'md',
  className = '',
}) {
  const [imgError, setImgError] = useState(false);

  // Resetear error si la URL de src cambia
  useEffect(() => {
    setImgError(false);
  }, [src]);

  const sizes = {
    xs: 'w-6 h-6 text-[9px]',
    sm: 'w-8 h-8 text-[10px]',
    md: 'w-10 h-10 text-xs',
    lg: 'w-12 h-12 text-sm',
    xl: 'w-16 h-16 text-lg',
    '2xl': 'w-24 h-24 text-2xl',
    '3xl': 'w-32 h-32 text-3xl',
  };

  const initials = name
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={alt || name}
        onError={() => setImgError(true)}
        className={`${sizes[size] || sizes.md} rounded-full border-2 border-secondary shadow-sm object-cover ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizes[size] || sizes.md} rounded-full bg-primary-container text-on-primary-container 
        flex items-center justify-center font-bold tracking-wider select-none shadow-sm ${className}`}
    >
      {initials || '?'}
    </div>
  );
}
