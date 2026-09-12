import {
    Edit,
    Eye,
    FileText,
    MoreHorizontal,
    Trash2,
    Users,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

const ActionDropdown = ({ actions, onAction }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState("right-0");
    const [dropdownVerticalPosition, setDropdownVerticalPosition] =
        useState("top-full mt-2");
    const dropdownRef = useRef(null);
    const buttonRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target)
            ) {
                setIsOpen(false);
            }
        };

        const handleEscape = (event) => {
            if (event.key === "Escape") {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEscape);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEscape);
        };
    }, []);

    useEffect(() => {
        if (isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            const estimatedMenuHeight = 260;

            // Check if dropdown would overflow on the right
            if (rect.right + 192 > viewportWidth) {
                // 192px = w-48
                setDropdownPosition("right-0");
            } else if (rect.left - 192 < 0) {
                setDropdownPosition("left-0");
            } else {
                setDropdownPosition("right-0");
            }

            // Open upward if there is not enough space below
            if (rect.bottom + estimatedMenuHeight > viewportHeight) {
                setDropdownVerticalPosition("bottom-full mb-2");
            } else {
                setDropdownVerticalPosition("top-full mt-2");
            }
        }
    }, [isOpen]);

    const handleAction = (action) => {
        onAction(action);
        setIsOpen(false);
    };

    const getActionIcon = (action) => {
        if (action.icon) return action.icon;

        switch (action.type) {
            case "edit":
                return <Edit className="w-4 h-4" />;
            case "delete":
                return <Trash2 className="w-4 h-4" />;
            case "view":
                return <Eye className="w-4 h-4" />;
            case "students":
                return <Users className="w-4 h-4" />;
            case "documents":
                return <FileText className="w-4 h-4" />;
            default:
                return <Edit className="w-4 h-4" />;
        }
    };

    const getActionColor = (action) => {
        if (action.color) return action.color;

        switch (action.type) {
            case "edit":
                return "text-primary hover:bg-primary/10";
            case "delete":
                return "text-error hover:bg-error/10";
            case "view":
                return "text-success hover:bg-success/10";
            case "students":
                return "text-secondary hover:bg-secondary/10";
            case "documents":
                return "text-warning hover:bg-warning/10";
            default:
                return "text-base-content/70 hover:bg-base-200";
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                ref={buttonRef}
                onClick={() => setIsOpen(!isOpen)}
                type="button"
                className="btn btn-ghost btn-square btn-sm min-h-11 min-w-11"
                aria-label="Buka menu tindakan"
                aria-expanded={isOpen}
            >
                <MoreHorizontal className="w-4 h-4" />
            </button>

            {isOpen && (
                <div
                    className={`menu absolute ${dropdownPosition} ${dropdownVerticalPosition} z-[9999] max-h-64 w-48 overflow-y-auto rounded-box border border-base-300 bg-base-100 p-2 shadow-xl`}
                    role="menu"
                >
                    <div>
                        {actions.map((action, index) =>
                            action.type === "divider" ? (
                                <hr
                                    key={index}
                                    className="my-1 border-base-300"
                                />
                            ) : (
                                <button
                                    key={index}
                                    onClick={() => handleAction(action)}
                                    type="button"
                                    role="menuitem"
                                    className={`flex min-h-11 w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors ${getActionColor(action)}`}
                                >
                                    {getActionIcon(action)}
                                    <span>{action.label}</span>
                                </button>
                            ),
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ActionDropdown;
