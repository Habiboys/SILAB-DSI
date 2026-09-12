export default function PrimaryButton({
    type = 'submit',
    className = '',
    disabled,
    children,
    ...props
}) {
    return (
        <button
            {...props}
            type={type}
            className={`btn btn-primary min-h-11 ${className}`}
            disabled={disabled}
        >
            {children}
        </button>
    );
}
