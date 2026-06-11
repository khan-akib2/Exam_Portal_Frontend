"use client";

import { useEffect, useState } from "react";
import { 
  Plus, Search, Filter, Tag, CheckCircle2, ChevronRight, 
  MoreHorizontal, AlignLeft, Layers, Calendar, Trash2, 
  RefreshCw, Check, UploadCloud, FileText, Settings, X,
  AlignJustify, Bold, Italic, Type, Image as ImageIcon
} from "lucide-react";
import { useDialog } from "@/components/DialogProvider";
import { motion } from "framer-motion";
import Link from "next/link";

export default function QuestionReviewWorkspace() {
  const { showAlert, showConfirm } = useDialog();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Navigation State
  const [searchQuery, setSearchQuery] = useState("");
  const [activeQuestion, setActiveQuestion] = useState(null);
  
  // Editor State
  const [editorData, setEditorData] = useState({
    question: "",
    options: ["", "", "", ""],
    correctAnswer: 0,
    explanation: "",
    subject: "General Medicine",
    chapter: "",
    difficulty: "Medium",
    tags: []
  });
  const [isSaving, setIsSaving] = useState(false);
  const [tagInput, setTagInput] = useState("");

  const fetchQuestions = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/questions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setQuestions(data.questions || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  // Update editor data when active question changes
  useEffect(() => {
    if (activeQuestion) {
      setEditorData({
        question: activeQuestion.question || "",
        options: [...(activeQuestion.options || ["", "", "", ""])],
        correctAnswer: activeQuestion.correctAnswer || 0,
        explanation: activeQuestion.explanation || "",
        subject: activeQuestion.subject || "General Medicine",
        chapter: activeQuestion.chapter || "",
        difficulty: activeQuestion.difficulty || "Medium",
        tags: activeQuestion.tags || []
      });
    }
  }, [activeQuestion]);

  const handleNewQuestion = () => {
    setActiveQuestion({ _id: "new" });
    setEditorData({
      question: "",
      options: ["", "", "", ""],
      correctAnswer: 0,
      explanation: "",
      subject: "General Medicine",
      chapter: "",
      difficulty: "Medium",
      tags: []
    });
  };

  const handleSave = async () => {
    if (!editorData.question.trim()) {
      showAlert("Question text is required.", "Validation Error");
      return;
    }
    
    setIsSaving(true);
    try {
      const token = localStorage.getItem("token");
      const url = activeQuestion && activeQuestion._id !== "new" 
        ? `/api/questions/${activeQuestion._id}` 
        : `/api/questions`;
      const method = activeQuestion && activeQuestion._id !== "new" ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editorData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save question.");

      showAlert("Question saved successfully.", "Saved");
      await fetchQuestions();
      if (activeQuestion._id === "new" && data.question) {
        setActiveQuestion(data.question);
      } else {
        const updated = questions.find(q => q._id === activeQuestion._id);
        if(updated) setActiveQuestion(updated);
      }
    } catch (err) {
      showAlert(err.message, "Save Error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!activeQuestion || activeQuestion._id === "new") {
      setActiveQuestion(null);
      return;
    }
    
    const confirmed = await showConfirm("Are you sure you want to delete this question? This action cannot be undone.", "Delete Question");
    if (!confirmed) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/questions/${activeQuestion._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setActiveQuestion(null);
        fetchQuestions();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const addTag = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!editorData.tags.includes(tagInput.trim())) {
        setEditorData(prev => ({
          ...prev,
          tags: [...prev.tags, tagInput.trim()]
        }));
      }
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove) => {
    setEditorData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tagToRemove)
    }));
  };

  const filteredQuestions = questions.filter(q => 
    q.question?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.subject?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-[calc(100vh-64px)] -mt-6 md:-mt-8 -mb-6 md:-mb-8 -mx-6 md:-mx-8 flex flex-col bg-[#FAFAFA] dark:bg-[var(--background)]"
    >
      {/* Top Header */}
      <div className="h-14 border-b border-slate-200 dark:border-white/5 bg-white dark:bg-[var(--card)] flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="h-4 w-4 text-[#1157CF]" /> Question Workspace
          </h1>
          <span className="text-xs text-slate-400 font-medium">|</span>
          <span className="text-xs font-bold text-slate-500 dark:text-slate-450 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-full">{questions.length} Items</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/questions/upload" className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 px-3 py-1.5 rounded transition-colors flex items-center gap-1.5">
            <UploadCloud className="h-3.5 w-3.5" /> PDF Pipeline
          </Link>
          <button 
            onClick={handleNewQuestion}
            className="text-xs font-bold text-white bg-[#1157CF] hover:bg-[#0D46A8] px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" /> New Question
          </button>
        </div>
      </div>

      {/* 3-Panel Workspace */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Panel: Navigator */}
        <div className="w-80 border-r border-slate-200 dark:border-white/5 bg-white dark:bg-[var(--card)] flex flex-col shrink-0 z-10 shadow-[2px_0_10px_rgba(0,0,0,0.02)] dark:shadow-none">
          <div className="p-3 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-[var(--background)] border border-slate-200 dark:border-white/5 rounded text-xs font-medium focus:outline-none focus:border-[#1157CF] focus:ring-1 focus:ring-[#1157CF] text-slate-900 dark:text-white"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto hide-scrollbar">
            {loading ? (
              <div className="flex justify-center p-8"><RefreshCw className="h-4 w-4 animate-spin text-slate-400" /></div>
            ) : filteredQuestions.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 font-medium">No questions found.</div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-white/5">
                {activeQuestion && activeQuestion._id === "new" && (
                  <div className="p-3 bg-[#1157CF]/5 dark:bg-blue-500/10 border-l-2 border-[#1157CF] dark:border-blue-500 cursor-pointer">
                    <div className="text-xs font-bold text-[#1157CF] dark:text-blue-400 line-clamp-2">New Draft Question...</div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-[#1157CF]/60">Editing</span>
                    </div>
                  </div>
                )}
                {filteredQuestions.map(q => (
                  <div 
                    key={q._id} 
                    onClick={() => setActiveQuestion(q)}
                    className={`p-4 cursor-pointer transition-all border-l-4 ${
                      activeQuestion?._id === q._id 
                        ? 'bg-gradient-to-r from-blue-50 to-white dark:from-blue-950/20 dark:to-transparent border-blue-600 dark:border-blue-500 shadow-sm relative z-10' 
                        : 'border-transparent hover:bg-slate-50/80 dark:hover:bg-white/5'
                    }`}
                  >
                    <div className={`text-xs font-bold line-clamp-2 leading-relaxed ${activeQuestion?._id === q._id ? 'text-[#1157CF] dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'}`}>
                      {q.question || "Empty Question"}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-450 bg-slate-100 dark:bg-white/5 px-1.5 py-0.5 rounded">
                        {q.subject || 'General'}
                      </span>
                      <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1">
                        <CheckCircle2 className="h-2.5 w-2.5 text-[#0F7B3E]" /> {q.difficulty}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Center Panel: Editor */}
        <div className="flex-1 flex flex-col bg-white dark:bg-[var(--card)] overflow-hidden relative">
          {activeQuestion ? (
            <>
              {/* Editor Toolbar */}
              <div className="h-12 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5 flex items-center gap-1 px-4 shrink-0">
                <button className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 rounded"><Bold className="h-4 w-4" /></button>
                <button className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 rounded"><Italic className="h-4 w-4" /></button>
                <div className="w-px h-4 bg-slate-300 dark:bg-white/10 mx-1"></div>
                <button className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 rounded"><AlignLeft className="h-4 w-4" /></button>
                <button className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 rounded"><AlignJustify className="h-4 w-4" /></button>
                <div className="w-px h-4 bg-slate-300 dark:bg-white/10 mx-1"></div>
                <button className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 rounded"><ImageIcon className="h-4 w-4" /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto w-full hide-scrollbar">
                <div className="space-y-8">
                  {/* Question Stem */}
                  <div>
                    <textarea 
                      value={editorData.question}
                      onChange={(e) => setEditorData({...editorData, question: e.target.value})}
                      placeholder="Type your question stem here..."
                      className="w-full text-xl font-bold text-slate-900 dark:text-white border-none outline-none resize-none bg-transparent placeholder:text-slate-300 dark:placeholder:text-slate-700"
                      rows={4}
                    />
                  </div>

                  {/* Options */}
                  <div className="space-y-3">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">Options</h3>
                    {editorData.options.map((opt, idx) => (
                      <div 
                        key={idx} 
                        className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all focus-within:ring-4 focus-within:ring-blue-500/10 focus-within:border-blue-400 dark:focus-within:border-blue-500 group ${
                          editorData.correctAnswer === idx 
                            ? 'border-emerald-500 dark:border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/10 shadow-sm' 
                            : 'border-slate-200 dark:border-white/5 bg-white dark:bg-[var(--background)] hover:border-slate-300 dark:hover:border-white/10'
                        }`}
                      >
                        <button 
                          onClick={() => setEditorData({...editorData, correctAnswer: idx})}
                          className={`flex items-center justify-center h-6 w-6 rounded-full border-2 shrink-0 transition-all ${
                            editorData.correctAnswer === idx 
                              ? 'border-emerald-500 dark:border-emerald-500 bg-emerald-500 text-white shadow-md shadow-emerald-500/30' 
                              : 'border-slate-300 dark:border-white/20 text-slate-400 dark:text-slate-500 hover:border-slate-400 dark:hover:border-slate-300 group-focus-within:border-blue-400 dark:group-focus-within:border-blue-500'
                          }`}
                        >
                          {editorData.correctAnswer === idx ? <Check className="h-3.5 w-3.5" /> : <span className="text-[10px] font-bold">{String.fromCharCode(65 + idx)}</span>}
                        </button>
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const newOpts = [...editorData.options];
                            newOpts[idx] = e.target.value;
                            setEditorData({...editorData, options: newOpts});
                          }}
                          placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                          className={`w-full text-sm font-medium outline-none bg-transparent ${editorData.correctAnswer === idx ? 'text-[#0F7B3E] dark:text-emerald-400' : 'text-slate-700 dark:text-slate-200'}`}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Explanation */}
                  <div>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">Explanation (Optional)</h3>
                    <textarea 
                      value={editorData.explanation}
                      onChange={(e) => setEditorData({...editorData, explanation: e.target.value})}
                      placeholder="Explain the rationale behind the correct answer..."
                      className="w-full text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-[var(--background)] border border-slate-200 dark:border-white/5 rounded-xl p-4 outline-none focus:border-[#1157CF] dark:focus:border-blue-500 focus:bg-white dark:focus:bg-[var(--background)] transition-all min-h-[120px]"
                    />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
              <div className="h-16 w-16 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center border border-slate-100 dark:border-white/5 mb-4 shadow-sm">
                <FileText className="h-6 w-6 text-slate-300 dark:text-slate-600" />
              </div>
              <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">No Question Selected</p>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 text-center max-w-xs">
                Select a question from the navigator on the left, or create a new one to start editing.
              </p>
              <button 
                onClick={handleNewQuestion}
                className="mt-6 text-xs font-bold text-[#1157CF] bg-[#1157CF]/10 hover:bg-[#1157CF]/20 dark:bg-[#1157CF]/10 dark:hover:bg-[#1157CF]/20 px-4 py-2 rounded-lg transition-colors"
              >
                Create New Question
              </button>
            </div>
          )}
        </div>

        {/* Right Panel: Metadata & Properties */}
        {activeQuestion && (
          <div className="w-72 border-l border-slate-200 dark:border-white/5 bg-[#FAFAFA] dark:bg-[var(--card)] flex flex-col shrink-0 z-10 shadow-[-2px_0_10px_rgba(0,0,0,0.02)] dark:shadow-none">
            <div className="h-12 border-b border-slate-200 dark:border-white/5 flex items-center justify-between px-4 bg-white dark:bg-[var(--card)] shrink-0">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Properties</span>
              <div className="flex gap-1">
                <button onClick={handleDelete} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded transition-colors" title="Delete">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              
              {/* Categorization */}
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5 block">Subject Mapping</label>
                  <select 
                    value={editorData.subject}
                    onChange={(e) => setEditorData({...editorData, subject: e.target.value})}
                    className="w-full bg-white dark:bg-[var(--background)] border border-slate-200 dark:border-white/5 rounded text-xs font-bold text-slate-700 dark:text-slate-200 px-3 py-2 outline-none focus:border-[#1157CF] dark:focus:border-blue-500 appearance-none"
                  >
                    <option value="General Medicine">General Medicine</option>
                    <option value="Surgery">Surgery</option>
                    <option value="Pediatrics">Pediatrics</option>
                    <option value="OBGYN">OBGYN</option>
                    <option value="Anatomy">Anatomy</option>
                    <option value="Physiology">Physiology</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5 block">Chapter / Topic</label>
                  <input 
                    type="text"
                    value={editorData.chapter}
                    onChange={(e) => setEditorData({...editorData, chapter: e.target.value})}
                    placeholder="e.g. Cardiovascular System"
                    className="w-full bg-white dark:bg-[var(--background)] border border-slate-200 dark:border-white/5 rounded text-xs font-medium text-slate-700 dark:text-slate-200 px-3 py-2 outline-none focus:border-[#1157CF] dark:focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5 block">Difficulty Level</label>
                  <div className="flex bg-slate-100 dark:bg-white/5 p-0.5 rounded-lg border border-slate-200 dark:border-white/5">
                    {["Easy", "Medium", "Hard"].map(level => (
                      <button
                        key={level}
                        onClick={() => setEditorData({...editorData, difficulty: level})}
                        className={`flex-1 text-[10px] font-bold py-1.5 rounded-md transition-all ${
                          editorData.difficulty === level 
                            ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm' 
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1">
                  <Tag className="h-3 w-3" /> Tags
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {editorData.tags.map(tag => (
                    <span key={tag} className="inline-flex items-center gap-1 bg-[#1157CF]/10 dark:bg-blue-500/10 text-[#1157CF] dark:text-blue-400 px-2 py-0.5 rounded text-[10px] font-bold">
                      {tag}
                      <button onClick={() => removeTag(tag)} className="hover:text-[#0D46A8]"><X className="h-2.5 w-2.5" /></button>
                    </span>
                  ))}
                </div>
                <input 
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={addTag}
                  placeholder="Add tag and press Enter..."
                  className="w-full bg-white dark:bg-[var(--background)] border border-slate-200 dark:border-white/5 rounded text-xs font-medium text-slate-700 dark:text-slate-200 px-3 py-2 outline-none focus:border-[#1157CF] dark:focus:border-blue-500"
                />
              </div>

              {/* System Info */}
              {activeQuestion._id !== "new" && (
                <div className="pt-4 border-t border-slate-200 dark:border-white/5">
                  <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500">ID: {activeQuestion._id}</p>
                  <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500">Created: {new Date(activeQuestion.createdAt || Date.now()).toLocaleDateString()}</p>
                </div>
              )}

            </div>
            
            {/* Action Bar */}
            <div className="p-4 bg-white dark:bg-[var(--card)] border-t border-slate-200 dark:border-white/5 shrink-0">
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="w-full bg-[#1157CF] hover:bg-[#0D46A8] text-white text-xs font-bold py-2.5 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSaving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                {activeQuestion._id === "new" ? "Publish to Pool" : "Save Changes"}
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
