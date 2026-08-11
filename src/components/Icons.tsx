import type { ReactElement } from 'react'

interface IconProps {
  size?: number
  color?: string
  className?: string
}

const ic = (path: string | ReactElement, viewBox = '0 0 24 24') =>
  ({ size = 24, color = 'currentColor', className = '' }: IconProps) => (
    <svg width={size} height={size} viewBox={viewBox} fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}>
      {typeof path === 'string' ? <path d={path} /> : path}
    </svg>
  )

export const HomeIcon = ic('M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10')
export const SearchIcon = ic('M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z')
export const BellIcon = ic('M15 17H9m-7-1a1 1 0 001 1h18a1 1 0 001-1v-.5c0-.4-.2-.8-.5-1L20 13V9A8 8 0 004 9v4l-1.5 2.5c-.3.2-.5.6-.5 1V16z')
export const UserIcon = ic('M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 11a4 4 0 100-8 4 4 0 000 8z')
export const HeartIcon = ({ size = 24, color = 'currentColor', filled = false, className = '' }: IconProps & { filled?: boolean }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? '#FF9F1C' : 'none'} stroke={filled ? '#FF9F1C' : color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
  </svg>
)
export const ShareIcon = ic('M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8 M16 6l-4-4-4 4 M12 2v13')
export const ChevronLeft = ic('M15 18l-6-6 6-6')
export const ChevronRight = ic('M9 18l6-6-6-6')
export const ChevronDown = ic('M6 9l6 6 6-6')
export const FilterIcon = ic('M22 3H2l8 9.46V19l4 2v-8.54L22 3z')
export const SortIcon = ic('M3 6h18M6 12h12M9 18h6')
export const ZapIcon = ic(<><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="currentColor" stroke="none" /></>)
export const MapPinIcon = ic('M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z M12 13a3 3 0 100-6 3 3 0 000 6z')
export const StarIcon = ({ size = 24, color = '#FFD166', filled = true, className = '' }: IconProps & { filled?: boolean }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : 'none'} stroke={filled ? color : 'currentColor'} strokeWidth={1.5} className={className}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
)
export const FlashIcon = ic('M13 2L3 14h9l-1 8 10-12h-9l1-8z')
export const XIcon = ic('M18 6L6 18M6 6l12 12')
export const CheckIcon = ic('M20 6L9 17l-5-5')
export const TruckIcon = ic('M1 3h15v13H1zM16 8h4l3 3v5h-7V8zM5.5 21a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM18.5 21a2.5 2.5 0 100-5 2.5 2.5 0 000 5z')
export const ClockIcon = ic('M12 22a10 10 0 100-20 10 10 0 000 20z M12 6v6l4 2')
export const TrendingDownIcon = ic('M23 18l-9.5-9.5-5 5L1 6 M17 18h6v-6')
export const TrendingUpIcon = ic('M23 6l-9.5 9.5-5-5L1 18 M17 6h6v6')
export const InfoIcon = ic('M12 22a10 10 0 100-20 10 10 0 000 20z M12 8v4 M12 16h.01')
export const MicIcon = ic('M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z M19 10v2a7 7 0 01-14 0v-2 M12 19v4 M8 23h8')
export const QrCodeIcon = ic(
  <g>
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="5" y="5" width="3" height="3" fill="currentColor" stroke="none" />
    <rect x="16" y="5" width="3" height="3" fill="currentColor" stroke="none" />
    <rect x="5" y="16" width="3" height="3" fill="currentColor" stroke="none" />
    <path d="M14 14h3v3h-3z M17 17h3v3h-3z M14 20h3" />
  </g>
)
export const GridIcon = ic('M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z')
export const LogOutIcon = ic('M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4 M16 17l5-5-5-5 M21 12H9')

