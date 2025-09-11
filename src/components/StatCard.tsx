import { Card } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: string;
  trend?: string;
  trendUp?: boolean;
}

export function StatCard({ title, value, trend, trendUp }: StatCardProps) {
  return (
    <Card className="p-4 bg-gradient-to-br from-card to-accent/10 border-border/50 shadow-sm hover:shadow-md transition-all duration-300">
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