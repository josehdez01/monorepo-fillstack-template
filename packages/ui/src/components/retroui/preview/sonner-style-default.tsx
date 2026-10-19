import { Button } from '..';
import { toast } from 'sonner';

const onClick = () => {
    toast('Event has been created', {
        cancel: {
            label: 'Undo',
            onClick: () => {},
        },
        description: 'Sunday, December 03, 2025',
    });
};

export default function SonnerStyleDefault() {
    return <Button onClick={onClick}>Show Toast</Button>;
}
