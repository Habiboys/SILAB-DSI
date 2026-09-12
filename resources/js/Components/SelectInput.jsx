import React from 'react';

export default function SelectInput({ className = '', children, ...props }) {
    return (
        <select
            {...props}
            className={`select select-bordered min-h-11 w-full focus:select-primary ${className}`}
        >
            {children}
        </select>
    );
}