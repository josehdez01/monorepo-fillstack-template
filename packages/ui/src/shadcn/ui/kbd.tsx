import type { JSX } from 'react';
import { cn } from '@/lib/utils';

const Kbd = ({ className, ...props }: React.ComponentProps<'kbd'>): JSX.Element => (
    <kbd
        data-slot="kbd"
        className={cn(
            'bg-muted text-muted-foreground pointer-events-none inline-flex h-5 w-fit min-w-5 select-none items-center justify-center gap-1 rounded-sm px-1 font-sans text-xs font-medium',
            "[&_svg:not([class*='size-'])]:size-3",
            '[[data-slot=tooltip-content]_&]:bg-background/20 [[data-slot=tooltip-content]_&]:text-background dark:[[data-slot=tooltip-content]_&]:bg-background/10',
            className,
        )}
        {...props}
    />
);

const KbdGroup = ({ className, ...props }: React.ComponentProps<'div'>): JSX.Element => (
    <kbd
        data-slot="kbd-group"
        className={cn('inline-flex items-center gap-1', className)}
        {...props}
    />
);

export { Kbd, KbdGroup };
