interface Props {
  size?: 'sm' | 'md' | 'lg'
}

export default function WC2026Logo({ size = 'md' }: Props) {
  const scale = size === 'sm' ? 'scale-75' : size === 'lg' ? 'scale-125' : ''

  return (
    <div className={`flex flex-col items-center select-none ${scale}`}>
      {/* Trophy SVG */}
      <svg
        viewBox="0 0 80 80"
        className={`${size === 'sm' ? 'w-10 h-10' : size === 'lg' ? 'w-24 h-24' : 'w-16 h-16'}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="trophyGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFD700" />
            <stop offset="50%" stopColor="#FFA500" />
            <stop offset="100%" stopColor="#FF6B00" />
          </linearGradient>
          <linearGradient id="trophyShine" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFF9C4" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#FF6B00" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Cup body */}
        <path
          d="M24 8 H56 L52 38 C50 50 44 54 40 54 C36 54 30 50 28 38 Z"
          fill="url(#trophyGold)"
        />
        {/* Shine */}
        <path
          d="M28 8 H52 L50 26 C44 20 36 20 30 26 Z"
          fill="url(#trophyShine)"
        />
        {/* Handles */}
        <path
          d="M24 12 C16 12 12 18 12 24 C12 32 18 36 26 34"
          stroke="url(#trophyGold)" strokeWidth="4" strokeLinecap="round" fill="none"
        />
        <path
          d="M56 12 C64 12 68 18 68 24 C68 32 62 36 54 34"
          stroke="url(#trophyGold)" strokeWidth="4" strokeLinecap="round" fill="none"
        />
        {/* Stem */}
        <rect x="36" y="54" width="8" height="12" fill="url(#trophyGold)" rx="1" />
        {/* Base */}
        <rect x="26" y="66" width="28" height="6" fill="url(#trophyGold)" rx="3" />
        {/* Ball in cup */}
        <circle cx="40" cy="30" r="8" fill="white" fillOpacity="0.15" />
        <path
          d="M40 22 L43 29 L40 32 L37 29 Z M43 29 L50 28 M37 29 L30 28 M40 32 L42 38 M40 32 L38 38"
          stroke="white" strokeWidth="1" strokeOpacity="0.4" strokeLinecap="round" fill="none"
        />
      </svg>

      {/* Text */}
      <div className="text-center mt-1">
        <div className="text-[9px] font-bold tracking-[0.25em] text-amber-400/80 uppercase">
          FIFA World Cup™
        </div>
        <div
          className="text-2xl font-black tracking-tight leading-none"
          style={{
            background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FF6B00 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          2026
        </div>
        <div className="text-[8px] font-semibold tracking-[0.3em] text-amber-500/60 uppercase mt-0.5">
          USA · Canada · Mexico
        </div>
      </div>
    </div>
  )
}
