import { cn } from '@/lib/utils';
import type { JSX } from 'react';
import {
    Tab,
    TabGroup,
    TabList,
    TabPanel,
    TabPanels,
    type TabListProps,
    type TabPanelProps,
    type TabProps,
} from '@headlessui/react';

const Tabs: typeof TabGroup = TabGroup;
const TabsPanels: typeof TabPanels = TabPanels;

interface ITabsTriggerList extends TabListProps {
    className?: string;
}
const TabsTriggerList: (props: ITabsTriggerList) => JSX.Element = ({
    children,
    className,
    ...props
}: ITabsTriggerList) => {
    return (
        <TabList className={cn('flex flex-row space-x-2', className)} {...props}>
            {children}
        </TabList>
    );
};

interface ITabsTrigger extends TabProps {
    className?: string;
}
const TabsTrigger: (props: ITabsTrigger) => JSX.Element = ({
    children,
    className,
    ...props
}: ITabsTrigger) => {
    return (
        <Tab
            className={cn(
                'px-4 py-1 border-2 border-transparent data-selected:border-border data-selected:bg-primary data-selected:text-primary-foreground data-selected:font-semibold focus:outline-hidden',
                className,
            )}
            {...props}
        >
            {children}
        </Tab>
    );
};

interface ITabsContent extends TabPanelProps {
    className?: string;
}
const TabsContent: (props: ITabsContent) => JSX.Element = ({
    children,
    className,
    ...props
}: ITabsContent) => {
    return (
        <TabPanel className={cn('border-2 border-border mt-2 p-4', className)} {...props}>
            {children}
        </TabPanel>
    );
};

export { Tabs, TabsPanels, TabsTrigger, TabsContent, TabsTriggerList };
