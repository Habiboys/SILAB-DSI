export default function DangerButton({
    type = 'button',
    className = '',
    disabled,
    children,
    ...props
}) {
    return (
        <button
            {...props}
            type={type}
            className={`btn btn-error min-h-11 ${className}`}
            disabled={disabled}
        >
            {children}
        </button>
    );
}
