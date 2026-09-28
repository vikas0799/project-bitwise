const Logo = ({ light = false }: { light?: boolean }) => (
  <span className="flex items-center gap-2.5">
    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-800 text-lg font-extrabold text-white shadow-md shadow-brand-600/30">
      B
    </span>
    <span className={`text-lg font-extrabold tracking-tight ${light ? 'text-white' : 'text-ink'}`}>
      Bitwise <span className={light ? 'text-brand-300' : 'text-brand-600'}>School</span>
    </span>
  </span>
);

export default Logo;
