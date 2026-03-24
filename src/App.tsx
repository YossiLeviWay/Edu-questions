import React, { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  doc, 
  deleteDoc, 
  updateDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { 
  signInAnonymously, 
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { 
  Plus, 
  Minus, 
  Settings, 
  Trash2, 
  Edit2, 
  PlusCircle, 
  Menu, 
  X,
  LogOut,
  HelpCircle
} from 'lucide-react';
import { db, auth } from './firebase';

const appId = 'edu-questions-app';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<any[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [fontSize, setFontSize] = useState(22);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showAddAnswerModal, setShowAddAnswerModal] = useState(false);
  const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);
  const [editQuestionData, setEditQuestionData] = useState<any>(null);
  const [editAnswerData, setEditAnswerData] = useState<any>(null);
  const [loginPassword, setLoginPassword] = useState('');
  const [isQuestionExpanded, setIsQuestionExpanded] = useState(false);

  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (err: any) {
        console.error("Auth error:", err);
        if (err.code === 'auth/admin-restricted-operation') {
          setAuthError("יש להפעיל 'Anonymous Authentication' ב-Firebase Console תחת לשונית Sign-in method.");
        } else {
          setAuthError(err.message);
        }
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  if (authError) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center p-4 text-right" style={{ direction: 'rtl' }}>
        <div className="bg-white p-8 rounded-[2rem] shadow-xl border-2 border-red-200 max-w-md w-full">
          <h2 className="text-2xl font-black text-red-600 mb-4">שגיאת התחברות ל-Firebase</h2>
          <p className="text-slate-700 font-bold mb-6">{authError}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="w-full bg-red-600 text-white py-4 rounded-2xl font-black"
          >
            נסה שוב
          </button>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (!user) return;
    const qCol = collection(db, 'artifacts', appId, 'public', 'data', 'questions');
    const unsubscribe = onSnapshot(qCol, (snapshot) => {
      const qs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const sorted = qs.sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setQuestions(sorted);
      if (sorted.length > 0 && !currentQuestion) {
        setCurrentQuestion(sorted[0]);
      }
    }, (err) => console.error(err));
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user || !currentQuestion) return;
    const aCol = collection(db, 'artifacts', appId, 'public', 'data', 'answers');
    const unsubscribe = onSnapshot(aCol, (snapshot) => {
      const allAnswers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const filtered = allAnswers
        .filter((a: any) => a.questionId === currentQuestion.id)
        .sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setAnswers(filtered);
    }, (err) => console.error(err));
    return () => unsubscribe();
  }, [user, currentQuestion]);

  const handleLogin = () => {
    if (loginPassword === '123qwe123') {
      setIsAdmin(true);
      setShowLoginModal(false);
      setLoginPassword('');
    } else {
      alert("סיסמה שגויה");
    }
  };

  const handleAddQuestion = async (title: string, text: string) => {
    if (!isAdmin || !text.trim() || !title.trim()) return;
    
    if (editQuestionData) {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'questions', editQuestionData.id);
      await updateDoc(docRef, { title, text });
      setEditQuestionData(null);
    } else {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'questions'), {
        title,
        text,
        createdAt: serverTimestamp()
      });
    }
    setShowAddQuestionModal(false);
  };

  const handleAddAnswer = async (name: string, text: string) => {
    if (!currentQuestion || !text.trim()) return;
    if (editAnswerData) {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'answers', editAnswerData.id);
      await updateDoc(docRef, { name, text });
      setEditAnswerData(null);
    } else {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'answers'), {
        questionId: currentQuestion.id,
        name: name || "משתתפת אנונימית",
        text,
        createdAt: serverTimestamp()
      });
    }
    setShowAddAnswerModal(false);
  };

  return (
    <div 
      className="min-h-screen bg-stone-50 text-slate-900 flex flex-col transition-all font-sans"
      style={{ fontSize: `${fontSize}px`, direction: 'rtl' }}
    >
      <header className="bg-white border-b-2 border-slate-100 shadow-sm sticky top-0 z-40 w-full">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 md:p-3 bg-slate-50 hover:bg-blue-50 text-slate-600 rounded-xl md:rounded-2xl border border-slate-100 cursor-pointer">
              <Menu size={24} />
            </button>
            <h1 className="font-black text-blue-600 text-lg md:text-2xl mr-1 md:mr-2 truncate max-w-[150px] md:max-w-none">הלוח השיתופי</h1>
          </div>
          <div className="flex items-center gap-1 md:gap-2">
            <div className="flex bg-slate-50 rounded-xl md:rounded-2xl p-1 gap-1 border border-slate-200">
              <button onClick={() => setFontSize(f => Math.min(f + 4, 64))} className="p-1 md:p-2 text-blue-700 cursor-pointer"><Plus size={20} /></button>
              <button onClick={() => setFontSize(f => Math.max(f - 4, 12))} className="p-1 md:p-2 text-blue-700 cursor-pointer"><Minus size={20} /></button>
            </div>
            {!isAdmin ? (
              <button onClick={() => setShowLoginModal(true)} className="p-2 md:p-3 text-slate-400 hover:text-blue-600 cursor-pointer"><Settings size={20} /></button>
            ) : (
              <button onClick={() => setIsAdmin(false)} className="flex items-center gap-2 p-2 md:p-3 bg-red-50 text-red-600 rounded-xl md:rounded-2xl font-bold cursor-pointer">
                <LogOut size={18} /><span className="hidden sm:inline">יציאה</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {currentQuestion && (
        <div className="sticky top-[65px] md:top-[80px] z-30 flex justify-center px-4 pointer-events-none w-full">
          <div 
            className={`pointer-events-auto group relative bg-white border-2 border-blue-500 rounded-2xl md:rounded-[2rem] shadow-2xl transition-all duration-300 max-w-2xl w-full ${isQuestionExpanded ? 'p-4 md:p-8' : 'p-2 md:p-3 text-center cursor-help'}`}
            onMouseEnter={() => setIsQuestionExpanded(true)}
            onMouseLeave={() => setIsQuestionExpanded(false)}
            onClick={() => setIsQuestionExpanded(!isQuestionExpanded)}
          >
            {!isQuestionExpanded ? (
              <div className="flex items-center justify-center gap-2 md:gap-3 text-blue-700 font-black text-sm md:text-base">
                <HelpCircle size={20} className="animate-bounce" />
                <span className="truncate">{currentQuestion.title || 'צפייה בשאלה'}</span>
              </div>
            ) : (
              <div className="space-y-3 md:space-y-4 text-right">
                <div className="flex justify-between items-center border-b border-blue-100 pb-2">
                  <span className="text-xs md:text-sm font-black text-blue-600 uppercase tracking-widest truncate">{currentQuestion.title}</span>
                  <X size={18} className="text-slate-300 cursor-pointer" onClick={(e) => { e.stopPropagation(); setIsQuestionExpanded(false); }} />
                </div>
                <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                  <p className="font-bold text-slate-800 leading-snug whitespace-pre-wrap" style={{ fontSize: `${Math.max(fontSize * 0.9, 14)}px` }}>
                    {currentQuestion.text}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full mt-2 md:mt-4 overflow-x-hidden">
        {currentQuestion ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {answers.map((ans) => (
              <div key={ans.id} className="bg-white p-6 rounded-[2.5rem] shadow-lg border border-slate-100 flex flex-col gap-4 group">
                <div className="flex justify-between items-start border-b border-slate-50 pb-3">
                  <span className="font-black text-blue-700 bg-blue-50 px-4 py-1 rounded-2xl text-base">{ans.name}</span>
                  {isAdmin && (
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditAnswerData(ans); setShowAddAnswerModal(true); }} className="p-2 text-slate-400 hover:text-blue-600 cursor-pointer"><Edit2 size={18} /></button>
                      <button onClick={() => { if(confirm("למחוק?")) deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'answers', ans.id)) }} className="p-2 text-red-400 hover:text-red-600 cursor-pointer"><Trash2 size={18} /></button>
                    </div>
                  )}
                </div>
                <p className="whitespace-pre-wrap leading-relaxed text-slate-700 text-right">{ans.text}</p>
              </div>
            ))}
          </div>
        ) : <div className="text-center py-40 opacity-40 text-2xl font-bold">בחרו שאלה מהתפריט</div>}
      </main>

      {currentQuestion && (
        <button onClick={() => { setEditAnswerData(null); setShowAddAnswerModal(true); }} className="fixed bottom-10 left-10 bg-blue-600 text-white p-6 rounded-full shadow-2xl z-30 flex items-center gap-4 hover:-translate-y-2 transition-all cursor-pointer">
          <Plus size={40} strokeWidth={3} />
          <span className="font-black text-2xl ml-2 hidden md:inline">להוספת תגובה</span>
        </button>
      )}

      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
          <div className="relative bg-white w-96 max-w-[90vw] h-full flex flex-col shadow-2xl animate-slide-in-right">
            <div className="p-6 border-b-2 flex justify-between items-center bg-slate-50">
              <h2 className="font-black text-2xl">רשימת שאלות</h2>
              <button onClick={() => setIsSidebarOpen(false)} className="cursor-pointer"><X size={32} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {questions.map((q) => (
                <div 
                  key={q.id}
                  onClick={() => { setCurrentQuestion(q); setIsSidebarOpen(false); }}
                  className={`p-4 md:p-6 rounded-2xl md:rounded-[2rem] cursor-pointer border-2 transition-all text-right ${currentQuestion?.id === q.id ? 'bg-blue-600 border-blue-700 text-white shadow-xl' : 'bg-white border-slate-100 hover:border-blue-200 text-slate-700'}`}
                >
                  <p className="font-black text-lg md:text-xl">{q.title || 'ללא כותרת'}</p>
                  {isAdmin && (
                    <div className="flex gap-4 mt-3 border-t border-white/20 pt-2">
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          setEditQuestionData(q); 
                          setShowAddQuestionModal(true); 
                        }} 
                        className="flex items-center gap-1 text-white/80 hover:text-white text-sm font-bold cursor-pointer"
                      >
                        <Edit2 size={14} /> עריכה
                      </button>
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          if(confirm("למחוק את השאלה וכל התשובות שלה?")) {
                            deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'questions', q.id));
                            if (currentQuestion?.id === q.id) setCurrentQuestion(null);
                          }
                        }} 
                        className="flex items-center gap-1 text-red-200 hover:text-red-400 text-sm font-bold cursor-pointer"
                      >
                        <Trash2 size={14} /> מחיקה
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {isAdmin && (
                <button onClick={() => setShowAddQuestionModal(true)} className="w-full flex flex-col items-center p-10 text-blue-600 border-4 border-dashed border-blue-100 rounded-[2.5rem] hover:bg-blue-50 cursor-pointer">
                  <PlusCircle size={48} /><span className="font-black text-xl">שאלה חדשה</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showAddAnswerModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
          <div className="bg-white w-full max-w-3xl rounded-2xl md:rounded-[3rem] p-6 md:p-10 shadow-2xl text-right overflow-y-auto max-h-[95vh]">
            <div className="flex items-center justify-between mb-6 md:mb-8">
              <h2 className="text-2xl md:text-3xl font-black">{editAnswerData ? 'עריכת תגובה' : 'הוסיפי תגובה'}</h2>
              <div className="flex bg-slate-100 rounded-xl p-1">
                <button onClick={() => setFontSize(f => Math.min(f+4, 64))} className="p-2 text-blue-600 cursor-pointer"><Plus size={18}/></button>
                <button onClick={() => setFontSize(f => Math.max(f-4, 12))} className="p-2 text-blue-600 cursor-pointer"><Minus size={18}/></button>
              </div>
            </div>
            <div className="mb-4 md:mb-6 p-4 md:p-6 bg-blue-50 border-2 border-blue-100 rounded-2xl md:rounded-[2rem] max-h-[30vh] overflow-y-auto custom-scrollbar">
              <p className="font-bold text-slate-800" style={{ fontSize: `${Math.max(fontSize * 0.8, 14)}px` }}>{currentQuestion?.text}</p>
            </div>
            <form onSubmit={(e: any) => { e.preventDefault(); handleAddAnswer(e.target.name.value, e.target.text.value); }}>
              <input name="name" defaultValue={editAnswerData?.name} placeholder="שם" className="w-full p-4 md:p-6 bg-slate-50 border-2 border-slate-100 rounded-2xl md:rounded-3xl mb-4 text-right" />
              <textarea name="text" defaultValue={editAnswerData?.text} rows={5} placeholder="תשובה" className="w-full p-4 md:p-6 bg-slate-50 border-2 border-slate-100 rounded-2xl md:rounded-3xl mb-6 text-right resize-none" style={{ fontSize: `${Math.max(fontSize, 16)}px` }} required />
              <div className="flex gap-4">
                <button type="submit" className="flex-2 bg-blue-600 text-white py-4 md:py-6 px-6 md:px-10 rounded-2xl md:rounded-3xl font-black text-xl md:text-2xl shadow-xl cursor-pointer">שלחי</button>
                <button type="button" onClick={() => setShowAddAnswerModal(false)} className="flex-1 bg-slate-100 py-4 md:py-6 rounded-2xl md:rounded-3xl font-black cursor-pointer">ביטול</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddQuestionModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
          <div className="bg-white w-full max-w-2xl rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 shadow-2xl text-right overflow-y-auto max-h-[95vh]">
            <h2 className="text-2xl md:text-3xl font-black mb-6">{editQuestionData ? 'עריכת שאלה' : 'שאלה חדשה'}</h2>
            <input 
              id="qTitle" 
              defaultValue={editQuestionData?.title}
              placeholder="כותרת השאלה (תוצג בתפריט)" 
              className="w-full p-4 md:p-6 bg-slate-50 border-2 border-slate-200 rounded-2xl md:rounded-3xl mb-4 text-right font-bold" 
            />
            <div className="mb-2 text-xs text-slate-400 font-bold">טיפ: התחילי שורה במספר (למשל 1.) כדי ליצור סעיפים ברורים</div>
            <textarea 
              id="qText" 
              defaultValue={editQuestionData?.text}
              placeholder="תוכן השאלה המלא" 
              className="w-full p-4 md:p-6 bg-slate-50 border-2 border-slate-200 rounded-2xl md:rounded-3xl text-lg md:text-xl min-h-[200px] text-right" 
            />
            <div className="flex gap-4 mt-8">
              <button onClick={() => {
                const title = (document.getElementById('qTitle') as HTMLInputElement).value;
                const text = (document.getElementById('qText') as HTMLTextAreaElement).value;
                handleAddQuestion(title, text);
              }} className="flex-2 bg-blue-600 text-white py-4 md:py-6 px-6 md:px-10 rounded-2xl md:rounded-3xl font-black text-xl md:text-2xl shadow-xl cursor-pointer">
                {editQuestionData ? 'עדכן' : 'פרסם'}
              </button>
              <button onClick={() => { setShowAddQuestionModal(false); setEditQuestionData(null); }} className="flex-1 bg-slate-100 py-4 md:py-6 rounded-2xl md:rounded-3xl font-black cursor-pointer">ביטול</button>
            </div>
          </div>
        </div>
      )}

      {showLoginModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
          <div className="bg-white w-full max-w-md rounded-[2rem] p-8 shadow-2xl text-right">
            <h2 className="text-2xl font-black mb-6">כניסת מנהל</h2>
            <input 
              type="password" 
              value={loginPassword} 
              onChange={(e) => setLoginPassword(e.target.value)}
              placeholder="סיסמה" 
              className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl mb-6 text-right" 
            />
            <div className="flex gap-3">
              <button onClick={handleLogin} className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black cursor-pointer">כניסה</button>
              <button onClick={() => setShowLoginModal(false)} className="flex-1 bg-slate-100 py-4 rounded-2xl font-black cursor-pointer">ביטול</button>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .animate-slide-in-right { animation: slide-in-right 0.4s cubic-bezier(0.16, 1, 0.3, 1); } 
        @keyframes slide-in-right { from { transform: translateX(100%); } to { transform: translateX(0); } }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      ` }} />
    </div>
  );
}
