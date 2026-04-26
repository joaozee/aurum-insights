import { useState } from "react";
import { Book, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";

export default function GlossarySection({ terms, searchTerm }) {
  const [expandedId, setExpandedId] = useState(null);

  const toggleTerm = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const groupedTerms = terms.reduce((acc, term) => {
    const letter = term.title[0].toUpperCase();
    if (!acc[letter]) acc[letter] = [];
    acc[letter].push(term);
    return acc;
  }, {});

  const sortedLetters = Object.keys(groupedTerms).sort();

  if (terms.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center">
        <Book className="h-16 w-16 text-gray-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">
          {searchTerm ? "Nenhum termo encontrado" : "Glossário em Construção"}
        </h3>
        <p className="text-gray-400">
          {searchTerm ? "Tente outra busca" : "Termos financeiros serão adicionados em breve"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alphabet Navigation */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <div className="flex flex-wrap gap-2">
          {sortedLetters.map(letter => (
            <a
              key={letter}
              href={`#letter-${letter}`}
              className="h-8 w-8 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 flex items-center justify-center text-violet-400 font-semibold text-sm transition-colors"
            >
              {letter}
            </a>
          ))}
        </div>
      </div>

      {/* Terms List */}
      <div className="space-y-8">
        {sortedLetters.map(letter => (
          <div key={letter} id={`letter-${letter}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                <span className="text-white font-bold text-lg">{letter}</span>
              </div>
              <h3 className="text-xl font-bold text-white">{letter}</h3>
            </div>

            <div className="space-y-3">
              {groupedTerms[letter].map(term => (
                <motion.div
                  key={term.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-violet-500/30 transition-colors"
                >
                  <button
                    onClick={() => toggleTerm(term.id)}
                    className="w-full flex items-center justify-between p-4 text-left"
                  >
                    <div className="flex-1">
                      <h4 className="text-white font-semibold text-base mb-1">{term.title}</h4>
                      {term.short_description && (
                        <p className="text-gray-400 text-sm">{term.short_description}</p>
                      )}
                    </div>
                    <div className="ml-4">
                      {expandedId === term.id ? (
                        <ChevronUp className="h-5 w-5 text-violet-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-500" />
                      )}
                    </div>
                  </button>

                  <AnimatePresence>
                    {expandedId === term.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-gray-800 overflow-hidden"
                      >
                        <div className="p-4 bg-gray-800/30">
                          <ReactMarkdown className="prose prose-sm prose-invert max-w-none text-gray-300">
                            {term.content}
                          </ReactMarkdown>
                          {term.tags && term.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-4">
                              {term.tags.map((tag, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-1 bg-violet-500/10 text-violet-400 text-xs rounded-lg"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}