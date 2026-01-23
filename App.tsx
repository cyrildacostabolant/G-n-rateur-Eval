
import React, { useState, useEffect } from 'react';
import { 
  Plus, Settings, FileText, Download, Trash2, ChevronLeft, Save, 
  Eye, Loader2, LayoutDashboard, FileSearch, Trash, 
  FolderKanban, GraduationCap, Clock, Calendar,
  DownloadCloud, UploadCloud, FileJson, ShieldCheck
} from 'lucide-react';
import { Evaluation, Category, Question, AppView, BackupData } from './types.ts';
import { storageService } from './services/storageService.ts';
import { RichTextInput } from './components/RichTextInput.tsx';
import { TemplatePreview } from './components/TemplatePreview.tsx';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('dashboard');
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [currentEval, setCurrentEval] = useState<Partial<Evaluation> | null>(null);
  const [selectedEval, setSelectedEval] = useState<Evaluation | null>(null);
  const [showAnswers, setShowAnswers] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [evals, cats] = await Promise.all([
        storageService.getEvaluations(),
        storageService.getCategories()
      ]);
      setEvaluations(evals);
      setCategories(cats);
    } catch (error) {
      console.error("Erreur lors du chargement des données locales", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveEval = async () => {
    if (!currentEval || !currentEval.title) {
      alert("Le titre est obligatoire.");
      return;
    }
    setIsLoading(true);
    try {
      await storageService.saveEvaluation(currentEval as Evaluation);
      await loadData();
      setView('dashboard');
    } catch (e) {
      alert("Erreur lors de la sauvegarde.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteEval = async (id: string) => {
    if (confirm('Supprimer cette évaluation définitivement ?')) {
      await storageService.deleteEvaluation(id);
      await loadData();
    }
  };

  const handleAddCategory = async (name: string, color: string) => {
    if (!name) return;
    await storageService.saveCategory({ id: crypto.randomUUID(), name, color });
    await loadData();
  };

  const handleAddQuestion = () => {
    if (!currentEval) return;
    const lastSection = currentEval.questions?.length ? currentEval.questions[currentEval.questions.length - 1].sectionTitle : '';
    setCurrentEval({
      ...currentEval, 
      questions: [
        ...(currentEval.questions || []), 
        { id: crypto.randomUUID(), sectionTitle: lastSection, points: 2, content: '', answer: '' }
      ]
    });
  };

  const handleExportBackup = async () => {
    try {
      const data = await storageService.exportFullBackup();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const date = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `evalgen_backup_${date}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert("Erreur lors de l'exportation.");
    }
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const data = JSON.parse(content) as BackupData;
        
        if (!data.evaluations || !data.categories) {
          throw new Error("Format de fichier invalide.");
        }

        if (confirm(`Restaurer cette sauvegarde du ${new Date(data.exportDate).toLocaleDateString()} ? Attention, cela écrasera vos évaluations actuelles.`)) {
          setIsLoading(true);
          await storageService.restoreFromBackup(data);
          await loadData();
          alert("Restauration réussie !");
          setView('dashboard');
        }
      } catch (err) {
        alert("Erreur : Le fichier n'est pas une sauvegarde EvalGen valide.");
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsText(file);
  };

  if (isLoading && view === 'dashboard' && evaluations.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mb-4" />
        <p className="text-slate-500 font-bold tracking-widest uppercase text-xs">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white overflow-hidden font-sans text-slate-900">
      {/* Sidebar Navigation */}
      <aside className="w-72 bg-slate-900 text-white flex flex-col shrink-0">
        <div className="p-8 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-900/40">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="font-black text-xl tracking-tighter block leading-none">EvalGen</span>
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest leading-none">Local Edition</span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2">
          <button 
            onClick={() => setView('dashboard')}
            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition group ${view === 'dashboard' ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <LayoutDashboard className="w-5 h-5" /> 
            <span className="font-bold text-sm">Tableau de bord</span>
          </button>
          <button 
            onClick={() => {
              setCurrentEval({ id: crypto.randomUUID(), title: '', categoryId: categories[0]?.id || '1', questions: [], totalPoints: 20, createdAt: Date.now() });
              setView('editor');
            }}
            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition group ${view === 'editor' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <Plus className="w-5 h-5" /> 
            <span className="font-bold text-sm">Nouvelle Éval</span>
          </button>
          <button 
            onClick={() => setView('categories')}
            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition group ${view === 'categories' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <FolderKanban className="w-5 h-5" /> 
            <span className="font-bold text-sm">Disciplines</span>
          </button>
          <button 
            onClick={() => setView('backup')}
            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition group ${view === 'backup' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <DownloadCloud className="w-5 h-5" /> 
            <span className="font-bold text-sm">Sauvegarde</span>
          </button>
        </nav>

        <div className="p-6 border-t border-slate-800 text-center">
           <div className="flex items-center justify-center gap-1.5 text-emerald-500 mb-1">
             <ShieldCheck className="w-3.5 h-3.5" />
             <span className="text-[10px] font-bold uppercase">Données Privées</span>
           </div>
           <p className="text-[9px] text-slate-500 leading-tight">Aucun serveur, vos fichiers restent sur votre machine.</p>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-slate-50">
        <div className="p-10 max-w-7xl mx-auto">
          
          {view === 'dashboard' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-500">
              <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-slate-200 pb-10">
                <div className="space-y-1">
                  <h1 className="text-4xl font-black text-slate-900 tracking-tight">Ma Bibliothèque</h1>
                  <p className="text-slate-500 font-medium">Gérez vos {evaluations.length} évaluations locales.</p>
                </div>
                <button 
                  onClick={() => {
                    setCurrentEval({ id: crypto.randomUUID(), title: '', categoryId: categories[0]?.id || '1', questions: [], totalPoints: 20, createdAt: Date.now() });
                    setView('editor');
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 shadow-xl shadow-emerald-200 transition transform active:scale-95"
                >
                  <Plus className="w-6 h-6" /> CRÉER UNE ÉVALUATION
                </button>
              </header>

              {evaluations.length === 0 ? (
                <div className="bg-white border-2 border-dashed border-slate-200 rounded-[3rem] p-24 text-center space-y-6">
                  <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                    <FileText className="w-12 h-12" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Bibliothèque vide</h2>
                    <p className="text-slate-400 font-medium max-w-md mx-auto">Créez votre première évaluation ou restaurez une sauvegarde depuis l'onglet dédié.</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                  {evaluations.sort((a,b) => b.createdAt - a.createdAt).map(ev => {
                    const cat = categories.find(c => c.id === ev.categoryId);
                    return (
                      <div key={ev.id} className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 group">
                        <div className="flex justify-between items-start mb-6">
                          <span className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest" style={{ backgroundColor: cat?.color + '20', color: cat?.color }}>
                            {cat?.name || 'Général'}
                          </span>
                          <button onClick={() => handleDeleteEval(ev.id)} className="text-slate-300 hover:text-red-500 transition opacity-0 group-hover:opacity-100 p-2">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                        <h3 className="text-xl font-black text-slate-800 mb-4 line-clamp-2 min-h-[3.5rem] tracking-tight">{ev.title}</h3>
                        <div className="flex items-center gap-4 text-xs font-bold text-slate-400 mb-8 pb-4 border-b border-slate-50">
                           <div className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {ev.questions.length} questions</div>
                           <div className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {new Date(ev.createdAt).toLocaleDateString()}</div>
                        </div>
                        <div className="flex gap-3">
                          <button onClick={() => { setCurrentEval(ev); setView('editor'); }} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black py-3 rounded-xl text-xs tracking-widest transition uppercase">Éditer</button>
                          <button onClick={() => { setSelectedEval(ev); setShowAnswers(false); setView('preview'); }} className="flex-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 font-black py-3 rounded-xl text-xs tracking-widest transition uppercase">PDF</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {view === 'backup' && (
            <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-600">
               <header className="text-center space-y-2">
                <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Sauvegarde & Restauration</h1>
                <p className="text-slate-500 font-medium italic">Sécurisez vos données en les exportant sur votre PC.</p>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-2xl shadow-slate-200/40 text-center space-y-6">
                  <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
                    <DownloadCloud className="w-10 h-10" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Exporter</h2>
                    <p className="text-sm text-slate-400 leading-relaxed font-medium">Générez un fichier JSON contenant toutes vos évaluations et catégories pour les conserver sur votre PC.</p>
                  </div>
                  <button 
                    onClick={handleExportBackup}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-2xl shadow-xl shadow-blue-200 transition transform active:scale-95 flex items-center justify-center gap-3 uppercase text-xs tracking-widest"
                  >
                    <FileJson className="w-5 h-5" /> Télécharger la sauvegarde
                  </button>
                </div>

                <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-2xl shadow-slate-200/40 text-center space-y-6">
                  <div className="w-20 h-20 bg-orange-50 text-orange-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
                    <UploadCloud className="w-10 h-10" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Restaurer</h2>
                    <p className="text-sm text-slate-400 leading-relaxed font-medium">Sélectionnez un fichier de sauvegarde précédemment exporté pour restaurer votre bibliothèque.</p>
                  </div>
                  <label className="w-full bg-slate-900 hover:bg-black text-white font-black py-5 rounded-2xl shadow-xl shadow-slate-900/10 transition transform active:scale-95 flex items-center justify-center gap-3 uppercase text-xs tracking-widest cursor-pointer">
                    <UploadCloud className="w-5 h-5" />
                    Importer un fichier
                    <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
                  </label>
                  <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider">⚠️ Écrase les données actuelles</p>
                </div>
              </div>
            </div>
          )}

          {view === 'editor' && currentEval && (
            <div className="max-w-4xl mx-auto space-y-10 pb-40 animate-in fade-in slide-in-from-bottom-8 duration-500">
              <header className="flex justify-between items-center sticky top-0 bg-slate-50/95 backdrop-blur-xl py-6 z-40 border-b border-slate-200">
                <button onClick={() => setView('dashboard')} className="flex items-center gap-2 text-slate-500 font-black tracking-widest uppercase text-[10px] hover:text-slate-900 transition">
                  <ChevronLeft className="w-4 h-4" /> Retour
                </button>
                <button 
                  onClick={handleSaveEval}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-10 py-4 rounded-2xl font-black shadow-xl shadow-emerald-200 flex items-center gap-3 transition transform active:scale-95 tracking-widest uppercase text-xs"
                >
                  <Save className="w-5 h-5" /> Enregistrer Localement
                </button>
              </header>

              <section className="bg-white rounded-[3rem] p-12 border border-slate-100 shadow-2xl shadow-slate-200/40 space-y-8">
                <input 
                  type="text" 
                  value={currentEval.title}
                  onChange={(e) => setCurrentEval({...currentEval, title: e.target.value})}
                  placeholder="TITRE DE L'ÉVALUATION..."
                  className="w-full text-5xl font-black text-slate-900 border-none p-0 focus:ring-0 outline-none transition placeholder:text-slate-100 uppercase tracking-tighter"
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-3">
                    <label className="text-xs font-black uppercase text-slate-400 tracking-widest ml-1">Discipline</label>
                    <select 
                      value={currentEval.categoryId}
                      onChange={(e) => setCurrentEval({...currentEval, categoryId: e.target.value})}
                      className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-6 py-4 outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-200 transition font-bold text-slate-700 appearance-none shadow-inner cursor-pointer"
                    >
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-black uppercase text-slate-400 tracking-widest ml-1">Note Maximale (/pts)</label>
                    <input 
                      type="number"
                      value={currentEval.totalPoints}
                      onChange={(e) => setCurrentEval({...currentEval, totalPoints: parseInt(e.target.value) || 20})}
                      className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-6 py-4 outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-200 transition font-black text-emerald-600 text-xl shadow-inner"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-black uppercase text-slate-400 tracking-widest ml-1">Consignes & Objectifs</label>
                  <textarea 
                    value={currentEval.comment}
                    onChange={(e) => setCurrentEval({...currentEval, comment: e.target.value})}
                    placeholder="Instructions générales pour l'élève..."
                    className="w-full bg-slate-50 border-2 border-slate-50 rounded-3xl px-6 py-5 outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-200 transition font-medium text-slate-600 shadow-inner min-h-[100px]"
                  />
                </div>
              </section>

              <section className="space-y-8">
                <div className="flex justify-between items-center px-4">
                  <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Questions</h2>
                  <button 
                    onClick={handleAddQuestion}
                    className="bg-white border-2 border-slate-200 text-slate-900 hover:bg-emerald-600 hover:border-emerald-600 hover:text-white px-6 py-3 rounded-2xl font-black flex items-center gap-3 transition-all duration-300 shadow-lg shadow-slate-200/50 uppercase text-xs tracking-widest"
                  >
                    <Plus className="w-5 h-5" /> Ajouter une question
                  </button>
                </div>

                <div className="space-y-6">
                  {currentEval.questions?.map((q, idx) => (
                    <div key={q.id} className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-xl shadow-slate-200/30 space-y-6 relative group transition-all duration-300 hover:border-emerald-100">
                      <button 
                        onClick={() => {
                          const newQ = currentEval.questions?.filter((_, i) => i !== idx);
                          setCurrentEval({...currentEval, questions: newQ});
                        }}
                        className="absolute -right-3 -top-3 w-12 h-12 bg-white border-2 border-red-50 shadow-2xl rounded-2xl flex items-center justify-center text-red-500 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-red-500 hover:text-white transform group-hover:-rotate-3"
                      >
                        <Trash className="w-5 h-5" />
                      </button>

                      <div className="grid grid-cols-12 gap-8">
                        <div className="col-span-12 md:col-span-9 space-y-2">
                           <label className="text-[10px] font-black uppercase text-slate-300 tracking-widest ml-1">Section</label>
                           <input 
                            type="text" 
                            value={q.sectionTitle}
                            onChange={(e) => {
                              const qs = [...(currentEval.questions || [])];
                              qs[idx].sectionTitle = e.target.value;
                              setCurrentEval({...currentEval, questions: qs});
                            }}
                            placeholder="Titre de la section..."
                            className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-black text-slate-600 outline-none shadow-inner uppercase tracking-wide"
                          />
                        </div>
                        <div className="col-span-12 md:col-span-3 space-y-2">
                           <label className="text-[10px] font-black uppercase text-slate-300 tracking-widest ml-1">Points</label>
                           <input 
                            type="number" 
                            value={q.points}
                            onChange={(e) => {
                              const qs = [...(currentEval.questions || [])];
                              qs[idx].points = parseInt(e.target.value) || 0;
                              setCurrentEval({...currentEval, questions: qs});
                            }}
                            className="w-full bg-emerald-50 border-none rounded-2xl px-6 py-4 text-lg text-center font-black text-emerald-600 outline-none shadow-inner"
                          />
                        </div>
                        <div className="col-span-12 space-y-2">
                           <label className="text-[10px] font-black uppercase text-slate-300 tracking-widest ml-1">Énoncé</label>
                           <textarea 
                            value={q.content}
                            onChange={(e) => {
                              const qs = [...(currentEval.questions || [])];
                              qs[idx].content = e.target.value;
                              setCurrentEval({...currentEval, questions: qs});
                            }}
                            rows={3}
                            placeholder="Saisissez votre question..."
                            className="w-full bg-white border-2 border-slate-50 rounded-2xl px-6 py-5 text-slate-800 font-bold outline-none focus:border-emerald-200 transition text-lg"
                          />
                        </div>
                        <div className="col-span-12 space-y-2">
                          <label className="text-[10px] font-black uppercase text-slate-300 tracking-widest ml-1 flex justify-between">
                            Corrigé & Aide (Images autorisées)
                            <span className="text-emerald-400 font-normal normal-case italic">Copier-coller images ici</span>
                          </label>
                          <RichTextInput 
                            value={q.answer}
                            onChange={(val) => {
                              const qs = [...(currentEval.questions || [])];
                              qs[idx].answer = val;
                              setCurrentEval({...currentEval, questions: qs});
                            }}
                            className="mt-1 shadow-sm !rounded-3xl !border-slate-100 !min-h-[150px]"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Nouveau bouton Ajouter une question en bas de liste */}
                {currentEval.questions && currentEval.questions.length > 0 && (
                  <div className="flex justify-center pt-6">
                    <button 
                      onClick={handleAddQuestion}
                      className="bg-white border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white px-10 py-4 rounded-2xl font-black flex items-center gap-3 transition-all duration-300 shadow-xl shadow-emerald-100 uppercase text-xs tracking-widest"
                    >
                      <Plus className="w-6 h-6" /> Ajouter une autre question
                    </button>
                  </div>
                )}
              </section>
            </div>
          )}

          {view === 'categories' && (
            <div className="max-w-2xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-600">
               <header className="text-center space-y-2">
                <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Mes Disciplines</h1>
                <p className="text-slate-500 font-medium italic">Organisez vos évaluations par matière.</p>
              </header>

              <div className="bg-white rounded-[3rem] border border-slate-100 p-10 shadow-2xl shadow-slate-200/40 space-y-8">
                <div className="flex gap-4 p-4 bg-slate-50 rounded-3xl border border-slate-100 shadow-inner">
                   <input type="text" id="cat-name" placeholder="Nom de la matière..." className="flex-1 bg-white border-none rounded-2xl px-6 py-4 font-bold outline-none focus:ring-4 focus:ring-emerald-100 transition" />
                   <input type="color" id="cat-color" defaultValue="#10b981" className="w-16 h-14 border-none rounded-2xl bg-white p-2 cursor-pointer shadow-sm" />
                   <button 
                    onClick={() => {
                      const name = (document.getElementById('cat-name') as HTMLInputElement).value;
                      const color = (document.getElementById('cat-color') as HTMLInputElement).value;
                      handleAddCategory(name, color);
                      (document.getElementById('cat-name') as HTMLInputElement).value = '';
                    }}
                    className="bg-emerald-600 text-white px-8 rounded-2xl font-black transition active:scale-95"
                   >
                     Ajouter
                   </button>
                </div>

                <div className="divide-y divide-slate-50">
                  {categories.map(cat => (
                    <div key={cat.id} className="py-6 flex justify-between items-center group">
                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-2xl shadow-lg border-2 border-white" style={{ backgroundColor: cat.color }}></div>
                        <span className="text-lg font-black text-slate-800 tracking-tight">{cat.name}</span>
                      </div>
                      <button onClick={async () => {
                        if(confirm('Supprimer cette discipline ?')) {
                          await storageService.deleteCategory(cat.id);
                          loadData();
                        }
                      }} className="text-red-400 opacity-0 group-hover:opacity-100 p-4 transition-all hover:text-red-600">
                        <Trash2 className="w-6 h-6" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {view === 'preview' && selectedEval && (
            <div className="space-y-8 animate-in zoom-in-95 duration-500">
               <div className="flex flex-col md:flex-row justify-between items-center no-print bg-white/80 p-6 rounded-[2.5rem] border border-slate-200 sticky top-4 z-40 backdrop-blur-2xl shadow-2xl shadow-slate-300/50 gap-6">
                  <button onClick={() => setView('dashboard')} className="flex items-center gap-3 text-slate-600 font-black tracking-widest uppercase text-xs px-6 py-3 hover:bg-slate-100 rounded-2xl transition group w-full md:w-auto">
                    <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> Retour
                  </button>
                  <div className="flex gap-4 w-full md:w-auto">
                    <button 
                      onClick={() => setShowAnswers(!showAnswers)} 
                      className="flex-1 md:flex-none bg-white border-2 border-slate-200 px-8 py-4 rounded-2xl font-black flex items-center justify-center gap-3 text-slate-800 hover:bg-slate-50 hover:border-emerald-200 transition shadow-lg shadow-slate-200/50 tracking-widest uppercase text-xs"
                    >
                      {showAnswers ? <Eye className="w-5 h-5 text-emerald-500" /> : <FileSearch className="w-5 h-5 text-slate-400" />}
                      {showAnswers ? 'Mode Élève' : 'Mode Corrigé'}
                    </button>
                    <button 
                      onClick={() => {
                        const el = document.getElementById('pdf-container');
                        if (el) (window as any).html2pdf().set({
                          margin: 0,
                          filename: `${selectedEval.title}.pdf`,
                          image: { type: 'jpeg', quality: 0.98 },
                          html2canvas: { scale: 2, useCORS: true },
                          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                        }).from(el).save();
                      }} 
                      className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-2xl font-black flex items-center justify-center gap-3 shadow-2xl shadow-emerald-600/30 transition transform active:scale-95 tracking-widest uppercase text-xs"
                    >
                      <Download className="w-5 h-5" /> Télécharger PDF
                    </button>
                  </div>
               </div>
               
               <div className="flex justify-center bg-slate-200/50 p-12 rounded-[3.5rem] min-h-[1000px] shadow-inner overflow-x-auto border-4 border-white/50 border-dashed">
                 <div className="animate-in fade-in zoom-in-95 duration-700">
                    <TemplatePreview evaluation={selectedEval} categories={categories} showAnswers={showAnswers} containerId="pdf-container" />
                 </div>
               </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
