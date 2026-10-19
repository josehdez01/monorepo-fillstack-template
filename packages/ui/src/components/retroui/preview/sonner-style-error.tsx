import { Button } from '..';
import { toast } from 'sonner';

const onClick = () => {
    toast.error('Oops! you ran into a pot hole');
};

export default function SonnerStyleError() {
    return <Button onClick={onClick}>Show Toast (Error)</Button>;
}
