'use client';

import { Bold, Italic, Underline } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/retroui';

export default function ToggleGroupStyleOutlined() {
    return (
        <ToggleGroup type="multiple" variant="outlined">
            <ToggleGroupItem value="bold">
                <Bold className="h-4 w-4" />
            </ToggleGroupItem>

            <ToggleGroupItem value="italic">
                <Italic className="h-4 w-4" />
            </ToggleGroupItem>

            <ToggleGroupItem value="underline">
                <Underline className="h-4 w-4" />
            </ToggleGroupItem>
        </ToggleGroup>
    );
}
