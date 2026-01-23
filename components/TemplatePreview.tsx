
import React from 'react';
import { Evaluation, Category } from '../types.ts';

interface TemplatePreviewProps {
  evaluation: Evaluation;
  categories: Category[];
  showAnswers: boolean;
  containerId: string;
}

export const TemplatePreview: React.FC<TemplatePreviewProps> = ({ evaluation, categories, showAnswers, containerId }) => {
  const sections: { [key: string]: any[] } = {};
  evaluation.questions.forEach((q, index) => {
    const section = q.sectionTitle || "Sans Titre";
    if (!sections[section]) sections[section] = [];
    sections[section].push({ ...q, number: index + 1 });
  });

  const category = categories.find(c => c.id === evaluation.categoryId);
  const headerBgColor = category?.color || '#9de4c1';

  return (
    <div 
      id={containerId} 
      className="bg-white p-8 shadow-lg w-full max-w-[210mm] mx-auto min-h-[297mm] text-gray-900 font-sans flex flex-col relative" 
      style={{ fontSize: '11pt' }}
    >
      {/* Header avec suppression du mot "Note" */}
      <div className="flex w-full border-t-2 border-l-2 border-r-2 border-black">
        <div 
          className="w-1/4 p-2 flex flex-col items-center justify-center border-r-2 border-black text-center" 
          style={{ backgroundColor: headerBgColor }}
        >
          <span className="font-bold underline text-sm mb-1">Date</span>
          <span className="text-xs">.... / .... / ....</span>
        </div>
        <div className="w-3/4 bg-black p-4 flex items-center justify-center text-center">
          <h1 className="text-white text-2xl font-bold uppercase tracking-wider">{evaluation.title}</h1>
        </div>
      </div>

      <div className="flex w-full border-2 border-black mb-6">
        <div className="w-3/4 p-2 min-h-[80px] border-r-2 border-black">
          <p className="italic underline text-sm mb-1">Commentaire</p>
          <p className="text-sm text-gray-500 italic whitespace-pre-wrap">{evaluation.comment || '...'}</p>
        </div>
        <div className="w-1/4 flex flex-col items-center justify-center pt-2">
          {/* Note section sans le mot "Note" */}
          <div className="flex flex-col items-center mt-4">
             <div className="w-16 h-[2px] bg-black mb-1"></div>
             <p className="font-bold text-2xl">/ {evaluation.totalPoints || '20'}</p>
          </div>
        </div>
      </div>

      <div className="space-y-6 flex-1">
        {Object.entries(sections).map(([sectionTitle, questions], sIdx) => (
          <div key={sIdx} className="space-y-4">
            <h2 className="text-[#c00000] font-bold underline text-lg">
              {sectionTitle} ({questions.reduce((acc, q) => acc + (q.points || 0), 0)} pts)
            </h2>

            {questions.map((q, qIdx) => (
              <div key={q.id} className="space-y-1">
                <h3 className="text-[#0070c0] font-bold">
                  {q.number}. ({q.points} pts)
                </h3>
                <div className="flex items-start pl-2">
                   <span className="mr-2 mt-1">◦</span>
                   <p className="flex-1 whitespace-pre-wrap">{q.content}</p>
                </div>
                
                {showAnswers ? (
                  <div 
                    className="rich-content mt-2 pl-6 text-gray-700 italic border-l-2 border-gray-200 py-2" 
                    dangerouslySetInnerHTML={{ __html: q.answer }} 
                  />
                ) : (
                  <div className="mt-4 pl-6 space-y-4">
                    <div className="border-b border-gray-300 w-full h-4"></div>
                    <div className="border-b border-gray-300 w-full h-4"></div>
                    <div className="border-b border-gray-300 w-full h-4"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="mt-10 text-right text-xs text-gray-400 border-t pt-2">
        EvalGen Local - Page 1
      </div>
    </div>
  );
};
