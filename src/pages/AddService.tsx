import { useState } from "react";
import { useApp, CustomerRecord, normalizePhoneNumber } from "@/contexts/AppContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useToast } from "@/hooks/use-toast";
import { Save, User, Phone, MapPin, Calendar, IndianRupee, Droplets } from "lucide-react";

export function AddService() {
  const { dispatch } = useApp();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    serviceDate: new Date().toISOString().split('T')[0],
    serviceType: '',
    customServiceType: '',
    price: '',
    notes: '',
    nextServiceDate: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.phone || !formData.address || !formData.serviceType || !formData.price) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const newCustomer: CustomerRecord = {
      id: Date.now().toString(),
      name: formData.name,
      phone: normalizePhoneNumber(formData.phone),
      address: formData.address,
      serviceDate: formData.serviceDate,
      serviceType: formData.serviceType as 'Sump' | 'Tank' | 'Both' | 'Other',
      customServiceType: formData.serviceType === 'Other' ? formData.customServiceType : undefined,
      price: parseInt(formData.price),
      notes: formData.notes || undefined,
      nextServiceDate: formData.nextServiceDate || undefined,
      reminderSent: false
    };

    dispatch({ type: 'ADD_CUSTOMER', payload: newCustomer });
    
    toast({
      title: "Service Added",
      description: `New service record for ${formData.name} has been created`,
    });

    // Reset form
    setFormData({
      name: '',
      phone: '',
      address: '',
      serviceDate: new Date().toISOString().split('T')[0],
      serviceType: '',
      customServiceType: '',
      price: '',
      notes: '',
      nextServiceDate: ''
    });
  };

  return (
    <div className="p-4 pb-20 min-h-screen bg-gradient-to-b from-background to-accent/5">
      <div className="space-y-6">
        <div className="text-center space-y-2 relative">
          <div className="absolute top-0 right-0">
            <ThemeToggle />
          </div>
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-glow rounded-full flex items-center justify-center mx-auto shadow-xl">
            <Droplets className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Add New Service</h1>
          <p className="text-muted-foreground">Record a new customer service</p>
        </div>

        <Card className="p-6 space-y-6 bg-gradient-to-br from-card to-accent/5 border-2 border-card-border rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Customer Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Customer Information
              </h3>
              
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter customer name"
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 XXXXX XXXXX"
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address *</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Enter complete address"
                  className="min-h-[80px] resize-none"
                />
              </div>
            </div>

            {/* Service Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Droplets className="h-5 w-5 text-secondary" />
                Service Details
              </h3>
              
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="serviceDate">Service Date *</Label>
                  <Input
                    id="serviceDate"
                    type="date"
                    value={formData.serviceDate}
                    onChange={(e) => setFormData({ ...formData, serviceDate: e.target.value })}
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="serviceType">Service Type *</Label>
                  <Select value={formData.serviceType} onValueChange={(value) => setFormData({ ...formData, serviceType: value, customServiceType: value !== 'Other' ? '' : formData.customServiceType })}>
                    <SelectTrigger className="h-12">
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
                    <Label htmlFor="customServiceType">Custom Service Type *</Label>
                    <Input
                      id="customServiceType"
                      value={formData.customServiceType}
                      onChange={(e) => setFormData({ ...formData, customServiceType: e.target.value })}
                      placeholder="Enter custom service type"
                      className="h-12"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="price">Price Charged (₹) *</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="Enter amount"
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nextServiceDate">Next Service Date (Optional)</Label>
                  <Input
                    id="nextServiceDate"
                    type="date"
                    value={formData.nextServiceDate}
                    onChange={(e) => setFormData({ ...formData, nextServiceDate: e.target.value })}
                    className="h-12"
                  />
                  <p className="text-xs text-muted-foreground">
                    When is the next cleaning scheduled? Leave empty if not planned.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Any additional notes..."
                    className="min-h-[80px] resize-none"
                  />
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full h-12 bg-gradient-to-r from-primary to-primary-glow text-primary-foreground font-semibold">
              <Save className="h-5 w-5 mr-2" />
              Save Service Record
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}