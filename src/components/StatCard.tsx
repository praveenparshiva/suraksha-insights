import { Card } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: string;
  trend?: string;
  trendUp?: boolean;
}

export function StatCard({ title, value, trend, trendUp }: StatCardProps) {
  return (
    <Card className="p-6 bg-gradient-to-br from-card via-card to-accent/10 border-2 border-card-border rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 backdrop-blur-sm">
      <div className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        {trend && (
          <p className={`text-xs ${trendUp ? 'text-success' : 'text-destructive'}`}>
            {trend}
          </p>
        )}
      </div>
    </Card>
  );
}