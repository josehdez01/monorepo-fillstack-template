'use client';

import { Button, Tooltip } from '..';

export default function TooltipStyleDefault() {
    return (
        <Tooltip.Provider>
            <Tooltip>
                <Tooltip.Trigger asChild>
                    <Button variant="outline">Hover</Button>
                </Tooltip.Trigger>
                <Tooltip.Content variant="default">Add to Library</Tooltip.Content>
            </Tooltip>
        </Tooltip.Provider>
    );
}
