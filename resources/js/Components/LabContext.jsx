import React, { createContext, useState, useContext, useEffect } from 'react';

// Create the context
const LabContext = createContext(null);

// Create a provider component
export const LabProvider = ({ children, initialLaboratories }) => {
  const [selectedLab, setSelectedLab] = useState(null);

  // Initialize with the first lab if no lab is selected
  useEffect(() => {
    if (initialLaboratories && initialLaboratories.length > 0 && !selectedLab) {
      setSelectedLab(initialLaboratories[0]);
    }
  }, [initialLaboratories]);

  // Function to update selected lab
  const selectLab = (lab) => {
    setSelectedLab(lab);
  };

  return (
    <LabContext.Provider value={{ selectedLab, selectLab, laboratories: initialLaboratories }}>
      {children}
    </LabContext.Provider>
  );
};

// Custom hook to use the lab context
export const useLab = () => {
  const context = useContext(LabContext);
  if (!context) {
    throw new Error('useLab must be used within a LabProvider');
  }
  return context;
};