// Team photo when we have one (public/team), otherwise an initials avatar.
const PHOTOS: Record<string, string> = {
  'Vikas Patel': '/team/vikas-patel.jpg',
};

const GRADIENTS = [
  'from-brand-500 to-brand-700',
  'from-ink to-brand-700',
  'from-brand-400 to-brand-600',
  'from-slate-600 to-ink',
];

const SIZES = {
  sm: 'h-10 w-10 text-sm',
  md: 'h-16 w-16 text-xl',
  lg: 'h-24 w-24 text-3xl',
  xl: 'h-32 w-32 text-4xl',
} as const;

interface AvatarProps {
  name: string;
  size?: keyof typeof SIZES;
  tone?: number;
  className?: string;
}

const Avatar = ({ name, size = 'md', tone = 0, className = '' }: AvatarProps) => {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const photo = PHOTOS[name];
  if (photo) {
    return (
      <img
        src={photo}
        alt={name}
        width={256}
        height={256}
        loading="lazy"
        decoding="async"
        className={`shrink-0 rounded-full object-cover object-top ${SIZES[size]} ${className}`}
      />
    );
  }

  return (
    <span
      role="img"
      aria-label={name}
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-bold text-white ${GRADIENTS[tone % GRADIENTS.length]} ${SIZES[size]} ${className}`}
    >
      {initials}
    </span>
  );
};

export default Avatar;
