// frontend/src/utils/constants.js
export const RIDER_STATUS = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    SUSPENDED: 'suspended'
  };
  
  export const SWAP_STATUS = {
    COMPLETED: 'completed',
    FAILED: 'failed',
    PENDING: 'pending'
  };
  
  export const RISK_LEVELS = {
    LOW: { min: 0, max: 39, label: 'Low Risk', color: 'green' },
    MEDIUM: { min: 40, max: 69, label: 'Medium Risk', color: 'yellow' },
    HIGH: { min: 70, max: 100, label: 'High Risk', color: 'red' }
  };
  
  export const CHART_COLORS = {
    primary: '#3B82F6',
    secondary: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    info: '#6366F1'
  };
  