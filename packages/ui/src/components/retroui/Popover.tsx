'use client';

import * as React from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';

import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const popoverContentVariants = cva(
    'z-50 w-72 border-2 bg-background p-4 text-popover-foreground  outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-popover-content-transform-origin]',
);

const Popover: typeof PopoverPrimitive.Root = PopoverPrimitive.Root;

const PopoverTrigger: typeof PopoverPrimitive.Trigger = PopoverPrimitive.Trigger;

const PopoverAnchor: typeof PopoverPrimitive.Anchor = PopoverPrimitive.Anchor;

const PopoverContent = React.forwardRef<
    React.ElementRef<typeof PopoverPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> &
        VariantProps<typeof popoverContentVariants>
>(({ className, align = 'center', sideOffset = 4, ...props }, ref) => (
    <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
            ref={ref}
            align={align}
            sideOffset={sideOffset}
            className={cn(
                popoverContentVariants({
                    className,
                }),
            )}
            {...props}
        />
    </PopoverPrimitive.Portal>
));
PopoverContent.displayName = PopoverPrimitive.Content.displayName;

type PopoverObjectType = typeof Popover & {
    Trigger: typeof PopoverTrigger;
    Content: typeof PopoverContent;
    Anchor: typeof PopoverAnchor;
};

const PopoverObject: PopoverObjectType = Object.assign(Popover, {
    Trigger: PopoverTrigger,
    Content: PopoverContent,
    Anchor: PopoverAnchor,
});

export { PopoverObject as Popover };
