import { Badge } from '@/components/retroui/Badge';

export default function BadgeStyleVariants() {
    return (
        <div className="flex flex-wrap gap-4">
            <Badge>Default</Badge>
            <Badge variant="outline">Outlined</Badge>
            <Badge variant="solid">Solid</Badge>
            <Badge variant="surface">Surface</Badge>
        </div>
    );
}
