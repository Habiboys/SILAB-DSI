export default function SecondaryButton({
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
            className={`btn btn-ghost min-h-11 border border-base-300 bg-base-100 ${className}`}
            disabled={disabled}
        >
            {children}
        </button>
    );
}
