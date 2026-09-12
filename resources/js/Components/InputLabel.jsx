export default function InputLabel({
    value,
    className = '',
    children,
    ...props
}) {
    return (
        <label
            {...props}
            className={`label-text block text-sm font-medium text-base-content ${className}`}
        >
            {value ? value : children}
        </label>
    );
}
