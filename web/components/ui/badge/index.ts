import type { VariantProps } from 'class-variance-authority'
import { cva } from 'class-variance-authority'

export { default as Badge } from './Badge.vue'

export const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap',
  {
    variants: {
      variant: {
        critical: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200',
        high: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200',
        elevated: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
        relevant: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200',
        muted: 'bg-muted font-medium',
      },
    },
    defaultVariants: {
      variant: 'muted',
    },
  },
)

export type BadgeVariants = VariantProps<typeof badgeVariants>
