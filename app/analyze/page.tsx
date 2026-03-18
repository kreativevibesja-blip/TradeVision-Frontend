'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { api, type AnalysisResult } from '@/lib/api';
import { AuthModal } from '@/components/AuthModal';
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
  'Analyzing market structure...',
  'Extracting structural logic...',
  'Anchoring trade levels...',
  'Preparing final signal...',
];

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

export default function AnalyzePage() {
  const { user, token } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [pair, setPair] = useState('');
  const [timeframe, setTimeframe] = useState('');
  const [currentPrice, setCurrentPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState(ANALYSIS_STEPS[0]);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState('');
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

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

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/png': ['.png'], 'image/jpeg': ['.jpg', '.jpeg'], 'image/webp': ['.webp'] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

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

    setLoading(true);
    setError('');
    setAnalysis(null);
    setProgress(8);
    setCurrentStage(ANALYSIS_STEPS[0]);

    try {
      const formData = new FormData();
      formData.append('chart', file);
      formData.append('pair', pair);
      formData.append('timeframe', timeframe);
      formData.append('currentPrice', currentPrice.trim());

      const result = await api.analyzeChartUpload(formData, token);
      setProgress(100);
      setCurrentStage(ANALYSIS_STEPS[ANALYSIS_STEPS.length - 1]);
      setAnalysis(result.analysis);
      setLoading(false);
    } catch (submitError: any) {
      setError(submitError.message || 'Unable to start analysis.');
      setLoading(false);
    }
  };

  const bias = analysis?.bias || 'NEUTRAL';
  const takeProfits = Array.isArray(analysis?.takeProfits)
    ? analysis.takeProfits.filter((value: unknown): value is number => typeof value === 'number' && Number.isFinite(value))
    : [];
  const displayedSteps = ANALYSIS_STEPS.map((step, index) => ({
    step,
    complete: progress >= (index + 1) * 20 || currentStage === step,
  }));

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto"
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              <span className="text-gradient">Hybrid Signal Engine</span>
            </h1>
            <p className="text-muted-foreground">
              Gemini reads structure only. Trade levels are anchored to your supplied live price to avoid fake precision.
            </p>
          </div>

          {!analysis ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Upload className="h-5 w-5 text-primary" />
                    Upload Chart
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${
                      isDragActive
                        ? 'border-primary bg-primary/10'
                        : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                    }`}
                  >
                    <input {...getInputProps()} />
                    {preview ? (
                      <div className="space-y-4">
                        <img src={preview} alt="Chart preview" className="max-h-64 mx-auto rounded-lg" />
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
                </CardContent>
              </Card>

              <Card>
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
                      className="w-full h-10 px-3 rounded-lg border border-input bg-background/50 text-sm focus:ring-2 focus:ring-ring"
                    >
                      <option value="">Select pair or index...</option>
                      {PAIRS.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Timeframe</label>
                    <div className="grid grid-cols-3 gap-2">
                      {TIMEFRAMES.map((option) => (
                        <button
                          key={option}
                          onClick={() => setTimeframe(option)}
                          className={`h-10 rounded-lg border text-sm font-medium transition-all ${
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

                  <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Activity className="h-4 w-4 text-blue-400" />
                      Analysis Pipeline
                    </div>
                    {ANALYSIS_STEPS.map((step) => (
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
                        Analyzing market structure...
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
              className="space-y-8 max-w-6xl mx-auto"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant={bias === 'BULLISH' ? 'success' : bias === 'BEARISH' ? 'destructive' : 'warning'} className="text-base px-4 py-1">
                    {bias === 'BULLISH'
                      ? <TrendingUp className="h-4 w-4 mr-1" />
                      : bias === 'BEARISH'
                        ? <TrendingDown className="h-4 w-4 mr-1" />
                        : <Minus className="h-4 w-4 mr-1" />}
                    {bias}
                  </Badge>
                  <Badge variant="outline" className="text-sm px-3 py-1 border-blue-500/40 text-blue-300 bg-blue-500/10">
                    <CandlestickChart className="h-4 w-4 mr-1" />
                    {analysis.assetClass || 'market'}
                  </Badge>
                  <Badge variant="outline" className="text-sm px-3 py-1 border-purple-500/40 text-purple-300 bg-purple-500/10">
                    <Brain className="h-4 w-4 mr-1" />
                    {analysis.provider === 'gemini-vision+anchor' ? 'Gemini Vision + Anchor' : 'Gemini'}
                  </Badge>
                  <Badge
                    variant={analysis.recommendation === 'wait' ? 'warning' : 'success'}
                    className="text-sm px-3 py-1"
                  >
                    <Sparkles className="h-4 w-4 mr-1" />
                    {analysis.recommendation}
                  </Badge>
                  <span className="text-muted-foreground">{pair} · {timeframe}</span>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setAnalysis(null);
                    setFile(null);
                    setPreview(null);
                    setProgress(0);
                    setCurrentStage(ANALYSIS_STEPS[0]);
                  }}
                >
                  New Analysis
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  {preview && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Eye className="h-5 w-5 text-primary" />
                          Uploaded Chart
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <img src={preview} alt="Chart" className="w-full rounded-lg" />
                      </CardContent>
                    </Card>
                  )}

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Brain className="h-5 w-5 text-primary" />
                        Signal Reasoning
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground leading-relaxed">{analysis.reasoning}</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-primary" />
                        Vision Structure
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Trend Strength</p>
                          <p className="font-semibold capitalize">{analysis.trendStrength}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Entry Type</p>
                          <p className="font-semibold capitalize">{analysis.entryType}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Recent High Zone</p>
                          <p className="font-semibold">{analysis.structure?.recentHighZone || 'Not available'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Recent Low Zone</p>
                          <p className="font-semibold">{analysis.structure?.recentLowZone || 'Not available'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Liquidity Context</p>
                          <p className="font-semibold capitalize">{analysis.liquidityContext || 'Not available'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Chart Clarity</p>
                          <p className="font-semibold capitalize">{analysis.clarity}</p>
                        </div>
                      </div>

                      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <p className="text-sm text-muted-foreground mb-2">Structure Summary</p>
                        <p className="text-sm leading-relaxed">{analysis.structureSummary}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-6">
                  <Card>
                    <CardContent className="p-6">
                      <ConfidenceMeter score={analysis.confidence || 0} />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Trade Levels</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <CircleDollarSign className="h-4 w-4 text-emerald-400" />
                          Current Price Anchor
                        </div>
                        <p className="text-sm text-muted-foreground pl-6">{formatPrice(analysis.currentPrice, pair)}</p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Target className="h-4 w-4 text-blue-400" />
                          Entry
                        </div>
                        <p className="text-sm text-muted-foreground pl-6">{formatPrice(analysis.entry, pair)}</p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <ShieldAlert className="h-4 w-4 text-red-400" />
                          Stop Loss
                        </div>
                        <p className="text-sm text-muted-foreground pl-6">{formatPrice(analysis.stopLoss, pair)}</p>
                      </div>
                      {takeProfits.length > 0 ? takeProfits.map((target: number, index: number) => (
                        <div key={`${target}-${index}`} className="space-y-2">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <CheckCircle2 className="h-4 w-4 text-green-400" />
                            {`Take Profit ${index + 1}`}
                          </div>
                          <p className="text-sm text-muted-foreground pl-6">{formatPrice(target, pair)}</p>
                        </div>
                      )) : (
                        <p className="text-sm text-muted-foreground">No trade levels were returned because the structure is not clean enough yet.</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6 space-y-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Zap className="h-4 w-4 text-purple-400" />
                          <span className="text-sm font-medium">Signal Type</span>
                        </div>
                        <p className="text-sm text-purple-400 font-semibold capitalize">{analysis.entryType}</p>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="h-4 w-4 text-yellow-400" />
                          <span className="text-sm font-medium">Wait Conditions</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{analysis.waitConditions || 'Wait for confirmation at the entry zone before execution.'}</p>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="h-4 w-4 text-emerald-400" />
                          <span className="text-sm font-medium">Recommendation</span>
                        </div>
                        <p className="text-sm text-muted-foreground capitalize">{analysis.recommendation || 'wait'}</p>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Target className="h-4 w-4 text-cyan-400" />
                          <span className="text-sm font-medium">Risk / Reward</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{analysis.riskReward || 'Not available'}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <CandlestickChart className="h-4 w-4 text-blue-400" />
                        <span className="text-sm font-medium">Anchoring Logic</span>
                      </div>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <p>Price Source: <span className="text-foreground font-medium capitalize">{analysis.priceSource}</span></p>
                        <p>Working Range: <span className="text-foreground font-medium">{formatPrice(analysis.range, pair)}</span></p>
                        <p>Execution Buffer: <span className="text-foreground font-medium">{formatPrice(analysis.buffer, pair)}</span></p>
                        <p>Method: <span className="text-foreground font-medium">Deterministic price anchoring from current price</span></p>
                      </div>
                    </CardContent>
                  </Card>
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
                <div className="text-center space-y-6 max-w-md w-full px-6">
                  <CandlestickWave />
                  <div className="space-y-3">
                    <motion.p
                      key={currentStage}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="text-lg text-muted-foreground"
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
        </motion.div>
      </div>
    </div>
  );
}