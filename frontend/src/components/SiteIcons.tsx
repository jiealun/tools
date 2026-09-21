import type { ImgHTMLAttributes, SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

const lineIconProps = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  viewBox: '0 0 24 24',
  'aria-hidden': true,
}

export function BrandMark({ className }: ImgHTMLAttributes<HTMLImageElement>) {
  return <img className={className} src="/rainbow-tools-logo.svg" alt="" aria-hidden="true" />
}

export function SearchIcon(props: IconProps) {
  return <svg {...lineIconProps} {...props}><circle cx="11" cy="11" r="6.75" /><path d="m16 16 4.25 4.25" /></svg>
}

export function ArrowUpRightIcon(props: IconProps) {
  return <svg {...lineIconProps} {...props}><path d="M7 17 17 7M8 7h9v9" /></svg>
}

export function ArrowLeftIcon(props: IconProps) {
  return <svg {...lineIconProps} {...props}><path d="m10 6-6 6 6 6M4 12h16" /></svg>
}

export function BoxIcon(props: IconProps) {
  return <svg {...lineIconProps} {...props}><path d="m4.75 7.75 7.25-4 7.25 4v8.5l-7.25 4-7.25-4v-8.5Z" /><path d="m5 8 7 4 7-4M12 12v8" /></svg>
}

export function DownloadIcon(props: IconProps) {
  return <svg {...lineIconProps} {...props}><path d="M12 3v12m0 0 4-4m-4 4-4-4M5 20h14" /></svg>
}

export function KeyIcon(props: IconProps) {
  return <svg {...lineIconProps} {...props}><circle cx="8.5" cy="15.5" r="4.5" /><path d="m12 12 7-7m-2 2 2 2m-5-1 2 2" /></svg>
}

export function CheckIcon(props: IconProps) {
  return <svg {...lineIconProps} {...props}><path d="m5 12.5 4.2 4.2L19 7" /></svg>
}

export function ChartIcon(props: IconProps) {
  return <svg {...lineIconProps} {...props}><path d="M5 20V10m7 10V4m7 16v-7" /></svg>
}

export function BookIcon(props: IconProps) {
  return <svg {...lineIconProps} {...props}><path d="M4.5 5.5A3.5 3.5 0 0 1 8 2h4v18H8a3.5 3.5 0 0 0-3.5 3V5.5Z" /><path d="M19.5 5.5A3.5 3.5 0 0 0 16 2h-4v18h4a3.5 3.5 0 0 1 3.5 3V5.5Z" /></svg>
}

export function ImageIcon(props: IconProps) {
  return <svg {...lineIconProps} {...props}><rect x="3" y="4" width="18" height="16" rx="3" /><circle cx="9" cy="10" r="1.5" /><path d="m5.5 17 4.25-4 3.25 3 2.25-2 3.25 3" /></svg>
}

export function DocumentIcon(props: IconProps) {
  return <svg {...lineIconProps} {...props}><path d="M7 3h7l4 4v14H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" /><path d="M14 3v5h4M9 13h6M9 17h4" /></svg>
}

export function ChatIcon(props: IconProps) {
  return <svg {...lineIconProps} {...props}><path d="M5 5.5A2.5 2.5 0 0 1 7.5 3h9A2.5 2.5 0 0 1 19 5.5v6a2.5 2.5 0 0 1-2.5 2.5H11l-4.5 3v-3.15A2.5 2.5 0 0 1 5 11.5v-6Z" /><path d="M8.5 8.5h7M8.5 11h4" /></svg>
}

export function PaperclipIcon(props: IconProps) {
  return <svg {...lineIconProps} {...props}><path d="m9.25 12.75 5.7-5.7a3.18 3.18 0 0 1 4.5 4.5l-6.86 6.86a4.5 4.5 0 0 1-6.36-6.36l6.38-6.38a2.9 2.9 0 0 1 4.1 4.1l-6.04 6.04a1.45 1.45 0 0 1-2.05-2.05l5.44-5.44" /></svg>
}

export function SendIcon(props: IconProps) {
  return <svg {...lineIconProps} {...props}><path d="m21 3-7.5 18-3.2-7.3L3 10.5 21 3Z" /><path d="m10.3 13.7 4.2-4.2" /></svg>
}

export function CloseIcon(props: IconProps) {
  return <svg {...lineIconProps} {...props}><path d="m6 6 12 12M18 6 6 18" /></svg>
}
