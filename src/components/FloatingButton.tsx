import { cn } from '@/lib/cn'
import { Icon, type IconName } from '@/components/Icon'

interface FloatingButtonProps {
  icon: IconName
  /** Accessible label — the button is icon-only. */
  label: string
  size?: 'sm' | 'md'
  active?: boolean
  className?: string
  onClick?: () => void
}

/** Circular white floating control — the mockup's signature button. */
export function FloatingButton({
  icon,
  label,
  size = 'md',
  active = false,
  className,
  onClick,
}: FloatingButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        'inline-flex items-center justify-center rounded-full',
        'transition-[color,transform,box-shadow,background-color] duration-200 ease-[var(--ease-premium)]',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink',
        'hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.96]',
        size === 'sm' ? 'h-9 w-9' : 'h-11 w-11',
        active
          ? 'bg-ink text-card'
          : 'bg-card text-ink-soft shadow-float hover:text-ink hover:shadow-card',
        className,
      )}
    >
      <Icon name={icon} size={size === 'sm' ? 15 : 17} />
    </button>
  )
}
