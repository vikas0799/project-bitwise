// Initials avatar, used until real team photos are added to /public.
const GRADIENTS = [
  'from-brand-500 to-indigo-600',
  'from-violet-500 to-fuchsia-600',
  'from-emerald-500 to-cyan-600',
  'from-orange-500 to-rose-600',
];

const SIZES = {
  sm: 'h-10 w-10 text-sm',
  md: 'h-16 w-16 text-xl',
  lg: 'h-24 w-24 text-3xl',
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
