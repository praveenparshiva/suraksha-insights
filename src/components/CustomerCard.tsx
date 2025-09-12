import { Card } from "@/components/ui/card";
import { CustomerRecord } from "@/contexts/AppContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Trash2, Edit, CheckCircle, Clock, History } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface CustomerCardProps {
  customer: CustomerRecord;
  onDelete?: (id: string) => void;
  onEdit?: (customer: CustomerRecord) => void;
}

export function CustomerCard({ customer, onDelete, onEdit }: CustomerCardProps) {
  const getServiceBadgeVariant = (serviceType: string) => {
    switch (serviceType) {
      case 'Sump':
        return 'default';
      case 'Tank':
        return 'secondary';
      case 'Both':
        return 'outline';
      case 'Other':
        return 'destructive';
      default:
        return 'default';
    }
  };

  const getServiceTypeDisplay = (customer: CustomerRecord) => {
    return customer.serviceType === 'Other' && customer.customServiceType 
      ? customer.customServiceType 
      : customer.serviceType;
  };

  return (
    <Card className="p-6 space-y-4 bg-gradient-to-br from-card to-accent/5 border-2 border-card-border rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 relative backdrop-blur-sm">
      {/* Action buttons */}
      <div className="absolute top-2 right-2 flex gap-1">
        {onEdit && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(customer)}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
          >
            <Edit className="h-4 w-4" />
          </Button>
        )}
        {onDelete && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Service Record</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the service record for {customer.name}? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onDelete(customer.id)}
                className="bg-destructive hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        )}
      </div>
      
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-lg text-foreground">{customer.name}</h3>
          <p className="text-sm text-muted-foreground">{customer.phone}</p>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={getServiceBadgeVariant(customer.serviceType)}>
              {getServiceTypeDisplay(customer)}
            </Badge>
          </div>
        </div>
      </div>
      
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">{customer.address}</p>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Service: {formatDate(customer.serviceDate)}
            </p>
            
            <p className="font-semibold text-primary">
              ₹{customer.price.toLocaleString('en-IN')}
            </p>
          </div>
          
          {customer.nextServiceDate && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-secondary font-medium">
                Next Service: {formatDate(customer.nextServiceDate)}
              </p>
              
              {/* Reminder Status for next service */}
              {customer.reminderSent ? (
                <div className="flex items-center gap-1 text-success">
                  <CheckCircle className="h-3 w-3" />
                  <span className="text-xs">Sent</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span className="text-xs">Not Sent</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {customer.notes && (
        <div className="pt-2 border-t border-border/30">
          <p className="text-sm text-muted-foreground">{customer.notes}</p>
        </div>
      )}
      
      {/* Customer History */}
      {customer.history && customer.history.length > 0 && (
        <div className="pt-2 border-t border-border/30">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="history" className="border-none">
              <AccordionTrigger className="py-2 px-0 hover:no-underline">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <History className="h-4 w-4" />
                  Service History ({customer.history.length})
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-0 pb-2">
                <div className="space-y-3">
                  {customer.history.map((entry, index) => (
                    <div key={index} className="bg-gradient-to-br from-accent/40 to-accent/20 rounded-xl p-4 space-y-2 border-2 border-card-border backdrop-blur-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant={getServiceBadgeVariant(entry.serviceType)} className="text-xs">
                            {entry.serviceType === 'Other' && entry.customServiceType 
                              ? entry.customServiceType 
                              : entry.serviceType}
                          </Badge>
                          {entry.paymentStatus && (
                            <Badge variant={entry.paymentStatus === 'Paid' ? 'default' : 'secondary'} className="text-xs">
                              {entry.paymentStatus}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm font-semibold text-primary">
                          ₹{entry.price.toLocaleString('en-IN')}
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{formatDate(entry.date)}</span>
                        
                        {entry.reminderSent ? (
                          <div className="flex items-center gap-1 text-success">
                            <CheckCircle className="h-3 w-3" />
                            <span>Reminder Sent</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>No Reminder</span>
                          </div>
                        )}
                      </div>
                      
                      {entry.notes && (
                        <p className="text-xs text-muted-foreground mt-1">{entry.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      )}
    </Card>
  );
}