import React, { createContext, useContext, useReducer, useEffect } from 'react';

export interface CustomerRecord {
  id: string;
  name: string;
  phone: string;
  address: string;
  serviceDate: string;
  serviceType: 'Sump' | 'Tank' | 'Both' | 'Other';
  customServiceType?: string;
  price: number;
  notes?: string;
  nextServiceDate?: string;
  reminderSent?: boolean;
  reminderSentAt?: string;
}

interface AppState {
  customers: CustomerRecord[];
  totalIncome: number;
  monthlyIncome: Record<string, number>;
  weeklyIncome: number;
  dailyIncome: number;
}

type AppAction = 
  | { type: 'ADD_CUSTOMER'; payload: CustomerRecord }
  | { type: 'SET_CUSTOMERS'; payload: CustomerRecord[] }
  | { type: 'DELETE_CUSTOMER'; payload: string }
  | { type: 'UPDATE_CUSTOMER'; payload: CustomerRecord }
  | { type: 'MARK_REMINDER_SENT'; payload: { id: string; sentAt: string } }
  | { type: 'CALCULATE_STATS' };

const initialState: AppState = {
  customers: [],
  totalIncome: 0,
  monthlyIncome: {},
  weeklyIncome: 0,
  dailyIncome: 0
};

// Storage utilities
const STORAGE_KEY = 'suraksha_service_data';
const INIT_KEY = 'suraksha_initialized';

const saveToStorage = (customers: CustomerRecord[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(customers));
};

const loadFromStorage = (): CustomerRecord[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

const isFirstRun = (): boolean => {
  return !localStorage.getItem(INIT_KEY);
};

const markAsInitialized = () => {
  localStorage.setItem(INIT_KEY, 'true');
};

// Phone number utility
export const normalizePhoneNumber = (phone: string): string => {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Add +91 if not present and number starts with non-91
  if (cleaned.length === 10) {
    return `+91${cleaned}`;
  } else if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return `+${cleaned}`;
  } else if (cleaned.length >= 10) {
    // Assume it already has country code
    return `+${cleaned}`;
  }
  
  return `+91${cleaned}`;
};

// Dummy data for first-time initialization only
const dummyCustomers: CustomerRecord[] = [
  {
    id: '1',
    name: 'Rajesh Kumar',
    phone: '+919876543210',
    address: '123 MG Road, Bangalore',
    serviceDate: '2024-01-15',
    serviceType: 'Both',
    price: 2500,
    notes: 'Annual maintenance',
    nextServiceDate: '2025-01-12'
  },
  {
    id: '2',
    name: 'Priya Sharma',
    phone: '+918765432109',
    address: '456 HSR Layout, Bangalore',
    serviceDate: '2024-01-20',
    serviceType: 'Sump',
    price: 1200,
    notes: 'Deep cleaning required',
    nextServiceDate: '2025-01-10'
  },
  {
    id: '3',
    name: 'Amit Patel',
    phone: '+917654321098',
    address: '789 Koramangala, Bangalore',
    serviceDate: '2024-02-05',
    serviceType: 'Tank',
    price: 1800,
    nextServiceDate: '2025-01-11'
  },
  {
    id: '4',
    name: 'Sunita Reddy',
    phone: '+916543210987',
    address: '321 Whitefield, Bangalore',
    serviceDate: '2024-02-12',
    serviceType: 'Both',
    price: 3000,
    notes: 'Emergency service',
    nextServiceDate: '2025-01-13'
  },
  {
    id: '5',
    name: 'Vikram Singh',
    phone: '+915432109876',
    address: '654 Electronic City, Bangalore',
    serviceDate: '2024-02-18',
    serviceType: 'Sump',
    price: 1500,
    nextServiceDate: '2025-01-14'
  }
];

function appReducer(state: AppState, action: AppAction): AppState {
  let newState: AppState;
  
  switch (action.type) {
    case 'ADD_CUSTOMER':
      newState = {
        ...state,
        customers: [action.payload, ...state.customers],
      };
      saveToStorage(newState.customers);
      return newState;
      
    case 'SET_CUSTOMERS':
      newState = {
        ...state,
        customers: action.payload,
      };
      if (action.payload.length > 0) {
        saveToStorage(newState.customers);
      }
      return newState;
      
    case 'UPDATE_CUSTOMER':
      newState = {
        ...state,
        customers: state.customers.map(customer => 
          customer.id === action.payload.id ? action.payload : customer
        ),
      };
      saveToStorage(newState.customers);
      return newState;
      
    case 'DELETE_CUSTOMER':
      newState = {
        ...state,
        customers: state.customers.filter(customer => customer.id !== action.payload),
      };
      saveToStorage(newState.customers);
      return newState;
      
    case 'MARK_REMINDER_SENT':
      newState = {
        ...state,
        customers: state.customers.map(customer => 
          customer.id === action.payload.id 
            ? { ...customer, reminderSent: true, reminderSentAt: action.payload.sentAt }
            : customer
        ),
      };
      saveToStorage(newState.customers);
      return newState;
    case 'CALCULATE_STATS':
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();
      
      // Filter customers for current month/year calculations
      const currentMonthCustomers = state.customers.filter(customer => {
        const serviceDate = new Date(customer.serviceDate);
        return serviceDate.getMonth() === currentMonth && serviceDate.getFullYear() === currentYear;
      });
      
      // Filter customers for current week calculations
      const currentWeekCustomers = state.customers.filter(customer => {
        const serviceDate = new Date(customer.serviceDate);
        const weekStart = new Date(currentDate);
        weekStart.setDate(currentDate.getDate() - currentDate.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return serviceDate >= weekStart && serviceDate <= weekEnd;
      });
      
      const totalIncome = state.customers.reduce((sum, customer) => sum + customer.price, 0);
      
      const monthlyIncome: Record<string, number> = {};
      state.customers.forEach(customer => {
        const month = customer.serviceDate.substring(0, 7); // YYYY-MM format
        monthlyIncome[month] = (monthlyIncome[month] || 0) + customer.price;
      });

      const weeklyIncome = currentWeekCustomers.reduce((sum, customer) => sum + customer.price, 0);
      const dailyIncome = state.customers
        .filter(customer => customer.serviceDate === currentDate.toISOString().split('T')[0])
        .reduce((sum, customer) => sum + customer.price, 0);
      
      return {
        ...state,
        totalIncome,
        monthlyIncome,
        weeklyIncome,
        dailyIncome
      };
    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    // Load data from storage or initialize with dummy data on first run
    const storedCustomers = loadFromStorage();
    
    if (isFirstRun() && storedCustomers.length === 0) {
      // First time - load dummy data
      dispatch({ type: 'SET_CUSTOMERS', payload: dummyCustomers });
      markAsInitialized();
    } else {
      // Load from storage
      dispatch({ type: 'SET_CUSTOMERS', payload: storedCustomers });
    }
  }, []);

  useEffect(() => {
    dispatch({ type: 'CALCULATE_STATS' });
  }, [state.customers]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}