import { cn } from '@/lib/cn'
import { Icon } from '@/components/Icon'

interface SectionTabsProps {
  count: number
  activeIndex: number
  onSelect?: (index: number) => void
  className?: string
}

/** Cabin-section selector 1…n — jet-outline pill from the mockup. */
export function SectionTabs({ count, activeIndex, onSelect, className }: SectionTabsProps) {
  return (
    <div
      role="group"
      aria-label="Sections de la cabine"
      className={cn(
        'flex items-center gap-1.5 rounded-pill border border-line-strong py-1.5 pl-3 pr-1.5',
        className,
      )}
    >
      {/* nose glyph — echoes the mockup's jet outline */}
      <Icon name="aircraft" size={13} className="mr-1 shrink-0 text-ink-subtle" />
      {Array.from({ length: count }, (_, i) => {
        const active = i === activeIndex
        return (
          <button
            key={i}
            type="button"
            aria-pressed={active}
            aria-label={`Section ${i + 1}`}
            onClick={() => onSelect?.(i)}
            className={cn(
              'inline-flex h-8 min-w-12 items-center justify-center rounded-pill px-3',
              'text-xs font-medium transition-colors duration-200 ease-[var(--ease-premium)]',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink',
              active
                ? 'bg-ink text-card'
                : 'bg-surface-sunken text-ink-muted hover:text-ink-soft',
            )}
          >
            {i + 1}
          </button>
        )
      })}
    </div>
  )
}
