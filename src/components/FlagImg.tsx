'use client'

import { flagUrl } from '@/lib/flags'

interface Props {
  team: string
  size?: number
}

export default function FlagImg({ team, size = 24 }: Props) {
  const url = flagUrl(team)
  if (!url) return null

  return (
    <img
      src={url}
      alt={`${team} flag`}
      width={size}
      height={Math.round(size * 0.67)}
      className="rounded-sm object-cover flex-shrink-0 shadow-sm"
      style={{ width: size, height: Math.round(size * 0.67) }}
      loading="lazy"
    />
  )
}
