interface IconProps {
  src: string;
  className?: string;
  alt?: string;
}

export function Icon({ src, className = 'h-5 w-5', alt = '' }: IconProps) {
  return (
    <img
      src={src}
      alt={alt}
      aria-hidden={alt ? undefined : true}
      className={className}
    />
  );
}
