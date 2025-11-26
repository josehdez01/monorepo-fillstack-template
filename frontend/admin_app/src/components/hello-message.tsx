import { useQuery } from '@tanstack/react-query';
import { orpc } from '@/api/orpc-client';

export default function HelloMessage() {
    const { data } = useQuery(orpc.hello.greet.queryOptions({ input: { name: 'world' } }));

    return <p data-testid="orpc-hello">{String(data ?? '')}</p>;
}
