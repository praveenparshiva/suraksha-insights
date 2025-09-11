import { useApp } from "@/contexts/AppContext";
import { Card } from "@/components/ui/card";
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
} from "lucide-react";

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
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-gradient-to-br from-secondary to-secondary-glow rounded-full flex items-center justify-center mx-auto">
          <BarChart3 className="h-8 w-8 text-secondary-foreground" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground">Business insights & performance</p>
      </div>

      {/* Monthly Income Chart */}
      <Card className="p-6 bg-card border-border/50 shadow-lg">
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
      <Card className="p-6 bg-card border-border/50 shadow-lg">
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
      <Card className="p-6 bg-card border-border/50 shadow-lg">
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
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4 bg-gradient-to-br from-success/5 to-success/10 border-success/20">
          <div className="text-center space-y-1">
            <p className="text-sm font-medium text-success">Total Services</p>
            <p className="text-2xl font-bold text-success">
              {customers.length}
            </p>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
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
    </div>
  );
}
