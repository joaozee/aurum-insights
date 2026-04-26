import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Loader2, Search } from "lucide-react";
import { cn } from "@/lib/utils";

// Lista de ações mais populares da B3
const POPULAR_STOCKS = [
  { stock: "PETR4", name: "Petrobras", type: "stock" },
  { stock: "PETR3", name: "Petrobras", type: "stock" },
  { stock: "VALE3", name: "Vale", type: "stock" },
  { stock: "ITUB4", name: "Itaú Unibanco", type: "stock" },
  { stock: "BBDC4", name: "Bradesco", type: "stock" },
  { stock: "BBAS3", name: "Banco do Brasil", type: "stock" },
  { stock: "BBSE3", name: "BB Seguridade", type: "stock" },
  { stock: "ABEV3", name: "Ambev", type: "stock" },
  { stock: "B3SA3", name: "B3", type: "stock" },
  { stock: "WEGE3", name: "Weg", type: "stock" },
  { stock: "RENT3", name: "Localiza", type: "stock" },
  { stock: "SUZB3", name: "Suzano", type: "stock" },
  { stock: "RAIL3", name: "Rumo", type: "stock" },
  { stock: "JBSS3", name: "JBS", type: "stock" },
  { stock: "MGLU3", name: "Magazine Luiza", type: "stock" },
  { stock: "LREN3", name: "Lojas Renner", type: "stock" },
  { stock: "GGBR4", name: "Gerdau", type: "stock" },
  { stock: "USIM5", name: "Usiminas", type: "stock" },
  { stock: "CSNA3", name: "CSN", type: "stock" },
  { stock: "EMBR3", name: "Embraer", type: "stock" },
  { stock: "CIEL3", name: "Cielo", type: "stock" },
  { stock: "RADL3", name: "Raia Drogasil", type: "stock" },
  { stock: "HAPV3", name: "Hapvida", type: "stock" },
  { stock: "VIVT3", name: "Telefônica Brasil", type: "stock" },
  { stock: "ELET3", name: "Eletrobras", type: "stock" },
  { stock: "ELET6", name: "Eletrobras", type: "stock" },
  { stock: "CMIG4", name: "Cemig", type: "stock" },
  { stock: "CPLE6", name: "Copel", type: "stock" },
  { stock: "ENBR3", name: "Energias BR", type: "stock" },
  { stock: "TAEE11", name: "Taesa", type: "stock" },
  { stock: "SAPR11", name: "Sanepar", type: "stock" },
  { stock: "SBSP3", name: "Sabesp", type: "stock" },
  { stock: "CCRO3", name: "CCR", type: "stock" },
  { stock: "EQTL3", name: "Equatorial", type: "stock" },
  { stock: "SANB11", name: "Santander Brasil", type: "stock" },
  { stock: "KLBN11", name: "Klabin", type: "stock" },
  { stock: "BRKM5", name: "Braskem", type: "stock" },
  { stock: "GOAU4", name: "Gerdau Metalúrgica", type: "stock" },
  { stock: "BRFS3", name: "BRF", type: "stock" },
  { stock: "MRVE3", name: "MRV", type: "stock" },
  { stock: "CYRE3", name: "Cyrela", type: "stock" },
  { stock: "PRIO3", name: "PetroRio", type: "stock" },
  { stock: "RECV3", name: "PetroReconcavo", type: "stock" }
];

export default function TickerAutocomplete({ value, onChange, placeholder = "Ex: PETR4", className, ...props }) {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target) &&
        inputRef.current &&
        !inputRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const inputValue = e.target.value.toUpperCase();
    onChange(inputValue);
    setSelectedIndex(-1);

    if (inputValue.length >= 1) {
      const filtered = POPULAR_STOCKS
        .filter(stock => 
          stock.stock.toUpperCase().includes(inputValue) || 
          stock.name.toUpperCase().includes(inputValue)
        )
        .slice(0, 8);
      
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = (stock) => {
    onChange(stock.stock);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelectSuggestion(suggestions[selectedIndex]);
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <Input
          ref={inputRef}
          placeholder={placeholder}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => value.length >= 1 && suggestions.length > 0 && setShowSuggestions(true)}
          className={cn("bg-gray-800 border-gray-700 text-white pr-10", className)}
          autoComplete="off"
          {...props}
        />
        {value.length >= 1 && (
          <Search className="h-4 w-4 absolute right-3 top-3 text-gray-500" />
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div 
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-2 bg-gray-900 border-2 border-violet-500/30 rounded-xl shadow-2xl overflow-hidden max-h-96 overflow-y-auto"
        >
          {suggestions.map((stock, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectSuggestion(stock)}
              className={cn(
                "w-full px-5 py-4 text-left transition-all border-b border-gray-800 last:border-b-0 group",
                selectedIndex === idx 
                  ? "bg-violet-500/20 border-violet-500/50" 
                  : "hover:bg-violet-500/10"
              )}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className={cn(
                      "font-bold text-base transition-colors",
                      selectedIndex === idx ? "text-violet-300" : "text-white group-hover:text-violet-400"
                    )}>
                      {stock.stock}
                    </p>
                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] font-semibold rounded uppercase">
                      {stock.type}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm truncate">
                    {stock.name}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}