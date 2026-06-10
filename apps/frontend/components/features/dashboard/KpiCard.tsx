import { cn } from "@/lib/utils";

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  alert?: boolean;
  icon?: React.ReactNode;
}

export function KpiCard({ title, value, subtitle, alert, icon }: KpiCardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-xl border p-5 flex flex-col gap-3 transition-colors",
        alert
          ? "border-red-300 bg-red-50"
          : "border-gray-200 hover:border-primary/40"
      )}
    >
      <div className="flex items-center justify-between">
        <p className={cn(
          "text-xs font-semibold uppercase tracking-wider",
          alert ? "text-red-500" : "text-muted-foreground"
        )}>
          {title}
        </p>
        {icon && (
          <div className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center",
            alert ? "bg-red-100 text-red-500" : "bg-primary/10 text-primary"
          )}>
            {icon}
          </div>
        )}
      </div>
      <div>
        <p className={cn(
          "text-3xl font-bold tracking-tight",
          alert ? "text-red-600" : "text-gray-900"
        )}>
          {value}
        </p>
        {subtitle && (
          <p className={cn("text-xs mt-1", alert ? "text-red-400" : "text-muted-foreground")}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
