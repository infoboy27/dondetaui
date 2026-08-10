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
