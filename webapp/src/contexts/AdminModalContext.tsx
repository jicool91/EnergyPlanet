import { createContext, useContext } from 'react';

export interface AdminModalContextValue {
  openAdminMetrics: () => void;
}

const noop = () => {
  // no-op
};

const defaultValue: AdminModalContextValue = {
  openAdminMetrics: noop,
};

export const AdminModalContext = createContext<AdminModalContextValue>(defaultValue);

export function useAdminModal(): AdminModalContextValue {
  return useContext(AdminModalContext);
}
