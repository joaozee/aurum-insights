import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Award, Star, Users, Briefcase, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const EXPERTISE_OPTIONS = [
  "acoes",
  "fiis",
  "renda_fixa",
  "cripto",
  "analise_fundamentalista",
  "analise_tecnica",
  "diversificacao",
  "tributacao",
  "planejamento_financeiro",
];

const EXPERTISE_LABELS = {
  acoes: "Ações",
  fiis: "FIIs",
  renda_fixa: "Renda Fixa",
  cripto: "Criptomoedas",
  analise_fundamentalista: "Análise Fundamentalista",
  analise_tecnica: "Análise Técnica",
  diversificacao: "Diversificação",
  tributacao: "Tributação",
  planejamento_financeiro: "Planejamento Financeiro",
};

export default function MentorshipHub({ userEmail, userName }) {
  const [mentors, setMentors] = useState([]);
  const [userMentorProfile, setUserMentorProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [messageText, setMessageText] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [mentorData, userProfile] = await Promise.all([
        base44.entities.MentorProfile.list("-rating", 50),
        base44.entities.MentorProfile.filter({ user_email: userEmail }),
      ]);

      setMentors(mentorData || []);
      setUserMentorProfile(userProfile[0] || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBecomeMentor = async (selectedExpertise) => {
    try {
      const existingProfile = userMentorProfile;

      if (existingProfile) {
        await base44.entities.MentorProfile.update(existingProfile.id, {
          is_mentor: true,
          expertise_areas: selectedExpertise,
          availability: "disponivel",
        });
      } else {
        await base44.entities.MentorProfile.create({
          user_email: userEmail,
          user_name: userName,
          is_mentor: true,
          expertise_areas: selectedExpertise,
          availability: "disponivel",
          rating: 0,
        });
      }

      toast.success("Você agora é um mentor!");
      loadData();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao se tornar mentor");
    }
  };

  const handleRequestMentorship = async (mentorEmail) => {
    if (!messageText.trim()) {
      toast.error("Digite uma mensagem");
      return;
    }

    try {
      await base44.entities.MentorshipMatch.create({
        mentor_email: mentorEmail,
        mentor_name: selectedMentor.user_name,
        mentee_email: userEmail,
        mentee_name: userName,
        expertise_areas: selectedMentor.expertise_areas,
        status: "pendente",
        match_score: 0,
      });

      toast.success("Solicitação enviada!");
      setMessageText("");
      setSelectedMentor(null);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao enviar solicitação");
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-32 bg-gray-800 rounded-xl" />
        ))}
      </div>
    );
  }

  const activeMentors = mentors.filter((m) => m.is_mentor && m.availability !== "indisponivel");

  return (
    <div className="space-y-6">
      <Tabs defaultValue="mentores" className="w-full">
        <TabsList className="bg-gray-900 border border-gray-800 w-full">
          <TabsTrigger value="mentores" className="flex-1 data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400">
            <Award className="h-4 w-4 mr-2" />
            Encontrar Mentores
          </TabsTrigger>
          <TabsTrigger value="be-mentor" className="flex-1 data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400">
            <Briefcase className="h-4 w-4 mr-2" />
            Ser Mentor
          </TabsTrigger>
        </TabsList>

        {/* Encontrar Mentores */}
        <TabsContent value="mentores" className="space-y-4 mt-6">
          {activeMentors.length > 0 ? (
            <div className="grid gap-4">
              {activeMentors.map((mentor) => (
                <Card
                  key={mentor.id}
                  className="bg-gradient-to-br from-gray-900 via-gray-900 to-purple-950/20 border-gray-800 p-5 hover:border-purple-500/30 transition-all"
                >
                  <div className="flex gap-4">
                    <Avatar className="h-16 w-16 flex-shrink-0">
                      <AvatarFallback className="bg-purple-500/20 text-purple-400 text-lg">
                        {mentor.user_name?.[0]}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-white">{mentor.user_name}</h4>
                          <p className="text-sm text-gray-400">{mentor.experience_years || 0} anos de experiência</p>
                        </div>
                        <div className="flex items-center gap-1 text-amber-400">
                          <Star className="h-4 w-4 fill-current" />
                          <span className="font-semibold">{mentor.rating || 0}</span>
                        </div>
                      </div>

                      {mentor.bio && <p className="text-sm text-gray-400 mb-3">{mentor.bio}</p>}

                      <div className="flex flex-wrap gap-2 mb-3">
                        {mentor.expertise_areas?.map((expertise) => (
                          <Badge key={expertise} variant="outline" className="text-xs border-gray-700">
                            {EXPERTISE_LABELS[expertise]}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">{mentor.mentees_count || 0} mentorados</span>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              onClick={() => setSelectedMentor(mentor)}
                              className="bg-purple-500 hover:bg-purple-600"
                              size="sm"
                            >
                              Solicitar Mentoria
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-gray-900 border-gray-800">
                            <DialogHeader>
                              <DialogTitle className="text-white">
                                Solicitar Mentoria com {mentor.user_name}
                              </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div>
                                <label className="text-sm font-medium text-gray-300 mb-2 block">
                                  Mensagem (opcional)
                                </label>
                                <Textarea
                                  placeholder="Conte um pouco sobre seus objetivos..."
                                  value={messageText}
                                  onChange={(e) => setMessageText(e.target.value)}
                                  className="bg-gray-800 border-gray-700 text-white min-h-[100px]"
                                />
                              </div>
                              <Button
                                onClick={() => handleRequestMentorship(mentor.user_email)}
                                className="w-full bg-purple-500 hover:bg-purple-600"
                              >
                                Enviar Solicitação
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-gray-900 border-gray-800 p-8 text-center">
              <Award className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Nenhum mentor disponível no momento</p>
            </Card>
          )}
        </TabsContent>

        {/* Ser Mentor */}
        <TabsContent value="be-mentor" className="space-y-4 mt-6">
          <Card className="bg-gradient-to-br from-purple-950/30 to-gray-900 border-purple-500/30 p-6">
            <h4 className="font-semibold text-white mb-3">Compartilhe Seu Conhecimento</h4>
            <p className="text-sm text-gray-400 mb-4">
              Ao se tornar um mentor, você ajuda iniciantes e ganha reconhecimento na comunidade.
            </p>

            {userMentorProfile && userMentorProfile.is_mentor ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-green-400 text-sm">
                  <Check className="h-4 w-4" />
                  Você é um mentor certificado!
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-300">Áreas de Expertise:</p>
                  <div className="flex flex-wrap gap-2">
                    {userMentorProfile.expertise_areas?.map((expertise) => (
                      <Badge key={expertise} className="bg-purple-500/20 text-purple-400">
                        {EXPERTISE_LABELS[expertise]}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <MentorSignupForm onSubmit={handleBecomeMentor} />
            )}
          </Card>

          {userMentorProfile && userMentorProfile.is_mentor && (
            <Card className="bg-gray-900 border-gray-800 p-6">
              <h4 className="font-semibold text-white mb-4">Seus Mentorados</h4>
              <p className="text-gray-400 text-sm">
                {userMentorProfile.mentees_count || 0} mentorado(s) ativo(s)
              </p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MentorSignupForm({ onSubmit }) {
  const [selectedExpertise, setSelectedExpertise] = useState([]);

  const handleToggleExpertise = (expertise) => {
    setSelectedExpertise((prev) =>
      prev.includes(expertise) ? prev.filter((e) => e !== expertise) : [...prev, expertise]
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-gray-300 mb-3 block">Selecione suas áreas de expertise:</label>
        <div className="grid grid-cols-2 gap-3">
          {EXPERTISE_OPTIONS.map((expertise) => (
            <button
              key={expertise}
              onClick={() => handleToggleExpertise(expertise)}
              className={`p-3 rounded-lg border transition-all text-sm ${
                selectedExpertise.includes(expertise)
                  ? "bg-purple-500/20 border-purple-500 text-purple-400"
                  : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600"
              }`}
            >
              {EXPERTISE_LABELS[expertise]}
            </button>
          ))}
        </div>
      </div>
      <Button
        onClick={() => onSubmit(selectedExpertise)}
        disabled={selectedExpertise.length === 0}
        className="w-full bg-purple-500 hover:bg-purple-600 disabled:opacity-50"
      >
        Tornar-se Mentor
      </Button>
    </div>
  );
}