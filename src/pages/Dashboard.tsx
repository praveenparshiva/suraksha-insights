import { useState, useMemo } from "react";
import { useApp, CustomerRecord } from "@/contexts/AppContext";
import { StatCard } from "@/components/StatCard";
import { CustomerCard } from "@/components/CustomerCard";
import { SearchFilters } from "@/components/SearchFilters";
import { UpcomingServices } from "@/components/UpcomingServices";
import { EditServiceForm } from "@/components/EditServiceForm";
import { Droplets } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export function Dashboard() {
  const { state, dispatch } = useApp();
  const { toast } = useToast();
  const { customers, totalIncome } = state;

  const [filters, setFilters] = useState({
    search: "",
    serviceType: "ALL_TYPES", // ✅ Fixed default value
    dateFrom: "",
    dateTo: "",
  });

  const [editingCustomer, setEditingCustomer] = useState<CustomerRecord | null>(
    null
  );
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);

  const handleDeleteCustomer = (id: string) => {
    const customer = customers.find((c) => c.id === id);
    dispatch({ type: "DELETE_CUSTOMER", payload: id });
    toast({
      title: "Service Deleted",
      description: `Service record for ${customer?.name} has been deleted`,
    });
  };

  const handleEditCustomer = (customer: CustomerRecord) => {
    setEditingCustomer(customer);
    setIsEditFormOpen(true);
  };

  const handleSaveEdit = (updatedCustomer: CustomerRecord) => {
    dispatch({ type: "UPDATE_CUSTOMER", payload: updatedCustomer });
    toast({
      title: "Service Updated",
      description: `Service record for ${updatedCustomer.name} has been updated`,
    });
  };

  const handleMarkReminderSent = (id: string, sentAt: string) => {
    dispatch({ type: "MARK_REMINDER_SENT", payload: { id, sentAt } });
  };

  // Filter customers
  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const matchesName = customer.name.toLowerCase().includes(searchTerm);
        const matchesPhone = customer.phone.toLowerCase().includes(searchTerm);
        if (!matchesName && !matchesPhone) return false;
      }

      // Service type filter
      if (filters.serviceType !== "ALL_TYPES") {
        if (filters.serviceType === "Other") {
          if (customer.serviceType !== "Other" || !customer.customServiceType) {
            return false;
          }
        } else {
          if (customer.serviceType !== filters.serviceType) {
            return false;
          }
        }
      }

      // Date range filter
      if (filters.dateFrom) {
        if (new Date(customer.serviceDate) < new Date(filters.dateFrom)) {
          return false;
        }
      }
      if (filters.dateTo) {
        if (new Date(customer.serviceDate) > new Date(filters.dateTo)) {
          return false;
        }
      }

      return true;
    });
  }, [customers, filters]);

  // Stats
  const currentMonth = new Date().toISOString().substring(0, 7);
  const currentMonthIncome = state.monthlyIncome[currentMonth] || 0;
  const customersThisMonth = customers.filter(
    (c) => c.serviceDate.substring(0, 7) === currentMonth
  ).length;

  const serviceTypes = customers.reduce((acc, customer) => {
    acc[customer.serviceType] = (acc[customer.serviceType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topServiceType =
    Object.entries(serviceTypes).sort(([, a], [, b]) => b - a)[0]?.[0] || "N/A";

  return (
    <div className="p-4 pb-20 space-y-6 min-h-screen bg-gradient-to-b from-background to-accent/5">
      {/* Header */}
      <div className="relative">
        <div className="bg-gradient-to-r from-primary/10 via-secondary/5 to-primary/10 rounded-2xl p-6 border border-primary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-glow rounded-xl p-3 shadow-lg">
                  <img
                    src="/lovable-uploads/f04cecf2-04c0-4022-bbd7-e5ff1285f4e5.png"
                    alt="Suraksha Service"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-success rounded-full border-2 border-background"></div>
              </div>
              <div className="space-y-1">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Suraksha Service
                </h1>
                <p className="text-sm text-muted-foreground font-medium">
                  Professional Water Tank & Sump Cleaning
                </p>
                <div className="flex items-center gap-2 text-xs text-success">
                  <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                  Service Active
                </div>
              </div>
            </div>
            <div className="text-right space-y-1">
              <p className="text-xs text-muted-foreground">Today</p>
              <p className="text-sm font-semibold text-foreground">
                {new Date().toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard
          title="This Month"
          value={`₹${currentMonthIncome.toLocaleString("en-IN")}`}
        />
        <StatCard title="Customers" value={customersThisMonth.toString()} />
        <StatCard
          title="Total Income"
          value={`₹${totalIncome.toLocaleString("en-IN")}`}
        />
        <StatCard title="Top Service" value={topServiceType} />
      </div>

      {/* Upcoming Services */}
      <UpcomingServices
        customers={customers}
        onMarkReminderSent={handleMarkReminderSent}
      />

      {/* Customer Records */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-foreground">Customer Records</h2>

        <SearchFilters onFilter={setFilters} />

        <div className="space-y-3">
          {filteredCustomers.length === 0 ? (
            <Card className="p-8 text-center">
              <Droplets className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {customers.length === 0
                  ? "No Services Yet"
                  : "No Results Found"}
              </h3>
              <p className="text-muted-foreground">
                {customers.length === 0
                  ? "Start by adding your first service record."
                  : "Try adjusting your search or filter criteria."}
              </p>
            </Card>
          ) : (
            filteredCustomers.map((customer) => (
              <CustomerCard
                key={customer.id}
                customer={customer}
                onDelete={handleDeleteCustomer}
                onEdit={handleEditCustomer}
              />
            ))
          )}
        </div>
      </div>

      {/* Edit Service Form */}
      <EditServiceForm
        customer={editingCustomer}
        isOpen={isEditFormOpen}
        onClose={() => {
          setIsEditFormOpen(false);
          setEditingCustomer(null);
        }}
        onSave={handleSaveEdit}
      />
    </div>
  );
}
