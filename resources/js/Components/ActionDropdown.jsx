import React, { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, Edit, Trash2, Users, FileText, Eye } from 'lucide-react';

const ActionDropdown = ({ actions, onAction }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState('right-0');
    const dropdownRef = useRef(null);
    const buttonRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, []);

    useEffect(() => {
        if (isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            
            // Check if dropdown would overflow on the right
            if (rect.right + 192 > viewportWidth) { // 192px = w-48
                setDropdownPosition('right-0');
            } else if (rect.left - 192 < 0) {
                setDropdownPosition('left-0');
            } else {
                setDropdownPosition('right-0');
            }
        }
    }, [isOpen]);

    const handleAction = (action) => {
        onAction(action);
        setIsOpen(false);
    };

    const getActionIcon = (type) => {
        switch (type) {
            case 'edit': return <Edit className="w-4 h-4" />;
            case 'delete': return <Trash2 className="w-4 h-4" />;
            case 'view': return <Eye className="w-4 h-4" />;
            case 'students': return <Users className="w-4 h-4" />;
            case 'documents': return <FileText className="w-4 h-4" />;
            default: return <Edit className="w-4 h-4" />;
        }
    };

    const getActionColor = (type) => {
        switch (type) {
            case 'delete': return 'text-red-600 hover:bg-red-50';
            case 'edit': return 'text-blue-600 hover:bg-blue-50';
            case 'view': return 'text-green-600 hover:bg-green-50';
            case 'students': return 'text-purple-600 hover:bg-purple-50';
            case 'documents': return 'text-orange-600 hover:bg-orange-50';
            default: return 'text-gray-600 hover:bg-gray-50';
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                ref={buttonRef}
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
                <MoreHorizontal className="w-4 h-4" />
            </button>

            {isOpen && (
                <div className={`absolute ${dropdownPosition} mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-[9999] max-h-64 overflow-y-auto`}>
                    <div className="py-1">
                        {actions.map((action, index) => (
                            <button
                                key={index}
                                onClick={() => handleAction(action)}
                                className={`w-full text-left px-4 py-2 text-sm flex items-center space-x-3 ${getActionColor(action.type)} transition-colors`}
                            >
                                {getActionIcon(action.type)}
                                <span>{action.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ActionDropdown;