// Brand marks (filled, not stroke-based like the icons above) for external
// community/platform links -- Discord invite, Android/iOS availability.
export const DiscordIcon = ({ size = 24, color = '#5865F2', className = '' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} className={className}>
    <path d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 0 0-.079.036c-.21.369-.444.85-.608 1.23a18.566 18.566 0 0 0-5.487 0 12.36 12.36 0 0 0-.617-1.23.077.077 0 0 0-.079-.037c-1.714.29-3.354.8-4.885 1.491a.07.07 0 0 0-.032.027C.533 9.093-.32 13.555.099 17.961a.08.08 0 0 0 .031.055 20.03 20.03 0 0 0 5.993 2.98.078.078 0 0 0 .084-.026 13.83 13.83 0 0 0 1.226-1.963.074.074 0 0 0-.041-.104 13.201 13.201 0 0 1-1.872-.878.075.075 0 0 1-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 0 1 .078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 0 1 .079.009c.12.098.245.195.372.288a.075.075 0 0 1-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 0 0-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 0 0 .084.028 19.963 19.963 0 0 0 6.002-2.98.076.076 0 0 0 .032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 0 0-.031-.028zM8.02 15.278c-1.182 0-2.157-1.069-2.157-2.38 0-1.312.956-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.956 2.38-2.157 2.38zm7.975 0c-1.183 0-2.157-1.069-2.157-2.38 0-1.312.955-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.946 2.38-2.157 2.38z" />
  </svg>
)

export const AndroidIcon = ({ size = 24, color = '#3DDC84', className = '' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} className={className}>
    <path d="M17.6 9.48l1.84-3.18c.16-.31.04-.69-.26-.85-.29-.15-.65-.06-.83.22l-1.88 3.24c-2.86-1.21-6.08-1.21-8.94 0L5.65 5.67c-.19-.29-.58-.38-.87-.2-.28.18-.37.54-.22.83L6.4 9.48C3.3 11.25 1.28 14.44 1 18h22c-.28-3.56-2.3-6.75-5.4-8.52zM7 15.25c-.69 0-1.25-.56-1.25-1.25s.56-1.25 1.25-1.25 1.25.56 1.25 1.25-.56 1.25-1.25 1.25zm10 0c-.69 0-1.25-.56-1.25-1.25s.56-1.25 1.25-1.25 1.25.56 1.25 1.25-.56 1.25-1.25 1.25z" />
  </svg>
)

export const AppleIcon = ({ size = 24, color = '#0F1D2D', className = '' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} className={className}>
    <path d="M16.365 1.43c0 1.14-.415 2.19-1.213 3.032-.878.94-2.288 1.665-3.406 1.573-.15-1.11.39-2.28 1.152-3.032C13.72 2.03 15.06 1.44 16.365 1.43zM20.65 17.02c-.402.918-.887 1.79-1.462 2.61-.815 1.17-1.66 2.34-2.99 2.365-1.31.026-1.73-.777-3.226-.777-1.5 0-1.965.752-3.204.803-1.29.05-2.28-1.263-3.1-2.428-1.68-2.383-2.965-6.73-1.24-9.667.858-1.46 2.392-2.384 4.06-2.408 1.263-.025 2.455.85 3.226.85.77 0 2.216-1.05 3.735-.896.636.026 2.42.257 3.567 1.938-.092.058-2.13 1.244-2.106 3.71.026 2.947 2.585 3.928 2.612 3.94-.02.066-.41 1.404-1.35 2.86z" />
  </svg>
)
export const ShieldIcon = ic('M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z')
export const HelpCircleIcon = ic('M12 22a10 10 0 100-20 10 10 0 000 20z M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3 M12 17h.01')
export const SettingsIcon = ic('M12 15a3 3 0 100-6 3 3 0 000 6z M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z')
export const CameraIcon = ({ size = 24, color = 'currentColor', className = '' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
)
export const ArrowRightIcon = ic('M5 12h14M12 5l7 7-7 7')
export const PackageIcon = ic('M16.5 9.4l-9-5.19M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 001 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z M3.27 6.96L12 12.01l8.73-5.05 M12 22.08V12')
export const StoreIcon = ic('M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10')
