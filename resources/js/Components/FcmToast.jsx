export default function FcmToast({ title, body, url, onDismiss }) {
    const handleClick = () => {
        if (url) window.location.href = url;
        onDismiss?.();
    };

    return (
        <div className="flex items-start gap-3 w-full">
            {/* Icon */}
            <div className="flex-shrink-0 mt-0.5">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
                    </svg>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 leading-snug truncate">
                    {title}
                </p>
                {body && (
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed line-clamp-2">
                        {body}
                    </p>
                )}
            </div>

            {/* Action */}
            {url && (
                <button
                    onClick={handleClick}
                    className="flex-shrink-0 text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline mt-0.5 transition-colors"
                >
                    Buka →
                </button>
            )}
        </div>
    );
}
