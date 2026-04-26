import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Video, Upload, Loader2, GripVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function CourseContentManager({ course, onUpdate }) {
  const [modules, setModules] = useState(course?.modules || []);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingModule, setEditingModule] = useState(null);
  const [editingLesson, setEditingLesson] = useState(null);
  const [moduleTitle, setModuleTitle] = useState("");
  const [lessonData, setLessonData] = useState({ title: "", duration_minutes: 0, video_url: "" });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setModules(course?.modules || []);
  }, [course]);

  const handleAddModule = async () => {
    if (!moduleTitle.trim()) return;
    
    const newModule = { title: moduleTitle, lessons: [] };
    const updatedModules = [...modules, newModule];
    
    await updateCourseModules(updatedModules);
    setModuleTitle("");
  };

  const handleEditModule = async (index, newTitle) => {
    const updatedModules = [...modules];
    updatedModules[index].title = newTitle;
    await updateCourseModules(updatedModules);
  };

  const handleDeleteModule = async (index) => {
    if (!confirm("Deseja excluir este módulo e todas as suas aulas?")) return;
    const updatedModules = modules.filter((_, i) => i !== index);
    await updateCourseModules(updatedModules);
  };

  const handleAddLesson = async (moduleIndex) => {
    setEditingModule(moduleIndex);
    setEditingLesson(null);
    setLessonData({ title: "", duration_minutes: 0, video_url: "" });
    setDialogOpen(true);
  };

  const handleEditLesson = (moduleIndex, lessonIndex) => {
    setEditingModule(moduleIndex);
    setEditingLesson(lessonIndex);
    setLessonData(modules[moduleIndex].lessons[lessonIndex]);
    setDialogOpen(true);
  };

  const handleDeleteLesson = async (moduleIndex, lessonIndex) => {
    if (!confirm("Deseja excluir esta aula?")) return;
    const updatedModules = [...modules];
    updatedModules[moduleIndex].lessons.splice(lessonIndex, 1);
    await updateCourseModules(updatedModules);
  };

  const handleSaveLesson = async () => {
    const updatedModules = [...modules];
    if (editingLesson !== null) {
      updatedModules[editingModule].lessons[editingLesson] = lessonData;
    } else {
      updatedModules[editingModule].lessons.push(lessonData);
    }
    await updateCourseModules(updatedModules);
    setDialogOpen(false);
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setLessonData({ ...lessonData, video_url: file_url });
    } catch (error) {
      alert("Erro ao fazer upload do vídeo");
    } finally {
      setUploading(false);
    }
  };

  const updateCourseModules = async (updatedModules) => {
    try {
      await base44.entities.Course.update(course.id, { modules: updatedModules });
      setModules(updatedModules);
      if (onUpdate) onUpdate();
    } catch (error) {
      alert("Erro ao atualizar curso");
    }
  };

  const getTotalLessons = () => {
    return modules.reduce((total, module) => total + module.lessons.length, 0);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gray-900 border-gray-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold text-white">Conteúdo do Curso</h3>
            <p className="text-sm text-gray-400">
              {modules.length} módulos • {getTotalLessons()} aulas
            </p>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Nome do módulo"
              value={moduleTitle}
              onChange={(e) => setModuleTitle(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white w-64"
            />
            <Button onClick={handleAddModule} className="bg-violet-600 hover:bg-violet-700">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Módulo
            </Button>
          </div>
        </div>

        {modules.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Video className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Nenhum módulo criado ainda</p>
          </div>
        ) : (
          <Accordion type="single" collapsible className="space-y-3">
            {modules.map((module, moduleIndex) => (
              <AccordionItem
                key={moduleIndex}
                value={`module-${moduleIndex}`}
                className="bg-gray-800/50 border-gray-700 rounded-lg px-4"
              >
                <AccordionTrigger className="text-white hover:no-underline">
                  <div className="flex items-center gap-3 flex-1">
                    <GripVertical className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">{module.title}</span>
                    <Badge className="bg-gray-700 text-gray-300">
                      {module.lessons.length} aulas
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 pt-2">
                    {module.lessons.map((lesson, lessonIndex) => (
                      <div
                        key={lessonIndex}
                        className="flex items-center justify-between bg-gray-900/50 rounded-lg p-3"
                      >
                        <div className="flex items-center gap-3">
                          <Video className="h-4 w-4 text-violet-400" />
                          <div>
                            <p className="text-white text-sm font-medium">{lesson.title}</p>
                            <p className="text-xs text-gray-400">{lesson.duration_minutes} min</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditLesson(moduleIndex, lessonIndex)}
                            className="text-gray-400 hover:text-white"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteLesson(moduleIndex, lessonIndex)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAddLesson(moduleIndex)}
                      className="w-full mt-2 border-gray-700 text-gray-400"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Aula
                    </Button>
                  </div>
                  <div className="flex gap-2 mt-4 pt-4 border-t border-gray-700">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        const newTitle = prompt("Novo nome do módulo:", module.title);
                        if (newTitle) handleEditModule(moduleIndex, newTitle);
                      }}
                      className="text-gray-400"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Renomear
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteModule(moduleIndex)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir Módulo
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>{editingLesson !== null ? "Editar Aula" : "Nova Aula"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Título da Aula</label>
              <Input
                value={lessonData.title}
                onChange={(e) => setLessonData({ ...lessonData, title: e.target.value })}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="Ex: Introdução ao mercado de ações"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Duração (minutos)</label>
              <Input
                type="number"
                value={lessonData.duration_minutes}
                onChange={(e) => setLessonData({ ...lessonData, duration_minutes: parseInt(e.target.value) })}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Vídeo</label>
              <div className="space-y-2">
                <Input
                  value={lessonData.video_url}
                  onChange={(e) => setLessonData({ ...lessonData, video_url: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white"
                  placeholder="URL do vídeo ou faça upload"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleVideoUpload}
                    className="hidden"
                    id="video-upload"
                  />
                  <label htmlFor="video-upload">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={uploading}
                      className="border-gray-700 text-gray-300"
                      asChild
                    >
                      <span>
                        {uploading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Enviando...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Fazer Upload
                          </>
                        )}
                      </span>
                    </Button>
                  </label>
                </div>
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={handleSaveLesson} className="flex-1 bg-violet-600 hover:bg-violet-700">
                Salvar
              </Button>
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="border-gray-700"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}