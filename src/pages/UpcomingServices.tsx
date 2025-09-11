import { useApp } from "@/contexts/AppContext";
import { UpcomingServices as UpcomingServicesComponent } from "@/components/UpcomingServices";

export function UpcomingServices() {
  const { state, dispatch } = useApp();
  const { customers } = state;

  const handleMarkReminderSent = (id: string, sentAt: string) => {
    dispatch({ type: 'MARK_REMINDER_SENT', payload: { id, sentAt } });
  };

  return (
    <div className="p-4 pb-20 min-h-screen bg-gradient-to-b from-background to-accent/5">
      <UpcomingServicesComponent 
        customers={customers} 
        onMarkReminderSent={handleMarkReminderSent}
      />
    </div>
  );
}