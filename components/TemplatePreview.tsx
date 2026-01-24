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
  const headerBgColor = category?.color || '#000000';
  
  const isDarkColor = (color: string) => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness < 128;
  };
  const textColor = isDarkColor(headerBgColor) ? 'text-white' : 'text-slate-900';

  /**
   * Vérifie si le HTML contient du contenu réel (texte ou images)
   */
  const hasContent = (html?: string) => {
    if (!html) return false;
    const clean = html.replace(/<[^>]*>/g, '').trim();
    return clean.length > 0 || html.includes('<img');
  };

  return (
    <div 
      id={containerId} 
      className="bg-white p-8 shadow-lg w-full max-w-[210mm] mx-auto min-h-[296.5mm] text-gray-900 font-sans flex flex-col relative box-border" 
      style={{ fontSize: '11pt' }}
    >
      {/* Header */}
      <div className="flex w-full border-t-2 border-l-2 border-r-2 border-black">
        <div className="w-1/4 p-2 flex flex-col items-center justify-center border-r-2 border-black text-center bg-white">
          <span className="font-bold underline text-sm mb-1">Date</span>
          <span className="text-xs">.... / .... / ....</span>
        </div>
        <div 
          className={`w-3/4 p-4 flex items-center justify-center text-center ${textColor}`}
          style={{ backgroundColor: headerBgColor }}
        >
          <h1 className="text-2xl font-bold uppercase tracking-wider">{evaluation.title}</h1>
        </div>
      </div>

      <div className="flex w-full border-2 border-black mb-6">
        <div className="w-3/4 p-2 min-h-[140px] border-r-2 border-black">
          <p className="italic underline text-sm mb-1">Commentaire</p>
          <p className="text-sm text-gray-500 italic whitespace-pre-wrap">{evaluation.comment || '...'}</p>
        </div>
        <div className="w-1/4 flex flex-col items-center justify-center pt-2">
          <div className="flex flex-col items-center mt-4">
             <div className="w-16 h-[2px] bg-black mb-1"></div>
             <p className="font-bold text-2xl">{evaluation.totalPoints || '20'}</p>
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
              <div key={q.id} className="space-y-2 break-inside-avoid">
                <div className="flex items-start">
                   <span className="text-[#0070c0] font-bold mr-2 shrink-0">{q.number}.</span>
                   <div className="flex-1">
                      <div className="text-[#0070c0] font-bold">
                         <div className="rich-content inline-block" dangerouslySetInnerHTML={{ __html: q.content }} />
                         <span className="ml-1 text-[10pt] whitespace-nowrap">({q.points} pts)</span>
                      </div>
                   </div>
                </div>
                
                {showAnswers ? (
                  /* MODE CORRIGÉ : On affiche le corrigé complet */
                  <div 
                    className="rich-content mt-2 pl-6 text-gray-700 italic border-l-2 border-emerald-100 py-1" 
                    dangerouslySetInnerHTML={{ __html: q.answer }} 
                  />
                ) : (
                  /* MODE ÉLÈVE */
                  hasContent(q.studentTemplate) ? (
                    /* Si un schéma vierge ou une amorce est définie, on l'affiche */
                    <div 
                      className="rich-content mt-2 pl-6" 
                      dangerouslySetInnerHTML={{ __html: q.studentTemplate! }} 
                    />
                  ) : (
                    /* Sinon, on affiche les lignes de réponse classiques */
                    <div className="mt-2 pl-6 space-y-4">
                      <div className="border-b border-gray-300 w-full h-4"></div>
                      <div className="border-b border-gray-300 w-full h-4"></div>
                      <div className="border-b border-gray-300 w-full h-4"></div>
                    </div>
                  )
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Pied de page */}
      <div className="mt-10 flex justify-between items-center text-[9pt] text-gray-400 border-t pt-2 uppercase tracking-tight">
        <div className="flex gap-4 items-center">
          <span className="font-bold">{evaluation.title}</span>
          <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
          <span className="italic normal-case">{category?.name}</span>
        </div>
        <div>Page 1</div>
      </div>
    </div>
  );
};