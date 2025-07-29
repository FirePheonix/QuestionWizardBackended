import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '@clerk/clerk-react';
import { 
  Check, Circle, CheckSquare, ToggleLeft, BarChart3, Star, Edit3, Type, GitMerge, FileText as EssayIcon,
  Image, FileText as PdfIcon, Bot, RotateCw, Clock, X, AlertTriangle, UploadCloud, FileCheck2, Loader2
} from 'lucide-react';

import {
  QuestionType, SourceType, GenerationStatus, GeneratedQuestion, AIEvaluationGuidelines, BalanceInfoResponse
} from '../types';

import BalanceSidebar from './BalanceSidebar';

interface ReviewableQuestion extends GeneratedQuestion {
  accepted: boolean;
}

interface QuestionTypeUI {
  id: QuestionType;
  title: string;
  icon: React.ComponentType<any>;
  quantity: number;
}

interface GenerationStage {
  id: string;
  name: string;
  status: 'completed' | 'current' | 'pending';
}

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

interface FileUploadState {
    status: UploadStatus;
    progress: number;
    fileId?: string;
    fileName?: string;
    error?: string;
    preview?: string;
}

interface AIQuestionWizardProps {
  onComplete?: (data: any) => void;
  onCancel?: () => void;
  className?: string;
}

