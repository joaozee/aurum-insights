import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function DateRangeFilter({ onRangeChange }) {
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setMonth(new Date().getMonth() - 6)),
    to: new Date()
  });
  const [isOpen, setIsOpen] = useState(false);

  const presetRanges = [
    { label: "Último Mês", months: 1 },
    { label: "3 Meses", months: 3 },
    { label: "6 Meses", months: 6 },
    { label: "1 Ano", months: 12 },
    { label: "2 Anos", months: 24 },
    { label: "Todo Período", months: null }
  ];

  const handlePresetClick = (months) => {
    const to = new Date();
    const from = months ? new Date(new Date().setMonth(new Date().getMonth() - months)) : new Date(2020, 0, 1);
    
    const range = { from, to };
    setDateRange(range);
    onRangeChange(range);
    setIsOpen(false);
  };

  const handleCustomRange = () => {
    onRangeChange(dateRange);
    setIsOpen(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Preset Buttons */}
      <div className="flex flex-wrap gap-2">
        {presetRanges.map((preset) => (
          <Button
            key={preset.label}
            size="sm"
            variant="outline"
            onClick={() => handlePresetClick(preset.months)}
            className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white text-xs"
          >
            {preset.label}
          </Button>
        ))}
      </div>

      {/* Custom Range Picker */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            size="sm"
            variant="outline"
            className="border-violet-500/30 text-violet-400 hover:bg-violet-500/10 text-xs"
          >
            <CalendarIcon className="h-3.5 w-3.5 mr-2" />
            Período Customizado
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-4 bg-gray-900 border-gray-700" align="end">
          <div className="space-y-4">
            <div>
              <p className="text-xs text-gray-400 mb-2">Data Inicial</p>
              <Calendar
                mode="single"
                selected={dateRange.from}
                onSelect={(date) => setDateRange({ ...dateRange, from: date })}
                locale={ptBR}
                className="rounded-md border-gray-700"
              />
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-2">Data Final</p>
              <Calendar
                mode="single"
                selected={dateRange.to}
                onSelect={(date) => setDateRange({ ...dateRange, to: date })}
                locale={ptBR}
                className="rounded-md border-gray-700"
              />
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="flex-1 border-gray-700"
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleCustomRange}
                className="flex-1 bg-violet-600 hover:bg-violet-700"
              >
                Aplicar
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Selected Range Display */}
      <div className="text-xs text-gray-400 ml-2">
        {format(dateRange.from, "dd/MMM/yy", { locale: ptBR })} - {format(dateRange.to, "dd/MMM/yy", { locale: ptBR })}
      </div>
    </div>
  );
}