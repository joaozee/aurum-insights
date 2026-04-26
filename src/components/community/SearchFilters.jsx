import { useState } from "react";
import { Search, X, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export default function SearchFilters({ 
  onSearch, 
  onFilterChange,
  searchQuery,
  filters 
}) {
  const [showFilters, setShowFilters] = useState(false);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      const newTags = [...tags, tagInput.trim()];
      setTags(newTags);
      onFilterChange({ ...filters, tags: newTags });
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag) => {
    const newTags = tags.filter(t => t !== tag);
    setTags(newTags);
    onFilterChange({ ...filters, tags: newTags });
  };

  const handleClearFilters = () => {
    setTags([]);
    onSearch("");
    onFilterChange({
      sortBy: "recent",
      dateRange: "all",
      author: "",
      tags: []
    });
  };

  return (
    <div className="space-y-4 mb-6">
      {/* Main Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <Input
          placeholder="Buscar posts por palavras-chave..."
          value={searchQuery}
          onChange={(e) => onSearch(e.target.value)}
          className="pl-12 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
        />
      </div>

      {/* Filters Toggle */}
      <div className="flex gap-2">
        <Button
          onClick={() => setShowFilters(!showFilters)}
          variant={showFilters ? "default" : "outline"}
          className={cn(
            "gap-2",
            showFilters && "bg-violet-500/20 text-violet-400 border-violet-500/30"
          )}
        >
          <Filter className="h-4 w-4" />
          Filtros Avançados
        </Button>

        {Object.values(filters).some(v => v && (Array.isArray(v) ? v.length > 0 : v !== "recent" && v !== "all")) && (
          <Button
            onClick={handleClearFilters}
            variant="ghost"
            className="text-gray-400 hover:text-red-400"
          >
            <X className="h-4 w-4 mr-1" />
            Limpar
          </Button>
        )}
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-4 space-y-4">
          {/* Sort By */}
          <div>
            <label className="text-xs text-gray-400 font-medium mb-2 block">
              Ordenar por
            </label>
            <Select
              value={filters.sortBy || "recent"}
              onValueChange={(value) => onFilterChange({ ...filters, sortBy: value })}
            >
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="recent">Mais Recentes</SelectItem>
                <SelectItem value="popular">Mais Populares</SelectItem>
                <SelectItem value="comments">Mais Comentados</SelectItem>
                <SelectItem value="oldest">Mais Antigos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Range */}
          <div>
            <label className="text-xs text-gray-400 font-medium mb-2 block">
              Período
            </label>
            <Select
              value={filters.dateRange || "all"}
              onValueChange={(value) => onFilterChange({ ...filters, dateRange: value })}
            >
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="all">Todos os períodos</SelectItem>
                <SelectItem value="week">Última semana</SelectItem>
                <SelectItem value="month">Último mês</SelectItem>
                <SelectItem value="quarter">Últimos 3 meses</SelectItem>
                <SelectItem value="year">Último ano</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tags */}
          <div>
            <label className="text-xs text-gray-400 font-medium mb-2 block">
              Tags (digite e pressione Enter)
            </label>
            <div className="flex gap-2">
              <Input
                placeholder="Ex: ações, FII, análise..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAddTag()}
                className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-500 text-sm"
              />
              <Button
                onClick={handleAddTag}
                className="bg-violet-500 hover:bg-violet-600"
              >
                +
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <div
                    key={tag}
                    className="bg-violet-500/20 text-violet-300 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                  >
                    #{tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-violet-200"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Author Search */}
          <div>
            <label className="text-xs text-gray-400 font-medium mb-2 block">
              Autor
            </label>
            <Input
              placeholder="Nome do autor..."
              value={filters.author || ""}
              onChange={(e) => onFilterChange({ ...filters, author: e.target.value })}
              className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-500 text-sm"
            />
          </div>
        </div>
      )}
    </div>
  );
}