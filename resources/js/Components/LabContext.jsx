import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';

const LabContext = createContext();

export const LabProvider = ({ children, auth, laboratorium, kepengurusanLabs = [] }) => {
    const [selectedLab, setSelectedLabState] = useState(null);
    const [selectedKepengurusanLabId, setSelectedKepengurusanLabIdState] = useState(null);
    const initialSetupDone = useRef(false);
    const previousLabId = useRef(null);

    // Get initial lab from localStorage or default
    const getInitialLab = () => {
        if (typeof window === 'undefined') return null;
        
        const savedLabId = localStorage.getItem('selectedLabId');
        if (savedLabId && laboratorium?.length > 0) {
            const savedLab = laboratorium.find(lab => lab.id === parseInt(savedLabId));
            if (savedLab) return savedLab;
        }
        return null;
    };

    // Get initial kepengurusan_lab_id from localStorage
    const getInitialKepengurusanLabId = () => {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem('selectedKepengurusanLabId') || null;
    };

    // This effect runs only once to set the initial lab
    useEffect(() => {
        if (initialSetupDone.current) return;
        
        if (auth?.user && laboratorium?.length > 0) {
            const hasAdminRole = auth.user.roles?.some(role => 
                ['superadmin', 'kadep', 'admin'].includes(role)
            );

            // For non-admin users, set their assigned lab
            if (!hasAdminRole && (auth.user.access_lab_id || auth.user.laboratory?.id)) {
                const labId = auth.user.access_lab_id || auth.user.laboratory?.id;
                const userLab = laboratorium.find(lab => 
                    lab.id === labId
                );
                if (userLab) {
                    setSelectedLabState(userLab);
                    previousLabId.current = userLab.id;
                    localStorage.setItem('selectedLabId', userLab.id.toString());
                }
            } 
            // For admin users, allow selection but provide default if none selected
            else if (hasAdminRole) {
                // Try to get from localStorage first
                const savedLab = getInitialLab();
                if (savedLab) {
                    setSelectedLabState(savedLab);
                    previousLabId.current = savedLab.id;
                } else {
                    // Try to find user's assigned lab first, otherwise use first lab
                    const labId = auth.user.access_lab_id || auth.user.laboratory?.id;
                    const userLab = labId ? 
                        laboratorium.find(lab => lab.id === labId) : null;
                    const labToSet = userLab || laboratorium[0];
                    setSelectedLabState(labToSet);
                    previousLabId.current = labToSet?.id;
                    if (labToSet) {
                        localStorage.setItem('selectedLabId', labToSet.id.toString());
                    }
                }
            }
            
            // Initialize kepengurusan_lab_id from localStorage
            const savedKepengurusanLabId = getInitialKepengurusanLabId();
            if (savedKepengurusanLabId) {
                setSelectedKepengurusanLabIdState(savedKepengurusanLabId);
            }
            
            initialSetupDone.current = true;
        }
    }, []); // Empty dependency array - runs only once

    // Custom setter that prevents unnecessary state updates and saves to localStorage
    const setSelectedLab = (newLab) => {
        if (!newLab) return;
        
        // Only update if the lab ID has changed
        if (newLab.id !== previousLabId.current) {
            previousLabId.current = newLab.id;
            setSelectedLabState(newLab);
            localStorage.setItem('selectedLabId', newLab.id.toString());
            // Clear kepengurusan_lab_id when lab changes (will be re-set when tahun is selected)
            setSelectedKepengurusanLabIdState(null);
            localStorage.removeItem('selectedKepengurusanLabId');
        }
    };

    // Setter for kepengurusan_lab_id
    const setSelectedKepengurusanLabId = (kepLabId) => {
        if (kepLabId) {
            setSelectedKepengurusanLabIdState(kepLabId.toString());
            localStorage.setItem('selectedKepengurusanLabId', kepLabId.toString());
        } else {
            setSelectedKepengurusanLabIdState(null);
            localStorage.removeItem('selectedKepengurusanLabId');
        }
    };

    // Memoize the context value to prevent unnecessary re-renders
    const value = useMemo(() => ({
        selectedLab,
        setSelectedLab,
        laboratories: laboratorium,
        selectedKepengurusanLabId,
        setSelectedKepengurusanLabId,
    }), [selectedLab, laboratorium, selectedKepengurusanLabId]);

    return (
        <LabContext.Provider value={value}>
            {children}
        </LabContext.Provider>
    );
};

export const useLab = () => {
    const context = useContext(LabContext);
    if (!context) {
        throw new Error('useLab must be used within a LabProvider');
    }
    return context;
};