import { useQuery } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';

export default function HelloMessage() {
    const router = useRouter();
    const orpc = router.options.context.orpc;
    const { data } = useQuery(orpc.hello.greet.queryOptions({ input: { name: 'world' } }));

    return <p data-testid="orpc-hello">{String(data ?? '')}</p>;
}
