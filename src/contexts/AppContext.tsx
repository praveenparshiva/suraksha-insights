import React, { createContext, useContext, useReducer, useEffect } from 'react';

export interface ServiceHistoryEntry {
  date: string;
  serviceType: 'Sump' | 'Tank' | 'Both' | 'Other';
  customServiceType?: string;
  price: number;
  paymentStatus?: 'Paid' | 'Pending';
  reminderSent?: boolean;
  reminderSentAt?: string;
  notes?: string;
}

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
  history?: ServiceHistoryEntry[];
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
      // Check if customer already exists (by id or phone)
      const existingCustomerIndex = state.customers.findIndex(
        customer => customer.id === action.payload.id || customer.phone === action.payload.phone
      );
      
      if (existingCustomerIndex >= 0) {
        // Customer exists - move current service to history and update with new service
        const existingCustomer = state.customers[existingCustomerIndex];
        const currentServiceEntry: ServiceHistoryEntry = {
          date: existingCustomer.serviceDate,
          serviceType: existingCustomer.serviceType,
          customServiceType: existingCustomer.customServiceType,
          price: existingCustomer.price,
          paymentStatus: 'Paid', // Assume past services are paid
          reminderSent: existingCustomer.reminderSent,
          reminderSentAt: existingCustomer.reminderSentAt,
          notes: existingCustomer.notes
        };
        
        const updatedCustomer: CustomerRecord = {
          ...action.payload,
          history: [currentServiceEntry, ...(existingCustomer.history || [])]
        };
        
        newState = {
          ...state,
          customers: [
            updatedCustomer,
            ...state.customers.filter((_, index) => index !== existingCustomerIndex)
          ],
        };
      } else {
        // New customer
        newState = {
          ...state,
          customers: [action.payload, ...state.customers],
        };
      }
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
      
      // Helper function to calculate total price including history
      const calculateCustomerTotalPrice = (customer: CustomerRecord): number => {
        const currentPrice = customer.price;
        const historyPrice = customer.history?.reduce((sum, entry) => sum + entry.price, 0) || 0;
        return currentPrice + historyPrice;
      };

      // Helper function to get all services (current + history) for a customer
      const getAllCustomerServices = (customer: CustomerRecord) => {
        const services = [
          {
            date: customer.serviceDate,
            price: customer.price
          }
        ];
        
        if (customer.history) {
          services.push(...customer.history.map(entry => ({
            date: entry.date,
            price: entry.price
          })));
        }
        
        return services;
      };
      
      // Calculate total income (all services ever)
      const totalIncome = state.customers.reduce((sum, customer) => {
        return sum + calculateCustomerTotalPrice(customer);
      }, 0);
      
      // Calculate monthly income including history
      const monthlyIncome: Record<string, number> = {};
      state.customers.forEach(customer => {
        const allServices = getAllCustomerServices(customer);
        allServices.forEach(service => {
          const month = service.date.substring(0, 7); // YYYY-MM format
          monthlyIncome[month] = (monthlyIncome[month] || 0) + service.price;
        });
      });

      // Calculate weekly income including history
      const weekStart = new Date(currentDate);
      weekStart.setDate(currentDate.getDate() - currentDate.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      const weeklyIncome = state.customers.reduce((sum, customer) => {
        const allServices = getAllCustomerServices(customer);
        const weekServices = allServices.filter(service => {
          const serviceDate = new Date(service.date);
          return serviceDate >= weekStart && serviceDate <= weekEnd;
        });
        return sum + weekServices.reduce((serviceSum, service) => serviceSum + service.price, 0);
      }, 0);

      // Calculate daily income including history
      const todayString = currentDate.toISOString().split('T')[0];
      const dailyIncome = state.customers.reduce((sum, customer) => {
        const allServices = getAllCustomerServices(customer);
        const todayServices = allServices.filter(service => service.date === todayString);
        return sum + todayServices.reduce((serviceSum, service) => serviceSum + service.price, 0);
      }, 0);
      
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