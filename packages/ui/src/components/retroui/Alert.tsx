import type { HtmlHTMLAttributes, JSX } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';
import { Text } from '@/components/retroui/Text';

const alertVariants = cva('relative w-full rounded border-2 p-4', {
    variants: {
        variant: {
            default: 'bg-background text-foreground [&_svg]:shrink-0',
            solid: 'bg-black text-white',
        },
        status: {
            error: 'bg-red-300 text-red-800 border-red-800',
            success: 'bg-green-300 text-green-800 border-green-800',
            warning: 'bg-yellow-300 text-yellow-800 border-yellow-800',
            info: 'bg-blue-300 text-blue-800 border-blue-800',
        },
    },
    defaultVariants: {
        variant: 'default',
    },
});

interface IAlertProps
    extends HtmlHTMLAttributes<HTMLDivElement>,
        VariantProps<typeof alertVariants> {}

type AlertBase = (props: IAlertProps) => JSX.Element;

const Alert: AlertBase = ({ className, variant, status, ...props }) => (
    <div role="alert" className={cn(alertVariants({ variant, status }), className)} {...props} />
);
Alert.displayName = 'Alert';

interface IAlertTitleProps extends HtmlHTMLAttributes<HTMLHeadingElement> {}
const AlertTitle: (props: IAlertTitleProps) => JSX.Element = ({
    className,
    ...props
}: IAlertTitleProps) => <Text as="h5" className={cn(className)} {...props} />;
AlertTitle.displayName = 'AlertTitle';

interface IAlertDescriptionProps extends HtmlHTMLAttributes<HTMLParagraphElement> {}
const AlertDescription: (props: IAlertDescriptionProps) => JSX.Element = ({
    className,
    ...props
}: IAlertDescriptionProps) => <div className={cn('text-muted-foreground', className)} {...props} />;

AlertDescription.displayName = 'AlertDescription';

type AlertComponentType = AlertBase & {
    Title: typeof AlertTitle;
    Description: typeof AlertDescription;
};

const AlertComponent: AlertComponentType = Object.assign(Alert, {
    Title: AlertTitle,
    Description: AlertDescription,
});

export { AlertComponent as Alert };
