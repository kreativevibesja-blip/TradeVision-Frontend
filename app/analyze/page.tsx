'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { api, resolveAssetUrl, type AnalysisResult } from '@/lib/api';
import { AuthModal } from '@/components/AuthModal';
import { ChartLightbox } from '@/components/ChartLightbox';
import {
  Upload,
  Image as ImageIcon,
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Brain,
  BarChart3,
  AlertTriangle,
  Eye,
  Zap,
  CandlestickChart,
  Activity,
  Sparkles,
  CircleDollarSign,
  Lock,
  Crown,
} from 'lucide-react';

const PAIRS = [
  'EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CAD', 'NZD/USD',
  'EUR/GBP', 'GBP/JPY', 'EUR/JPY', 'USD/CHF',
  'XAU/USD', 'BTC/USD', 'ETH/USD', 'US30', 'NAS100', 'SPX500',
  'Boom 300', 'Boom 500', 'Boom 1000',
  'Crash 300', 'Crash 500', 'Crash 1000',
  'Volatility 10', 'Volatility 25', 'Volatility 50', 'Volatility 75', 'Volatility 100',
  'Step Index',
  'Other',
];

const TIMEFRAMES = ['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1', 'W1', 'MN'];
const ANALYSIS_STEPS = [
  'Uploading chart...',
  'Analyzing SMC structure...',
  'Interpreting liquidity and zones...',
  'Validating entry conditions...',
  'Preparing final SMC signal...',
];

const QUEUE_TRANSITION_MESSAGES = [
  'Preparing your chart for the queue...',
  'Securing your place in line...',
  'Sending your chart to the analysis worker...',
];

const ANALYZE_RETRY_DRAFT_KEY = 'analyze_retry_draft';

interface StoredAnalyzeFile {
  name: string;
  type: string;
  dataUrl: string;
}

interface StoredAnalyzeDraft {
  pair: string;
  timeframe: string;
  timeframe2: string;
  currentPrice: string;
  primaryChart: StoredAnalyzeFile | null;
  secondaryChart: StoredAnalyzeFile | null;
}

const fileToDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
        return;
      }

      reject(new Error('Could not read chart file'));
    };
    reader.onerror = () => reject(new Error('Could not read chart file'));
    reader.readAsDataURL(file);
  });

const dataUrlToFile = async ({ name, type, dataUrl }: StoredAnalyzeFile) => {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  return new File([blob], name, { type: type || blob.type || 'image/jpeg' });
};

const saveAnalyzeDraft = async (draft: {
  pair: string;
  timeframe: string;
  timeframe2: string;
  currentPrice: string;
  file: File;
  file2: File | null;
}) => {
  const payload: StoredAnalyzeDraft = {
    pair: draft.pair,
    timeframe: draft.timeframe,
    timeframe2: draft.timeframe2,
    currentPrice: draft.currentPrice,
    primaryChart: {
      name: draft.file.name,
      type: draft.file.type,
      dataUrl: await fileToDataUrl(draft.file),
    },
    secondaryChart: draft.file2
      ? {
          name: draft.file2.name,
          type: draft.file2.type,
          dataUrl: await fileToDataUrl(draft.file2),
        }
      : null,
  };

  window.sessionStorage.setItem(ANALYZE_RETRY_DRAFT_KEY, JSON.stringify(payload));
};

const clearAnalyzeDraft = () => {
  window.sessionStorage.removeItem(ANALYZE_RETRY_DRAFT_KEY);
};

const formatPrice = (value: number | null | undefined, pair: string) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 'N/A';
  }

  const normalized = pair.toUpperCase();
  if (normalized.includes('BTC') || normalized.includes('US30') || normalized.includes('NAS100') || normalized.includes('SPX500')) {
    return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
  }

  if (normalized.includes('JPY')) {
    return value.toFixed(3);
  }

  if (normalized.includes('XAU')) {
    return value.toFixed(1);
  }

  return value.toFixed(4);
};

const formatStructuredZone = (
  zone: { min: number | null; max: number | null } | null | undefined,
  pair: string
) => {
  if (!zone || typeof zone.min !== 'number' || typeof zone.max !== 'number') {
    return 'Not available';
  }

  return `${formatPrice(zone.min, pair)} - ${formatPrice(zone.max, pair)}`;
};

const formatZoneReason = (reason?: 'order block' | 'imbalance' | 'previous structure') => {
  if (!reason) {
    return 'Reason not available';
  }

  return reason;
};

