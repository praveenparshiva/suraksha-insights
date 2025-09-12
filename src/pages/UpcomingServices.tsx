import { useApp } from "@/contexts/AppContext";
import { UpcomingServices as UpcomingServicesComponent } from "@/components/UpcomingServices";
import { ThemeToggle } from "@/components/ThemeToggle";

export function UpcomingServices() {
  const { state, dispatch } = useApp();
  const { customers } = state;

  const handleMarkReminderSent = (id: string, sentAt: string) => {
    dispatch({ type: 'MARK_REMINDER_SENT', payload: { id, sentAt } });
  };

  return (
    <div className="p-4 pb-20 min-h-screen bg-gradient-to-b from-background to-accent/5">
      <div className="relative mb-6">
        <div className="absolute top-0 right-0">
          <ThemeToggle />
        </div>
      </div>
      <UpcomingServicesComponent 
        customers={customers} 
        onMarkReminderSent={handleMarkReminderSent}
      />
    </div>
  );
}