import { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  ArrowLeft, 
  Search,
  HelpCircle,
  CreditCard,
  BookOpen,
  Users,
  Crown,
  ChevronDown
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import PageHeader from "@/components/shared/PageHeader";

export default function Help() {
  const [search, setSearch] = useState("");

  const categories = [
    { icon: Crown, title: "Assinatura Premium", count: 5 },
    { icon: CreditCard, title: "Pagamentos", count: 4 },
    { icon: BookOpen, title: "Cursos", count: 6 },
    { icon: Users, title: "Comunidade", count: 3 }
  ];

  const faqs = [
    {
      question: "Como funciona a assinatura Premium?",
      answer: "A assinatura Premium dá acesso ilimitado a todos os conteúdos exclusivos, análises aprofundadas, cursos especiais e à comunidade VIP. Você pode escolher entre o plano mensal ou anual."
    },
    {
      question: "Posso cancelar minha assinatura a qualquer momento?",
      answer: "Sim! Você pode cancelar sua assinatura a qualquer momento. Após o cancelamento, você continuará tendo acesso até o final do período já pago."
    },
    {
      question: "Os cursos ficam disponíveis para sempre?",
      answer: "Sim, todos os cursos que você comprar ficam disponíveis para sempre, com acesso vitalício ao conteúdo e todas as atualizações futuras."
    },
    {
      question: "Como funciona a garantia de 7 dias?",
      answer: "Se você não ficar satisfeito com a assinatura Premium nos primeiros 7 dias, devolvemos 100% do seu dinheiro, sem perguntas."
    },
    {
      question: "Posso acessar de qualquer dispositivo?",
      answer: "Sim! O Aurum funciona em qualquer dispositivo com acesso à internet: computador, tablet ou celular."
    }
  ];

  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(search.toLowerCase()) ||
    faq.answer.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link to={createPageUrl("Profile")} className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 group">
          <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
          <span>Voltar</span>
        </Link>

        <PageHeader 
          title="Central de Ajuda"
          subtitle="Como podemos ajudar você?"
        />

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input 
            placeholder="Buscar dúvidas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-12 h-14 text-lg border-gray-200 rounded-2xl"
          />
        </div>

        {/* Categories */}
        {!search && (
          <div className="grid grid-cols-2 gap-4 mb-10">
            {categories.map((cat) => (
              <div 
                key={cat.title}
                className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center mb-3">
                  <cat.icon className="h-5 w-5 text-amber-600" />
                </div>
                <h3 className="font-medium text-gray-900">{cat.title}</h3>
                <p className="text-sm text-gray-500">{cat.count} artigos</p>
              </div>
            ))}
          </div>
        )}

        {/* FAQs */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-amber-500" />
            Perguntas Frequentes
          </h2>
          <Accordion type="single" collapsible className="space-y-3">
            {filteredFaqs.map((faq, i) => (
              <AccordionItem 
                key={i}
                value={`faq-${i}`}
                className="border border-gray-100 rounded-xl px-4"
              >
                <AccordionTrigger className="py-4 text-left hover:no-underline">
                  <span className="font-medium text-gray-900">{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent className="pb-4 text-gray-600">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </div>
  );
}