function CandlestickWave() {
  return (
    <div className="flex items-end gap-1.5 h-20 justify-center">
      {Array.from({ length: 9 }).map((_, index) => (
        <motion.div
          key={index}
          className={`w-2.5 rounded-sm ${index % 3 === 0 ? 'bg-red-500/60' : 'bg-green-500/60'}`}
          animate={{ height: [8, 30 + Math.random() * 40, 8] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: index * 0.12, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

function ConfidenceMeter({ score }: { score: number }) {
  const getColor = (value: number) => {
    if (value >= 70) return 'text-green-400';
    if (value >= 40) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getBarColor = (value: number) => {
    if (value >= 70) return 'bg-gradient-to-r from-green-500 to-emerald-400';
    if (value >= 40) return 'bg-gradient-to-r from-yellow-500 to-orange-400';
    return 'bg-gradient-to-r from-red-500 to-rose-400';
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-end">
        <span className="text-sm text-muted-foreground">Confidence</span>
        <span className={`text-3xl font-bold ${getColor(score)}`}>
          {score}
          <span className="text-lg text-muted-foreground">/100</span>
        </span>
      </div>
      <Progress value={score} className="h-3" indicatorClassName={getBarColor(score)} />
      <p className={`text-sm font-medium ${getColor(score)}`}>
        {score >= 80 ? 'High conviction setup' : score >= 60 ? 'Tradable with confirmation' : score >= 40 ? 'Lower-quality setup' : 'Wait for better structure'}
      </p>
    </div>
  );
}

function QueueTransitionScreen() {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setMessageIndex((current) => (current + 1) % QUEUE_TRANSITION_MESSAGES.length);
    }, 1800);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  return (
    <div className="min-h-[calc(100svh-5rem)] px-4 py-4 sm:px-6 sm:py-6 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-md"
      >
        <div className="mobile-card p-6 sm:p-8 space-y-6 text-center">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold sm:text-3xl">
              <span className="text-gradient">Preparing Your Queue Spot</span>
            </h1>
            <p className="text-sm text-muted-foreground">
              Your chart is being uploaded and your analysis job is being created.
            </p>
          </div>

          <div className="flex justify-center">
            <div className="relative h-24 w-24 sm:h-28 sm:w-28">
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-primary/30"
                animate={{ scale: [1, 1.45], opacity: [0.7, 0] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
              />
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-cyan-500/30"
                animate={{ scale: [1, 1.25], opacity: [0.5, 0] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut', delay: 0.45 }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full border border-white/10 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-cyan-500/20"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
                >
                  <Brain className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
                </motion.div>
              </div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={messageIndex}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="flex items-center justify-center gap-2 text-sm sm:text-base font-medium"
            >
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span>{QUEUE_TRANSITION_MESSAGES[messageIndex]}</span>
            </motion.div>
          </AnimatePresence>

          <div className="space-y-2">
            <div className="relative h-2 overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500"
                animate={{ width: ['12%', '78%', '42%'] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>
            <p className="text-xs text-muted-foreground">You’ll be taken to the waiting screen in a moment.</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function AnalyzePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, token, refreshUser } = useAuth();
  const isPro = user?.subscription === 'PRO';
  const retryMode = searchParams.get('retry') === '1';
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file2, setFile2] = useState<File | null>(null);
  const [preview2, setPreview2] = useState<string | null>(null);
  const [pair, setPair] = useState('');
  const [timeframe, setTimeframe] = useState('');
  const [timeframe2, setTimeframe2] = useState('');
  const [currentPrice, setCurrentPrice] = useState('');
  const [showAiZones, setShowAiZones] = useState(true);
  const [activeChart, setActiveChart] = useState<'htf' | 'ltf'>('ltf');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState(ANALYSIS_STEPS[0]);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState('');
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [queueStarting, setQueueStarting] = useState(false);
  const analysisId = searchParams.get('analysisId');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const nextFile = acceptedFiles[0];
    if (!nextFile) {
      return;
    }

    setFile(nextFile);
    setPreview(URL.createObjectURL(nextFile));
    setAnalysis(null);
    setError('');
  }, []);

  const onDrop2 = useCallback((acceptedFiles: File[]) => {
    const nextFile = acceptedFiles[0];
    if (!nextFile) {
      return;
    }

    setFile2(nextFile);
    setPreview2(URL.createObjectURL(nextFile));
    setAnalysis(null);
    setError('');
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/png': ['.png'], 'image/jpeg': ['.jpg', '.jpeg'], 'image/webp': ['.webp'] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  const { getRootProps: getRootProps2, getInputProps: getInputProps2, isDragActive: isDragActive2 } = useDropzone({
    onDrop: onDrop2,
    accept: { 'image/png': ['.png'], 'image/jpeg': ['.jpg', '.jpeg'], 'image/webp': ['.webp'] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  const isDualChart = Boolean(file2);

  useEffect(() => {
    if (!retryMode || file || analysis) {
      return;
    }

    let cancelled = false;

    const restoreDraft = async () => {
      const rawDraft = window.sessionStorage.getItem(ANALYZE_RETRY_DRAFT_KEY);
      if (!rawDraft) {
        return;
      }

      try {
        const draft = JSON.parse(rawDraft) as StoredAnalyzeDraft;
        if (!draft.primaryChart) {
          return;
        }

        const restoredPrimary = await dataUrlToFile(draft.primaryChart);
        const restoredSecondary = draft.secondaryChart ? await dataUrlToFile(draft.secondaryChart) : null;

        if (cancelled) {
          return;
        }

        setFile(restoredPrimary);
        setPreview(draft.primaryChart.dataUrl);
        setFile2(restoredSecondary);
        setPreview2(draft.secondaryChart?.dataUrl || null);
        setPair(draft.pair || '');
        setTimeframe(draft.timeframe || '');
        setTimeframe2(draft.timeframe2 || '');
        setCurrentPrice(draft.currentPrice || '');
        setAnalysis(null);
        setError('');

        router.replace('/analyze');
      } catch {
        clearAnalyzeDraft();
      }
    };

    void restoreDraft();

    return () => {
      cancelled = true;
    };
  }, [retryMode, file, analysis, router]);

  useEffect(() => {
    if (!loading) {
      return;
    }

    let stepIndex = 0;
    const interval = window.setInterval(() => {
      stepIndex = Math.min(stepIndex + 1, ANALYSIS_STEPS.length - 1);
      setCurrentStage(ANALYSIS_STEPS[stepIndex]);
      setProgress((current) => Math.min(current + 18, 90));
    }, 1200);

    return () => {
      window.clearInterval(interval);
    };
  }, [loading]);

  useEffect(() => {
    if (!token || !analysisId || analysis?.id === analysisId) {
      return;
    }

    let cancelled = false;

    const loadAnalysis = async () => {
      setLoading(true);
      setProgress(35);
      setCurrentStage('Loading saved analysis...');
      setError('');

      try {
        const result = await api.getAnalysis(analysisId, token);
        if (cancelled) {
          return;
        }

        setAnalysis(result.analysis);
        setPair(result.analysis.pair);
        setTimeframe(result.analysis.timeframe);
        setCurrentPrice(String(result.analysis.currentPrice ?? ''));
        setShowAiZones(Boolean(result.analysis.markedImageUrl));
        setProgress(100);
      } catch (loadError: any) {
        if (cancelled) {
          return;
        }

        setError(loadError.message || 'Unable to load saved analysis.');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadAnalysis();

    return () => {
      cancelled = true;
    };
  }, [analysis?.id, analysisId, token]);

  const handleAnalyze = async () => {
    if (!user || !token) {
      setAuthMode('login');
      setAuthOpen(true);
      return;
    }

    if (!file || !pair || !timeframe || !currentPrice.trim()) {
      setError('Please upload a chart, select a pair, choose a timeframe, and enter the current price.');
      return;
    }

    if (file2 && !timeframe2) {
      setError('Please select a timeframe for the second chart.');
      return;
    }

    setLoading(true);
    setQueueStarting(!isPro);
    setError('');
    setAnalysis(null);
    setProgress(8);
    setCurrentStage(ANALYSIS_STEPS[0]);

    try {
      await saveAnalyzeDraft({
        pair,
        timeframe,
        timeframe2,
        currentPrice: currentPrice.trim(),
        file,
        file2,
      });

      const formData = new FormData();
      formData.append('chart', file);
      formData.append('pair', pair);
      formData.append('timeframe', timeframe);
      formData.append('currentPrice', currentPrice.trim());

      if (file2) {
        formData.append('chart2', file2);
        formData.append('timeframe2', timeframe2);
      }

      const result = await api.analyzeChartUpload(formData, token);

      // Free users get queued — redirect to queue waiting page
      if (result.queued && result.jobId) {
        router.push(`/analyze/queue?jobId=${result.jobId}&analysisId=${result.analysisId || ''}`);
        return;
      }

      // Pro users get instant result
      if (result.analysis) {
        setProgress(100);
        setCurrentStage(ANALYSIS_STEPS[ANALYSIS_STEPS.length - 1]);
        setAnalysis(result.analysis);
        setShowAiZones(Boolean(result.analysis.markedImageUrl));
        await refreshUser().catch(() => {});
      }
      setLoading(false);
      setQueueStarting(false);
    } catch (submitError: any) {
      if (/daily analysis limit reached/i.test(submitError?.message || '')) {
        await refreshUser().catch(() => {});
      }
      setError(submitError.message || 'Unable to start analysis.');
      setLoading(false);
      setQueueStarting(false);
    }
  };

  if (queueStarting && !isPro) {
    return <QueueTransitionScreen />;
  }

  const trend = analysis?.trend || 'ranging';
  const signalType = analysis?.signalType || 'wait';
  const originalChartUrl = preview || resolveAssetUrl(analysis?.originalImageUrl || analysis?.imageUrl || null);
  const markedChartUrl = resolveAssetUrl(analysis?.markedImageUrl || null);
  const displayedChartUrl = showAiZones && markedChartUrl ? markedChartUrl : originalChartUrl;
  const displayedSteps = ANALYSIS_STEPS.map((step, index) => ({
    step,
    complete: progress >= (index + 1) * 20 || currentStage === step,
  }));

  return (
    <div className="min-h-screen py-8">
      <div className="page-shell">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28 }}
          className="max-w-7xl mx-auto"
        >
          <div className="text-center mb-8">
            <h1 className="mb-2 text-2xl font-bold sm:text-3xl md:text-4xl">
              <span className="text-gradient">SMC Signal Engine</span>
            </h1>
            <p className="mx-auto max-w-2xl text-sm text-muted-foreground sm:text-base">
              TradeVision analyzes charts through Smart Money Concepts, prioritizing market structure, liquidity, and confirmation over forced entries.
            </p>
          </div>

          {!analysis ? (
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
              <Card className="mobile-card">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Upload className="h-5 w-5 text-primary" />
                    {isDualChart ? 'Chart 1 — Higher Timeframe' : 'Upload Chart'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div
                    {...getRootProps()}
                    className={`cursor-pointer rounded-2xl border-2 border-dashed p-5 text-center transition-all duration-200 sm:p-8 ${
                      isDragActive
                        ? 'border-primary bg-primary/10'
                        : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                    }`}
                  >
                    <input {...getInputProps()} />
                    {preview ? (
                      <div className="space-y-4">
                        <img src={preview} alt="Chart preview" className="mx-auto h-auto max-h-[400px] w-full rounded-xl object-contain md:max-h-[600px]" />
                        <p className="text-sm text-muted-foreground">Click or drag to replace</p>
                      </div>
                    ) : (
                      <div className="space-y-4 py-8">
                        <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground" />
                        <div>
                          <p className="font-medium mb-1">Drag & drop your chart screenshot</p>
                          <p className="text-sm text-muted-foreground">PNG, JPG, or WebP up to 10MB</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {isPro && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-1.5">
                        <Crown className="h-3.5 w-3.5 text-yellow-400" />
                        Chart 2 — Lower Timeframe
                        <span className="text-xs text-muted-foreground">(Optional)</span>
                      </label>
                      {preview2 ? (
                        <div className="relative">
                          <div
                            {...getRootProps2()}
                            className={`cursor-pointer rounded-2xl border-2 border-dashed p-4 text-center transition-all duration-200 ${
                              isDragActive2
                                ? 'border-primary bg-primary/10'
                                : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                            }`}
                          >
                            <input {...getInputProps2()} />
                            <img src={preview2} alt="Chart 2 preview" className="mx-auto h-auto max-h-[250px] w-full rounded-xl object-contain" />
                            <p className="mt-2 text-sm text-muted-foreground">Click or drag to replace</p>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setFile2(null); setPreview2(null); setTimeframe2(''); }}
                            className="absolute top-2 right-2 rounded-full bg-red-500/80 hover:bg-red-500 p-1 text-white text-xs"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div
                          {...getRootProps2()}
                          className={`cursor-pointer rounded-2xl border-2 border-dashed p-4 text-center transition-all duration-200 ${
                            isDragActive2
                              ? 'border-primary bg-primary/10'
                              : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                          }`}
                        >
                          <input {...getInputProps2()} />
                          <div className="space-y-2 py-4">
                            <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">Upload a second chart for multi-timeframe analysis</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="mobile-card">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Chart Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Pair / Index</label>
                    <select
                      value={pair}
                      onChange={(event) => setPair(event.target.value)}
                      className="h-12 w-full rounded-xl border border-input bg-background/50 px-3 text-sm focus:ring-2 focus:ring-ring"
                    >
                      <option value="">Select pair or index...</option>
                      {PAIRS.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>

                  {isDualChart ? (
                    <>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Chart 1 Timeframe (HTF)</label>
                        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-3">
                          {TIMEFRAMES.map((option) => (
                            <button
                              key={option}
                              onClick={() => setTimeframe(option)}
                              className={`h-10 rounded-xl border px-2 text-sm font-medium transition-all ${
                                timeframe === option
                                  ? 'border-primary bg-primary/20 text-primary'
                                  : 'border-white/10 hover:border-white/20 text-muted-foreground'
                              }`}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Chart 2 Timeframe (LTF)</label>
                        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-3">
                          {TIMEFRAMES.map((option) => (
                            <button
                              key={`tf2-${option}`}
                              onClick={() => setTimeframe2(option)}
                              className={`h-10 rounded-xl border px-2 text-sm font-medium transition-all ${
                                timeframe2 === option
                                  ? 'border-primary bg-primary/20 text-primary'
                                  : 'border-white/10 hover:border-white/20 text-muted-foreground'
                              }`}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Timeframe</label>
                      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-3">
                        {TIMEFRAMES.map((option) => (
                          <button
                            key={option}
                            onClick={() => setTimeframe(option)}
                            className={`h-12 rounded-xl border px-2 text-sm font-medium transition-all ${
                              timeframe === option
                                ? 'border-primary bg-primary/20 text-primary'
                                : 'border-white/10 hover:border-white/20 text-muted-foreground'
                            }`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Current Price</label>
                    <Input
                      type="number"
                      inputMode="decimal"
                      step="any"
                      value={currentPrice}
                      onChange={(event) => setCurrentPrice(event.target.value)}
                      placeholder="Enter the live price shown on your chart"
                    />
                    <p className="text-xs text-muted-foreground">
                      Required. The system uses this price as the anchor for entry, stop loss, and take profit calculations.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Activity className="h-4 w-4 text-blue-400" />
                      Analysis Pipeline
                    </div>
                    {[
                      'Uploading chart...',
                      'Analyzing market structure...',
                      'Filtering signal quality...',
                      'Building execution plan...',
                      'Preparing final signal...',
                    ].map((step) => (
                      <div key={step} className="text-sm text-muted-foreground">{step}</div>
                    ))}
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
                      <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                      {error}
                    </div>
                  )}

                  <Button
                    variant="glow"
                    size="lg"
                    className="w-full gap-2"
                    onClick={handleAnalyze}
                    disabled={loading || !file}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Analyzing SMC structure...
                      </>
                    ) : (
                      <>
                        <Brain className="h-5 w-5" />
                        Generate Signal
                      </>
                    )}
                  </Button>

                  {!user && (
                    <p className="text-xs text-center text-muted-foreground">
                      You need to sign in to analyze charts.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28 }}
              className="mx-auto max-w-6xl space-y-6 sm:space-y-8"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant={trend === 'bullish' ? 'success' : trend === 'bearish' ? 'destructive' : 'warning'} className="text-base px-4 py-1">
                    {trend === 'bullish'
                      ? <TrendingUp className="h-4 w-4 mr-1" />
                      : trend === 'bearish'
                        ? <TrendingDown className="h-4 w-4 mr-1" />
                        : <Minus className="h-4 w-4 mr-1" />}
                    {trend}
                  </Badge>
                  <Badge variant="outline" className="text-sm px-3 py-1 border-blue-500/40 text-blue-300 bg-blue-500/10">
                    <CandlestickChart className="h-4 w-4 mr-1" />
                    {analysis.assetClass || 'market'}
                  </Badge>
                  <Badge variant="outline" className="text-sm px-3 py-1 border-purple-500/40 text-purple-300 bg-purple-500/10">
                    <Brain className="h-4 w-4 mr-1" />
                    TradeVision
                  </Badge>
                  <Badge
                    variant={analysis.recommendation === 'wait' ? 'warning' : 'success'}
                    className="text-sm px-3 py-1"
                  >
                    <Sparkles className="h-4 w-4 mr-1" />
                    {signalType}
                  </Badge>
                  <span className="text-muted-foreground">
                    {pair} · {analysis?.isDualChart ? `${timeframe} / ${timeframe2}` : timeframe}
                  </span>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    clearAnalyzeDraft();
                    router.replace('/analyze');
                    setAnalysis(null);
                    setFile(null);
                    setPreview(null);
                    setFile2(null);
                    setPreview2(null);
                    setTimeframe2('');
                    setActiveChart('ltf');
                    setShowAiZones(true);
                    setProgress(0);
                    setCurrentStage(ANALYSIS_STEPS[0]);
                    setError('');
                  }}
                >
                  New Analysis
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
                <div className="lg:col-span-2 space-y-6">
                  {analysis?.isDualChart ? (
                    <Card className="mobile-card">
                      <CardHeader>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Eye className="h-5 w-5 text-primary" />
                            {activeChart === 'htf' ? `HTF Chart (${analysis.htfTimeframe || timeframe})` : `LTF Chart (${analysis.ltfTimeframe || timeframe2})`}
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            <div className="flex rounded-lg border border-white/10 overflow-hidden">
                              <button
                                onClick={() => setActiveChart('htf')}
                                className={`px-3 py-1.5 text-sm font-medium transition-all ${
                                  activeChart === 'htf'
                                    ? 'bg-primary/20 text-primary'
                                    : 'text-muted-foreground hover:text-foreground'
                                }`}
                              >
                                HTF
                              </button>
                              <button
                                onClick={() => setActiveChart('ltf')}
                                className={`px-3 py-1.5 text-sm font-medium transition-all ${
                                  activeChart === 'ltf'
                                    ? 'bg-primary/20 text-primary'
                                    : 'text-muted-foreground hover:text-foreground'
                                }`}
                              >
                                LTF
                              </button>
                            </div>
                            <Button
                              variant={showAiZones ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setShowAiZones((current) => !current)}
                            >
                              Show AI Zones
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {activeChart === 'htf' ? (
                          <>
                            <img
                              src={(showAiZones && analysis.htfMarkedImageUrl ? resolveAssetUrl(analysis.htfMarkedImageUrl) : resolveAssetUrl(analysis.htfOriginalImageUrl || null)) || preview || ''}
                              alt="HTF Chart"
                              className="h-auto max-h-[400px] w-full rounded-xl object-contain md:max-h-[600px] cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => setLightboxSrc((showAiZones && analysis.htfMarkedImageUrl ? resolveAssetUrl(analysis.htfMarkedImageUrl) : resolveAssetUrl(analysis.htfOriginalImageUrl || null)) || preview || '')}
                            />
                            {analysis.htfChartBounds && (
                              <p className="mt-3 text-xs text-muted-foreground">
                                HTF markup range: {formatPrice(analysis.htfChartBounds.minPrice, pair)} to {formatPrice(analysis.htfChartBounds.maxPrice, pair)}
                              </p>
                            )}
                          </>
                        ) : (
                          <>
                            <img
                              src={(showAiZones && analysis.ltfMarkedImageUrl ? resolveAssetUrl(analysis.ltfMarkedImageUrl) : resolveAssetUrl(analysis.ltfOriginalImageUrl || null)) || preview2 || preview || ''}
                              alt="LTF Chart"
                              className="h-auto max-h-[400px] w-full rounded-xl object-contain md:max-h-[600px] cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => setLightboxSrc((showAiZones && analysis.ltfMarkedImageUrl ? resolveAssetUrl(analysis.ltfMarkedImageUrl) : resolveAssetUrl(analysis.ltfOriginalImageUrl || null)) || preview2 || preview || '')}
                            />
                            {analysis.ltfChartBounds && (
                              <p className="mt-3 text-xs text-muted-foreground">
                                LTF markup range: {formatPrice(analysis.ltfChartBounds.minPrice, pair)} to {formatPrice(analysis.ltfChartBounds.maxPrice, pair)}
                              </p>
                            )}
                          </>
                        )}
                      </CardContent>
                    </Card>
                  ) : displayedChartUrl && (
                    <Card className="mobile-card">
                      <CardHeader>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Eye className="h-5 w-5 text-primary" />
                            {showAiZones && markedChartUrl ? 'Marked Chart' : 'Original Chart'}
                          </CardTitle>
                          <Button
                            variant={showAiZones ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setShowAiZones((current) => !current)}
                            disabled={!markedChartUrl}
                          >
                            Show AI Zones
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <img
                          src={displayedChartUrl}
                          alt="Chart"
                          className="h-auto max-h-[400px] w-full rounded-xl object-contain md:max-h-[600px] cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => displayedChartUrl && setLightboxSrc(displayedChartUrl)}
                        />
                        {!markedChartUrl && (
                          <p className="mt-3 text-xs text-muted-foreground">
                            Markup was unavailable for this analysis, so the original chart is shown.
                          </p>
                        )}
                        {analysis?.chartBounds && (
                          <p className="mt-3 text-xs text-muted-foreground">
                            Markup mapping range: {formatPrice(analysis.chartBounds.minPrice, pair)} to {formatPrice(analysis.chartBounds.maxPrice, pair)} ({analysis.chartBounds.source === 'input' ? 'manual' : 'auto-mapped'})
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  <Card className="mobile-card">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Brain className="h-5 w-5 text-primary" />
                        SMC Reasoning
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground leading-relaxed">{analysis.reasoning}</p>
                    </CardContent>
                  </Card>

                  <Card className="mobile-card">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-primary" />
                        Market Structure
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Trend</p>
                          <p className="font-semibold capitalize">{analysis.trend}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Market Condition</p>
                          <p className="font-semibold capitalize">{analysis.marketCondition || 'Not identified'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Structure State</p>
                          <p className="font-semibold capitalize">{analysis.structure.state || 'transition'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Primary Strategy</p>
                          <p className="font-semibold">{analysis.primaryStrategy || 'Not selected'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Current Price Position</p>
                          <p className="font-semibold capitalize">{analysis.currentPricePosition}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">BOS</p>
                          <p className="font-semibold capitalize">{analysis.structure.bos}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">CHoCH</p>
                          <p className="font-semibold capitalize">{analysis.structure.choch}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Setup Quality</p>
                          <p className="font-semibold capitalize">{analysis.setupQuality}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Signal Type</p>
                          <p className="font-semibold capitalize">{signalType}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Entry Logic</p>
                          <p className="font-semibold capitalize">{analysis.entryLogic.type}</p>
                        </div>
                        {analysis.entryPlan && (
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Entry Bias</p>
                            <p className="font-semibold capitalize">{analysis.entryPlan.bias}</p>
                          </div>
                        )}
                      </div>

                      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <p className="text-sm text-muted-foreground mb-2">Confirmations</p>
                        {analysis.confirmations && analysis.confirmations.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {analysis.confirmations.map((confirmationItem, index) => (
                              <Badge
                                key={`${confirmationItem}-${index}`}
                                variant="outline"
                                className="border-cyan-500/30 bg-cyan-500/10 text-cyan-200"
                              >
                                {confirmationItem}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm leading-relaxed text-muted-foreground">No explicit confirmations were returned for this setup.</p>
                        )}
                      </div>

                      {isPro && analysis.pricePosition?.explanation && (
                        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                          <p className="text-sm text-muted-foreground mb-2">Premium / Discount Explanation</p>
                          <p className="text-sm leading-relaxed">{analysis.pricePosition.explanation}</p>
                        </div>
                      )}

                      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <p className="text-sm text-muted-foreground mb-2">System Message</p>
                        <p className="text-sm leading-relaxed">{analysis.message}</p>
                      </div>

                      {isPro && analysis.entryPlan?.reason && (
                        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                          <p className="text-sm text-muted-foreground mb-2">Entry Plan Reason</p>
                          <p className="text-sm leading-relaxed">{analysis.entryPlan.reason}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="mobile-card">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Activity className="h-5 w-5 text-primary" />
                        Liquidity
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Liquidity Type</p>
                        <p className="font-semibold capitalize">{analysis.liquidity.type || 'none'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Liquidity Sweep</p>
                        <p className="font-semibold capitalize">{analysis.liquidity.sweep}</p>
                      </div>
                      {isPro ? (
                        <>
                          {analysis.liquidity.description && (
                            <div>
                              <p className="text-sm text-muted-foreground mb-2">Liquidity Explanation</p>
                              <p className="text-sm leading-relaxed text-muted-foreground">{analysis.liquidity.description}</p>
                            </div>
                          )}
                          <div>
                            <p className="text-sm text-muted-foreground mb-2">Liquidity Zones</p>
                            {analysis.liquidity.liquidityZones.length > 0 ? (
                              <div className="space-y-2">
                                {analysis.liquidity.liquidityZones.map((zone, index) => (
                                  <div key={`${zone}-${index}`} className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-muted-foreground">
                                    {zone}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">No clear liquidity zones were identified.</p>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-3 flex items-center gap-2">
                          <Lock className="h-4 w-4 text-purple-400 shrink-0" />
                          <p className="text-xs text-muted-foreground">
                            Detailed liquidity analysis available on <Link href="/pricing" className="text-purple-400 underline underline-offset-2">Pro</Link>
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-6">
                  <Card className="mobile-card">
                    <CardContent className="p-6">
                      <ConfidenceMeter score={analysis.confidence || 0} />
                    </CardContent>
                  </Card>

                  <Card className="mobile-card">
                    <CardHeader>
                      <CardTitle className="text-lg">Supply And Demand</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <CircleDollarSign className="h-4 w-4 text-emerald-400" />
                          Current Price
                        </div>
                        <p className="text-sm text-muted-foreground pl-6">{formatPrice(analysis.currentPrice, pair)}</p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <ShieldAlert className="h-4 w-4 text-red-400" />
                          Supply Zone
                        </div>
                        <p className="text-sm text-muted-foreground pl-6">{formatStructuredZone(analysis.zones.supplyZone, pair)}</p>
                        <p className="text-xs text-muted-foreground pl-6">{formatZoneReason(analysis.zones.supplyZone?.reason)}</p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <CheckCircle2 className="h-4 w-4 text-green-400" />
                          Demand Zone
                        </div>
                        <p className="text-sm text-muted-foreground pl-6">{formatStructuredZone(analysis.zones.demandZone, pair)}</p>
                        <p className="text-xs text-muted-foreground pl-6">{formatZoneReason(analysis.zones.demandZone?.reason)}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="mobile-card">
                    <CardContent className="p-6 space-y-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Zap className="h-4 w-4 text-purple-400" />
                          <span className="text-sm font-medium">Signal Type</span>
                        </div>
                        <p className="text-sm text-purple-400 font-semibold capitalize">{signalType}</p>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Target className="h-4 w-4 text-cyan-400" />
                          <span className="text-sm font-medium">Entry Zone</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{formatStructuredZone(analysis.entryZone, pair)}</p>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="h-4 w-4 text-yellow-400" />
                          <span className="text-sm font-medium">Wait For</span>
                        </div>
                        <p className="text-sm text-muted-foreground capitalize">
                          {analysis.confirmation === 'none' ? 'No confirmation yet' : `${analysis.confirmation} confirmation`}
                        </p>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="h-4 w-4 text-emerald-400" />
                          <span className="text-sm font-medium">Confirmation Needed</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{analysis.confirmationNeeded ? 'Yes' : 'No'}</p>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="h-4 w-4 text-orange-400" />
                          <span className="text-sm font-medium">System Message</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{analysis.message}</p>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <ShieldAlert className="h-4 w-4 text-red-400" />
                          <span className="text-sm font-medium">Invalidation</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {typeof analysis.invalidationLevel === 'number'
                            ? `${formatPrice(analysis.invalidationLevel, pair)} · ${analysis.invalidationReason || 'Invalidation explanation not available'}`
                            : analysis.invalidationReason || 'Invalidation explanation not available'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {isPro && (analysis.stopLoss || analysis.takeProfit1) ? (
                    <Card className="mobile-card border-amber-500/30 bg-amber-500/5">
                      <CardContent className="p-6 space-y-4">
                        <div className="flex items-center gap-2 mb-1">
                          <Target className="h-4 w-4 text-amber-400" />
                          <span className="text-sm font-medium">Risk Management Levels</span>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-500/40 text-amber-300">
                            {analysis.finalVerdict?.action === 'enter' ? 'DEFINITIVE' : 'PROJECTED'}
                          </Badge>
                        </div>
                        {analysis.stopLoss != null && (
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <ShieldAlert className="h-3.5 w-3.5 text-red-400" />
                              <span className="text-xs font-medium text-red-400">Stop Loss</span>
                            </div>
                            <p className="text-sm font-semibold pl-5">{formatPrice(analysis.stopLoss, pair)}</p>
                          </div>
                        )}
                        {analysis.takeProfit1 != null && (
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
                              <span className="text-xs font-medium text-green-400">Take Profit 1</span>
                            </div>
                            <p className="text-sm font-semibold pl-5">{formatPrice(analysis.takeProfit1, pair)}</p>
                          </div>
                        )}
                        {analysis.takeProfit2 != null && (
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                              <span className="text-xs font-medium text-emerald-400">Take Profit 2</span>
                            </div>
                            <p className="text-sm font-semibold pl-5">{formatPrice(analysis.takeProfit2, pair)}</p>
                          </div>
                        )}
                        {analysis.takeProfit3 != null && (
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <CheckCircle2 className="h-3.5 w-3.5 text-teal-400" />
                              <span className="text-xs font-medium text-teal-400">Take Profit 3</span>
                            </div>
                            <p className="text-sm font-semibold pl-5">{formatPrice(analysis.takeProfit3, pair)}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ) : !isPro ? (
                    <Card className="mobile-card border-purple-500/30 bg-purple-500/5">
                      <CardContent className="p-6">
                        <div className="flex flex-col items-center text-center space-y-3">
                          <div className="rounded-full bg-purple-500/10 p-3">
                            <Lock className="h-5 w-5 text-purple-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">Stop Loss & Take Profit Levels</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Upgrade to Pro for exact SL/TP levels, deeper analysis, and AI chart markup.
                            </p>
                          </div>
                          <Link href="/pricing">
                            <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white">
                              <Crown className="h-3.5 w-3.5 mr-1.5" />
                              Upgrade to Pro
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  ) : null}

                </div>
              </div>
            </motion.div>
          )}

          <AnimatePresence>
            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm"
              >
                  <div className="w-full max-w-md space-y-6 px-6 text-center">
                  <CandlestickWave />
                  <div className="space-y-3">
                    <motion.p
                      key={currentStage}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="text-base text-muted-foreground sm:text-lg"
                    >
                      {currentStage}
                    </motion.p>
                    <Progress value={progress} className="h-3" />
                    <p className="text-sm text-muted-foreground/60">Live analysis in progress · {progress}%</p>
                  </div>

                  <div className="space-y-2 rounded-xl border border-white/10 bg-white/5 p-4 text-left">
                    {displayedSteps.map(({ step, complete }) => (
                      <div key={step} className="flex items-center gap-2 text-sm">
                        {complete ? <CheckCircle2 className="h-4 w-4 text-green-400" /> : <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />}
                        <span className={complete ? 'text-foreground' : 'text-muted-foreground'}>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AuthModal
            open={authOpen}
            onOpenChange={setAuthOpen}
            mode={authMode}
            onModeChange={setAuthMode}
          />

          <ChartLightbox
            src={lightboxSrc || ''}
            open={Boolean(lightboxSrc)}
            onClose={() => setLightboxSrc(null)}
          />
        </motion.div>
      </div>
    </div>
  );
}

export default function AnalyzePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center py-8">
          <div className="text-sm text-muted-foreground">Loading analysis workspace...</div>
        </div>
      }
    >
      <AnalyzePageContent />
    </Suspense>
  );
}