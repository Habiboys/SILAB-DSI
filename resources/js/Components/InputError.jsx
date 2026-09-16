export default function InputError({ message, className = '', ...props }) {
    return message ? (
        <p {...props} className={`text-xs font-medium text-error ${className}`}>
            {message}
        </p>
    ) : null;
}
