import { CustomerRecord, normalizePhoneNumber } from "@/contexts/AppContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  MessageCircle,
  Phone,
  CheckCircle,
  Clock,
} from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";

interface UpcomingServicesProps {
  customers: CustomerRecord[];
  onMarkReminderSent: (id: string, sentAt: string) => void;
}

export function UpcomingServices({
  customers,
  onMarkReminderSent,
}: UpcomingServicesProps) {
  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerRecord | null>(null);
  const [customMessage, setCustomMessage] = useState("");
  const { toast } = useToast();

  // Filter customers with next service within 3 days
  const upcomingCustomers = customers.filter((customer) => {
    if (!customer.nextServiceDate) return false;

    const nextServiceDate = new Date(customer.nextServiceDate);
    const today = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(today.getDate() + 3);

    return nextServiceDate >= today && nextServiceDate <= threeDaysFromNow;
  });

  const getDefaultMessage = (customer: CustomerRecord) => {
    const nextDate = customer.nextServiceDate
      ? formatDate(customer.nextServiceDate)
      : "";

    // Map service types to friendly labels
    let serviceLabel: string;
    switch (customer.serviceType.toLowerCase()) {
      case "sump":
        serviceLabel = "sump cleaning";
        break;
      case "tank":
        serviceLabel = "water tank cleaning";
        break;
      case "both":
      case "other":
        serviceLabel = "water tank and sump cleaning";
        break;
      default:
        serviceLabel = customer.serviceType.toLowerCase();
        break;
    }

    return `Hi Dear Sir/Madam, this is a gentle reminder from Suraksha Service. Your next ${serviceLabel} is due on ${nextDate}. Please confirm if we should book your slot, or let us know a better time. Thank you for trusting us with your water tank/sump cleaning needs!`;
  };

  const validatePhoneNumber = (phone: string): boolean => {
    const normalized = normalizePhoneNumber(phone);
    // Check if the normalized number has at least 10 digits after country code
    const digits = normalized.replace(/\D/g, "");
    return digits.length >= 12; // +91 + 10 digits
  };

  const handleSendWhatsApp = (customer: CustomerRecord, message: string) => {
    if (!validatePhoneNumber(customer.phone)) {
      toast({
        title: "Invalid Phone Number",
        description: "Please check the phone number format.",
        variant: "destructive",
      });
      return;
    }

    const normalizedPhone = normalizePhoneNumber(customer.phone);
    const phoneNumber = normalizedPhone.replace(/\D/g, "");
    const encodedMessage = encodeURIComponent(message);

    // Primary WhatsApp link
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

    try {
      window.open(whatsappUrl, "_blank");

      // Mark reminder as sent
      const sentAt = new Date().toISOString();
      onMarkReminderSent(customer.id, sentAt);

      toast({
        title: "Reminder Sent",
        description: `WhatsApp reminder sent to ${customer.name}`,
      });
    } catch (error) {
      // Fallback to app scheme
      const fallbackUrl = `whatsapp://send?phone=${phoneNumber}&text=${encodedMessage}`;
      window.location.href = fallbackUrl;
    }
  };

  const openMessageDialog = (customer: CustomerRecord) => {
    setSelectedCustomer(customer);
    setCustomMessage(getDefaultMessage(customer));
  };

  if (upcomingCustomers.length === 0) {
    return (
      <Card className="p-6 text-center">
        <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          No Upcoming Services
        </h3>
        <p className="text-muted-foreground">
          No services scheduled within the next 3 days.
        </p>
      </Card>
    );
  }

  // Get urgency color based on days
  const getUrgencyColor = (daysDiff: number) => {
    if (daysDiff <= 0) return "hsl(211 96% 36%)"; // Red for today/overdue
    if (daysDiff === 1) return "hsl(45 93% 47%)"; // Amber for tomorrow
    if (daysDiff <= 3) return "hsl(187 100% 42%)"; // Cyan for 2-3 days
    return "transparent";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-bold text-foreground">Upcoming Services</h2>
        <Badge variant="secondary">{upcomingCustomers.length}</Badge>
      </div>

      <div className="space-y-3">
        {upcomingCustomers.map((customer) => {
          const nextServiceDate = new Date(customer.nextServiceDate!);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          nextServiceDate.setHours(0, 0, 0, 0);

          const daysDiff = Math.ceil(
            (nextServiceDate.getTime() - today.getTime()) /
              (1000 * 60 * 60 * 24)
          );
          const urgencyColor = getUrgencyColor(daysDiff);

          return (
            <Card key={customer.id} className="p-4 relative overflow-hidden">
              {/* Urgency indicator */}
              {urgencyColor !== "transparent" && (
                <div
                  className="absolute bottom-2 right-2 w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: urgencyColor,
                    boxShadow: `0 0 20px ${urgencyColor}80`,
                  }}
                />
              )}

              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-foreground truncate">
                      {customer.name}
                    </h3>
                    <Badge
                      variant={
                        daysDiff <= 0
                          ? "destructive"
                          : daysDiff === 1
                          ? "default"
                          : "secondary"
                      }
                    >
                      {daysDiff <= 0
                        ? "Today"
                        : daysDiff === 1
                        ? "Tomorrow"
                        : `${daysDiff} days`}
                    </Badge>
                  </div>

                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3" />
                      <span className="truncate">{customer.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(customer.nextServiceDate!)}</span>
                      <Badge variant="outline" className="ml-2">
                        {customer.serviceType === "Other" &&
                        customer.customServiceType
                          ? customer.customServiceType
                          : customer.serviceType}
                      </Badge>
                    </div>

                    {/* Reminder Status */}
                    <div className="flex items-center gap-2 mt-2">
                      {customer.reminderSent ? (
                        <div className="flex items-center gap-1 text-success">
                          <CheckCircle className="h-3 w-3" />
                          <span className="text-xs">
                            Sent{" "}
                            {customer.reminderSentAt
                              ? formatDate(customer.reminderSentAt)
                              : ""}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span className="text-xs text-red-500">
                            Reminder Not Sent
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      onClick={() => openMessageDialog(customer)}
                      className="absolute top-2 right-2 flex items-center gap-2"
                      size="sm"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Send
                    </Button>
                  </DialogTrigger>

                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Send WhatsApp Reminder</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Customer: {selectedCustomer?.name}</Label>
                        <Label className="text-sm text-muted-foreground">
                          Phone: {selectedCustomer?.phone}
                        </Label>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="message">Reminder Message</Label>
                        <Textarea
                          id="message"
                          value={customMessage}
                          onChange={(e) => setCustomMessage(e.target.value)}
                          className="min-h-[120px]"
                          placeholder="Enter your custom message..."
                        />
                      </div>

                      <Button
                        onClick={() => {
                          if (selectedCustomer) {
                            handleSendWhatsApp(selectedCustomer, customMessage);
                          }
                        }}
                        className="w-full"
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Send WhatsApp Message
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
