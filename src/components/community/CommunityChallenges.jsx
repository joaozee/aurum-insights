import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Target, Calendar, Users, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function CommunityChallenges({ userEmail }) {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChallenges();
  }, []);

  const loadChallenges = async () => {
    try {
      const data = await base44.entities.CommunityChallenge.filter({ is_active: true });
      setChallenges(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const joinChallenge = async (challenge) => {
    try {
      const participant = challenge.participants?.find(p => p.user_email === userEmail);
      if (participant) {
        toast.info("Você já está participando deste desafio!");
        return;
      }

      const user = await base44.auth.me();
      const updatedParticipants = [
        ...(challenge.participants || []),
        {
          user_email: userEmail,
          user_name: user.full_name,
          progress: 0,
          completed: false
        }
      ];

      await base44.entities.CommunityChallenge.update(challenge.id, {
        participants: updatedParticipants
      });

      toast.success("Você entrou no desafio!");
      loadChallenges();
    } catch (error) {
      toast.error("Erro ao entrar no desafio");
      console.error(error);
    }
  };

  const getChallengeTypeLabel = (type) => {
    const labels = {
      posts: "Criar posts",
      likes: "Curtir posts",
      comments: "Comentar",
      courses: "Completar cursos",
      portfolio: "Aportes na carteira"
    };
    return labels[type] || type;
  };

  const getParticipantProgress = (challenge) => {
    const participant = challenge.participants?.find(p => p.user_email === userEmail);
    return participant?.progress || 0;
  };

  const isParticipating = (challenge) => {
    return challenge.participants?.some(p => p.user_email === userEmail);
  };

  const getDaysRemaining = (endDate) => {
    const days = Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  if (loading) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="p-6 text-center">
          <Loader2 className="h-8 w-8 text-violet-400 animate-spin mx-auto" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-400" />
          Desafios da Comunidade
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {challenges.length === 0 ? (
          <div className="text-center py-8">
            <Trophy className="h-12 w-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Nenhum desafio ativo no momento</p>
          </div>
        ) : (
          challenges.map(challenge => {
            const participating = isParticipating(challenge);
            const progress = getParticipantProgress(challenge);
            const progressPercent = (progress / challenge.target_value) * 100;
            const daysLeft = getDaysRemaining(challenge.end_date);

            return (
              <div key={challenge.id} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="text-white font-semibold mb-1">{challenge.title}</h4>
                    <p className="text-gray-400 text-sm mb-2">{challenge.description}</p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="text-xs border-violet-500/30 text-violet-400">
                        <Target className="h-3 w-3 mr-1" />
                        {getChallengeTypeLabel(challenge.type)}: {challenge.target_value}
                      </Badge>
                      <Badge variant="outline" className="text-xs border-amber-500/30 text-amber-400">
                        <Trophy className="h-3 w-3 mr-1" />
                        {challenge.reward_points} pontos
                      </Badge>
                      <Badge variant="outline" className="text-xs border-gray-600 text-gray-400">
                        <Calendar className="h-3 w-3 mr-1" />
                        {daysLeft} dias
                      </Badge>
                      <Badge variant="outline" className="text-xs border-gray-600 text-gray-400">
                        <Users className="h-3 w-3 mr-1" />
                        {challenge.participants?.length || 0} participantes
                      </Badge>
                    </div>
                  </div>
                </div>

                {participating ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Seu progresso</span>
                      <span className="text-violet-400 font-semibold">
                        {progress}/{challenge.target_value}
                      </span>
                    </div>
                    <Progress value={progressPercent} className="h-2" />
                    {progressPercent >= 100 && (
                      <Badge className="bg-green-500/20 text-green-400 w-full justify-center">
                        <Check className="h-3 w-3 mr-1" />
                        Desafio Completo! 🎉
                      </Badge>
                    )}
                  </div>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => joinChallenge(challenge)}
                    className="w-full bg-violet-600 hover:bg-violet-700"
                  >
                    <Trophy className="h-4 w-4 mr-2" />
                    Participar do Desafio
                  </Button>
                )}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}