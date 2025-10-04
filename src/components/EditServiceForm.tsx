import { useState, useEffect } from "react";
import { CustomerRecord } from "@/contexts/AppContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Save, User, Phone, MapPin, Droplets } from "lucide-react";
import { syncWithN8n } from "@/lib/n8n-sync";
import { useToast } from "@/hooks/use-toast";

interface EditServiceFormProps {
  customer: CustomerRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (customer: CustomerRecord) => void;
}

export function EditServiceForm({ customer, isOpen, onClose, onSave }: EditServiceFormProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    serviceDate: '',
    serviceType: '',
    customServiceType: '',
    price: '',
    notes: '',
    nextServiceDate: ''
  });

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name,
        phone: customer.phone,
        address: customer.address,
        serviceDate: customer.serviceDate,
        serviceType: customer.serviceType,
        customServiceType: customer.customServiceType || '',
        price: customer.price.toString(),
        notes: customer.notes || '',
        nextServiceDate: customer.nextServiceDate || ''
      });
    }
  }, [customer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customer || !formData.name || !formData.phone || !formData.address || !formData.serviceType || !formData.price) {
      return;
    }

    const updatedCustomer: CustomerRecord = {
      ...customer,
      name: formData.name,
      phone: formData.phone,
      address: formData.address,
      serviceDate: formData.serviceDate,
      serviceType: formData.serviceType as 'Sump' | 'Tank' | 'Both' | 'Other',
      customServiceType: formData.serviceType === 'Other' ? formData.customServiceType : undefined,
      price: parseInt(formData.price),
      notes: formData.notes || undefined,
      nextServiceDate: formData.nextServiceDate || undefined
    };

    onSave(updatedCustomer);

    // Sync with n8n automation
    const synced = await syncWithN8n(updatedCustomer);
    
    if (synced) {
      toast({
        title: "Data synced with Suraksha Automation ✅",
        description: "Updated service data sent to automation",
      });
    } else {
      toast({
        title: "Could not sync with automation ⚠️",
        description: "Changes saved locally, but automation sync failed",
        variant: "destructive"
      });
    }

    onClose();
  };

  if (!customer) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Service Record</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Customer Information */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Customer Information
            </h4>
            
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter customer name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone Number *</Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 XXXXX XXXXX"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-address">Address *</Label>
              <Textarea
                id="edit-address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Enter complete address"
                className="min-h-[60px] resize-none"
              />
            </div>
          </div>

          {/* Service Details */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Droplets className="h-4 w-4 text-secondary" />
              Service Details
            </h4>
            
            <div className="space-y-2">
              <Label htmlFor="edit-serviceDate">Service Date *</Label>
              <Input
                id="edit-serviceDate"
                type="date"
                value={formData.serviceDate}
                onChange={(e) => setFormData({ ...formData, serviceDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-serviceType">Service Type *</Label>
              <Select value={formData.serviceType} onValueChange={(value) => setFormData({ ...formData, serviceType: value, customServiceType: value !== 'Other' ? '' : formData.customServiceType })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select service type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sump">Sump Cleaning</SelectItem>
                  <SelectItem value="Tank">Tank Cleaning</SelectItem>
                  <SelectItem value="Both">Both (Sump + Tank)</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.serviceType === 'Other' && (
              <div className="space-y-2">
                <Label htmlFor="edit-customServiceType">Custom Service Type *</Label>
                <Input
                  id="edit-customServiceType"
                  value={formData.customServiceType}
                  onChange={(e) => setFormData({ ...formData, customServiceType: e.target.value })}
                  placeholder="Enter custom service type"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="edit-price">Price Charged (₹) *</Label>
              <Input
                id="edit-price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="Enter amount"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-nextServiceDate">Next Service Date</Label>
              <Input
                id="edit-nextServiceDate"
                type="date"
                value={formData.nextServiceDate}
                onChange={(e) => setFormData({ ...formData, nextServiceDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any additional notes..."
                className="min-h-[60px] resize-none"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}