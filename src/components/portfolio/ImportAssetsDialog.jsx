import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { FileUp, AlertCircle, CheckCircle2, Loader2, Upload } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";

export default function ImportAssetsDialog({ userEmail, onAssetsImported }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [importResult, setImportResult] = useState(null);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const isValidType = file.type === "application/pdf" || 
                         file.type === "text/csv" ||
                         file.name.endsWith(".csv");
      
      if (!isValidType) {
        toast.error("Apenas PDF e CSV são suportados");
        return;
      }
      setSelectedFile(file);
      setImportResult(null);
    }
  };

  const parseCSV = (csvText) => {
    const lines = csvText.split('\n').filter(line => line.trim());
    const assets = [];

    // Detectar se tem header e pular se necessário
    let startIndex = 0;
    if (lines[0].toLowerCase().includes('ticker') || 
        lines[0].toLowerCase().includes('ação') ||
        lines[0].toLowerCase().includes('quantidade')) {
      startIndex = 1;
    }

    for (let i = startIndex; i < lines.length; i++) {
      const parts = lines[i].split(',').map(p => p.trim());
      
      if (parts.length >= 3) {
        const ticker = parts[0].toUpperCase();
        const quantity = parseFloat(parts[1]);
        const price = parseFloat(parts[2]);

        if (ticker && !isNaN(quantity) && !isNaN(price) && quantity > 0 && price > 0) {
          assets.push({ ticker, quantity, price });
        }
      }
    }

    return assets;
  };

  const handleImport = async () => {
    if (!selectedFile) {
      toast.error("Selecione um arquivo");
      return;
    }

    setLoading(true);
    try {
      let assets = [];

      if (selectedFile.type === "text/csv" || selectedFile.name.endsWith(".csv")) {
        const text = await selectedFile.text();
        assets = parseCSV(text);
      } else if (selectedFile.type === "application/pdf") {
        // Upload PDF e extrair
        const uploadRes = await base44.integrations.Core.UploadFile({ file: selectedFile });
        
        const extractRes = await base44.integrations.Core.ExtractDataFromUploadedFile({
          file_url: uploadRes.file_url,
          json_schema: {
            type: "object",
            properties: {
              assets: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    ticker: { type: "string" },
                    quantity: { type: "number" },
                    purchase_price: { type: "number" }
                  }
                }
              }
            }
          }
        });

        if (extractRes.status === "success" && extractRes.output?.assets) {
          assets = extractRes.output.assets.map(a => ({
            ticker: a.ticker?.toUpperCase(),
            quantity: a.quantity,
            price: a.purchase_price
          })).filter(a => a.ticker && a.quantity > 0 && a.price > 0);
        }
      }

      if (assets.length === 0) {
        toast.error("Nenhum ativo válido encontrado no arquivo");
        setLoading(false);
        return;
      }

      // Criar transações de compra
      const transactions = assets.map(a => ({
        user_email: userEmail,
        ticker: a.ticker,
        type: "compra",
        quantity: a.quantity,
        price: a.price,
        total_value: a.quantity * a.price,
        transaction_date: new Date().toISOString().split('T')[0],
        notes: "Importado de arquivo"
      }));

      await base44.entities.Transaction.bulkCreate(transactions);

      setImportResult({
        success: true,
        message: `${assets.length} ativo(s) importado(s) com sucesso!`,
        count: assets.length
      });

      toast.success(`${assets.length} ativo(s) importado(s)`);
      setTimeout(() => {
        setOpen(false);
        setSelectedFile(null);
        setImportResult(null);
        onAssetsImported?.();
      }, 2000);
    } catch (err) {
      console.error(err);
      setImportResult({
        success: false,
        message: "Erro ao importar ativos. Verifique o arquivo e tente novamente."
      });
      toast.error("Erro ao importar ativos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant="outline"
        className="border-gray-700 text-gray-300 hover:bg-gray-800"
      >
        <FileUp className="h-4 w-4 mr-2" />
        Importar Carteira
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-gray-900 border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white">Importar Carteira de Ativos</DialogTitle>
            <DialogDescription className="text-gray-400">
              Envie um arquivo PDF ou CSV com seus ativos
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {!importResult ? (
              <>
                <div className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center hover:border-violet-500 transition-colors cursor-pointer"
                     onClick={() => document.getElementById("file-input")?.click()}>
                  <Upload className="h-12 w-12 text-gray-500 mx-auto mb-3" />
                  <p className="text-white font-medium mb-1">Clique para selecionar</p>
                  <p className="text-sm text-gray-400">ou arraste seu arquivo aqui</p>
                  <input
                    id="file-input"
                    type="file"
                    accept=".pdf,.csv"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>

                {selectedFile && (
                  <div className="bg-gray-800 rounded-lg p-4">
                    <p className="text-sm text-gray-300">
                      <span className="font-medium">Arquivo selecionado:</span> {selectedFile.name}
                    </p>
                  </div>
                )}

                <div className="bg-gray-800/50 rounded-lg p-4 text-sm text-gray-400">
                  <p className="font-medium text-white mb-2">Formato esperado:</p>
                  <p>• CSV: ticker, quantidade, preço (um por linha)</p>
                  <p>• PDF: Será automaticamente extraído</p>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => setOpen(false)}
                    variant="outline"
                    className="flex-1 border-gray-700 text-gray-300"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleImport}
                    disabled={!selectedFile || loading}
                    className="flex-1 bg-violet-600 hover:bg-violet-700 text-white"
                  >
                    {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Importar
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center space-y-4 py-6">
                {importResult.success ? (
                  <>
                    <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
                    <div>
                      <p className="text-white font-medium">{importResult.message}</p>
                      <p className="text-gray-400 text-sm mt-1">
                        Suas transações foram adicionadas à carteira
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
                    <p className="text-red-400 font-medium">{importResult.message}</p>
                  </>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}