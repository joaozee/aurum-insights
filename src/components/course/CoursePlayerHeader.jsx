import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { GraduationCap } from "lucide-react";

export default function CoursePlayerHeader({ course }) {
  return (
    <header className="bg-gray-900/80 border-b border-gray-800 backdrop-blur-lg sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to={createPageUrl("Home")} className="flex items-center gap-2 hover:text-violet-400 transition-colors">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
            </Link>
            <div className="hidden sm:block h-6 w-px bg-gray-800" />
            <div className="hidden sm:block">
              <p className="text-sm text-gray-400">{course.category === "investimentos" ? "Investimentos" : course.category === "formacao" ? "Formação" : "Avançado"}</p>
              <h1 className="text-white font-semibold line-clamp-1">{course.title}</h1>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}