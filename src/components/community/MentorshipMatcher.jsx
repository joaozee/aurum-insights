import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, Star, Sparkles, Loader2, UserPlus, Check } from "lucide-react";
import { toast } from "sonner";

export default function MentorshipMatcher({ userEmail, userName }) {
  const [mentors, setMentors] = useState([]);
  const [myMatches, setMyMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [matching, setMatching] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  const loadData = async () => {
    try {
      const [mentorProfiles, matches] = await Promise.all([
        base44.entities.MentorProfile.filter({ is_mentor: true, availability: "disponivel" }),
        base44.entities.MentorshipMatch.filter({ mentee_email: userEmail })
      ]);

      setMentors(mentorProfiles);
      setMyMatches(matches);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const findBestMatch = async () => {
    setMatching(true);
    try {
      // Get user's profile and needs
      const [userPoints, riskProfile] = await Promise.all([
        base44.entities.UserPoints.filter({ user_email: userEmail }),
        base44.entities.RiskProfile.filter({ user_email: userEmail })
      ]);

      const prompt = `
Como sistema de matchmaking de mentoria em investimentos, encontre o melhor mentor.

**PERFIL DO MENTORADO:**
- Experiência: ${riskProfile[0]?.market_knowledge || 'iniciante'}
- Objetivo: ${riskProfile[0]?.primary_goal || 'crescimento'}
- Horizonte: ${riskProfile[0]?.investment_horizon || 'longo_prazo'}

**MENTORES DISPONÍVEIS:**
${mentors.map(m => `
- ${m.user_name}
  Expertise: ${m.expertise_areas?.join(', ')}
  Experiência: ${m.experience_years} anos
  Avaliação: ${m.rating}/5
  Mentorados: ${m.mentees_count}
  Bio: ${m.bio || 'N/A'}
`).join('\n')}

Retorne o email do mentor mais adequado e um score de 0-100.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            mentor_email: { type: "string" },
            match_score: { type: "number" },
            razao: { type: "string" }
          }
        }
      });

      const mentor = mentors.find(m => m.user_email === response.mentor_email);
      
      if (mentor) {
        await base44.entities.MentorshipMatch.create({
          mentor_email: mentor.user_email,
          mentor_name: mentor.user_name,
          mentee_email: userEmail,
          mentee_name: userName,
          expertise_areas: mentor.expertise_areas,
          status: "pendente",
          match_score: response.match_score
        });

        toast.success(`Match encontrado com ${mentor.user_name}! (${response.match_score}% compatibilidade)`);
        loadData();
      }
    } catch (error) {
      toast.error("Erro ao buscar mentor");
      console.error(error);
    } finally {
      setMatching(false);
    }
  };

  const requestMentor = async (mentor) => {
    try {
      await base44.entities.MentorshipMatch.create({
        mentor_email: mentor.user_email,
        mentor_name: mentor.user_name,
        mentee_email: userEmail,
        mentee_name: userName,
        expertise_areas: mentor.expertise_areas,
        status: "pendente",
        match_score: 80
      });

      toast.success(`Solicitação enviada para ${mentor.user_name}!`);
      loadData();
    } catch (error) {
      toast.error("Erro ao solicitar mentoria");
      console.error(error);
    }
  };

  const alreadyMatched = (mentorEmail) => {
    return myMatches.some(m => m.mentor_email === mentorEmail);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-violet-500/30 text-violet-400 hover:bg-violet-500/10">
          <Users className="h-4 w-4 mr-2" />
          Encontrar Mentor
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-violet-400" />
            Sistema de Mentoria
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* AI Match Button */}
          <Card className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 border-violet-500/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-8 w-8 text-violet-400" />
                  <div>
                    <h3 className="text-white font-semibold text-sm">Match Inteligente</h3>
                    <p className="text-gray-400 text-xs">IA encontra o mentor ideal para você</p>
                  </div>
                </div>
                <Button 
                  onClick={findBestMatch} 
                  disabled={matching || loading}
                  size="sm"
                  className="bg-violet-600 hover:bg-violet-700"
                >
                  {matching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Buscar Match"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* My Matches */}
          {myMatches.length > 0 && (
            <div>
              <h4 className="text-white font-semibold mb-3 text-sm">Minhas Mentorias</h4>
              <div className="space-y-2">
                {myMatches.map(match => (
                  <div key={match.id} className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-violet-500/20 text-violet-400 text-xs">
                            {match.mentor_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-white text-sm font-medium">{match.mentor_name}</p>
                          <p className="text-gray-400 text-xs">{match.expertise_areas?.join(', ')}</p>
                        </div>
                      </div>
                      <Badge className={
                        match.status === "ativa" ? "bg-green-500/20 text-green-400" :
                        match.status === "pendente" ? "bg-yellow-500/20 text-yellow-400" :
                        "bg-gray-500/20 text-gray-400"
                      }>
                        {match.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Available Mentors */}
          <div>
            <h4 className="text-white font-semibold mb-3 text-sm">Mentores Disponíveis</h4>
            {loading ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 text-violet-400 animate-spin mx-auto" />
              </div>
            ) : (
              <div className="space-y-3">
                {mentors.map(mentor => (
                  <div key={mentor.id} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-gradient-to-br from-violet-500/20 to-purple-500/20 text-violet-400">
                            {mentor.user_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h5 className="text-white font-semibold">{mentor.user_name}</h5>
                          <div className="flex items-center gap-2 mt-1">
                            <Star className="h-3 w-3 text-yellow-400 fill-current" />
                            <span className="text-xs text-gray-400">
                              {mentor.rating?.toFixed(1) || "5.0"} • {mentor.experience_years} anos
                            </span>
                          </div>
                        </div>
                      </div>
                      {alreadyMatched(mentor.user_email) ? (
                        <Badge className="bg-green-500/20 text-green-400">
                          <Check className="h-3 w-3 mr-1" />
                          Conectado
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => requestMentor(mentor)}
                          className="bg-violet-600 hover:bg-violet-700"
                        >
                          <UserPlus className="h-3 w-3 mr-1" />
                          Conectar
                        </Button>
                      )}
                    </div>
                    {mentor.bio && (
                      <p className="text-gray-300 text-sm mb-3">{mentor.bio}</p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {mentor.expertise_areas?.map((area, i) => (
                        <Badge key={i} variant="outline" className="text-xs border-violet-500/30 text-violet-400">
                          {area}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}