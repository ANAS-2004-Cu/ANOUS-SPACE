import React, { createContext, useContext, useState, useCallback } from 'react';
import { AlertModal, AlertAction } from '../ui/AlertModal';

interface AlertContextValue {
  showAlert: (title: string, message?: string, actions?: AlertAction[]) => void;
}

const AlertContext = createContext<AlertContextValue | undefined>(undefined);

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [alertState, setAlertState] = useState<{
    visible: boolean;
    title: string;
    message?: string;
    actions?: AlertAction[];
  }>({
    visible: false,
    title: '',
  });

  const showAlert = useCallback((title: string, message?: string, actions?: AlertAction[]) => {
    setAlertState({ visible: true, title, message, actions });
  }, []);

  const handleClose = useCallback(() => {
    setAlertState((prev) => ({ ...prev, visible: false }));
  }, []);

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      <AlertModal
        visible={alertState.visible}
        title={alertState.title}
        message={alertState.message}
        actions={alertState.actions}
        onClose={handleClose}
      />
    </AlertContext.Provider>
  );
};

export function useAlert(): AlertContextValue {
  const ctx = useContext(AlertContext);
  if (!ctx) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return ctx;
}
