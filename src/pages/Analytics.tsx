import { useApp } from "@/contexts/AppContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  FileDown,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function Analytics() {
  const { state } = useApp();
  const { customers, monthlyIncome } = state;

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

  // PDF Export Function
  const generatePDFReport = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    let yPosition = margin;

    // Title
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("Suraksha Service Analytics Report", pageWidth / 2, yPosition, { align: "center" });
    yPosition += 20;

    // Report Date
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated on: ${new Date().toLocaleDateString("en-IN")}`, pageWidth / 2, yPosition, { align: "center" });
    yPosition += 20;

    // Business Summary Section
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Business Summary", margin, yPosition);
    yPosition += 15;

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Total Services (All-time): ${customers.length}`, margin, yPosition);
    yPosition += 8;
    doc.text(`Total Income: ₹${state.totalIncome.toLocaleString("en-IN")}`, margin, yPosition);
    yPosition += 8;
    
    const avgServiceValue = customers.length > 0 ? Math.round(state.totalIncome / customers.length) : 0;
    doc.text(`Average Service Value: ₹${avgServiceValue.toLocaleString("en-IN")}`, margin, yPosition);
    yPosition += 15;

    // Monthly Income Summary
    if (monthlyData.length > 0) {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Monthly Income Summary", margin, yPosition);
      yPosition += 10;

      const monthlyTableData = monthlyData.map(item => [
        item.month,
        `₹${item.income.toLocaleString("en-IN")}`
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [["Month", "Income"]],
        body: monthlyTableData,
        margin: { left: margin, right: margin },
        styles: { fontSize: 10 },
        headStyles: { fillColor: [66, 139, 202] },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 15;
    }

    // Service Distribution
    if (serviceTypeData.length > 0) {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Service Distribution", margin, yPosition);
      yPosition += 10;

      const serviceTableData = serviceTypeData.map(item => [
        item.name,
        item.value.toString(),
        `₹${item.income.toLocaleString("en-IN")}`
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [["Service Type", "Count", "Total Income"]],
        body: serviceTableData,
        margin: { left: margin, right: margin },
        styles: { fontSize: 10 },
        headStyles: { fillColor: [66, 139, 202] },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 15;
    }

    // Check if we need a new page
    if (yPosition > 200) {
      doc.addPage();
      yPosition = margin;
    }

    // Customer Details Section
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Customer Details", margin, yPosition);
    yPosition += 15;

    if (customers.length > 0) {
      const customerTableData = customers.map(customer => [
        customer.name,
        `+91${customer.phone}`,
        customer.address,
        customer.serviceDate,
        customer.serviceType,
        `₹${customer.price.toLocaleString("en-IN")}`,
        "Completed", // Default payment status since it's not in the data model
        customer.nextServiceDate || "N/A"
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [["Name", "Phone", "Address", "Service Date", "Type", "Price", "Payment", "Next Service"]],
        body: customerTableData,
        margin: { left: margin, right: margin },
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [66, 139, 202] },
        columnStyles: {
          2: { cellWidth: 25 }, // Address column
          0: { cellWidth: 20 }, // Name column
        },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 15;
    }

    // Analytics Snapshot
    const currentMonth = new Date().toISOString().substring(0, 7);
    const thisMonthCustomers = customers.filter(c => c.serviceDate.startsWith(currentMonth));
    const thisMonthIncome = thisMonthCustomers.reduce((sum, c) => sum + c.price, 0);
    const topServiceType = serviceTypeData.length > 0 ? serviceTypeData.reduce((a, b) => a.value > b.value ? a : b).name : "N/A";

    // Check if we need a new page for analytics snapshot
    if (yPosition > 230) {
      doc.addPage();
      yPosition = margin;
    }

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Analytics Snapshot", margin, yPosition);
    yPosition += 15;

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Top Service Type: ${topServiceType}`, margin, yPosition);
    yPosition += 8;
    doc.text(`Customers This Month: ${thisMonthCustomers.length}`, margin, yPosition);
    yPosition += 8;
    doc.text(`This Month's Income: ₹${thisMonthIncome.toLocaleString("en-IN")}`, margin, yPosition);

    // Save the PDF
    const fileName = `Suraksha_Analytics_Report_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
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

      {/* Export Data Card */}
      <Card className="p-6 bg-gradient-to-br from-card to-accent/5 border-2 border-card-border rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center mx-auto shadow-lg">
            <FileDown className="h-8 w-8 text-primary-foreground" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">Export Business Report</h3>
            <p className="text-sm text-muted-foreground">Generate a comprehensive PDF report with all your business analytics and customer data</p>
          </div>
          <Button 
            onClick={generatePDFReport}
            className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl font-medium"
          >
            <FileDown className="h-4 w-4 mr-2" />
            Export Data as PDF
          </Button>
        </div>
      </Card>
    </div>
  );
}
