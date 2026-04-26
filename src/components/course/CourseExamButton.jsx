import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { FileText, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function CourseExamButton({ courseId }) {
  const [exam, setExam] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExam();
  }, [courseId]);

  const loadExam = async () => {
    try {
      const user = await base44.auth.me();
      const exams = await base44.entities.CourseExam.filter({ course_id: courseId, is_active: true });
      
      if (exams.length > 0) {
        const courseExam = exams[0];
        setExam(courseExam);

        const userAttempts = await base44.entities.ExamAttempt.filter({
          user_email: user.email,
          exam_id: courseExam.id
        });
        setAttempts(userAttempts);
      }
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !exam) return null;

  const passed = attempts.some(a => a.passed);
  const bestScore = Math.max(...attempts.map(a => a.score), 0);

  return (
    <Link to={createPageUrl(`CourseExam?id=${exam.id}`)}>
      <Button 
        size="lg" 
        variant="outline"
        className={`w-full ${passed ? 'border-green-500 text-green-400 hover:bg-green-500/10' : 'border-violet-500 text-violet-400 hover:bg-violet-500/10'}`}
      >
        {passed ? (
          <>
            <CheckCircle2 className="h-5 w-5 mr-2" />
            Prova Concluída ({bestScore}%)
          </>
        ) : (
          <>
            <FileText className="h-5 w-5 mr-2" />
            {attempts.length > 0 ? 'Refazer Prova' : 'Fazer Prova'}
          </>
        )}
      </Button>
    </Link>
  );
}