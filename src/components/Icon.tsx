import type { ReactElement, SVGProps } from 'react'

export type IconName =
  | 'aircraft'
  | 'interior'
  | 'exterior'
  | 'summary'
  | 'chevron-left'
  | 'chevron-right'
  | 'arrow-right'
  | 'arrow-up-right'
  | 'video'
  | 'cube'
  | 'zoom-in'
  | 'expand'
  | 'seat'
  | 'palette'
  | 'sliders'
  | 'grid'

/* Ultra-light 24px line icons — single stroke family across the app. */
const ICONS: Record<IconName, ReactElement> = {
  aircraft: (
    <path d="M10.5 4.5 14 10h4.5a2 2 0 1 1 0 4H14l-3.5 5.5h-2L10 14H6.5L5 16H3l1-4-1-4h2l1.5 2H10L8.5 4.5z" />
  ),
  interior: (
    <>
      <path d="M6 11V7a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v4" />
      <path d="M5 11a2 2 0 0 1 2 2v1h10v-1a2 2 0 1 1 4 0v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2Z" />
      <path d="M7 20v1M17 20v1" />
    </>
  ),
  exterior: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="2.5" />
      <path d="M4 9.5h16M9.5 9.5V20" />
    </>
  ),
  summary: (
    <>
      <rect x="5" y="3" width="14" height="18" rx="2.5" />
      <path d="M9 8h6M9 12h6M9 16h4" />
    </>
  ),
  'chevron-left': <path d="m14 6-6 6 6 6" />,
  'chevron-right': <path d="m10 6 6 6-6 6" />,
  'arrow-right': <path d="M4 12h16m-7-7 7 7-7 7" />,
  'arrow-up-right': <path d="M7 17 17 7M8 7h9v9" />,
  video: (
    <>
      <rect x="3" y="7" width="12" height="10" rx="2.5" />
      <path d="m15 11 6-3v8l-6-3" />
    </>
  ),
  cube: (
    <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Zm0 9 8-4.5M12 12 4 7.5M12 12v9" />
  ),
  'zoom-in': (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M11 8v6M8 11h6M16.5 16.5 21 21" />
    </>
  ),
  expand: <path d="M4 9V4h5m11 5V4h-5M4 15v5h5m11-5v5h-5" />,
  seat: (
    <>
      <circle cx="9" cy="5" r="2" />
      <path d="M9 8v5l3 2.5h5l2 5.5M9 13H7a3 3 0 0 0-3 3v5" />
    </>
  ),
  palette: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />
    </>
  ),
  sliders: (
    <>
      <path d="M4 8h9m5 0h2M4 16h3m7 0h6" />
      <circle cx="15.5" cy="8" r="2" />
      <circle cx="9.5" cy="16" r="2" />
    </>
  ),
  grid: (
    <path
      d="M6 6h.01M12 6h.01M18 6h.01M6 12h.01M12 12h.01M18 12h.01M6 18h.01M12 18h.01M18 18h.01"
      strokeWidth={2.4}
    />
  ),
}

interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName
  size?: number
}

export function Icon({ name, size = 16, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {ICONS[name]}
    </svg>
  )
}
