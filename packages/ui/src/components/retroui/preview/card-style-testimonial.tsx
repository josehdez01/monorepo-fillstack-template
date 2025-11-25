import { Avatar } from '@/components/retroui/Avatar';
import { Card } from '@/components/retroui/Card';
import { Text } from '@/components/retroui/Text';

const TestimonialCard = () => {
    return (
        <Card className="w-full max-w-[400px] shadow-none hover:shadow-md">
            <Card.Content>
                <Text className="text-lg">
                    &quot; RetroUI is the cooling looking UI library out there! &quot;
                </Text>

                <div className="flex items-center space-x-2 mt-6">
                    <Avatar className="h-10 w-10">
                        <Avatar.Image
                            alt="avatar"
                            src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=880&q=80"
                        />
                    </Avatar>
                    <div>
                        <div className="font-medium">Leroy Jenkins</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">CEO of Uber</div>
                    </div>
                </div>
            </Card.Content>
        </Card>
    );
};

export default TestimonialCard;
