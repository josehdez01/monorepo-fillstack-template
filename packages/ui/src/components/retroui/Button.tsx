import { cva, type VariantProps } from 'class-variance-authority';
import React, { type ButtonHTMLAttributes } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
    'font-head transition-all rounded outline-hidden cursor-pointer duration-200 font-medium flex items-center',
    {
        defaultVariants: {
            size: 'md',
            variant: 'default',
        },
        variants: {
            size: {
                icon: 'p-2',
                lg: 'px-6 lg:px-8 py-2 lg:py-3 text-md lg:text-lg',
                md: 'px-4 py-1.5 text-base',
                sm: 'px-3 py-1 text-sm shadow hover:shadow-none',
            },
            variant: {
                default:
                    'shadow-md hover:shadow active:shadow-none bg-primary text-primary-foreground border-2 border-black transition hover:translate-y-1 active:translate-y-2 active:translate-x-1 hover:bg-primary-hover',
                link: 'bg-transparent hover:underline',
                outline:
                    'shadow-md hover:shadow active:shadow-none bg-transparent border-2 transition hover:translate-y-1 active:translate-y-2 active:translate-x-1',
                secondary:
                    'shadow-md hover:shadow active:shadow-none bg-secondary shadow-primary text-secondary-foreground border-2 border-black transition hover:translate-y-1 active:translate-y-2 active:translate-x-1 hover:bg-secondary-hover',
            },
        },
    },
);

export interface IButtonProps
    extends ButtonHTMLAttributes<HTMLButtonElement>,
        VariantProps<typeof buttonVariants> {
    asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, IButtonProps>(
    (
        {
            children,
            size = 'md',
            className = '',
            variant = 'default',
            asChild = false,
            ...props
        }: IButtonProps,
        forwardedRef,
    ) => {
        let Comp: typeof Slot | 'button' = 'button';
        if (asChild) {
            Comp = Slot;
        }
        return (
            <Comp
                ref={forwardedRef}
                className={cn(buttonVariants({ size, variant }), className)}
                {...props}
            >
                {children}
            </Comp>
        );
    },
);

Button.displayName = 'Button';