const AIQuestionWizard: React.FC<AIQuestionWizardProps> = ({ 
  onComplete, 
  onCancel,
  className = '' 
}) => {
  const { getToken } = useAuth();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [balanceInfo, setBalanceInfo] = useState<BalanceInfoResponse | null>(null);
  
  const [questionTypes, setQuestionTypes] = useState<QuestionTypeUI[]>([
    { id: QuestionType.SingleChoice, title: 'Single Choice', icon: Circle, quantity: 1 },
    { id: QuestionType.MultipleChoice, title: 'Multiple Choice', icon: CheckSquare, quantity: 1 },
    { id: QuestionType.TrueFalse, title: 'True/False', icon: ToggleLeft, quantity: 1 },
    { id: QuestionType.Ranking, title: 'Ranking', icon: BarChart3, quantity: 0 },
    { id: QuestionType.Rating, title: 'Rating', icon: Star, quantity: 0 },
    { id: QuestionType.FillInTheBlank, title: 'Fill in the Blank', icon: Edit3, quantity: 0 },
    { id: QuestionType.ShortText, title: 'Short Text', icon: Type, quantity: 0 },
    { id: QuestionType.Matching, title: 'Matching', icon: GitMerge, quantity: 0 },
    { id: QuestionType.Essay, title: 'Essay', icon: EssayIcon, quantity: 0 },
  ]);

  const [selectedSource, setSelectedSource] = useState<SourceType>(SourceType.Text);
  const [promptText, setPromptText] = useState<string>('Create engaging questions about machine learning fundamentals, covering topics like supervised learning, neural networks, and data preprocessing.');
  const [imageUpload, setImageUpload] = useState<FileUploadState>({ status: 'idle', progress: 0 });
  const [pdfUpload, setPdfUpload] = useState<FileUploadState>({ status: 'idle', progress: 0 });

  const [guidelines, setGuidelines] = useState<AIEvaluationGuidelines>({
    targetAudience: 'Intermediate',
    language: 'en-US',
    tone: 'Neutral'
  });

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [eta, setEta] = useState(0);
  const [generationStages, setGenerationStages] = useState<GenerationStage[]>([]);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const ws = useRef<WebSocket | null>(null);

  const [questions, setQuestions] = useState<ReviewableQuestion[]>([]);

  const totalQuestions = questionTypes.reduce((sum, type) => sum + type.quantity, 0);
  const estimatedCost = totalQuestions * 3;
  const acceptedQuestions = questions.filter(q => q.accepted);

  const steps = [
    { id: 1, name: 'Question Types' }, { id: 2, name: 'Source Selection' },
    { id: 3, name: 'Guidelines' }, { id: 4, name: 'Generation' },
    { id: 5, name: 'Review' },
  ];

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const token = await getToken();
        const response = await axios.get<BalanceInfoResponse>('/api/v1/ai-generation/balance', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setBalanceInfo(response.data);
      } catch (error) {
        console.error("Failed to fetch balance info", error);
      }
    };
    fetchBalance();
  }, [getToken]);

  const startGeneration = useCallback(async () => {
    if (currentStep !== 4) {
        if (ws.current) {
            ws.current.close(); ws.current = null; setSessionId(null);
        }
        return;
    }

    const fetchResults = async (sessionId: string, authToken: string) => {
        try {
            const response = await axios.get<GeneratedQuestion[]>(`/api/v1/ai-generation/result/${sessionId}`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            const reviewableQuestions = response.data.map(q => ({ ...q, accepted: true }));
            setQuestions(reviewableQuestions);
            setTimeout(() => setCurrentStep(5), 1000);
        } catch (error) {
            console.error('Failed to fetch generation results:', error);
            setGenerationError('Could not retrieve the generated questions.');
        }
    };

    const startAndConnect = async () => {
        setGenerationError(null);
        try {
            const authToken = await getToken();
            if (!authToken) throw new Error("Authentication token not found.");

            const payload = {
                questionTypes: questionTypes.filter(qt => qt.quantity > 0).map(qt => ({ id: qt.id, quantity: qt.quantity })),
                sourceType: selectedSource,
                sourceText: selectedSource === SourceType.Text ? promptText : undefined,
                sourceFileId: selectedSource === SourceType.Image ? imageUpload.fileId : pdfUpload.fileId,
                guidelines: guidelines
            };

            const response = await axios.post('/api/v1/ai-generation/start', payload, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            
            const { sessionId: newSessionId, initialStatus } = response.data;
            setSessionId(newSessionId);
            setProgress(initialStatus.progress);
            setEta(initialStatus.eta);
            setGenerationStages(initialStatus.stages);

            const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsHost = import.meta.env.DEV ? 'localhost:3001' : window.location.host;
            ws.current = new WebSocket(`${wsProtocol}//${wsHost}`);

            ws.current.onmessage = (event) => {
                const message = JSON.parse(event.data);
                if (message.payload.id !== newSessionId) return;

                if (message.type === 'statusUpdate') {
                    const { progress, eta, stages, status } = message.payload;
                    setProgress(progress); setEta(eta); setGenerationStages(stages);
                    if (status === GenerationStatus.Completed) {
                        fetchResults(newSessionId, authToken);
                        ws.current?.close();
                    }
                } else if (message.type === 'error') {
                    setGenerationError(message.payload.error || 'An unknown error occurred.');
                    ws.current?.close();
                }
            };
        } catch (error: any) {
            console.error('Failed to start generation session:', error);
            setGenerationError(error.response?.data?.message || 'Failed to start the generation process.');
        }
    };

    startAndConnect();
    return () => { if (ws.current) ws.current.close(); };
  }, [currentStep, getToken, questionTypes, selectedSource, promptText, imageUpload.fileId, pdfUpload.fileId, guidelines]);

  useEffect(() => {
    startGeneration();
  }, [startGeneration]);

  const summaryData = useMemo(() => {
    if (questions.length === 0) return undefined;
    const accepted = questions.filter(q => q.accepted);
    const totalQuality = accepted.reduce((sum, q) => sum + q.qualityScore, 0);
    return {
        questionsGenerated: questions.length,
        questionsAccepted: accepted.length,
        creditsConsumed: estimatedCost,
        averageQuality: accepted.length > 0 ? Math.round(totalQuality / accepted.length) : 0,
        qualityBreakdown: {
            excellent: accepted.filter(q => q.qualityScore >= 90).length,
            good: accepted.filter(q => q.qualityScore >= 80 && q.qualityScore < 90).length,
            fair: accepted.filter(q => q.qualityScore >= 70 && q.qualityScore < 80).length,
        }
    };
  }, [questions, estimatedCost]);

  const handleNextStep = () => { if (canProceed() && currentStep < steps.length) setCurrentStep(currentStep + 1); };
  const handlePreviousStep = () => { if (currentStep > 1) setCurrentStep(currentStep - 1); };
  const handleStepClick = (stepNumber: number) => { if (stepNumber <= currentStep) setCurrentStep(stepNumber); };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return totalQuestions > 0;
      case 2:
        if (selectedSource === SourceType.Text) return promptText.trim().length > 10;
        if (selectedSource === SourceType.Image) return imageUpload.status === 'success';
        if (selectedSource === SourceType.PDF) return pdfUpload.status === 'success';
        return false;
      case 3: return true;
      case 4: return progress >= 100 && !generationError;
      case 5: return acceptedQuestions.length > 0;
      default: return true;
    }
  };

  const updateQuestionQuantity = (id: QuestionType, quantity: number) => {
    setQuestionTypes(prev => prev.map(type => type.id === id ? { ...type, quantity } : type));
  };

  const handleFileUpload = async (file: File, type: 'image' | 'pdf') => {
    const formData = new FormData();
    formData.append(type, file);
    const setUploadState = type === 'image' ? setImageUpload : setPdfUpload;
    setUploadState({ status: 'uploading', progress: 0, fileName: file.name });
    try {
      const token = await getToken();
      const response = await axios.post(`/api/v1/ai-generation/source/upload-${type}`, formData, {
        headers: { 'Authorization': `Bearer ${token}` },
        onUploadProgress: (e: any) => setUploadState(p => ({ ...p, progress: Math.round((e.loaded * 100) / e.total) })),
      });
      setUploadState({ status: 'success', progress: 100, ...response.data });
    } catch (err: any) {
      setUploadState({ status: 'error', progress: 0, fileName: file.name, error: err.response?.data?.message || 'Upload failed.' });
    }
  };
  
  const renderFileUploadZone = (type: 'image' | 'pdf') => {
    const state = type === 'image' ? imageUpload : pdfUpload;
    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) handleFileUpload(e.target.files[0], type);
    };
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{type === 'image' ? 'Image Upload' : 'PDF Upload'}</h2>
        <input type="file" id={`${type}-upload-input`} className="hidden" onChange={onFileChange} accept={type === 'image' ? 'image/*' : '.pdf'} />
        {state.status === 'idle' && <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer" onClick={() => document.getElementById(`${type}-upload-input`)?.click()}><UploadCloud className="w-12 h-12 text-gray-400 mx-auto mb-4" /><p>Click to browse or drag & drop</p></div>}
        {state.status === 'uploading' && <div className="text-center p-8"><Loader2 className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" /><p>Uploading... {state.progress}%</p></div>}
        {state.status === 'success' && <div className="border-2 border-dashed border-green-300 bg-green-50 rounded-lg p-8 text-center"><FileCheck2 className="w-12 h-12 text-green-600 mx-auto mb-4" /><p className="text-green-800 font-medium">{state.fileName} uploaded!</p>{state.preview && <div className="mt-4 text-left bg-white p-2 rounded-md border text-xs text-gray-600 max-h-24 overflow-y-auto">{state.preview}</div>}<button onClick={() => document.getElementById(`${type}-upload-input`)?.click()} className="mt-2 text-blue-600 text-sm">Replace</button></div>}
        {state.status === 'error' && <div className="border-2 border-dashed border-red-300 bg-red-50 rounded-lg p-8 text-center"><AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-4" /><p className="text-red-800 font-medium">{state.error}</p><button onClick={() => document.getElementById(`${type}-upload-input`)?.click()} className="mt-2 text-blue-600 text-sm">Try Again</button></div>}
      </div>
    );
  };

  const renderMainContent = () => {
    switch (currentStep) {
      case 1: return (
          <div className="p-8"><h1 className="text-2xl font-bold mb-8">Select Question Types</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {questionTypes.map((type) => {
                const Icon = type.icon;
                return <div key={type.id} className="bg-white border rounded-lg p-6"><div className="flex items-center space-x-3 mb-4"><div className="p-2 bg-blue-50 rounded-lg"><Icon className="w-6 h-6 text-blue-600" /></div><h3 className="font-medium">{type.title}</h3></div><select value={type.quantity} onChange={(e) => updateQuestionQuantity(type.id, Number(e.target.value))} className="w-full p-2 border rounded-md"><option value={0}>0</option><option value={1}>1</option><option value={2}>2</option><option value={3}>3</option><option value={5}>5</option><option value={10}>10</option></select></div>;
              })}
            </div>
          </div>
        );
      case 2: return (
          <div className="p-8"><h1 className="text-2xl font-bold mb-8">Choose Content Source</h1>
            <div className="grid grid-cols-3 gap-6 mb-8">
              {[{id: SourceType.Text, title: 'Text', icon: Edit3}, {id: SourceType.Image, title: 'Image', icon: Image}, {id: SourceType.PDF, title: 'PDF', icon: PdfIcon}].map(opt => (
                <div key={opt.id} onClick={() => setSelectedSource(opt.id)} className={`p-6 text-center rounded-lg cursor-pointer border-2 ${selectedSource === opt.id ? 'border-blue-500 bg-blue-50' : 'bg-white hover:border-gray-300'}`}><opt.icon className={`w-8 h-8 mx-auto mb-2 ${selectedSource === opt.id ? 'text-blue-600' : 'text-gray-500'}`} />{opt.title}</div>
              ))}
            </div>
            {selectedSource === SourceType.Text && <textarea value={promptText} onChange={(e) => setPromptText(e.target.value)} className="w-full h-32 p-2 border rounded-lg" />}
            {selectedSource === SourceType.Image && renderFileUploadZone('image')}
            {selectedSource === SourceType.PDF && renderFileUploadZone('pdf')}
          </div>
        );
      case 3: return (
          <div className="p-8"><h1 className="text-2xl font-bold mb-8">Guidelines & Settings</h1>
            <div className="space-y-6 bg-white p-6 rounded-lg border">
              <div><label className="font-medium">Target Audience</label><select value={guidelines.targetAudience} onChange={e => setGuidelines(g => ({...g, targetAudience: e.target.value as any}))} className="w-full p-2 mt-1 border rounded-md"><option>Beginner</option><option>Intermediate</option><option>Expert</option></select></div>
              <div><label className="font-medium">Language</label><input type="text" value={guidelines.language} onChange={e => setGuidelines(g => ({...g, language: e.target.value}))} className="w-full p-2 mt-1 border rounded-md" /></div>
              <div><label className="font-medium">Tone</label><select value={guidelines.tone} onChange={e => setGuidelines(g => ({...g, tone: e.target.value as any}))} className="w-full p-2 mt-1 border rounded-md"><option>Formal</option><option>Informal</option><option>Humorous</option><option>Neutral</option></select></div>
            </div>
          </div>
        );
      case 4: return (
          <div className="p-8 text-center"><div className="max-w-2xl mx-auto">
            {!generationError ? (
              <><div className="inline-flex items-center justify-center w-24 h-24 bg-blue-100 rounded-full animate-pulse mb-8"><Bot className="w-12 h-12 text-blue-600" /></div>
              <h1 className="text-3xl font-bold mb-4">Generating Questions...</h1>
              <p className="text-lg text-gray-600 mb-12">AI is working its magic. Please wait.</p>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-2"><div className="bg-blue-600 h-3 rounded-full" style={{ width: `${progress}%` }}></div></div>
              <p className="text-sm text-gray-600 mb-8">ETA: {eta} seconds</p>
              <div className="bg-white rounded-lg border p-8 space-y-4">{generationStages.map(stage => <div key={stage.id} className="flex items-center space-x-3"><div className="flex-shrink-0">{stage.status === 'completed' ? <Check className="w-5 h-5 text-green-600" /> : stage.status === 'current' ? <RotateCw className="w-5 h-5 text-blue-600 animate-spin" /> : <Clock className="w-5 h-5 text-gray-400" />}</div><span>{stage.name}</span></div>)}</div></>
            ) : (
              <><AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-red-700 mb-4">Generation Failed</h1>
              <p className="text-lg text-gray-600 bg-red-50 p-4 rounded-md">{generationError}</p></>
            )}
            </div>
          </div>
        );
      case 5: return (
          <div className="p-8"><h1 className="text-2xl font-bold mb-8">Review Generated Questions</h1>
            <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
              {questions.map((q, i) => <div key={q.id} className={`border-2 rounded-lg p-6 ${q.accepted ? 'opacity-100' : 'opacity-60'}`}><div className="flex justify-between items-start mb-4"><h3 className="font-medium">Q{i+1}: {q.questionText}</h3><button onClick={() => setQuestions(qs => qs.map(qu => qu.id === q.id ? {...qu, accepted: !qu.accepted} : qu))} className="text-sm">{q.accepted ? 'Reject' : 'Accept'}</button></div><div className="space-y-2">{q.options.map(opt => <div key={opt.id} className="flex items-center"><input type={q.type === 'checkbox' ? 'checkbox' : 'radio'} readOnly checked={opt.isCorrect} className="mr-2" /><span>{opt.text}</span></div>)}</div></div>)}
            </div>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className={`min-h-screen bg-gray-50 font-inter grid grid-cols-12 ${className}`}>
      <div className="col-span-2 bg-white border-r p-6">
        <h2 className="text-lg font-semibold mb-8">Navigation</h2>
        <nav className="space-y-4">
          {steps.map(step => <div key={step.id} onClick={() => handleStepClick(step.id)} className={`flex items-center space-x-3 p-2 -m-2 rounded-lg ${step.id <= currentStep ? 'cursor-pointer hover:bg-gray-50' : 'cursor-default'}`}><div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${currentStep === step.id ? 'bg-blue-600 text-white' : currentStep > step.id ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>{currentStep > step.id ? <Check/> : step.id}</div><span>{step.name}</span></div>)}
        </nav>
      </div>
      
      <div className="col-span-7 bg-gray-50 flex flex-col">
        <div className="flex-grow overflow-y-auto">
          {renderMainContent()}
        </div>
        <div className="flex-shrink-0 p-8 flex justify-between bg-gray-50 border-t border-gray-200">
          <button onClick={handlePreviousStep} disabled={currentStep === 1} className="px-6 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-50">Back</button>
          {currentStep < steps.length ? <button onClick={handleNextStep} disabled={!canProceed()} className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">Next</button> : <button onClick={() => onComplete?.({ questions: acceptedQuestions })} className="px-6 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700">Complete</button>}
        </div>
      </div>

      <div className="col-span-3">
        <BalanceSidebar
          showCostWarning={currentStep < 4}
          showProcessingStatus={currentStep === 4}
          showGenerationSummary={currentStep > 4}
          highlightTextGeneration={selectedSource === SourceType.Text}
          balanceData={balanceInfo ? {
            currentBalance: balanceInfo.currentCredits,
            totalBalance: balanceInfo.totalCreditsInPeriod,
            periodStartDate: balanceInfo.periodStartDate,
            periodEndDate: balanceInfo.periodEndDate,
            balanceAfterGeneration: currentStep === 4 ? balanceInfo.currentCredits - estimatedCost : undefined
          } : undefined}
          usageMetersData={balanceInfo?.usageMeters}
          costData={{ cost: estimatedCost, sourceType: selectedSource }}
          processingData={{ cost: estimatedCost, sessionId }}
          summaryData={summaryData}
        />
      </div>
    </div>
  );
};

export default AIQuestionWizard;
