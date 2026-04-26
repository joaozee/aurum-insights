import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TrendingUp, Loader2, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function StockEventsSyncButton({ userEmail, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [synced, setSynced] = useState(false);

  const handleSync = async () => {
    setLoading(true);
    setSynced(false);

    try {
      const response = await base44.functions.invoke('syncStockEvents', {});
      
      if (response.data.success) {
        toast.success(response.data.message);
        setSynced(true);
        onSuccess?.();
        
        setTimeout(() => setSynced(false), 3000);
      } else {
        toast.error("Erro ao sincronizar eventos");
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro ao sincronizar com BRAPI");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleSync}
      disabled={loading || synced}
      variant="outline"
      className="border-violet-500/30 text-violet-400 hover:bg-violet-500/10"
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Sincronizando...
        </>
      ) : synced ? (
        <>
          <Check className="h-4 w-4 mr-2" />
          Sincronizado
        </>
      ) : (
        <>
          <TrendingUp className="h-4 w-4 mr-2" />
          Sincronizar Ações
        </>
      )}
    </Button>
  );
}