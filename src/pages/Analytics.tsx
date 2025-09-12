import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import {
  TrendingUp,
  PieChart as PieChartIcon,
  BarChart3,
  Calendar,
  Download,
  FileText,
  Table,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function Analytics() {
  const { state } = useApp();
  const { customers, monthlyIncome } = state;
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<"csv" | "pdf">("csv");
  const [exportMonth, setExportMonth] = useState<string>("all");
  const [exportYear, setExportYear] = useState<string>("all");

  // Prepare monthly income data for chart
  const monthlyData = Object.entries(monthlyIncome)
    .map(([month, income]) => ({
      month: new Date(month + "-01").toLocaleDateString("en-IN", {
        month: "short",
        year: "numeric",
      }),
      income: income,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  // Service type distribution
  const serviceTypeData = customers.reduce((acc, customer) => {
    const type = customer.serviceType;
    const existing = acc.find((item) => item.name === type);
    if (existing) {
      existing.value += 1;
      existing.income += customer.price;
    } else {
      acc.push({
        name: type,
        value: 1,
        income: customer.price,
      });
    }
    return acc;
  }, [] as Array<{ name: string; value: number; income: number }>);

  // Colors for pie chart - specific mapping for better visibility
  const getServiceTypeColor = (serviceType: string) => {
    const colorMap: Record<string, string> = {
      Sump: "hsl(var(--primary))", // Primary brand color
      Tank: "#6A5ACD", // Blue-violet for better contrast
      Both: "hsl(var(--secondary))", // Secondary color
      Other: "#008080", // Teal for custom services
    };
    return colorMap[serviceType] || "hsl(var(--accent))";
  };

  // Recent performance (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const performanceData = customers
    .filter((c) => new Date(c.serviceDate) >= sixMonthsAgo)
    .reduce((acc, customer) => {
      const month = customer.serviceDate.substring(0, 7);
      const existing = acc.find((item) => item.month === month);
      if (existing) {
        existing.customers += 1;
        existing.income += customer.price;
      } else {
        acc.push({
          month: new Date(month + "-01").toLocaleDateString("en-IN", {
            month: "short",
          }),
          customers: 1,
          income: customer.price,
        });
      }
      return acc;
    }, [] as Array<{ month: string; customers: number; income: number }>)
    .sort((a, b) => a.month.localeCompare(b.month));

  // Export functionality
  const getFilteredCustomers = () => {
    if (exportMonth === "all" && exportYear === "all") {
      return customers;
    }
    
    return customers.filter((customer) => {
      const serviceDate = new Date(customer.serviceDate);
      const customerMonth = serviceDate.getMonth() + 1;
      const customerYear = serviceDate.getFullYear();
      
      const monthMatch = exportMonth === "all" || customerMonth === parseInt(exportMonth);
      const yearMatch = exportYear === "all" || customerYear === parseInt(exportYear);
      
      return monthMatch && yearMatch;
    });
  };

  const generateCSV = () => {
    const filteredCustomers = getFilteredCustomers();
    
    const headers = [
      "Customer Name",
      "Phone",
      "Address", 
      "Service Date",
      "Service Type",
      "Price (₹)",
      "Notes"
    ];
    
    const rows = filteredCustomers.map((customer) => [
      customer.name,
      customer.phone,
      customer.address,
      customer.serviceDate,
      customer.serviceType === 'Other' && customer.customServiceType 
        ? customer.customServiceType 
        : customer.serviceType,
      customer.price.toString(),
      customer.notes || ""
    ]);
    
    // Calculate totals
    const totalSpent = filteredCustomers.reduce((sum, customer) => sum + customer.price, 0);
    const avgService = filteredCustomers.length > 0 ? totalSpent / filteredCustomers.length : 0;
    
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(",")),
      "",
      `"Total Services","${filteredCustomers.length}"`,
      `"Total Income","₹${totalSpent.toLocaleString("en-IN")}"`,
      `"Average Service Value","₹${Math.round(avgService).toLocaleString("en-IN")}"`
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `suraksha-data-${exportMonth}-${exportYear}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const generatePDF = () => {
    const filteredCustomers = getFilteredCustomers();
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.text("Suraksha Services - Data Export", 20, 20);
    
    // Date range info
    doc.setFontSize(12);
    const dateRange = `${exportMonth === "all" ? "All Months" : `Month: ${exportMonth}`}, ${exportYear === "all" ? "All Years" : `Year: ${exportYear}`}`;
    doc.text(dateRange, 20, 35);
    
    // Customer data table
    autoTable(doc, {
      head: [["Customer Name", "Phone", "Service Date", "Service Type", "Price (₹)", "Notes"]],
      body: filteredCustomers.map((customer) => [
        customer.name,
        customer.phone,
        customer.serviceDate,
        customer.serviceType === 'Other' && customer.customServiceType 
          ? customer.customServiceType 
          : customer.serviceType,
        customer.price.toLocaleString("en-IN"),
        customer.notes || ""
      ]),
      startY: 45,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] }
    });
    
    // Summary
    const totalSpent = filteredCustomers.reduce((sum, customer) => sum + customer.price, 0);
    const avgService = filteredCustomers.length > 0 ? totalSpent / filteredCustomers.length : 0;
    
    const finalY = (doc as any).lastAutoTable.finalY + 20;
    doc.setFontSize(12);
    doc.text(`Total Services: ${filteredCustomers.length}`, 20, finalY);
    doc.text(`Total Income: ₹${totalSpent.toLocaleString("en-IN")}`, 20, finalY + 10);
    doc.text(`Average Service Value: ₹${Math.round(avgService).toLocaleString("en-IN")}`, 20, finalY + 20);
    
    doc.save(`suraksha-data-${exportMonth}-${exportYear}.pdf`);
  };

  const handleExport = () => {
    if (exportFormat === "csv") {
      generateCSV();
    } else {
      generatePDF();
    }
    setIsExportDialogOpen(false);
  };

  // Get available months and years for filter
  const availableMonths = Array.from(new Set(customers.map(c => new Date(c.serviceDate).getMonth() + 1))).sort();
  const availableYears = Array.from(new Set(customers.map(c => new Date(c.serviceDate).getFullYear()))).sort();

  return (
    <div className="p-4 pb-20 space-y-6 min-h-screen bg-gradient-to-b from-background to-accent/5">
      {/* Header */}
      <div className="text-center space-y-2 relative">
        <div className="absolute top-0 right-0">
          <ThemeToggle />
        </div>
        <div className="w-16 h-16 bg-gradient-to-br from-secondary to-secondary-glow rounded-full flex items-center justify-center mx-auto shadow-xl">
          <BarChart3 className="h-8 w-8 text-secondary-foreground" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground">Business insights & performance</p>
      </div>

      {/* Monthly Income Chart */}
      <Card className="p-6 bg-gradient-to-br from-card to-accent/5 border-2 border-card-border rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">
              Monthly Income
            </h3>
          </div>
          {monthlyData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value) => [
                      `₹${value?.toLocaleString("en-IN")}`,
                      "Income",
                    ]}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar
                    dataKey="income"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              No data available
            </div>
          )}
        </div>
      </Card>

      {/* Service Type Distribution */}
      <Card className="p-6 bg-gradient-to-br from-card to-accent/5 border-2 border-card-border rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <PieChartIcon className="h-5 w-5 text-secondary" />
            <h3 className="text-lg font-semibold text-foreground">
              Service Distribution
            </h3>
          </div>
          {serviceTypeData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={serviceTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {serviceTypeData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={getServiceTypeColor(entry.name)}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [`${value} services`, name]}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              No data available
            </div>
          )}
        </div>
      </Card>

      {/* Performance Trend */}
      <Card className="p-6 bg-gradient-to-br from-card to-accent/5 border-2 border-card-border rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">
              Performance Trend
            </h3>
          </div>
          {performanceData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value, name) => [
                      name === "income"
                        ? `₹${value?.toLocaleString("en-IN")}`
                        : value,
                      name === "income" ? "Income" : "Customers",
                    ]}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="customers"
                    stroke="hsl(var(--secondary))"
                    strokeWidth={3}
                    dot={{
                      fill: "hsl(var(--secondary))",
                      strokeWidth: 2,
                      r: 4,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="income"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              No data available
            </div>
          )}
        </div>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 mb-16">
        <Card className="p-6 bg-gradient-to-br from-success/5 to-success/10 border-2 border-success/30 rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
          <div className="text-center space-y-1">
            <p className="text-sm font-medium text-success">Total Services</p>
            <p className="text-2xl font-bold text-success">
              {customers.length}
            </p>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-2 border-primary/30 rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
          <div className="text-center space-y-1">
            <p className="text-sm font-medium text-primary">
              Avg. Service Value
            </p>
            <p className="text-2xl font-bold text-primary">
              ₹
              {customers.length > 0
                ? Math.round(
                    state.totalIncome / customers.length
                  ).toLocaleString("en-IN")
                : "0"}
            </p>
          </div>
        </Card>
      </div>

      {/* Export Data Section */}
      <Card className="p-6 bg-gradient-to-br from-card to-accent/5 border-2 border-card-border rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm mb-16">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">
              Export Data
            </h3>
          </div>
          <p className="text-muted-foreground text-sm">
            Export your service data for backup or sharing. Choose your preferred format and date range.
          </p>
          
          <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full" variant="default">
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Export Service Data</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Export Format</label>
                  <Select value={exportFormat} onValueChange={(value: "csv" | "pdf") => setExportFormat(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="csv">
                        <div className="flex items-center gap-2">
                          <Table className="h-4 w-4" />
                          CSV (Spreadsheet)
                        </div>
                      </SelectItem>
                      <SelectItem value="pdf">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          PDF (Document)
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Month</label>
                    <Select value={exportMonth} onValueChange={setExportMonth}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Months</SelectItem>
                        {availableMonths.map((month) => (
                          <SelectItem key={month} value={month.toString()}>
                            {new Date(2024, month - 1).toLocaleDateString("en-IN", { month: "long" })}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Year</label>
                    <Select value={exportYear} onValueChange={setExportYear}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Years</SelectItem>
                        {availableYears.map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="pt-4">
                  <Button onClick={handleExport} className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Export {exportFormat.toUpperCase()} File
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </Card>
    </div>
  );
}
