import { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FileText, Upload, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function ImportTransactionsDialog({ open, onOpenChange, userEmail, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [results, setResults] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.type.includes('pdf')) {
      toast.error('Por favor, selecione um arquivo PDF');
      return;
    }

    setFile(selectedFile);
    await processFile(selectedFile);
  };

  const processFile = async (pdfFile) => {
    setLoading(true);
    try {
      // Upload the file
      const uploadRes = await base44.integrations.Core.UploadFile({ file: pdfFile });
      const fileUrl = uploadRes.file_url;

      // Extract data from PDF
      const extractRes = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url: fileUrl,
        json_schema: {
          type: 'object',
          properties: {
            transactions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  date: { type: 'string', description: 'Data da transação (DD/MM/YYYY ou YYYY-MM-DD)' },
                  description: { type: 'string', description: 'Descrição da transação' },
                  amount: { type: 'number', description: 'Valor da transação (sem símbolos)' },
                  type: { type: 'string', enum: ['entrada', 'saida'], description: 'Tipo: entrada ou saida' }
                },
                required: ['date', 'amount', 'type']
              }
            }
          }
        }
      });

      if (extractRes.status !== 'success') {
        toast.error('Erro ao extrair dados do PDF');
        setLoading(false);
        return;
      }

      const transactions = extractRes.output?.transactions || [];
      
      if (transactions.length === 0) {
        toast.error('Nenhuma transação encontrada no PDF');
        setLoading(false);
        return;
      }

      // Map and create transactions
      const mappedTransactions = transactions.map(t => ({
        user_email: userEmail,
        type: t.type,
        category: categorizeTransaction(t.description, t.type),
        amount: Math.abs(t.amount),
        description: t.description,
        transaction_date: formatDate(t.date)
      }));

      // Bulk create transactions
      await base44.entities.FinanceTransaction.bulkCreate(mappedTransactions);

      setResults({
        success: true,
        count: mappedTransactions.length,
        transactions: mappedTransactions
      });

      toast.success(`${mappedTransactions.length} transações importadas com sucesso!`);
      
      setTimeout(() => {
        onSuccess?.();
        handleClose();
      }, 2000);

    } catch (err) {
      console.error(err);
      toast.error('Erro ao processar arquivo');
      setResults({
        success: false,
        error: err.message
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return new Date().toISOString().split('T')[0];
    
    // Try DD/MM/YYYY format
    if (dateStr.includes('/')) {
      const [day, month, year] = dateStr.split('/');
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    // Already YYYY-MM-DD
    return dateStr;
  };

  const categorizeTransaction = (description, type) => {
    const desc = description?.toLowerCase() || '';
    
    if (type === 'entrada') {
      if (desc.includes('salário') || desc.includes('salary')) return 'salario';
      if (desc.includes('pix') || desc.includes('transferência')) return 'pix_recebido';
      if (desc.includes('bônus') || desc.includes('bonus')) return 'bonus';
      return 'pix_recebido';
    }
    
    if (desc.includes('aluguel') || desc.includes('rent')) return 'aluguel';
    if (desc.includes('alimentação') || desc.includes('food') || desc.includes('super')) return 'alimentacao';
    if (desc.includes('lazer') || desc.includes('cinema') || desc.includes('bar')) return 'lazer';
    if (desc.includes('cartão') || desc.includes('card')) return 'cartao_credito';
    if (desc.includes('assinatura') || desc.includes('subscription')) return 'assinaturas';
    if (desc.includes('transporte') || desc.includes('uber') || desc.includes('táxi')) return 'transporte';
    if (desc.includes('saúde') || desc.includes('farmácia') || desc.includes('doctor')) return 'saude';
    
    return 'outros';
  };

  const handleClose = () => {
    setFile(null);
    setResults(null);
    setLoading(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-900 border-gray-800 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <FileText className="h-5 w-5 text-violet-400" />
            Importar Transações do PDF
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Carregue um extrato bancário em PDF para importar automaticamente suas transações
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {!results ? (
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center cursor-pointer hover:border-violet-500 transition-colors"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Upload className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <p className="text-white font-medium mb-1">
                  {file ? file.name : 'Clique ou arraste um PDF'}
                </p>
                <p className="text-gray-400 text-sm">
                  Selecione um extrato bancário em formato PDF
                </p>
              </div>

              {loading && (
                <Card className="bg-gray-800 border-gray-700 p-4 flex items-center gap-3">
                  <Loader2 className="h-5 w-5 text-violet-400 animate-spin" />
                  <span className="text-gray-300">Processando PDF...</span>
                </Card>
              )}
            </div>
          ) : results.success ? (
            <Card className="bg-gradient-to-br from-emerald-950/50 to-emerald-900/30 border-emerald-800/50 p-6">
              <div className="flex items-start gap-4">
                <CheckCircle2 className="h-6 w-6 text-emerald-400 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="text-emerald-400 font-semibold mb-2">
                    {results.count} transações importadas com sucesso!
                  </h3>
                  <p className="text-gray-400 text-sm mb-4">
                    Suas transações foram adicionadas à sua carteira.
                  </p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {results.transactions.slice(0, 5).map((t, idx) => (
                      <div key={idx} className="text-sm text-gray-300 flex justify-between">
                        <span>{t.description}</span>
                        <span className={t.type === 'entrada' ? 'text-emerald-400' : 'text-red-400'}>
                          {t.type === 'entrada' ? '+' : '-'} R$ {t.amount.toFixed(2)}
                        </span>
                      </div>
                    ))}
                    {results.count > 5 && (
                      <p className="text-gray-500 text-sm italic">
                        +{results.count - 5} transações...
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="bg-gradient-to-br from-red-950/50 to-red-900/30 border-red-800/50 p-6">
              <div className="flex items-start gap-4">
                <AlertCircle className="h-6 w-6 text-red-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-red-400 font-semibold mb-1">Erro ao processar</h3>
                  <p className="text-gray-400 text-sm">{results.error}</p>
                </div>
              </div>
            </Card>
          )}

          <div className="flex gap-3">
            {results && (
              <Button
                variant="outline"
                className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800"
                onClick={() => {
                  setResults(null);
                  setFile(null);
                }}
              >
                Importar outro arquivo
              </Button>
            )}
            <Button
              onClick={handleClose}
              className="flex-1 bg-violet-600 hover:bg-violet-700 text-white"
            >
              {results?.success ? 'Concluído' : 'Cancelar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}