import { Loader2Icon } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { JSX } from 'react';

function Spinner({ className, ...props }: React.ComponentProps<'svg'>): JSX.Element {
    return (
        <Loader2Icon
            role="status"
            aria-label="Loading"
            className={cn('size-4 animate-spin', className)}
            {...props}
        />
    );
}

export { Spinner };
