import { useState } from "react";
import { Key, CheckCircle2, X } from "lucide-react";
import { getBrapiToken, setBrapiToken, clearBrapiCache } from "@/lib/brapiClient";

export default function BrapiTokenConfig({ onSave }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(getBrapiToken);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setBrapiToken(value.trim());
    clearBrapiCache();
    setSaved(true);
    setTimeout(() => { setSaved(false); setOpen(false); onSave?.(); }, 800);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-amber-400 transition-colors px-2 py-1 rounded-lg border border-gray-700 hover:border-amber-500/50"
      >
        <Key className="h-3 w-3" />
        Token API
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <Key className="h-4 w-4 text-amber-400" />
                Token brapi.dev
              </h3>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-gray-400 mb-4">
              Insira seu token da <a href="https://brapi.dev" target="_blank" rel="noopener noreferrer" className="text-amber-400 underline">brapi.dev</a> para acesso aos dados de mercado.
              O token é salvo localmente no seu navegador.
            </p>
            <input
              type="text"
              value={value}
              onChange={e => setValue(e.target.value)}
              placeholder="Seu token brapi..."
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 py-2 rounded-lg border border-gray-700 text-gray-400 hover:text-white text-sm transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="flex-1 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm transition-colors flex items-center justify-center gap-2"
              >
                {saved ? <><CheckCircle2 className="h-4 w-4" /> Salvo!</> : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}