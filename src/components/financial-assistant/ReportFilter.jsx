import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ReportFilter({ period, onPeriodChange }) {
  const periods = [
    { id: 'monthly', label: 'Mensal' },
    { id: 'quarterly', label: 'Trimestral' },
    { id: 'annual', label: 'Anual' }
  ];

  return (
    <div className="flex gap-2 mb-4">
      {periods.map((p) => (
        <Button
          key={p.id}
          size="sm"
          onClick={() => onPeriodChange(p.id)}
          className={cn(
            "transition-all",
            period === p.id
              ? "bg-violet-500 text-white"
              : "bg-gray-800 text-gray-300 hover:bg-gray-700"
          )}
        >
          {p.label}
        </Button>
      ))}
    </div>
  );
}