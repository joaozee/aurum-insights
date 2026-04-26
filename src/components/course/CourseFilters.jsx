import { useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/components/lib/utils";

export default function CourseFilters({ onFiltersChange, courses }) {
  const [expanded, setExpanded] = useState(false);
  const [filters, setFilters] = useState({
    category: "all",
    level: "all",
    duration: "all",
    price: "all"
  });

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const activeFilterCount = Object.values(filters).filter(v => v !== "all").length;

  const durationRanges = [
    { label: "Até 5h", min: 0, max: 5 },
    { label: "5h - 10h", min: 5, max: 10 },
    { label: "10h - 20h", min: 10, max: 20 },
    { label: "20h+", min: 20, max: Infinity }
  ];

  return (
    <div className="mb-8">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-violet-400 hover:text-violet-300 transition-colors"
      >
        <span className="font-medium">Filtros Avançados</span>
        {activeFilterCount > 0 && (
          <span className="bg-violet-500/20 text-violet-400 text-xs font-semibold px-2 py-1 rounded-full">
            {activeFilterCount}
          </span>
        )}
        <ChevronDown className={cn("h-4 w-4 transition-transform", expanded && "rotate-180")} />
      </button>

      {expanded && (
        <div className="mt-4 bg-gray-900/50 border border-gray-800 rounded-xl p-6 space-y-6">
          {/* Categoria */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">Categoria</label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: "all", label: "Todos" },
                { value: "investimentos", label: "Investimentos" },
                { value: "formacao", label: "Formação" },
                { value: "avancado", label: "Avançado" }
              ].map(cat => (
                <button
                  key={cat.value}
                  onClick={() => handleFilterChange("category", cat.value)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                    filters.category === cat.value
                      ? "bg-violet-600 text-white"
                      : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Nível */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">Nível</label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: "all", label: "Todos" },
                { value: "iniciante", label: "Iniciante" },
                { value: "intermediario", label: "Intermediário" },
                { value: "avancado", label: "Avançado" }
              ].map(level => (
                <button
                  key={level.value}
                  onClick={() => handleFilterChange("level", level.value)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                    filters.level === level.value
                      ? "bg-violet-600 text-white"
                      : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  )}
                >
                  {level.label}
                </button>
              ))}
            </div>
          </div>

          {/* Duração */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">Duração</label>
            <div className="flex flex-wrap gap-2">
              {[{ value: "all", label: "Todas" }, ...durationRanges].map(dur => (
                <button
                  key={dur.value || dur.label}
                  onClick={() => handleFilterChange("duration", dur.value || dur.label)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                    filters.duration === (dur.value || dur.label)
                      ? "bg-violet-600 text-white"
                      : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  )}
                >
                  {dur.label}
                </button>
              ))}
            </div>
          </div>

          {/* Preço */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">Preço</label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: "all", label: "Todos" },
                { value: "free", label: "Grátis" },
                { value: "paid", label: "Pagos" }
              ].map(price => (
                <button
                  key={price.value}
                  onClick={() => handleFilterChange("price", price.value)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                    filters.price === price.value
                      ? "bg-violet-600 text-white"
                      : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  )}
                >
                  {price.label}
                </button>
              ))}
            </div>
          </div>

          {activeFilterCount > 0 && (
            <Button
              onClick={() => {
                setFilters({ category: "all", level: "all", duration: "all", price: "all" });
                onFiltersChange({ category: "all", level: "all", duration: "all", price: "all" });
              }}
              variant="outline"
              className="w-full border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              <X className="h-4 w-4 mr-2" />
              Limpar Filtros
            </Button>
          )}
        </div>
      )}
    </div>
  );
}