import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { HelpCircle, Plus, CheckCircle2, Eye, MessageSquare, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const CATEGORIES = [
  { id: "renda_fixa", label: "Renda Fixa" },
  { id: "acoes", label: "Ações" },
  { id: "criptomoedas", label: "Criptomoedas" },
  { id: "analise_tecnica", label: "Análise Técnica" },
  { id: "planejamento", label: "Planejamento Financeiro" },
  { id: "geral", label: "Geral" },
];

export default function QAForum({ userEmail, userName }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterSolved, setFilterSolved] = useState("all");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "geral",
    tags: [],
  });

  useEffect(() => {
    loadQuestions();
  }, [filterCategory, filterSolved]);

  const loadQuestions = async () => {
    try {
      const data = await base44.entities.CommunityQAForum.list("-created_date", 100);
      let filtered = data || [];

      if (filterCategory !== "all") {
        filtered = filtered.filter((q) => q.category === filterCategory);
      }
      if (filterSolved !== "all") {
        filtered = filtered.filter((q) => q.is_solved === (filterSolved === "solved"));
      }

      setQuestions(filtered);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuestion = async () => {
    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error("Preencha todos os campos");
      return;
    }

    try {
      await base44.entities.CommunityQAForum.create({
        title: formData.title,
        description: formData.description,
        category: formData.category,
        author_email: userEmail,
        author_name: userName,
        tags: formData.tags,
        answers: [],
        views_count: 0,
        is_solved: false,
      });

      toast.success("Pergunta publicada!");
      setFormData({ title: "", description: "", category: "geral", tags: [] });
      setOpenDialog(false);
      loadQuestions();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao publicar pergunta");
    }
  };

  const handleAddAnswer = async (questionId, answer) => {
    if (!answer.trim()) {
      toast.error("Digite uma resposta");
      return;
    }

    try {
      const question = questions.find((q) => q.id === questionId);
      const newAnswers = [
        ...(question.answers || []),
        {
          answer_id: Math.random().toString(),
          author_email: userEmail,
          author_name: userName,
          content: answer,
          helpful_count: 0,
          marked_as_solution: false,
          created_at: new Date().toISOString(),
        },
      ];

      await base44.entities.CommunityQAForum.update(questionId, {
        answers: newAnswers,
      });

      toast.success("Resposta adicionada!");
      loadQuestions();
      setSelectedQuestion(null);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao adicionar resposta");
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-24 bg-gray-800 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-blue-400" />
          Fórum de Perguntas & Respostas
        </h3>
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button className="bg-blue-500 hover:bg-blue-600 gap-2">
              <Plus className="h-4 w-4" />
              Fazer Pergunta
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 border-gray-800">
            <DialogHeader>
              <DialogTitle className="text-white">Fazer uma Pergunta</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Título da Pergunta</label>
                <Input
                  placeholder="Seja específico e claro..."
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Descrição</label>
                <Textarea
                  placeholder="Explique sua dúvida em detalhes..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white min-h-[120px]"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Categoria</label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreateQuestion} className="w-full bg-blue-500 hover:bg-blue-600">
                Publicar Pergunta
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 mb-6">
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-48 bg-gray-800 border-gray-700 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700">
            <SelectItem value="all">Todas as Categorias</SelectItem>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterSolved} onValueChange={setFilterSolved}>
          <SelectTrigger className="w-40 bg-gray-800 border-gray-700 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700">
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="solved">Resolvidas</SelectItem>
            <SelectItem value="unsolved">Em Aberto</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Perguntas */}
      <div className="space-y-3">
        {questions.map((question) => (
          <Card
            key={question.id}
            className="bg-gradient-to-br from-gray-900 via-gray-900 to-blue-950/20 border-gray-800 p-5 hover:border-blue-500/30 transition-all cursor-pointer"
            onClick={() => setSelectedQuestion(question)}
          >
            <div className="flex gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2 mb-2">
                  {question.is_solved && <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />}
                  <h4 className="font-semibold text-white break-words">{question.title}</h4>
                </div>
                <p className="text-sm text-gray-400 line-clamp-2">{question.description}</p>

                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge variant="outline" className="text-xs border-gray-700">
                    {CATEGORIES.find((c) => c.id === question.category)?.label}
                  </Badge>
                  {question.tags?.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs border-gray-700">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <div className="text-right">
                  <p className="text-xs text-gray-500">{question.author_name}</p>
                  <p className="text-xs text-gray-600">
                    {formatDistanceToNow(new Date(question.created_date), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </p>
                </div>

                <div className="flex gap-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    {question.answers?.length || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {question.views_count || 0}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Modal de Pergunta Detalhada */}
      {selectedQuestion && (
        <Dialog open={!!selectedQuestion} onOpenChange={() => setSelectedQuestion(null)}>
          <DialogContent className="bg-gray-900 border-gray-800 max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white">{selectedQuestion.title}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Pergunta Original */}
              <div className="bg-gray-800/50 rounded-xl p-4">
                <p className="text-sm text-gray-300 mb-3">{selectedQuestion.description}</p>
                <p className="text-xs text-gray-500">
                  Perguntado por {selectedQuestion.author_name} •{" "}
                  {formatDistanceToNow(new Date(selectedQuestion.created_date), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </p>
              </div>

              {/* Respostas */}
              {selectedQuestion.answers && selectedQuestion.answers.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-white">{selectedQuestion.answers.length} Resposta(s)</h4>
                  {selectedQuestion.answers.map((answer) => (
                    <div key={answer.answer_id} className="bg-gray-800/30 rounded-xl p-4 border border-gray-700">
                      <p className="text-sm text-gray-300 mb-2">{answer.content}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{answer.author_name}</span>
                        {answer.marked_as_solution && (
                          <Badge className="bg-green-500/20 text-green-400">Solução Marcada</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Adicionar Resposta */}
              <div className="pt-4 border-t border-gray-800">
                <label className="text-sm font-medium text-gray-300 mb-2 block">Sua Resposta</label>
                <Textarea
                  placeholder="Compartilhe sua resposta..."
                  id={`answer-${selectedQuestion.id}`}
                  className="bg-gray-800 border-gray-700 text-white min-h-[100px] mb-3"
                />
                <Button
                  onClick={() => {
                    const textarea = document.getElementById(`answer-${selectedQuestion.id}`);
                    handleAddAnswer(selectedQuestion.id, textarea.value);
                    textarea.value = "";
                  }}
                  className="w-full bg-blue-500 hover:bg-blue-600"
                >
                  Publicar Resposta
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {questions.length === 0 && (
        <Card className="bg-gray-900 border-gray-800 p-8 text-center">
          <HelpCircle className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 mb-4">Nenhuma pergunta encontrada</p>
        </Card>
      )}
    </div>
  );
}