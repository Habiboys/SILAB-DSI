export default function InputError({ message, className = '', ...props }) {
    return message ? (
        <p
            {...props}
            className={`label-text-alt text-sm font-medium text-error ${className}`}
        >
            {message}
        </p>
    ) : null;
}
