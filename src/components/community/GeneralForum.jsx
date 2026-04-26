import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, MessageCircle, Eye, ThumbsUp, Send } from "lucide-react";

export default function GeneralForum() {
  const [discussions, setDiscussions] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDiscussion, setSelectedDiscussion] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [newDiscussion, setNewDiscussion] = useState({
    title: "",
    content: "",
    category: "geral"
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [userData, discussionsData] = await Promise.all([
        base44.auth.me(),
        base44.entities.GeneralDiscussion.list("-created_date")
      ]);
      setUser(userData);
      setDiscussions(discussionsData);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDiscussion = async (e) => {
    e.preventDefault();
    try {
      await base44.entities.GeneralDiscussion.create({
        ...newDiscussion,
        user_email: user.email,
        user_name: user.full_name
      });
      setDialogOpen(false);
      setNewDiscussion({ title: "", content: "", category: "geral" });
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleReply = async (discussionId) => {
    if (!replyText.trim()) return;
    try {
      const discussion = discussions.find(d => d.id === discussionId);
      const newReplies = [
        ...(discussion.replies || []),
        {
          user_email: user.email,
          user_name: user.full_name,
          content: replyText,
          created_at: new Date().toISOString()
        }
      ];
      await base44.entities.GeneralDiscussion.update(discussionId, { replies: newReplies });
      setReplyText("");
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpvote = async (discussionId) => {
    try {
      const discussion = discussions.find(d => d.id === discussionId);
      await base44.entities.GeneralDiscussion.update(discussionId, {
        upvotes: (discussion.upvotes || 0) + 1
      });
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleViewDiscussion = async (discussion) => {
    setSelectedDiscussion(discussion);
    try {
      await base44.entities.GeneralDiscussion.update(discussion.id, {
        views: (discussion.views || 0) + 1
      });
    } catch (e) {
      console.error(e);
    }
  };

  const filteredDiscussions = filterCategory === "all" 
    ? discussions 
    : discussions.filter(d => d.category === filterCategory);

  const categoryColors = {
    investimentos: "bg-violet-500/20 text-violet-400",
    duvidas: "bg-amber-500/20 text-amber-400",
    estrategias: "bg-blue-500/20 text-blue-400",
    geral: "bg-gray-500/20 text-gray-400"
  };

  if (loading) {
    return <div className="text-gray-400">Carregando fórum...</div>;
  }

  if (selectedDiscussion) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={() => setSelectedDiscussion(null)} className="border-gray-700 text-gray-300">
          ← Voltar ao Fórum
        </Button>
        
        <Card className="bg-gray-900 border-gray-800 p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="h-12 w-12 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-violet-400 font-semibold text-lg">
                {selectedDiscussion.user_name?.[0]?.toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-white">{selectedDiscussion.title}</h2>
                <Badge className={categoryColors[selectedDiscussion.category]}>
                  {selectedDiscussion.category}
                </Badge>
              </div>
              <p className="text-sm text-gray-400 mb-4">
                Por {selectedDiscussion.user_name} • {new Date(selectedDiscussion.created_date).toLocaleDateString()}
              </p>
              <p className="text-gray-300 whitespace-pre-wrap">{selectedDiscussion.content}</p>
              
              <div className="flex items-center gap-4 mt-4 text-sm text-gray-400">
                <button onClick={() => handleUpvote(selectedDiscussion.id)} className="flex items-center gap-1 hover:text-violet-400 transition-colors">
                  <ThumbsUp className="h-4 w-4" />
                  {selectedDiscussion.upvotes || 0}
                </button>
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {selectedDiscussion.views || 0}
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Respostas ({selectedDiscussion.replies?.length || 0})
            </h3>
            
            <div className="space-y-4 mb-6">
              {selectedDiscussion.replies?.map((reply, idx) => (
                <div key={idx} className="flex gap-4 bg-gray-800/50 rounded-lg p-4">
                  <div className="h-10 w-10 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-violet-400 font-semibold">
                      {reply.user_name?.[0]?.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-white">{reply.user_name}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(reply.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-300">{reply.content}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <Textarea
                placeholder="Escreva sua resposta..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
                rows={3}
              />
              <Button onClick={() => handleReply(selectedDiscussion.id)} className="bg-violet-600 hover:bg-violet-700">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Fórum Geral</h2>
          <p className="text-gray-400">Discuta sobre investimentos e estratégias com a comunidade</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-violet-600 hover:bg-violet-700">
              <Plus className="h-4 w-4 mr-2" />
              Nova Discussão
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Nova Discussão</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateDiscussion} className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Título</label>
                <Input
                  value={newDiscussion.title}
                  onChange={(e) => setNewDiscussion({ ...newDiscussion, title: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white"
                  required
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Categoria</label>
                <Select value={newDiscussion.category} onValueChange={(v) => setNewDiscussion({ ...newDiscussion, category: v })}>
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700 text-white">
                    <SelectItem value="geral">Geral</SelectItem>
                    <SelectItem value="investimentos">Investimentos</SelectItem>
                    <SelectItem value="duvidas">Dúvidas</SelectItem>
                    <SelectItem value="estrategias">Estratégias</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Conteúdo</label>
                <Textarea
                  value={newDiscussion.content}
                  onChange={(e) => setNewDiscussion({ ...newDiscussion, content: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white"
                  rows={6}
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1 bg-violet-600 hover:bg-violet-700">
                  Criar Discussão
                </Button>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="border-gray-700">
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-2">
        <Button
          variant={filterCategory === "all" ? "default" : "outline"}
          onClick={() => setFilterCategory("all")}
          className={filterCategory === "all" ? "bg-violet-600" : "border-gray-700"}
          size="sm"
        >
          Todas
        </Button>
        <Button
          variant={filterCategory === "investimentos" ? "default" : "outline"}
          onClick={() => setFilterCategory("investimentos")}
          className={filterCategory === "investimentos" ? "bg-violet-600" : "border-gray-700"}
          size="sm"
        >
          Investimentos
        </Button>
        <Button
          variant={filterCategory === "duvidas" ? "default" : "outline"}
          onClick={() => setFilterCategory("duvidas")}
          className={filterCategory === "duvidas" ? "bg-violet-600" : "border-gray-700"}
          size="sm"
        >
          Dúvidas
        </Button>
        <Button
          variant={filterCategory === "estrategias" ? "default" : "outline"}
          onClick={() => setFilterCategory("estrategias")}
          className={filterCategory === "estrategias" ? "bg-violet-600" : "border-gray-700"}
          size="sm"
        >
          Estratégias
        </Button>
      </div>

      {filteredDiscussions.length === 0 ? (
        <Card className="bg-gray-900 border-gray-800 p-12 text-center">
          <MessageCircle className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 mb-4">Nenhuma discussão ainda</p>
          <Button onClick={() => setDialogOpen(true)} className="bg-violet-600 hover:bg-violet-700">
            Criar Primeira Discussão
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredDiscussions.map((discussion) => (
            <Card key={discussion.id} className="bg-gray-900 border-gray-800 p-6 hover:bg-gray-800/50 transition-colors cursor-pointer" onClick={() => handleViewDiscussion(discussion)}>
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-violet-400 font-semibold text-lg">
                    {discussion.user_name?.[0]?.toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-white">{discussion.title}</h3>
                    <Badge className={categoryColors[discussion.category]}>
                      {discussion.category}
                    </Badge>
                  </div>
                  <p className="text-gray-400 text-sm mb-3 line-clamp-2">{discussion.content}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{discussion.user_name}</span>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="h-4 w-4" />
                      {discussion.replies?.length || 0}
                    </div>
                    <div className="flex items-center gap-1">
                      <ThumbsUp className="h-4 w-4" />
                      {discussion.upvotes || 0}
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {discussion.views || 0}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}