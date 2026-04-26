import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Users, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import CourseContentManager from "./CourseContentManager";

export default function InstructorCourses({ instructorEmail, instructorName }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [managingCourse, setManagingCourse] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "investimentos",
    level: "iniciante",
    price: 0,
    duration_hours: 0
  });

  useEffect(() => {
    loadCourses();
  }, [instructorEmail]);

  const loadCourses = async () => {
    try {
      const data = await base44.entities.Course.filter({ instructor_email: instructorEmail });
      setCourses(data);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCourse) {
        await base44.entities.Course.update(editingCourse.id, formData);
      } else {
        await base44.entities.Course.create({
          ...formData,
          instructor_email: instructorEmail,
          instructor_name: instructorName,
          modules: [],
          benefits: [],
          students_count: 0
        });
      }
      setDialogOpen(false);
      setEditingCourse(null);
      setFormData({
        title: "",
        description: "",
        category: "investimentos",
        level: "iniciante",
        price: 0,
        duration_hours: 0
      });
      loadCourses();
    } catch (e) {
      console.error(e);
    }
  };

  const handleEdit = (course) => {
    setEditingCourse(course);
    setFormData({
      title: course.title,
      description: course.description,
      category: course.category,
      level: course.level,
      price: course.price,
      duration_hours: course.duration_hours || 0
    });
    setDialogOpen(true);
  };

  const handleDelete = async (courseId) => {
    if (!confirm("Tem certeza que deseja excluir este curso?")) return;
    try {
      await base44.entities.Course.delete(courseId);
      loadCourses();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return <div className="text-gray-400">Carregando cursos...</div>;
  }

  if (managingCourse) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            onClick={() => setManagingCourse(null)}
            className="border-gray-700 text-gray-300"
          >
            ← Voltar
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-white">{managingCourse.title}</h2>
            <p className="text-gray-400">Gerenciar conteúdo do curso</p>
          </div>
        </div>
        <CourseContentManager course={managingCourse} onUpdate={loadCourses} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Meus Cursos</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-violet-600 hover:bg-violet-700" onClick={() => setEditingCourse(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Curso
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingCourse ? "Editar Curso" : "Criar Novo Curso"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Categoria</label>
                  <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700 text-white">
                      <SelectItem value="investimentos">Investimentos</SelectItem>
                      <SelectItem value="formacao">Formação</SelectItem>
                      <SelectItem value="avancado">Avançado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Nível</label>
                  <Select value={formData.level} onValueChange={(v) => setFormData({ ...formData, level: v })}>
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700 text-white">
                      <SelectItem value="iniciante">Iniciante</SelectItem>
                      <SelectItem value="intermediario">Intermediário</SelectItem>
                      <SelectItem value="avancado">Avançado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Preço (R$)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                    className="bg-gray-800 border-gray-700 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Duração (horas)</label>
                  <Input
                    type="number"
                    value={formData.duration_hours}
                    onChange={(e) => setFormData({ ...formData, duration_hours: parseInt(e.target.value) })}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1 bg-violet-600 hover:bg-violet-700">
                  {editingCourse ? "Salvar" : "Criar"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="border-gray-700">
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {courses.length === 0 ? (
        <Card className="bg-gray-900 border-gray-800 p-12 text-center">
          <p className="text-gray-400 mb-4">Você ainda não criou nenhum curso</p>
          <Button onClick={() => setDialogOpen(true)} className="bg-violet-600 hover:bg-violet-700">
            Criar Primeiro Curso
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {courses.map((course) => (
            <Card key={course.id} className="bg-gray-900 border-gray-800 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-white">{course.title}</h3>
                    <Badge className="bg-violet-500/20 text-violet-400">
                      {course.category}
                    </Badge>
                  </div>
                  <p className="text-gray-400 mb-4">{course.description}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {course.students_count || 0} alunos
                    </div>
                    <span>R$ {course.price?.toFixed(2)}</span>
                    <span>{course.level}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setManagingCourse(course)} className="border-gray-700">
                    <BookOpen className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleEdit(course)} className="border-gray-700">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDelete(course.id)} className="border-gray-700 text-red-400 hover:text-red-300">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}