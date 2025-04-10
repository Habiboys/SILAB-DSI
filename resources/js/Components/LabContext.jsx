import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';

const LabContext = createContext();

export const LabProvider = ({ children, auth, laboratorium }) => {
    const [selectedLab, setSelectedLabState] = useState(null);
    const initialSetupDone = useRef(false);
    const previousLabId = useRef(null);

    // This effect runs only once to set the initial lab
    useEffect(() => {
        if (initialSetupDone.current) return;
        
        if (auth?.user && laboratorium?.length > 0) {
            const hasAdminRole = auth.user.roles?.some(role => 
                ['superadmin', 'kadep', 'admin'].includes(role)
            );

            // For non-admin users, set their assigned lab
            if (!hasAdminRole && auth.user.laboratory_id) {
                const userLab = laboratorium.find(lab => 
                    lab.id === auth.user.laboratory_id
                );
                if (userLab) {
                    setSelectedLabState(userLab);
                    previousLabId.current = userLab.id;
                }
            } 
            // For admin users, allow selection but provide default if none selected
            else if (hasAdminRole) {
                // Try to find user's assigned lab first, otherwise use first lab
                const userLab = auth.user.laboratory_id ? 
                    laboratorium.find(lab => lab.id === auth.user.laboratory_id) : null;
                const labToSet = userLab || laboratorium[0];
                setSelectedLabState(labToSet);
                previousLabId.current = labToSet?.id;
            }
            
            initialSetupDone.current = true;
        }
    }, []); // Empty dependency array - runs only once

    // Custom setter that prevents unnecessary state updates
    const setSelectedLab = (newLab) => {
        if (!newLab) return;
        
        // Only update if the lab ID has changed
        if (newLab.id !== previousLabId.current) {
            previousLabId.current = newLab.id;
            setSelectedLabState(newLab);
        }
    };

    // Memoize the context value to prevent unnecessary re-renders
    const value = useMemo(() => ({
        selectedLab,
        setSelectedLab,
        laboratories: laboratorium
    }), [selectedLab, laboratorium]);

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