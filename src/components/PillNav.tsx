import { cn } from '@/lib/cn'
import { Icon, type IconName } from '@/components/Icon'

export interface NavItem {
  id: string
  label: string
  icon: IconName
}

interface PillNavProps {
  items: NavItem[]
  activeId: string
  onSelect?: (id: string) => void
  className?: string
}

/** Top navigation — white pills, active state solid ink (mockup fidelity). */
export function PillNav({ items, activeId, onSelect, className }: PillNavProps) {
  return (
    <nav aria-label="Étapes du configurateur" className={cn('flex items-center gap-2', className)}>
      {items.map((item) => {
        const active = item.id === activeId
        return (
          <button
            key={item.id}
            type="button"
            aria-current={active ? 'page' : undefined}
            onClick={() => onSelect?.(item.id)}
            className={cn(
              'inline-flex shrink-0 items-center gap-2 rounded-pill px-4 py-2.5',
              'text-xs font-medium tracking-wide',
              'transition-[color,transform,box-shadow,background-color] duration-200 ease-[var(--ease-premium)]',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink',
              'active:scale-[0.97]',
              active
                ? 'bg-ink text-card'
                : 'bg-card text-ink-soft shadow-sm hover:-translate-y-0.5 hover:text-ink hover:shadow-float',
            )}
          >
            <Icon name={item.icon} size={14} />
            {item.label}
          </button>
        )
      })}
    </nav>
  )
}
