"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { 
  FileQuestion, FileUp, Sparkles, Plus, Image as ImageIcon, 
  Trash2, Save, Check, RefreshCw, AlertCircle, Edit, CheckSquare, Square,
  Settings, Filter, Tag, FolderOpen, CheckCircle2, ChevronRight, HelpCircle, Layers, Calendar, LayoutGrid
} from "lucide-react";
import { useDialog } from "@/components/DialogProvider";

export default function QuestionsManager() {
  const { showAlert, showConfirm } = useDialog();
  const [activeTab, setActiveTab] = useState("bank"); // "bank", "extract", "review", "analytics"
  const [questions, setQuestions] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [pdfNames, setPdfNames] = useState([]);
  const [selectedPdfFilter, setSelectedPdfFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState([]);
  
  // Manual Editor State
  const [selectedQuestion, setSelectedQuestion] = useState(null); // null means "create new"
  const [editorData, setEditorData] = useState({
    question: "",
    options: ["", "", "", ""],
    correctAnswer: 0,
    explanation: "",
    subject: "General Medicine",
    chapter: "",
    difficulty: "Medium",
    imageBase64: null,
    image: null,
    tags: []
  });

  // PDF Extraction State
  const [pdfFile, setPdfFile] = useState(null);
  const [answersFile, setAnswersFile] = useState(null);
  const [extracting, setExtracting] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [analytics, setAnalytics] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  
  // Custom Premium Extractor Timeline States
  const [dragOver, setDragOver] = useState(false);
  const [parsingStep, setParsingStep] = useState(0); // 0 = idle, 1 = Upload, 2 = Analyze, 3 = Detect Qs, 4 = Detect Ans, 5 = Gemini Fallback, 6 = Ready
  
  // Extraction Wizard State
  const [showWizard, setShowWizard] = useState(false);
  const [wizardPdfName, setWizardPdfName] = useState("");
  const [wizardSamples, setWizardSamples] = useState([]);
  const [wizardAnswers, setWizardAnswers] = useState({}); // { draftId: chosenIndex }
  const [wizardTemplateName, setWizardTemplateName] = useState("");
  const [wizardSubmitting, setWizardSubmitting] = useState(false);

  // Review Queue / Draft Selection & Bulk Operations State
  const [selectedDraftIds, setSelectedDraftIds] = useState([]);
  const [bulkSubject, setBulkSubject] = useState("");
  const [bulkDifficulty, setBulkDifficulty] = useState("Medium");
  const [bulkTags, setBulkTags] = useState("");
  const [showBulkPanel, setShowBulkPanel] = useState(false);
  const [focusedDraftIdx, setFocusedDraftIdx] = useState(0);

  // Inline Draft Editor State
  const [editingDraftId, setEditingDraftId] = useState(null);
  const [editingDraftData, setEditingDraftData] = useState(null);

  // File input refs
  const fileInputRef = useRef(null);
  const answersFileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const draftImageInputRef = useRef(null);

  // Drag and drop event handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file && file.type === "application/pdf") {
      setPdfFile(file);
    }
  };

  const fetchQuestions = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/questions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setQuestions(data.questions || []);
        setSelectedQuestionIds([]);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchDrafts = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      let url = "/api/questions/drafts";
      const params = [];
      if (selectedPdfFilter) params.push(`pdfName=${encodeURIComponent(selectedPdfFilter)}`);
      if (params.length > 0) url += "?" + params.join("&");

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setDrafts(data.drafts || []);
        setPdfNames(data.pdfNames || []);
      }
    } catch (err) {
      console.error(err);
    }
  }, [selectedPdfFilter]);

  const fetchTemplates = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/questions/templates", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setTemplates(data.templates || []);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchAnalytics = useCallback(async () => {
    setLoadingAnalytics(true);
    try {
      const token = localStorage.getItem("token");
      let url = "/api/questions/drafts/analytics";
      const params = [];
      if (selectedPdfFilter) params.push(`pdfName=${encodeURIComponent(selectedPdfFilter)}`);
      if (params.length > 0) url += "?" + params.join("&");

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setAnalytics(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAnalytics(false);
    }
  }, [selectedPdfFilter]);

  const initData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchQuestions(), fetchDrafts(), fetchTemplates(), fetchAnalytics()]);
    setLoading(false);
  }, [fetchQuestions, fetchDrafts, fetchTemplates, fetchAnalytics]);

  useEffect(() => {
    setTimeout(() => {
      initData();
    }, 0);
  }, [initData]);

  // Handle Manual Question Operations
  const handleSelectQuestionForEdit = (q) => {
    setSelectedQuestion(q);
    setEditorData({
      question: q.question,
      options: [...q.options],
      correctAnswer: q.correctAnswer,
      explanation: q.explanation || "",
      subject: q.subject || "General Medicine",
      chapter: q.chapter || "",
      difficulty: q.difficulty || "Medium",
      imageBase64: null,
      image: q.image,
      tags: q.tags || []
    });
  };

  const handleNewQuestionClick = () => {
    setSelectedQuestion(null);
    setEditorData({
      question: "",
      options: ["", "", "", ""],
      correctAnswer: 0,
      explanation: "",
      subject: "General Medicine",
      chapter: "",
      difficulty: "Medium",
      imageBase64: null,
      image: null,
      tags: []
    });
  };

  const handleOptionChange = (idx, value) => {
    const newOptions = [...editorData.options];
    newOptions[idx] = value;
    setEditorData({ ...editorData, options: newOptions });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setEditorData((prev) => ({
        ...prev,
        imageBase64: reader.result,
        image: reader.result,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveQuestion = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const url = selectedQuestion 
        ? `/api/questions/${selectedQuestion._id}` 
        : `/api/questions`;
      
      const method = selectedQuestion ? "PATCH" : "POST";

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

      showAlert(selectedQuestion ? "Question updated successfully." : "Question added successfully.", "Success");
      handleNewQuestionClick();
      fetchQuestions();
    } catch (err) {
      showAlert(err.message, "Error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuestion = async (id) => {
    const confirmed = await showConfirm("Are you sure you want to delete this question?", "Delete Question?");
    if (!confirmed) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/questions/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        handleNewQuestionClick();
        fetchQuestions();
        showAlert("Question deleted successfully.", "Success");
      } else {
        let errMsg = "Failed to delete question.";
        try {
          const data = await res.json();
          errMsg = data.error || errMsg;
        } catch (_) {}
        showAlert(`${res.status} ${res.statusText}: ${errMsg}`, "Error");
      }
    } catch (err) {
      console.error(err);
      showAlert(`An error occurred: ${err.message}`, "Error");
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionSelectToggle = (id) => {
    setSelectedQuestionIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllQuestions = () => {
    if (selectedQuestionIds.length === questions.length) {
      setSelectedQuestionIds([]);
    } else {
      setSelectedQuestionIds(questions.map((q) => q._id));
    }
  };

  const handleBulkDeleteQuestions = async () => {
    const confirmed = await showConfirm(
      `Are you sure you want to delete ${selectedQuestionIds.length} questions from the pool?`,
      "Bulk Delete Questions"
    );
    if (!confirmed) return;

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/questions", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ questionIds: selectedQuestionIds }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Bulk delete failed.");

      showAlert(`Successfully deleted ${data.count} questions.`, "Success");
      setSelectedQuestionIds([]);
      fetchQuestions();
    } catch (err) {
      showAlert(err.message, "Error");
    } finally {
      setLoading(false);
    }
  };

  // PDF Extraction Submission logic
  const handlePdfSubmit = async (e) => {
    e.preventDefault();
    if (!pdfFile) return;

    setExtracting(true);
    setParsingStep(1); // 1 = Uploading

    // Start simulated progress steps
    const progressTimer = setInterval(() => {
      setParsingStep((prev) => {
        if (prev < 5) return prev + 1;
        return prev;
      });
    }, 1200);

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("file", pdfFile);
      if (answersFile) {
        formData.append("answersFile", answersFile);
      }
      if (selectedTemplateId) {
        formData.append("templateId", selectedTemplateId);
      }

      const res = await fetch("/api/questions/upload-pdf", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to process PDF.");

      setParsingStep(6); // 6 = Finalized
      clearInterval(progressTimer);

      // Check if Extraction Wizard is required
      if (data.requireWizard) {
        setWizardPdfName(data.pdfName);
        setWizardSamples(data.samples || []);
        setWizardAnswers({});
        setWizardTemplateName(`Template for ${data.pdfName.split('.')[0]}`);
        setShowWizard(true);
      } else {
        showAlert(`Successfully parsed "${data.pdfName}". Extracted ${data.draftsCount} draft questions. ${data.autoApprovedCount} questions were automatically approved!`, "Extraction Success");
        setSelectedPdfFilter(data.pdfName);
        setActiveTab("review");
        await fetchDrafts();
      }
    } catch (err) {
      showAlert(err.message, "PDF Extraction Error");
    } finally {
      setExtracting(false);
      setParsingStep(0);
      clearInterval(progressTimer);
      setPdfFile(null);
      setAnswersFile(null);
    }
  };

  // Wizard learning handler
  const handleWizardSubmit = async () => {
    // Validate
    const answeredCount = Object.keys(wizardAnswers).length;
    if (answeredCount < wizardSamples.length) {
      showAlert("Please select correct answers for all sample questions.", "Warning");
      return;
    }
    if (!wizardTemplateName.trim()) {
      showAlert("Please specify a template name.", "Warning");
      return;
    }

    setWizardSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const selections = Object.entries(wizardAnswers).map(([id, idx]) => ({
        draftId: id,
        chosenIndex: idx
      }));

      const res = await fetch("/api/questions/drafts/learn-pattern", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          pdfName: wizardPdfName,
          selections,
          templateName: wizardTemplateName
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Wizard failed to learn template.");

      showAlert(`Wizard completed successfully! Learned answer-marking pattern: "${data.pattern}". Saved template "${data.template.templateName}". Auto-approved ${data.autoApprovedCount} remaining questions!`, "Wizard Learned");
      setShowWizard(false);
      setSelectedPdfFilter(wizardPdfName);
      setActiveTab("review");
      await Promise.all([fetchDrafts(), fetchTemplates()]);
    } catch (err) {
      showAlert(err.message, "Wizard Error");
    } finally {
      setWizardSubmitting(false);
    }
  };

  // Draft Review & Editing Operations
  const handleDraftSelectToggle = useCallback((id) => {
    setSelectedDraftIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }, []);

  const handleSelectAllDrafts = () => {
    if (selectedDraftIds.length === drafts.length) {
      setSelectedDraftIds([]);
    } else {
      setSelectedDraftIds(drafts.map((d) => d._id));
    }
  };

  // Single Draft Actions
  const handleStartEditDraft = useCallback((draft) => {
    setEditingDraftId(draft._id);
    setEditingDraftData({
      question: draft.question,
      options: [...draft.options],
      correctAnswer: draft.correctAnswer,
      explanation: draft.explanation || "",
      subject: draft.subject || "General Medicine",
      chapter: draft.chapter || "",
      difficulty: draft.difficulty || "Medium",
      tags: draft.tags ? draft.tags.join(", ") : "",
      image: draft.image,
      imageBase64: null
    });
  }, []);

  const handleDraftFieldChange = (field, value) => {
    setEditingDraftData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDraftOptionChange = (idx, value) => {
    const opts = [...editingDraftData.options];
    opts[idx] = value;
    setEditingDraftData(prev => ({
      ...prev,
      options: opts
    }));
  };

  const handleDraftImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setEditingDraftData((prev) => ({
        ...prev,
        imageBase64: reader.result,
        image: reader.result,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveSingleDraft = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const payload = {
        ...editingDraftData,
        tags: editingDraftData.tags ? editingDraftData.tags.split(",").map(t => t.trim()).filter(Boolean) : []
      };

      const res = await fetch(`/api/questions/drafts/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update draft.");

      showAlert("Draft question updated.", "Success");
      setEditingDraftId(null);
      await fetchDrafts();
    } catch (err) {
      showAlert(err.message, "Error");
    }
  };

  const handleDeleteSingleDraft = useCallback(async (id) => {
    const confirmed = await showConfirm("Delete this draft question from the Review Queue?", "Delete Draft");
    if (!confirmed) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/questions/drafts/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        await fetchDrafts();
        setSelectedDraftIds(prev => prev.filter(item => item !== id));
        showAlert("Draft question deleted.", "Success");
      } else {
        let errMsg = "Failed to delete draft question.";
        try {
          const data = await res.json();
          errMsg = data.error || errMsg;
        } catch (_) {}
        throw new Error(`${res.status} ${res.statusText}: ${errMsg}`);
      }
    } catch (err) {
      showAlert(err.message, "Error");
    }
  }, [fetchDrafts, showConfirm, showAlert]);

  const handlePublishSingleDraft = useCallback(async (id) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/questions/drafts/${id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to publish question.");

      showAlert("Question published to database pool!", "Published");
      await Promise.all([fetchDrafts(), fetchQuestions()]);
      setSelectedDraftIds(prev => prev.filter(item => item !== id));
    } catch (err) {
      showAlert(err.message, "Error");
    }
  }, [fetchDrafts, fetchQuestions, showAlert]);

  // Bulk Operations
  const handleBulkPublish = async () => {
    const confirmed = await showConfirm(`Publish all ${selectedDraftIds.length} selected questions to the database pool?`, "Bulk Publish");
    if (!confirmed) return;

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/questions/drafts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          action: "publish",
          draftIds: selectedDraftIds
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Bulk publish failed.");

      showAlert(`Successfully published ${data.count} questions.`, "Success");
      setSelectedDraftIds([]);
      await Promise.all([fetchDrafts(), fetchQuestions()]);
    } catch (err) {
      showAlert(err.message, "Error");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    const confirmed = await showConfirm(`Are you sure you want to delete ${selectedDraftIds.length} draft questions?`, "Bulk Delete");
    if (!confirmed) return;

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/questions/drafts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          action: "delete",
          draftIds: selectedDraftIds
        })
      });

      if (res.ok) {
        const data = await res.json();
        showAlert(`Successfully deleted ${data.count} drafts.`, "Success");
        setSelectedDraftIds([]);
        await fetchDrafts();
      } else {
        let errMsg = "Bulk delete failed.";
        try {
          const data = await res.json();
          errMsg = data.error || errMsg;
        } catch (_) {}
        throw new Error(`${res.status} ${res.statusText}: ${errMsg}`);
      }
    } catch (err) {
      showAlert(err.message, "Error");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkEditSubmit = async (e) => {
    e.preventDefault();
    if (!bulkSubject && !bulkTags) {
      showAlert("Please enter a Subject or Tags to apply.", "Warning");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const fields = {};
      if (bulkSubject) fields.subject = bulkSubject;
      if (bulkDifficulty) fields.difficulty = bulkDifficulty;
      if (bulkTags) {
        fields.tags = bulkTags.split(",").map(t => t.trim()).filter(Boolean);
      }

      const res = await fetch("/api/questions/drafts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          action: "edit",
          draftIds: selectedDraftIds,
          fields
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Bulk edit failed.");

      showAlert(`Successfully updated ${data.count} drafts.`, "Success");
      setBulkSubject("");
      setBulkTags("");
      setSelectedDraftIds([]);
      setShowBulkPanel(false);
      await fetchDrafts();
    } catch (err) {
      showAlert(err.message, "Error");
    } finally {
      setLoading(false);
    }
  };

  // Keyboard Shortcuts for Review Queue
  useEffect(() => {
    if (activeTab !== "review" || drafts.length === 0) return;

    const handleKeyDown = (e) => {
      // Disable shortcuts when typing in inputs or textareas
      if (
        document.activeElement.tagName === "INPUT" ||
        document.activeElement.tagName === "TEXTAREA"
      ) {
        return;
      }

      switch (e.code) {
        case "ArrowDown":
        case "KeyJ":
          e.preventDefault();
          setFocusedDraftIdx((prev) => Math.min(prev + 1, drafts.length - 1));
          break;
        case "ArrowUp":
        case "KeyK":
          e.preventDefault();
          setFocusedDraftIdx((prev) => Math.max(prev - 1, 0));
          break;
        case "Space":
          e.preventDefault();
          if (drafts[focusedDraftIdx]) {
            handleDraftSelectToggle(drafts[focusedDraftIdx]._id);
          }
          break;
        case "KeyE":
          e.preventDefault();
          if (drafts[focusedDraftIdx]) {
            handleStartEditDraft(drafts[focusedDraftIdx]);
          }
          break;
        case "KeyP":
          e.preventDefault();
          if (drafts[focusedDraftIdx]) {
            handlePublishSingleDraft(drafts[focusedDraftIdx]._id);
          }
          break;
        case "KeyD":
          e.preventDefault();
          if (drafts[focusedDraftIdx]) {
            handleDeleteSingleDraft(drafts[focusedDraftIdx]._id);
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    activeTab, drafts, focusedDraftIdx, handleDraftSelectToggle, 
    handleStartEditDraft, handlePublishSingleDraft, handleDeleteSingleDraft
  ]);

  return (
    <div className="space-y-6 animate-fade-in text-left relative min-h-[80vh]">
      {/* Header */}
      <div className="border-b border-slate-150 pb-4">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
          <Layers className="h-5 w-5 text-[#2765A4]" />
          Medical MCQ Repository
        </h1>
        <p className="text-xs text-slate-500 mt-1">Ingest PDF booklets via hybrid parsing templates, audit OCR drafts, or perform catalog updates.</p>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-5">
        <button
          onClick={() => setActiveTab("bank")}
          className={`pb-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === "bank"
              ? "border-[#2E76C0] text-[#1F548C] font-extrabold"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <LayoutGrid className="h-4 w-4" />
          <span>Question Pool ({questions.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("extract")}
          className={`pb-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === "extract"
              ? "border-[#2E76C0] text-[#1F548C] font-extrabold"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <FolderOpen className="h-4 w-4 text-[#F59E0B]" />
          <span>PDF Booklet Extractor</span>
        </button>
        <button
          onClick={() => setActiveTab("review")}
          className={`pb-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === "review"
              ? "border-[#2E76C0] text-[#1F548C] font-extrabold"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <Settings className="h-4 w-4 text-indigo-500" />
          <span>Staging Review Queue ({drafts.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("analytics")}
          className={`pb-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === "analytics"
              ? "border-[#2E76C0] text-[#1F548C] font-extrabold"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <Sparkles className="h-4 w-4 text-violet-500 animate-pulse" />
          <span>Run Analytics</span>
        </button>
      </div>

      {/* TAB 1: QUESTION BANK */}
      {activeTab === "bank" && (
        <div className="grid gap-6 lg:grid-cols-5 items-start">
          {/* Question List Column */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                  MCQs Pool ({questions.length})
                </span>
                <div className="flex items-center gap-3">
                  {selectedQuestionIds.length > 0 && (
                    <button
                      onClick={handleBulkDeleteQuestions}
                      className="inline-flex items-center gap-1 text-xs font-bold text-red-650 hover:text-red-800 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Delete ({selectedQuestionIds.length})</span>
                    </button>
                  )}
                  <button
                    onClick={handleNewQuestionClick}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#2765A4] hover:text-teal-850 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>New MCQ</span>
                  </button>
                </div>
              </div>
              
              {questions.length > 0 && (
                <div className="flex items-center gap-2 px-1 text-[10px] text-slate-500 font-bold">
                  <button
                    type="button"
                    onClick={handleSelectAllQuestions}
                    className="inline-flex items-center gap-1 hover:text-slate-800 cursor-pointer"
                  >
                    {selectedQuestionIds.length === questions.length ? (
                      <CheckSquare className="h-3.5 w-3.5 text-[#2E76C0]" />
                    ) : (
                      <Square className="h-3.5 w-3.5" />
                    )}
                    <span>{selectedQuestionIds.length === questions.length ? "Deselect All" : "Select All"}</span>
                  </button>
                </div>
              )}
            </div>

            <div className="premium-card max-h-[60vh] overflow-y-auto divide-y divide-slate-100 p-2 bg-white border border-slate-200">
              {questions.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs italic">
                  No questions in pool yet. Ingest booklet PDFs or add a manual question.
                </div>
              ) : (
                questions.map((q) => {
                  const isSelected = selectedQuestionIds.includes(q._id);
                  return (
                    <div
                      key={q._id}
                      className={`p-3 rounded-xl hover:bg-slate-50/50 transition-colors flex items-start gap-2.5 text-left border border-transparent ${
                        selectedQuestion?._id === q._id ? "bg-teal-50/35 border-teal-200/50 border-l-4 border-l-[#2E76C0]" : ""
                      }`}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuestionSelectToggle(q._id);
                        }}
                        className="mt-0.5 text-slate-400 hover:text-[#2E76C0] shrink-0 cursor-pointer"
                      >
                        {isSelected ? (
                          <CheckSquare className="h-4 w-4 text-[#2E76C0]" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </button>

                      <div
                        onClick={() => handleSelectQuestionForEdit(q)}
                        className="flex-1 cursor-pointer"
                      >
                        <p className="text-xs font-semibold text-slate-800 line-clamp-2 leading-relaxed">{q.question}</p>
                        <div className="flex items-center justify-between mt-2 text-[10px] text-slate-450 font-bold">
                          <span>Subject: <strong className="text-slate-700">{q.subject}</strong></span>
                          <span className="bg-slate-100 border border-slate-200 text-slate-600 px-2 py-0.5 rounded font-bold">{q.difficulty}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Question Editor Form Column */}
          <div className="lg:col-span-3">
            <div className="premium-card p-6 space-y-5 bg-white border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-150 pb-3">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <FileQuestion className="h-4.5 w-4.5 text-[#2E76C0]" />
                  {selectedQuestion ? "Edit MCQ Details" : "Create New MCQ"}
                </h3>
                {selectedQuestion && (
                  <button
                    onClick={() => handleDeleteQuestion(selectedQuestion._id)}
                    className="text-xs font-bold text-red-600 hover:text-red-800 flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Delete Question</span>
                  </button>
                )}
              </div>

              <form onSubmit={handleSaveQuestion} className="space-y-4 text-left">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1.5">Question Prompt</label>
                  <textarea
                    required
                    value={editorData.question}
                    onChange={(e) => setEditorData({ ...editorData, question: e.target.value })}
                    rows="3"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-[#00E5FF] focus:ring-2 focus:ring-[#00E5FF]/10 leading-relaxed"
                    placeholder="A patient presents with..."
                  />
                </div>

                {/* Question Image */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1.5">Diagnostic Attachment (Optional)</label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => imageInputRef.current.click()}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-205 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      <ImageIcon className="h-4 w-4" />
                      <span>{editorData.image ? "Replace Image" : "Attach Image"}</span>
                    </button>
                    <input
                      type="file"
                      ref={imageInputRef}
                      onChange={handleImageUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    {editorData.image && (
                      <div className="flex items-center gap-2.5">
                        <img src={editorData.image} alt="Preview" className="h-10 w-10 object-cover rounded-lg border border-slate-200" />
                        <button
                          type="button"
                          onClick={() => setEditorData({ ...editorData, image: null, imageBase64: null })}
                          className="text-2xs text-red-650 font-bold hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Options Inputs */}
                <div className="space-y-3">
                  <label className="block text-[10px] font-bold text-slate-700 uppercase">Choice Options & Answer Key</label>
                  {editorData.options.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2.5">
                      <span className="w-6 text-xs font-bold text-slate-400 font-mono text-right">{String.fromCharCode(65 + idx)})</span>
                      <input
                        type="text"
                        required
                        value={opt}
                        onChange={(e) => handleOptionChange(idx, e.target.value)}
                        className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-[#00E5FF] focus:ring-2 focus:ring-[#00E5FF]/10"
                        placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                      />
                      <input
                        type="radio"
                        name="correctAnswerIndex"
                        checked={editorData.correctAnswer === idx}
                        onChange={() => setEditorData({ ...editorData, correctAnswer: idx })}
                        className="h-4.5 w-4.5 text-[#2765A4] focus:ring-[#00E5FF] cursor-pointer"
                        title="Mark as correct answer"
                      />
                    </div>
                  ))}
                </div>

                {/* Explanation */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1.5">Clinical Rationales / Explanations</label>
                  <textarea
                    value={editorData.explanation}
                    onChange={(e) => setEditorData({ ...editorData, explanation: e.target.value })}
                    rows="2"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-[#00E5FF] focus:ring-2 focus:ring-[#00E5FF]/10 leading-relaxed"
                    placeholder="Provide pathophysiology details..."
                  />
                </div>

                {/* Subject, difficulty, tags */}
                <div className="grid gap-3.5 sm:grid-cols-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1.5">Subject</label>
                    <input
                      type="text"
                      required
                      value={editorData.subject}
                      onChange={(e) => setEditorData({ ...editorData, subject: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-[#00E5FF] focus:ring-2 focus:ring-[#00E5FF]/10"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1.5">Chapter / Topic</label>
                    <input
                      type="text"
                      value={editorData.chapter}
                      onChange={(e) => setEditorData({ ...editorData, chapter: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-[#00E5FF] focus:ring-2 focus:ring-[#00E5FF]/10"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1.5">Difficulty</label>
                    <select
                      value={editorData.difficulty}
                      onChange={(e) => setEditorData({ ...editorData, difficulty: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs bg-white outline-none focus:border-[#00E5FF] focus:ring-2 focus:ring-[#00E5FF]/10"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1.5">Tags (Comma-separated)</label>
                  <input
                    type="text"
                    value={editorData.tags ? editorData.tags.join(", ") : ""}
                    onChange={(e) => setEditorData({ ...editorData, tags: e.target.value.split(",").map(t => t.trim()).filter(Boolean) })}
                    placeholder="e.g. ECG, Cardiology"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-[#00E5FF] focus:ring-2 focus:ring-[#00E5FF]/10"
                  />
                </div>

                <div className="flex justify-end pt-3 border-t border-slate-100 gap-2">
                  {selectedQuestion && (
                    <button
                      type="button"
                      onClick={handleNewQuestionClick}
                      className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-650 hover:bg-slate-100 transition-all cursor-pointer"
                    >
                      Cancel / Add New
                    </button>
                  )}
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#2765A4] px-4.5 py-2 text-xs font-bold text-white hover:bg-[#1F548C] shadow-md shadow-[#2E76C0]/10 transition-all cursor-pointer active:scale-98"
                  >
                    <Save className="h-3.5 w-3.5" />
                    <span>Save Question</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PDF BOOKLETS EXTRACTOR */}
      {activeTab === "extract" && (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Uploader Card */}
            <div className="premium-card p-6 md:col-span-2 text-left bg-white border border-slate-200">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-4">Upload MCQ Booklet PDF</h3>
              
              <form onSubmit={handlePdfSubmit} className="space-y-4">
                <div
                  onClick={() => fileInputRef.current.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all flex flex-col items-center justify-center ${
                    dragOver 
                      ? "border-[#00E5FF] bg-teal-50/50 scale-[1.01] shadow-md shadow-[#00E5FF]/5" 
                      : pdfFile 
                      ? "border-teal-400 bg-teal-50/10" 
                      : "border-slate-300 bg-slate-50 hover:bg-slate-50/30 hover:border-teal-405"
                  }`}
                >
                  <FileUp className={`h-12 w-12 mb-3 transition-colors ${dragOver ? "text-[#2E76C0] animate-bounce" : "text-slate-400"}`} />
                  <span className="text-sm font-bold text-slate-805 block">
                    {pdfFile ? pdfFile.name : "Select or drag & drop MCQ booklet PDF"}
                  </span>
                  <span className="text-xs text-slate-450 mt-1.5 block max-w-sm leading-normal">
                    Drag the clinical mock exam PDF here. Supports standard text documents, checkmark highlighted PDFs, or OCR fallback files.
                  </span>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => setPdfFile(e.target.files[0])}
                    accept="application/pdf"
                    className="hidden"
                  />
                </div>

                {/* Optional Separate Answers PDF Upload */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-700 uppercase">Optional Separate Answers Key PDF</label>
                  <div
                    onClick={() => answersFileInputRef.current.click()}
                    className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center cursor-pointer hover:border-[#00E5FF] bg-slate-50 hover:bg-slate-50/20 transition-all flex flex-col items-center justify-center"
                  >
                    <FileUp className="h-6 w-6 text-slate-400 mb-1" />
                    <span className="text-xs font-semibold text-slate-650">
                      {answersFile ? answersFile.name : "Select Answers PDF (if available)"}
                    </span>
                    <input
                      type="file"
                      ref={answersFileInputRef}
                      onChange={(e) => setAnswersFile(e.target.files[0])}
                      accept="application/pdf"
                      className="hidden"
                    />
                  </div>
                  {answersFile && (
                    <button
                      type="button"
                      onClick={() => setAnswersFile(null)}
                      className="text-3xs font-bold text-red-500 hover:text-red-750 hover:underline block ml-auto cursor-pointer"
                    >
                      Clear Answers PDF
                    </button>
                  )}
                </div>

                {/* Optional Template Pre-selection */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1.5">Apply Extraction Template (Optional)</label>
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs bg-white outline-none focus:border-[#00E5FF]"
                  >
                    <option value="">Auto-Detect Answer Marking Styles</option>
                    {templates.map(t => (
                      <option key={t._id} value={t._id}>{t.templateName} ({t.answerPattern})</option>
                    ))}
                  </select>
                  <p className="text-4xs text-slate-400 mt-1.5 leading-normal">Leave empty to run auto-detection of styles or trigger the learning Wizard.</p>
                </div>

                <button
                  type="submit"
                  disabled={!pdfFile || extracting}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#2E76C0] py-3 text-sm font-bold text-white shadow-lg shadow-[#2E76C0]/10 hover:bg-[#1F548C] transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {extracting ? (
                    <>
                      <RefreshCw className="h-5 w-5 animate-spin" />
                      <span>Parsing coordinates & styles (Running hybrid OCR + AI fallback)...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5 text-amber-300" />
                      <span>Run Hybrid Local Extraction</span>
                    </>
                  )}
                </button>
              </form>

              {/* Real-time Step-by-Step progress timeline */}
              {parsingStep > 0 && (
                <div className="bg-slate-50 border border-slate-200/85 rounded-2xl p-6 mt-6 space-y-4 animate-slide-up">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-650 uppercase tracking-widest">Extraction Pipeline Steps</span>
                    <span className="text-3xs font-extrabold text-[#1F548C] uppercase bg-teal-50 border border-teal-100 px-2.5 py-0.5 rounded-full animate-pulse">
                      Processing Step {parsingStep} of 6
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#2E76C0] transition-all duration-500 rounded-full"
                      style={{ width: `${(parsingStep / 6) * 100}%` }}
                    />
                  </div>
                  {/* Horizontal step node tracker */}
                  <div className="flex items-start justify-between gap-1 pt-3">
                    {[
                      { step: 1, label: "Upload" },
                      { step: 2, label: "Layout" },
                      { step: 3, label: "Detect Qs" },
                      { step: 4, label: "Answers" },
                      { step: 5, label: "AI Fallback" },
                      { step: 6, label: "Staging" }
                    ].map((s) => {
                      const isActive = parsingStep === s.step;
                      const isCompleted = parsingStep > s.step;
                      return (
                        <div key={s.step} className="flex-1 flex flex-col items-center text-center">
                          <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center font-black text-2xs transition-all ${
                            isCompleted 
                              ? "bg-[#2E76C0] border-[#2E76C0] text-white" 
                              : isActive 
                              ? "bg-white border-[#00E5FF] text-[#2E76C0] shadow-md ring-4 ring-[#00E5FF]/10" 
                              : "bg-white border-slate-200 text-slate-400"
                          }`}>
                            {isCompleted ? "✓" : s.step}
                          </div>
                          <span className={`text-[8px] font-bold mt-2 uppercase tracking-wider block ${
                            isActive ? "text-[#2E76C0]" : isCompleted ? "text-slate-605" : "text-slate-400"
                          }`}>
                            {s.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Templates Panel */}
            <div className="premium-card p-6 text-left bg-white border border-slate-200">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-1.5 border-b pb-2">
                <Settings className="h-4.5 w-4.5 text-[#2765A4]" />
                Learned Templates ({templates.length})
              </h3>
              
              {templates.length === 0 ? (
                <div className="text-xs text-slate-400 py-4 italic">
                  No formats learned yet. Upload a PDF booklet with low marking confidence to train templates.
                </div>
              ) : (
                <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1">
                  {templates.map(t => (
                    <div key={t._id} className="border border-slate-150 rounded-xl p-3 bg-slate-50/40 space-y-1">
                      <div className="flex justify-between items-start">
                        <strong className="text-xs text-slate-800 leading-tight">{t.templateName}</strong>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="bg-teal-50 border border-teal-100 text-teal-850 text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                          {t.answerPattern.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: REVIEW QUEUE */}
      {activeTab === "review" && (
        <div className="space-y-4 animate-fade-in text-left">
          {/* Review Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/60">
            <div className="flex flex-wrap items-center gap-3">
              {/* PDF Filter */}
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-400" />
                <select
                  value={selectedPdfFilter}
                  onChange={(e) => setSelectedPdfFilter(e.target.value)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs bg-white focus:border-[#00E5FF] outline-none"
                >
                  <option value="">All Uploaded Drafts</option>
                  {pdfNames.map((name, i) => (
                    <option key={i} value={name}>{name}</option>
                  ))}
                </select>
              </div>

              {selectedPdfFilter && (
                <button
                  onClick={() => setSelectedPdfFilter("")}
                  className="text-xs font-semibold text-red-650 hover:underline cursor-pointer"
                >
                  Clear filter
                </button>
              )}
            </div>

            {/* Selection Info / Bulk Toggle */}
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={handleSelectAllDrafts}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 border border-slate-200 bg-white px-3 py-1.5 rounded-xl transition-all cursor-pointer"
              >
                {selectedDraftIds.length === drafts.length && drafts.length > 0 ? (
                  <>
                    <Square className="h-3.5 w-3.5" />
                    <span>Deselect All</span>
                  </>
                ) : (
                  <>
                    <CheckSquare className="h-3.5 w-3.5 text-[#2E76C0]" />
                    <span>Select All ({drafts.length})</span>
                  </>
                )}
              </button>

              {selectedDraftIds.length > 0 && (
                <button
                  onClick={() => setShowBulkPanel(!showBulkPanel)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#2E76C0] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#1F548C] transition-all cursor-pointer"
                >
                  <span>Bulk Actions ({selectedDraftIds.length})</span>
                  <ChevronRight className={`h-3.5 w-3.5 transition-transform ${showBulkPanel ? "rotate-90" : ""}`} />
                </button>
              )}
            </div>
          </div>

          {/* Bulk Panel Drawer */}
          {showBulkPanel && selectedDraftIds.length > 0 && (
            <div className="premium-card p-4 border-l-4 border-[#2E76C0] bg-teal-50/10 space-y-3 animate-slide-down border-slate-200 rounded-xl">
              <div className="flex items-center justify-between border-b border-slate-150 pb-2">
                <h4 className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">Bulk Update Selected Drafts</h4>
                <div className="flex gap-2">
                  <button
                    onClick={handleBulkPublish}
                    className="bg-[#10B981] text-white font-bold text-2xs px-3 py-1 rounded hover:bg-[#059669] transition-colors cursor-pointer"
                  >
                    Bulk Publish
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    className="bg-red-650 text-white font-bold text-2xs px-3 py-1 rounded hover:bg-red-700 transition-colors cursor-pointer"
                  >
                    Bulk Delete
                  </button>
                </div>
              </div>

              <form onSubmit={handleBulkEditSubmit} className="grid gap-3 sm:grid-cols-4 items-end">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Set Subject</label>
                  <input
                    type="text"
                    value={bulkSubject}
                    onChange={(e) => setBulkSubject(e.target.value)}
                    placeholder="e.g. Cardiology"
                    className="w-full rounded border border-slate-200 px-2.5 py-1.5 text-xs bg-white outline-none focus:border-[#00E5FF]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Set Difficulty</label>
                  <select
                    value={bulkDifficulty}
                    onChange={(e) => setBulkDifficulty(e.target.value)}
                    className="w-full rounded border border-slate-200 px-2.5 py-1.5 text-xs bg-white outline-none focus:border-[#00E5FF]"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Add Tags</label>
                  <input
                    type="text"
                    value={bulkTags}
                    onChange={(e) => setBulkTags(e.target.value)}
                    placeholder="e.g. Anatomy, ECG"
                    className="w-full rounded border border-slate-200 px-2.5 py-1.5 text-xs bg-white outline-none focus:border-[#00E5FF]"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-[#2E76C0] text-white text-xs font-bold py-2 rounded hover:bg-[#1F548C] cursor-pointer"
                >
                  Apply Metadata
                </button>
              </form>
            </div>
          )}

          {/* Keyboard Shortcuts Hint Bar */}
          <div className="flex flex-wrap items-center gap-4 bg-slate-900 text-slate-100 px-4 py-2.5 rounded-xl border border-slate-800 text-xs select-none">
            <span className="font-extrabold text-teal-400 uppercase tracking-widest text-[9px]">Keyboard Controls:</span>
            <div className="flex flex-wrap items-center gap-4 text-[10px] font-semibold text-slate-350">
              <span className="flex items-center gap-1"><span className="keycap">J</span> / <span className="keycap">↓</span> Next Draft</span>
              <span className="flex items-center gap-1"><span className="keycap">K</span> / <span className="keycap">↑</span> Prev Draft</span>
              <span className="flex items-center gap-1"><span className="keycap">Space</span> Select Draft</span>
              <span className="flex items-center gap-1"><span className="keycap">E</span> Edit Focused</span>
              <span className="flex items-center gap-1"><span className="keycap">P</span> Publish Focused</span>
              <span className="flex items-center gap-1"><span className="keycap">D</span> Delete Focused</span>
            </div>
          </div>

          {/* Drafts List */}
          {drafts.length === 0 ? (
            <div className="premium-card p-12 text-center text-slate-400 text-xs italic bg-white border border-slate-200">
              No draft questions staging in the Review Queue. Go to PDF Extractor tab to upload a booklet.
            </div>
          ) : (
            <div className="space-y-4">
              {drafts.map((draft, idx) => {
                const isSelected = selectedDraftIds.includes(draft._id);
                const isEditing = editingDraftId === draft._id;
                const isLowConfidence = draft.confidenceScore < 90;
                const isFocused = focusedDraftIdx === idx;

                return (
                  <div
                    key={draft._id}
                    className={`bg-white border rounded-xl p-5 border-l-4 transition-all relative ${
                      isFocused ? "premium-card-active scale-[1.005]" : "border-slate-200"
                    } ${
                      isSelected ? "border-[#2E76C0] bg-teal-50/10 shadow-sm" : isLowConfidence ? "border-l-amber-400 bg-amber-50/5" : "border-l-slate-300"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Checkbox */}
                      <button
                        onClick={() => handleDraftSelectToggle(draft._id)}
                        className={`mt-1 text-slate-400 hover:text-[#2E76C0] shrink-0 cursor-pointer`}
                      >
                        {isSelected ? (
                          <CheckSquare className="h-5 w-5 text-[#2E76C0]" />
                        ) : (
                          <Square className="h-5 w-5" />
                        )}
                      </button>

                      {/* Main Draft Card Content */}
                      <div className="flex-1 space-y-3 text-left">
                        {/* Title and badges */}
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              Draft Question {idx + 1}
                            </span>
                            
                            {/* Confidence Score Meter */}
                            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/60 px-2 py-0.5 rounded-full">
                              <span className="text-4xs font-bold text-slate-400 uppercase">Confidence:</span>
                              <div className="w-12 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${
                                    draft.confidenceScore >= 90 ? "bg-[#10B981]/100" : draft.confidenceScore >= 70 ? "bg-[#F59E0B]" : "bg-red-500"
                                  }`}
                                  style={{ width: `${draft.confidenceScore}%` }}
                               />
                              </div>
                              <span className={`text-[9px] font-black ${
                                draft.confidenceScore >= 90 ? "text-[#10B981]" : draft.confidenceScore >= 70 ? "text-amber-600" : "text-red-500"
                              }`}>{draft.confidenceScore}%</span>
                            </div>

                            <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                              isLowConfidence ? "bg-amber-50 text-amber-700 border-amber-150" : "bg-[#10B981]/10 text-[#059669] border-emerald-150"
                            }`}>
                              {isLowConfidence ? "Needs Review" : "Auto Approved"}
                            </span>
                          </div>

                          <span className="text-[10px] font-semibold text-slate-400 italic max-w-xs truncate">
                            File: {draft.pdfName}
                          </span>
                        </div>

                        {/* VIEW MODE */}
                        {!isEditing && (
                          <div className="space-y-2">
                            {/* Question text */}
                            <h4 className="text-xs font-semibold text-slate-900 leading-relaxed">
                              {draft.question}
                            </h4>

                            {/* Image attach display */}
                            {draft.image && (
                              <div className="my-2 border rounded-xl overflow-hidden max-w-xs bg-slate-50">
                                <img src={draft.image} alt="Diagnostic attachment" className="w-full object-cover max-h-48" />
                              </div>
                            )}

                            {/* Options */}
                            <div className="grid gap-2 grid-cols-1">
                              {draft.options.map((opt, oIdx) => {
                                const optMeta = draft.optionMetadata?.[oIdx] || {};
                                const highlightClass = optMeta.isHighlighted
                                  ? optMeta.highlightColor === "green"
                                    ? "bg-emerald-100/70 border-emerald-305 text-emerald-900"
                                    : optMeta.highlightColor === "pink"
                                    ? "bg-pink-100/70 border-pink-305 text-pink-900"
                                    : optMeta.highlightColor === "cyan"
                                    ? "bg-cyan-100/70 border-cyan-305 text-cyan-900"
                                    : "bg-yellow-100 border-yellow-300 text-yellow-900"
                                  : "";

                                const styleClasses = [
                                  optMeta.isBold ? "font-bold" : "",
                                  optMeta.isUnderlined ? "underline" : "",
                                  optMeta.isColored ? "text-rose-600 font-medium" : "",
                                  highlightClass
                                ].filter(Boolean).join(" ");

                                return (
                                  <div
                                    key={oIdx}
                                    className={`p-2.5 rounded-lg border text-xs ${
                                      draft.correctAnswer === oIdx
                                        ? "bg-[#10B981]/10 border-emerald-300 text-emerald-800 font-bold"
                                        : "bg-slate-50/50 border-slate-150 text-slate-600"
                                    }`}
                                  >
                                    <span className="font-bold text-slate-400 mr-1.5">{String.fromCharCode(65 + oIdx)})</span>
                                    <span className={styleClasses}>
                                      {opt || <span className="italic text-slate-300">(Empty Option)</span>}
                                    </span>
                                    {draft.correctAnswer === oIdx && (
                                      <span className="ml-2 text-[8px] font-extrabold uppercase bg-emerald-100 border border-emerald-200 text-emerald-800 px-1.5 py-0.5 rounded">Correct Answer</span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>

                            {/* Metadata & Actions row */}
                            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-150">
                              <div className="flex flex-wrap gap-2 text-2xs text-slate-500">
                                <span className="bg-slate-105 border border-slate-200 px-2 py-0.5 rounded-md">Subject: <strong>{draft.subject}</strong></span>
                                {draft.chapter && <span className="bg-slate-105 border border-slate-200 px-2 py-0.5 rounded-md">Chapter: <strong>{draft.chapter}</strong></span>}
                                <span className="bg-slate-105 border border-slate-200 px-2 py-0.5 rounded-md">Difficulty: <strong>{draft.difficulty}</strong></span>
                                {draft.tags && draft.tags.length > 0 && (
                                  <div className="flex gap-1">
                                    {draft.tags.map((t, ti) => (
                                      <span key={ti} className="bg-teal-50 text-[#1F548C] border border-teal-100 px-1.5 py-0.5 rounded font-bold">#{t}</span>
                                    ))}
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleStartEditDraft(draft)}
                                  className="inline-flex items-center gap-1 text-[10px] font-bold text-[#2765A4] hover:text-teal-800 cursor-pointer"
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  onClick={() => handleDeleteSingleDraft(draft._id)}
                                  className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 hover:text-red-800 cursor-pointer"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  <span>Delete</span>
                                </button>
                                <button
                                  onClick={() => handlePublishSingleDraft(draft._id)}
                                  className="inline-flex items-center gap-1 bg-[#10B981] text-white text-[10px] font-bold px-3 py-1.5 rounded-xl hover:bg-[#059669] transition-all cursor-pointer"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                  <span>Publish MCQ</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* EDIT INLINE MODE */}
                        {isEditing && (
                          <div className="space-y-4 pt-2 border-t border-slate-150">
                            {/* Question text input */}
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Question prompt</label>
                              <textarea
                                value={editingDraftData.question}
                                onChange={(e) => handleDraftFieldChange("question", e.target.value)}
                                rows="2"
                                className="w-full rounded border border-slate-200 px-3 py-1.5 text-xs bg-white outline-none focus:border-[#00E5FF] focus:ring-2 focus:ring-[#00E5FF]/10 leading-relaxed"
                              />
                            </div>

                            {/* Image attach/upload in draft */}
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Diagnostic Image</label>
                              <div className="flex items-center gap-3">
                                <button
                                  type="button"
                                  onClick={() => draftImageInputRef.current.click()}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-205 bg-slate-50 px-2.5 py-1.5 text-2xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                                >
                                  <ImageIcon className="h-3.5 w-3.5" />
                                  <span>{editingDraftData.image ? "Replace Image" : "Attach Image"}</span>
                                </button>
                                <input
                                  type="file"
                                  ref={draftImageInputRef}
                                  onChange={handleDraftImageUpload}
                                  accept="image/*"
                                  className="hidden"
                                />
                                {editingDraftData.image && (
                                  <div className="flex items-center gap-2">
                                    <img src={editingDraftData.image} alt="Preview" className="h-8 w-8 object-cover rounded-lg border border-slate-200" />
                                    <button
                                      type="button"
                                      onClick={() => handleDraftFieldChange("image", null)}
                                      className="text-3xs text-red-650 font-bold hover:underline cursor-pointer"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Options and radio select */}
                            <div className="space-y-2">
                              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Options & Correct Indicator</label>
                              {editingDraftData.options.map((opt, oIdx) => (
                                <div key={oIdx} className="flex items-center gap-2">
                                  <span className="w-6 text-xs font-bold text-slate-400 font-mono text-right">{String.fromCharCode(65 + oIdx)})</span>
                                  <input
                                    type="text"
                                    value={opt}
                                    onChange={(e) => handleDraftOptionChange(oIdx, e.target.value)}
                                    className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs bg-white outline-none focus:border-[#00E5FF] focus:ring-2 focus:ring-[#00E5FF]/10"
                                  />
                                  <input
                                    type="radio"
                                    name={`draft_correct_${draft._id}`}
                                    checked={editingDraftData.correctAnswer === oIdx}
                                    onChange={() => handleDraftFieldChange("correctAnswer", oIdx)}
                                    className="h-4 w-4 text-[#2765A4] focus:ring-[#00E5FF] cursor-pointer"
                                  />
                                </div>
                              ))}
                            </div>

                            {/* Explanation */}
                            <div>
                              <label className="block text-[10px] font-bold text-slate-505 uppercase tracking-wider mb-1">Rationales / Explanation</label>
                              <input
                                type="text"
                                value={editingDraftData.explanation}
                                onChange={(e) => handleDraftFieldChange("explanation", e.target.value)}
                                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs bg-white outline-none focus:border-[#00E5FF] focus:ring-2 focus:ring-[#00E5FF]/10"
                              />
                            </div>

                            {/* Subject, Difficulty, Tags inputs */}
                            <div className="grid gap-3.5 sm:grid-cols-3">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Subject</label>
                                <input
                                  type="text"
                                  value={editingDraftData.subject}
                                  onChange={(e) => handleDraftFieldChange("subject", e.target.value)}
                                  className="w-full rounded-lg border border-slate-200 px-3 py-1 text-xs bg-white outline-none focus:border-[#00E5FF] focus:ring-2 focus:ring-[#00E5FF]/10"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Difficulty</label>
                                <select
                                  value={editingDraftData.difficulty}
                                  onChange={(e) => handleDraftFieldChange("difficulty", e.target.value)}
                                  className="w-full rounded-lg border border-slate-200 px-3 py-1 text-xs bg-white outline-none focus:border-[#00E5FF] focus:ring-2 focus:ring-[#00E5FF]/10"
                                >
                                  <option value="Easy">Easy</option>
                                  <option value="Medium">Medium</option>
                                  <option value="Hard">Hard</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Tags (Comma-separated)</label>
                                <input
                                  type="text"
                                  value={editingDraftData.tags}
                                  onChange={(e) => handleDraftFieldChange("tags", e.target.value)}
                                  className="w-full rounded-lg border border-slate-200 px-3 py-1 text-xs bg-white outline-none focus:border-[#00E5FF] focus:ring-2 focus:ring-[#00E5FF]/10"
                                  placeholder="ECG, Cardiology"
                                />
                              </div>
                            </div>

                            {/* Inline edit buttons */}
                            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                              <button
                                onClick={() => setEditingDraftId(null)}
                                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-605 hover:bg-slate-100 cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleSaveSingleDraft(draft._id)}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-[#2765A4] px-4.5 py-2 text-xs font-bold text-white hover:bg-[#1F548C] shadow-md shadow-[#2E76C0]/10 transition-all cursor-pointer active:scale-98"
                              >
                                <Save className="h-3.5 w-3.5" />
                                <span>Save Changes</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: ANALYTICS DASHBOARD */}
      {activeTab === "analytics" && (
        <div className="space-y-6 animate-fade-in text-left">
          {/* Filter controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/60">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-750 uppercase">Booklet Filter:</span>
              <select
                value={selectedPdfFilter}
                onChange={(e) => setSelectedPdfFilter(e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs bg-white focus:border-[#00E5FF] outline-none"
              >
                <option value="">All Uploaded Booklets</option>
                {pdfNames.map((name, i) => (
                  <option key={i} value={name}>{name}</option>
                ))}
              </select>
            </div>
          </div>

          {loadingAnalytics || !analytics ? (
            <div className="flex flex-col items-center justify-center p-20 premium-card bg-white border border-slate-200">
              <RefreshCw className="h-8 w-8 text-[#2E76C0] animate-spin mb-2" />
              <span className="text-xs font-semibold text-slate-500">Loading Booklet Run Analytics...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* Total parsed */}
                <div className="premium-card p-5 bg-white flex items-center gap-4 border border-slate-200 border-l-4 border-l-[#2E76C0] shadow-xs">
                  <div className="p-2.5 bg-teal-50 rounded-xl text-[#2E76C0] shrink-0">
                    <FileQuestion className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Extracted</div>
                    <div className="text-2xl font-black text-slate-900 mt-0.5">{analytics.total || 0}</div>
                  </div>
                </div>

                {/* Skipped */}
                <div className="premium-card p-5 bg-white flex items-center gap-4 border border-slate-200 border-l-4 border-l-[#F59E0B] shadow-xs">
                  <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600 shrink-0">
                    <AlertCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Skipped Questions</div>
                    <div className="text-2xl font-black text-slate-900 mt-0.5">{analytics.skipped || 0}</div>
                  </div>
                </div>

                {/* Auto Approved */}
                <div className="premium-card p-5 bg-white flex items-center gap-4 border border-slate-200 border-l-4 border-l-[#10B981]/100 shadow-xs">
                  <div className="p-2.5 bg-[#10B981]/10 rounded-xl text-[#10B981] shrink-0">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Auto Approved</div>
                    <div className="text-2xl font-black text-slate-900 mt-0.5">{analytics.autoApproved || 0}</div>
                  </div>
                </div>

                {/* Needs review */}
                <div className="premium-card p-5 bg-white flex items-center gap-4 border border-slate-200 border-l-4 border-l-indigo-650 shadow-xs">
                  <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600 shrink-0">
                    <HelpCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Staging Review</div>
                    <div className="text-2xl font-black text-slate-900 mt-0.5">{analytics.needsReview || 0}</div>
                  </div>
                </div>
              </div>

              {/* Strategy Breakdown Card */}
              <div className="premium-card p-6 bg-white border border-slate-200 space-y-4">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b pb-2 flex items-center gap-1.5">
                  <Sparkles className="h-4.5 w-4.5 text-[#2765A4]" />
                  Answer Key Detection Strategy Analysis
                </h3>

                {Object.keys(analytics.strategyBreakdown || {}).length === 0 ? (
                  <div className="text-xs text-slate-400 py-6 text-center italic">No strategy breakdown data available.</div>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(analytics.strategyBreakdown).map(([strategy, count]) => {
                      const total = Object.values(analytics.strategyBreakdown).reduce((a, b) => a + b, 0);
                      const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                      
                      // Strategy Display Name mapping
                      const displayNames = {
                        plus_symbol: "Plus Symbol Marker (+)",
                        checkmark_symbol: "Checkmark Symbol Marker (✓)",
                        asterisk_symbol: "Asterisk Symbol Marker (*)",
                        bold_option: "Bold Option Style Marking",
                        colored_option: "Distinct Font Color",
                        highlight_option: "Yellow Color Highlights",
                        colored_highlight: "Green/Cyan/Pink Style Highlight",
                        underline_option: "Underline Annotation",
                        answer_text: "Explicit Explanatory Text Dec",
                        end_answer_key: "End of PDF Answer Grid",
                        separate_answers: "Separate Answers Key Booklet",
                        ocr_marker: "OCR Fallback Character Match",
                        none: "Staging Review Required (Unidentified Style)"
                      };

                      const strategyColors = {
                        plus_symbol: "bg-[#00E5FF]",
                        checkmark_symbol: "bg-[#10B981]/100",
                        asterisk_symbol: "bg-yellow-500",
                        bold_option: "bg-slate-700",
                        colored_option: "bg-purple-500",
                        highlight_option: "bg-yellow-400",
                        colored_highlight: "bg-pink-500",
                        underline_option: "bg-indigo-500",
                        answer_text: "bg-orange-500",
                        end_answer_key: "bg-violet-600",
                        separate_answers: "bg-blue-600",
                        ocr_marker: "bg-rose-500",
                        none: "bg-slate-300"
                      };

                      return (
                        <div key={strategy} className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold text-slate-700">
                            <span>{displayNames[strategy] || strategy}</span>
                            <span className="text-slate-500 font-bold">{count} questions ({percentage}%)</span>
                          </div>
                          <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${strategyColors[strategy] || "bg-[#00E5FF]"}`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* EXTRACTION WIZARD MODAL */}
      {showWizard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border max-w-3xl w-full max-h-[85vh] flex flex-col animate-scale-up text-left">
            {/* Wizard Header */}
            <div className="p-5 border-b border-slate-150 bg-slate-50 rounded-t-2xl flex items-start gap-3">
              <Sparkles className="h-6 w-6 text-[#F59E0B] mt-0.5 shrink-0" />
              <div>
                <h3 className="text-sm font-black text-slate-900">Extraction Pattern Training Wizard</h3>
                <p className="text-2xs text-slate-500 mt-0.5 leading-normal">
                  Mark the correct options for these {wizardSamples.length} samples.
                  The system will audit style markers (bolds/colors/highlights) and auto-detect the pattern rules.
                </p>
              </div>
            </div>

            {/* Wizard Questions Scroll Area */}
            <div className="p-5 overflow-y-auto flex-1 space-y-5">
              {/* Template settings */}
              <div className="bg-teal-50/40 border border-teal-100 rounded-xl p-3.5 grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-[10px] font-bold text-teal-800 uppercase tracking-wider mb-1">PDF Booklet Name</label>
                  <div className="text-xs font-bold text-slate-700 truncate">{wizardPdfName}</div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-teal-800 uppercase tracking-wider mb-1">New Template Name</label>
                  <input
                    type="text"
                    required
                    value={wizardTemplateName}
                    onChange={(e) => setWizardTemplateName(e.target.value)}
                    placeholder="e.g. Allen Medical Institute"
                    className="w-full rounded border border-teal-200 px-3 py-1 text-xs bg-white outline-none focus:border-[#00E5FF]"
                  />
                </div>
              </div>

              {/* Sample list */}
              <div className="space-y-4">
                {wizardSamples.map((sample, sIdx) => (
                  <div key={sample._id} className="border border-slate-205 rounded-xl p-4 bg-slate-50/20">
                    <strong className="text-[10px] font-bold text-slate-400 uppercase">Sample MCQ {sIdx + 1}</strong>
                    <p className="text-xs font-semibold text-slate-800 mt-1 mb-3 leading-relaxed">{sample.question}</p>
                    
                    <div className="grid gap-2 grid-cols-1">
                      {sample.options.map((opt, oIdx) => {
                        const isChosen = wizardAnswers[sample._id] === oIdx;
                        const optMeta = sample.optionMetadata?.[oIdx] || {};
                        
                        return (
                          <label
                            key={oIdx}
                            className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all flex items-center gap-2.5 ${
                              isChosen 
                                ? "bg-teal-50 border-teal-400 text-teal-900 font-bold"
                                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            <input
                              type="radio"
                              name={`wizard_radio_${sample._id}`}
                              checked={isChosen}
                              onChange={() => setWizardAnswers(prev => ({ ...prev, [sample._id]: oIdx }))}
                              className="h-4.5 w-4.5 text-[#2765A4] focus:ring-[#00E5FF] cursor-pointer"
                            />
                            <div className="flex-1">
                              <span className="font-bold text-slate-400 mr-1.5">{String.fromCharCode(65 + oIdx)})</span>
                              <span className={`${optMeta.isBold ? "font-bold" : ""} ${optMeta.isHighlighted ? "bg-yellow-100" : ""} ${optMeta.isUnderlined ? "underline" : ""}`}>
                                {opt}
                              </span>
                              
                              {/* Meta Indicators */}
                              <div className="flex gap-1 mt-1">
                                {optMeta.isHighlighted && <span className="text-[8px] bg-yellow-50 text-yellow-800 px-1 py-0.25 rounded font-extrabold uppercase">Highlighted</span>}
                                {optMeta.isBold && <span className="text-[8px] bg-slate-100 text-slate-800 px-1 py-0.25 rounded font-extrabold uppercase">Bold</span>}
                                {optMeta.isUnderlined && <span className="text-[8px] bg-slate-100 text-slate-800 px-1 py-0.25 rounded font-extrabold uppercase">Underlined</span>}
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Wizard Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex items-center justify-between gap-3">
              <span className="text-2xs text-slate-500 font-semibold">
                Marked answers: {Object.keys(wizardAnswers).length} / {wizardSamples.length}
              </span>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setShowWizard(false)}
                  disabled={wizardSubmitting}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel / Skip
                </button>
                <button
                  onClick={handleWizardSubmit}
                  disabled={wizardSubmitting || Object.keys(wizardAnswers).length < wizardSamples.length || !wizardTemplateName.trim()}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#2765A4] px-5 py-2 text-xs font-bold text-white hover:bg-[#1F548C] disabled:opacity-50 cursor-pointer"
                >
                  {wizardSubmitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Analyzing Styles...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Learn & Process Remaining</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
