import React from 'react';
import { useLab } from './LabContext';

const KepengurusanStatus = ({ modul = null, children, showWarning = true }) => {
  const { selectedLab } = useLab();
  const [hasActiveKepengurusan, setHasActiveKepengurusan] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const checkKepengurusanStatus = async () => {
      if (!selectedLab) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/check-kepengurusan-status?lab_id=${selectedLab.id}&modul=${modul || ''}`);
        const data = await response.json();
        setHasActiveKepengurusan(data.has_active_kepengurusan);
      } catch (error) {
        console.error('Error checking kepengurusan status:', error);
        setHasActiveKepengurusan(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkKepengurusanStatus();
  }, [selectedLab, modul]);

  if (isLoading) {
    return <div className="animate-pulse">Loading...</div>;
  }

  if (!hasActiveKepengurusan && showWarning) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Kepengurusan Tidak Aktif
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>
                {modul 
                  ? `Modul ${modul} hanya dapat diakses saat ada kepengurusan aktif.`
                  : 'Modul ini hanya dapat diakses saat ada kepengurusan aktif.'
                }
              </p>
              <p className="mt-1">
                Silakan hubungi admin untuk mengaktifkan kepengurusan atau pilih kepengurusan yang aktif.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default KepengurusanStatus;
