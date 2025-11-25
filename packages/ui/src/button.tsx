import type { CSSProperties, ReactNode } from 'react';

export interface ButtonProps {
    children: ReactNode;
    onClick?: () => void;
    style?: CSSProperties;
}

export const Button = ({ children, onClick, style }: ButtonProps) => (
    <button
        type="button"
        onClick={onClick}
        style={{
            background: '#f6f6f6',
            border: '1px solid #ccc',
            borderRadius: 8,
            cursor: 'pointer',
            padding: '0.5rem 1rem',
            ...style,
        }}
    >
        {children}
    </button>
);
