import { Button } from '@/components/retroui';
import { toast } from 'sonner';

export default function SonnerStyleDefault() {
    const onClick = () => {
        toast('Event has been created', {
            cancel: {
                label: 'Undo',
                onClick: () => {},
            },
            description: 'Sunday, December 03, 2025',
        });
    };

    return <Button onClick={onClick}>Show Toast</Button>;
}
