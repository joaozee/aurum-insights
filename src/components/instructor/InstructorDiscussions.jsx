import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, CheckCircle2, Clock } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function InstructorDiscussions({ instructorEmail }) {
  const [discussions, setDiscussions] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [loading, setLoading] = useState(true);
  const [responseText, setResponseText] = useState({});

  useEffect(() => {
    loadData();
  }, [instructorEmail]);

  const loadData = async () => {
    try {
      const coursesData = await base44.entities.Course.filter({ instructor_email: instructorEmail });
      setCourses(coursesData);

      const courseIds = coursesData.map(c => c.id);
      const allDiscussions = await base44.entities.CourseDiscussion.list();
      const instructorDiscussions = allDiscussions.filter(d => courseIds.includes(d.course_id));
      setDiscussions(instructorDiscussions);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (discussionId) => {
    if (!responseText[discussionId]?.trim()) return;
    try {
      await base44.entities.CourseDiscussion.update(discussionId, {
        instructor_response: responseText[discussionId],
        status: "answered"
      });
      setResponseText({ ...responseText, [discussionId]: "" });
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const filteredDiscussions = selectedCourse === "all" 
    ? discussions 
    : discussions.filter(d => d.course_id === selectedCourse);

  const pendingCount = filteredDiscussions.filter(d => d.status === "pending").length;

  if (loading) {
    return <div className="text-gray-400">Carregando discussões...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Discussões dos Alunos</h2>
          <p className="text-gray-400">
            {pendingCount} {pendingCount === 1 ? "pergunta pendente" : "perguntas pendentes"}
          </p>
        </div>
        <Select value={selectedCourse} onValueChange={setSelectedCourse}>
          <SelectTrigger className="bg-gray-800 border-gray-700 text-white w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700 text-white">
            <SelectItem value="all">Todos os Cursos</SelectItem>
            {courses.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredDiscussions.length === 0 ? (
        <Card className="bg-gray-900 border-gray-800 p-12 text-center">
          <MessageCircle className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">Nenhuma discussão ainda</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredDiscussions
            .sort((a, b) => (a.status === "pending" ? -1 : 1))
            .map((discussion) => {
              const course = courses.find(c => c.id === discussion.course_id);
              return (
                <Card key={discussion.id} className="bg-gray-900 border-gray-800 p-6">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-violet-400 font-semibold">
                        {discussion.user_name?.[0]?.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-semibold text-white">{discussion.user_name}</span>
                        <Badge className="bg-blue-500/20 text-blue-400 text-xs">
                          {course?.title}
                        </Badge>
                        {discussion.status === "pending" ? (
                          <Badge className="bg-amber-500/20 text-amber-400 text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            Pendente
                          </Badge>
                        ) : (
                          <Badge className="bg-green-500/20 text-green-400 text-xs">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Respondida
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-gray-300 mb-4">{discussion.question}</p>
                      
                      {discussion.instructor_response ? (
                        <div className="bg-violet-500/10 border border-violet-500/30 rounded-lg p-4">
                          <p className="text-sm text-gray-400 mb-2">Sua resposta:</p>
                          <p className="text-gray-300">{discussion.instructor_response}</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <Textarea
                            placeholder="Digite sua resposta..."
                            value={responseText[discussion.id] || ""}
                            onChange={(e) => setResponseText({ ...responseText, [discussion.id]: e.target.value })}
                            className="bg-gray-800 border-gray-700 text-white"
                            rows={3}
                          />
                          <Button
                            onClick={() => handleRespond(discussion.id)}
                            disabled={!responseText[discussion.id]?.trim()}
                            className="bg-violet-600 hover:bg-violet-700"
                          >
                            Responder
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
        </div>
      )}
    </div>
  );
}