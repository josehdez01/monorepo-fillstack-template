'use client';

import React, { type JSX } from 'react';
import { cn } from '@/lib/utils';
import { Dialog } from '@/components/retroui/Dialog';
import { type DialogProps } from '@radix-ui/react-dialog';
import { Command as CommandPrimitive } from 'cmdk';
import { Check, Search, type LucideIcon } from 'lucide-react';

function Command({
    className,
    ...props
}: React.ComponentProps<typeof CommandPrimitive>): JSX.Element {
    return (
        <CommandPrimitive
            className={cn(
                'flex h-full w-full flex-col overflow-hidden rounded bg-background text-foreground border-border shadow-md',
                className,
            )}
            {...props}
        />
    );
}

type CommandDialogProps = DialogProps & { className?: string };

const CommandDialog = ({ children, className, ...props }: CommandDialogProps): JSX.Element => {
    return (
        <Dialog {...props}>
            <Dialog.Content
                className={cn('overflow-hidden p-0 shadow-lg rounded w-full max-w-md', className)}
            >
                <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
                    {children}
                </Command>
            </Dialog.Content>
        </Dialog>
    );
};

function CommandInput({
    className,
    ...props
}: React.ComponentProps<typeof CommandPrimitive.Input>): JSX.Element {
    return (
        <div
            className="flex items-center border-border border-b px-3"
            cmdk-input-wrapper=""
            data-slot="command-input"
        >
            <Search className="me-2 h-4 w-4 shrink-0 opacity-50 text-foreground" />
            <CommandPrimitive.Input
                className={cn(
                    'flex h-11 w-full rounded bg-transparent py-3 text-sm outline-hidden text-foreground placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 font-body',
                    className,
                )}
                {...props}
            />
        </div>
    );
}

function CommandList({
    className,
    ...props
}: React.ComponentProps<typeof CommandPrimitive.List>): JSX.Element {
    return (
        <CommandPrimitive.List
            data-slot="command-list"
            className={cn(
                'max-h-[400px] overflow-auto overscroll-contain transition-[height]  h-[calc(min(300px,var(--cmdk-list-height)))] bg-background',
                className,
            )}
            {...props}
        />
    );
}

function CommandEmpty({
    ...props
}: React.ComponentProps<typeof CommandPrimitive.Empty>): JSX.Element {
    return (
        <CommandPrimitive.Empty
            data-slot="command-empty"
            className="py-6 text-center text-sm text-muted-foreground font-body"
            {...props}
        />
    );
}

function CommandGroup({
    className,
    ...props
}: React.ComponentProps<typeof CommandPrimitive.Group>): JSX.Element {
    return (
        <CommandPrimitive.Group
            data-slot="command-group"
            className={cn(
                'overflow-hidden p-1.5 text-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground font-body',
                className,
            )}
            {...props}
        />
    );
}

function CommandSeparator({
    className,
    ...props
}: React.ComponentProps<typeof CommandPrimitive.Separator>): JSX.Element {
    return (
        <CommandPrimitive.Separator
            data-slot="command-separator"
            className={cn('h-px bg-border', className)}
            {...props}
        />
    );
}

function CommandItem({
    className,
    ...props
}: React.ComponentProps<typeof CommandPrimitive.Item>): JSX.Element {
    return (
        <CommandPrimitive.Item
            data-slot="command-item"
            className={cn(
                'relative flex text-foreground cursor-pointer gap-2 select-none items-center rounded px-2 py-1.5 text-sm outline-hidden data-[disabled=true]:pointer-events-none data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-accent hover:text-accent-foreground transition-all font-body',
                className,
            )}
            {...props}
        />
    );
}

const CommandShortcut = ({
    className,
    ...props
}: React.HTMLAttributes<HTMLSpanElement>): JSX.Element => {
    return (
        <span
            data-slot="command-shortcut"
            className={cn(
                'ms-auto text-xs tracking-widest text-muted-foreground font-body',
                className,
            )}
            {...props}
        />
    );
};

interface CommandCheckProps {
    icon?: LucideIcon;
    className?: string;
}

function CommandCheck({ icon: Icon = Check, className, ...props }: CommandCheckProps): JSX.Element {
    return (
        <Icon
            data-slot="command-check"
            data-check="true"
            className={cn('size-4 ms-auto text-primary', className)}
            {...props}
        />
    );
}

type CommandComponentType = typeof Command & {
    Check: typeof CommandCheck;
    Dialog: typeof CommandDialog;
    Empty: typeof CommandEmpty;
    Group: typeof CommandGroup;
    Input: typeof CommandInput;
    Item: typeof CommandItem;
    List: typeof CommandList;
    Separator: typeof CommandSeparator;
    Shortcut: typeof CommandShortcut;
};

const CommandComponent: CommandComponentType = Object.assign(Command, {
    Check: CommandCheck,
    Dialog: CommandDialog,
    Empty: CommandEmpty,
    Group: CommandGroup,
    Input: CommandInput,
    Item: CommandItem,
    List: CommandList,
    Separator: CommandSeparator,
    Shortcut: CommandShortcut,
});

export { CommandComponent as Command };
