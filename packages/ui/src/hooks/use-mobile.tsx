import * as React from 'react';

const MOBILE_BREAKPOINT = 768;
const BREAKPOINT_OFFSET = 1;

const computeIsMobile = () => {
    if (typeof globalThis.innerWidth !== 'number') {
        return false;
    }
    return globalThis.innerWidth < MOBILE_BREAKPOINT;
};

export const useIsMobile = () => {
    const [isMobile, setIsMobile] = React.useState<boolean | undefined>();

    React.useEffect(() => {
        if (typeof globalThis.matchMedia !== 'function') {
            return undefined;
        }

        const maxWidth = MOBILE_BREAKPOINT - BREAKPOINT_OFFSET;
        const mediaQuery = globalThis.matchMedia(`(max-width: ${maxWidth}px)`);
        const onChange = () => {
            setIsMobile(computeIsMobile());
        };

        mediaQuery.addEventListener('change', onChange);
        setIsMobile(computeIsMobile());

        return () => {
            mediaQuery.removeEventListener('change', onChange);
        };
    }, []);

    return Boolean(isMobile);
};
