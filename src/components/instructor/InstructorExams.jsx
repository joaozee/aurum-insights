import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function InstructorExams({ instructorEmail }) {
  const [exams, setExams] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [formData, setFormData] = useState({
    course_id: "",
    title: "",
    description: "",
    passing_score: 70,
    attempts_allowed: 3,
    questions: []
  });

  useEffect(() => {
    loadData();
  }, [instructorEmail]);

  const loadData = async () => {
    try {
      const coursesData = await base44.entities.Course.filter({ instructor_email: instructorEmail });
      setCourses(coursesData);

      const courseIds = coursesData.map(c => c.id);
      const allExams = await base44.entities.CourseExam.list();
      const instructorExams = allExams.filter(e => courseIds.includes(e.course_id));
      setExams(instructorExams);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingExam) {
        await base44.entities.CourseExam.update(editingExam.id, formData);
      } else {
        await base44.entities.CourseExam.create({ ...formData, is_active: true });
      }
      setDialogOpen(false);
      setEditingExam(null);
      resetForm();
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const resetForm = () => {
    setFormData({
      course_id: "",
      title: "",
      description: "",
      passing_score: 70,
      questions: []
    });
  };

  const handleEdit = (exam) => {
    setEditingExam(exam);
    setFormData(exam);
    setDialogOpen(true);
  };

  const handleDelete = async (examId) => {
    if (!confirm("Tem certeza que deseja excluir esta prova?")) return;
    try {
      await base44.entities.CourseExam.delete(examId);
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const addQuestion = () => {
    setFormData({
      ...formData,
      questions: [
        ...formData.questions,
        { question: "", options: ["", "", "", ""], correct_answer: 0, explanation: "" }
      ]
    });
  };

  const updateQuestion = (index, field, value) => {
    const newQuestions = [...formData.questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setFormData({ ...formData, questions: newQuestions });
  };

  const removeQuestion = (index) => {
    setFormData({
      ...formData,
      questions: formData.questions.filter((_, i) => i !== index)
    });
  };

  if (loading) {
    return <div className="text-gray-400">Carregando provas...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Provas dos Cursos</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-violet-600 hover:bg-violet-700" onClick={() => { setEditingExam(null); resetForm(); }}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Prova
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingExam ? "Editar Prova" : "Criar Nova Prova"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Curso</label>
                <Select value={formData.course_id} onValueChange={(v) => setFormData({ ...formData, course_id: v })}>
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue placeholder="Selecione um curso" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700 text-white">
                    {courses.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Título</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white"
                  required
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Descrição</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white"
                  rows={2}
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Nota Mínima (%)</label>
                <Input
                  type="number"
                  value={formData.passing_score}
                  onChange={(e) => setFormData({ ...formData, passing_score: parseInt(e.target.value) })}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>

              <div className="border-t border-gray-800 pt-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-white">Questões</h3>
                  <Button type="button" size="sm" onClick={addQuestion} className="bg-violet-600 hover:bg-violet-700">
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar Questão
                  </Button>
                </div>
                <div className="space-y-4">
                  {formData.questions.map((q, qIdx) => (
                    <Card key={qIdx} className="bg-gray-800/50 border-gray-700 p-4">
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-sm text-gray-400">Questão {qIdx + 1}</span>
                        <Button type="button" size="sm" variant="ghost" onClick={() => removeQuestion(qIdx)} className="text-red-400 hover:text-red-300">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <Input
                        placeholder="Digite a pergunta"
                        value={q.question}
                        onChange={(e) => updateQuestion(qIdx, 'question', e.target.value)}
                        className="bg-gray-800 border-gray-700 text-white mb-3"
                      />
                      <div className="space-y-2 mb-3">
                        {q.options.map((opt, oIdx) => (
                          <div key={oIdx} className="flex items-center gap-2">
                            <input
                              type="radio"
                              checked={q.correct_answer === oIdx}
                              onChange={() => updateQuestion(qIdx, 'correct_answer', oIdx)}
                              className="text-violet-500"
                            />
                            <Input
                              placeholder={`Opção ${oIdx + 1}`}
                              value={opt}
                              onChange={(e) => {
                                const newOptions = [...q.options];
                                newOptions[oIdx] = e.target.value;
                                updateQuestion(qIdx, 'options', newOptions);
                              }}
                              className="bg-gray-800 border-gray-700 text-white flex-1"
                            />
                          </div>
                        ))}
                      </div>
                      <Input
                        placeholder="Explicação (opcional)"
                        value={q.explanation}
                        onChange={(e) => updateQuestion(qIdx, 'explanation', e.target.value)}
                        className="bg-gray-800 border-gray-700 text-white"
                      />
                    </Card>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1 bg-violet-600 hover:bg-violet-700">
                  {editingExam ? "Salvar" : "Criar"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="border-gray-700">
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {exams.length === 0 ? (
        <Card className="bg-gray-900 border-gray-800 p-12 text-center">
          <FileText className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 mb-4">Você ainda não criou nenhuma prova</p>
          <Button onClick={() => setDialogOpen(true)} className="bg-violet-600 hover:bg-violet-700">
            Criar Primeira Prova
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {exams.map((exam) => {
            const course = courses.find(c => c.id === exam.course_id);
            return (
              <Card key={exam.id} className="bg-gray-900 border-gray-800 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-white">{exam.title}</h3>
                      <Badge className="bg-blue-500/20 text-blue-400">
                        {course?.title}
                      </Badge>
                    </div>
                    <p className="text-gray-400 mb-4">{exam.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span>{exam.questions?.length || 0} questões</span>
                      <span>Nota mínima: {exam.passing_score}%</span>
                      <span>Tentativas ilimitadas</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(exam)} className="border-gray-700">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDelete(exam.id)} className="border-gray-700 text-red-400 hover:text-red-300">
                      <Trash2 className="h-4 w-4" />
                    </Button>
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