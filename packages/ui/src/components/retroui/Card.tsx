import { cn } from '@/lib/utils';
import type { HTMLAttributes, JSX } from 'react';
import { Text } from '@/components/retroui/Text';

interface ICardProps extends HTMLAttributes<HTMLDivElement> {
    className?: string;
}

const Card: (props: ICardProps) => JSX.Element = ({ className, ...props }: ICardProps) => {
    return (
        <div
            className={cn(
                'inline-block border-2 rounded shadow-md transition-all hover:shadow-none bg-card',
                className,
            )}
            {...props}
        />
    );
};

const CardHeader: (props: ICardProps) => JSX.Element = ({ className, ...props }: ICardProps) => {
    return <div className={cn('flex flex-col justify-start p-4', className)} {...props} />;
};

const CardTitle: (props: ICardProps) => JSX.Element = ({ className, ...props }: ICardProps) => {
    return <Text as="h3" className={cn('mb-2', className)} {...props} />;
};

const CardDescription: (props: ICardProps) => JSX.Element = ({
    className,
    ...props
}: ICardProps) => <p className={cn('text-muted-foreground', className)} {...props} />;

const CardContent: (props: ICardProps) => JSX.Element = ({ className, ...props }: ICardProps) => {
    return <div className={cn('p-4', className)} {...props} />;
};

type CardComponentType = typeof Card & {
    Header: typeof CardHeader;
    Title: typeof CardTitle;
    Description: typeof CardDescription;
    Content: typeof CardContent;
};

const CardComponent: CardComponentType = Object.assign(Card, {
    Header: CardHeader,
    Title: CardTitle,
    Description: CardDescription,
    Content: CardContent,
});

export { CardComponent as Card };
