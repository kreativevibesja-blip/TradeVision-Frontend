'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
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

const LOADING_MESSAGES = [
  'Scanning price structure...',
  'Detecting liquidity zones...',
  'Evaluating market conditions...',
  'Generating trade plan...',
];

function CandlestickWave() {
  return (
    <div className="flex items-end gap-1.5 h-20 justify-center">
      {Array.from({ length: 9 }).map((_, i) => (
        <motion.div
          key={i}
          className={`w-2.5 rounded-sm ${i % 3 === 0 ? 'bg-red-500/60' : 'bg-green-500/60'}`}
          animate={{ height: [8, 30 + Math.random() * 40, 8] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.12, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

function ConfidenceMeter({ score }: { score: number }) {
  const getColor = (s: number) => {
    if (s >= 70) return 'text-green-400';
    if (s >= 40) return 'text-yellow-400';
    return 'text-red-400';
  };
  const getBarColor = (s: number) => {
    if (s >= 70) return 'bg-gradient-to-r from-green-500 to-emerald-400';
    if (s >= 40) return 'bg-gradient-to-r from-yellow-500 to-orange-400';
    return 'bg-gradient-to-r from-red-500 to-rose-400';
  };
  const getLabel = (s: number) => {
    if (s >= 80) return 'High Confidence';
    if (s >= 60) return 'Moderate Confidence';
    if (s >= 40) return 'Low Confidence';
    return 'Very Low Confidence';
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-end">
        <span className="text-sm text-muted-foreground">Trade Score</span>
        <span className={`text-3xl font-bold ${getColor(score)}`}>{score}<span className="text-lg text-muted-foreground">/100</span></span>
      </div>
      <Progress value={score} className="h-3" indicatorClassName={getBarColor(score)} />
      <p className={`text-sm font-medium ${getColor(score)}`}>{getLabel(score)}</p>
    </div>
  );
}

export default function AnalyzePage() {
  const { user, token } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [pair, setPair] = useState('');
  const [timeframe, setTimeframe] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState(0);
  const [analysis, setAnalysis] = useState<any>(null);
  const [error, setError] = useState('');
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const f = acceptedFiles[0];
    if (f) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
      setAnalysis(null);
      setError('');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/png': ['.png'], 'image/jpeg': ['.jpg', '.jpeg'], 'image/webp': ['.webp'] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  const handleAnalyze = async () => {
    if (!user || !token) {
      setAuthOpen(true);
      return;
    }
    if (!file || !pair || !timeframe) {
      setError('Please upload a chart, select a pair, and choose a timeframe.');
      return;
    }

    setLoading(true);
    setError('');
    setAnalysis(null);
    setLoadingMsg(0);

    const msgInterval = setInterval(() => {
      setLoadingMsg((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 2500);

    try {
      const formData = new FormData();
      formData.append('chart', file);
      formData.append('pair', pair);
      formData.append('timeframe', timeframe);

      const uploadResult = await api.uploadChart(formData, token);
      const result = await api.analyzeChart(
        { imageUrl: uploadResult.imageUrl, pair, timeframe },
        token
      );

      setAnalysis(result.analysis);
    } catch (err: any) {
      setError(err.message || 'Analysis failed. Please try again.');
    } finally {
      clearInterval(msgInterval);
      setLoading(false);
    }
  };

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
              <span className="text-gradient">Chart Analysis</span>
            </h1>
            <p className="text-muted-foreground">Upload your trading chart and get instant AI analysis</p>
          </div>

          {!analysis ? (
            /* ═══════ UPLOAD & SETTINGS ═══════ */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {/* Upload Zone */}
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
                        <img
                          src={preview}
                          alt="Chart preview"
                          className="max-h-64 mx-auto rounded-lg"
                        />
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

              {/* Settings */}
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
                      onChange={(e) => setPair(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-input bg-background/50 text-sm focus:ring-2 focus:ring-ring"
                    >
                      <option value="">Select pair or index...</option>
                      {PAIRS.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Timeframe</label>
                    <div className="grid grid-cols-3 gap-2">
                      {TIMEFRAMES.map((tf) => (
                        <button
                          key={tf}
                          onClick={() => setTimeframe(tf)}
                          className={`h-10 rounded-lg border text-sm font-medium transition-all ${
                            timeframe === tf
                              ? 'border-primary bg-primary/20 text-primary'
                              : 'border-white/10 hover:border-white/20 text-muted-foreground'
                          }`}
                        >
                          {tf}
                        </button>
                      ))}
                    </div>
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
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Brain className="h-5 w-5" />
                        Analyze Chart
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
            /* ═══════ RESULTS ═══════ */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8 max-w-6xl mx-auto"
            >
              {/* Top Bar */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant={analysis.bias === 'BULLISH' ? 'success' : analysis.bias === 'BEARISH' ? 'destructive' : 'warning'} className="text-base px-4 py-1">
                    {analysis.bias === 'BULLISH' ? <TrendingUp className="h-4 w-4 mr-1" /> : analysis.bias === 'BEARISH' ? <TrendingDown className="h-4 w-4 mr-1" /> : <Minus className="h-4 w-4 mr-1" />}
                    {analysis.bias}
                  </Badge>
                  {analysis.marketCondition && (
                    <Badge variant="outline" className="text-sm px-3 py-1 border-blue-500/40 text-blue-300 bg-blue-500/10">
                      <CandlestickChart className="h-4 w-4 mr-1" />
                      {analysis.marketCondition}
                    </Badge>
                  )}
                  <span className="text-muted-foreground">{pair} · {timeframe}</span>
                </div>
                <Button
                  variant="outline"
                  onClick={() => { setAnalysis(null); setFile(null); setPreview(null); }}
                >
                  New Analysis
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Chart Preview */}
                <div className="lg:col-span-2 space-y-6">
                  {preview && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Eye className="h-5 w-5 text-primary" />
                          Annotated Chart
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="relative rounded-lg overflow-hidden">
                          <img src={preview} alt="Chart" className="w-full rounded-lg" />
                          {/* Overlay markers */}
                          <div className="absolute inset-0">
                            <div className="absolute bottom-[30%] left-[10%] right-[10%] h-12 bg-green-500/10 border border-green-500/30 rounded flex items-center justify-center">
                              <span className="text-xs font-medium text-green-400">Entry Zone: {analysis.entry}</span>
                            </div>
                            <div className="absolute bottom-[20%] left-[10%] right-[10%] border-t-2 border-dashed border-red-500/60">
                              <span className="text-xs text-red-400 bg-red-500/20 px-2 py-0.5 rounded absolute -top-5 left-0">SL: {analysis.stopLoss}</span>
                            </div>
                            {analysis.takeProfits?.map((tp: string, i: number) => (
                              <div key={i} className="absolute left-[10%] right-[10%] border-t-2 border-dashed border-green-500/40" style={{ top: `${15 - i * 8}%` }}>
                                <span className="text-xs text-green-400 bg-green-500/20 px-2 py-0.5 rounded absolute -top-5 right-0">TP{i + 1}: {tp}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* AI Explanation */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Brain className="h-5 w-5 text-primary" />
                        AI Explanation
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground leading-relaxed">{analysis.analysisText}</p>
                    </CardContent>
                  </Card>

                  {/* Structure Details */}
                  {analysis.structure && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <BarChart3 className="h-5 w-5 text-primary" />
                          Structure Analysis
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {[
                            { label: 'Break of Structure', items: analysis.structure.bos, color: 'blue' },
                            { label: 'Change of Character', items: analysis.structure.choch, color: 'purple' },
                            { label: 'Liquidity Zones', items: analysis.structure.liquidityZones, color: 'yellow' },
                            { label: 'Support & Resistance', items: analysis.structure.supportResistance, color: 'cyan' },
                          ].map((section) => (
                            <div key={section.label} className="space-y-2">
                              <h4 className="text-sm font-medium">{section.label}</h4>
                              {section.items?.length > 0 ? (
                                <ul className="space-y-1">
                                  {section.items.map((item: string, i: number) => (
                                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                      <CheckCircle2 className="h-3 w-3 mt-1 flex-shrink-0 text-primary" />
                                      {item}
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-sm text-muted-foreground">Not detected</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Right Column - Analysis Details */}
                <div className="space-y-6">
                  {/* Confidence */}
                  <Card>
                    <CardContent className="p-6">
                      <ConfidenceMeter score={analysis.confidence || 0} />
                    </CardContent>
                  </Card>

                  {/* Key Levels */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Key Levels</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Target className="h-4 w-4 text-blue-400" />
                          Entry Zone
                        </div>
                        <p className="text-sm text-muted-foreground pl-6">{analysis.entry}</p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <ShieldAlert className="h-4 w-4 text-red-400" />
                          Stop Loss
                        </div>
                        <p className="text-sm text-muted-foreground pl-6">{analysis.stopLoss}</p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <CheckCircle2 className="h-4 w-4 text-green-400" />
                          Take Profits
                        </div>
                        {analysis.takeProfits?.map((tp: string, i: number) => (
                          <p key={i} className="text-sm text-muted-foreground pl-6">
                            TP{i + 1}: {tp}
                          </p>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {analysis.marketCondition && (
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center gap-2 mb-2">
                          <CandlestickChart className="h-4 w-4 text-blue-400" />
                          <span className="text-sm font-medium">Market Condition</span>
                        </div>
                        <p className="text-sm text-blue-300 font-semibold">{analysis.marketCondition}</p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Strategy */}
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="h-4 w-4 text-purple-400" />
                        <span className="text-sm font-medium">Strategy</span>
                      </div>
                      <p className="text-sm text-purple-400 font-semibold">{analysis.strategy}</p>
                    </CardContent>
                  </Card>

                  {/* Wait Conditions */}
                  {analysis.waitConditions && (
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="h-4 w-4 text-yellow-400" />
                          <span className="text-sm font-medium">Wait Conditions</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{analysis.waitConditions}</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Loading Overlay */}
          <AnimatePresence>
            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm"
              >
                <div className="text-center space-y-6">
                  <CandlestickWave />
                  <motion.p
                    key={loadingMsg}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-lg text-muted-foreground"
                  >
                    {LOADING_MESSAGES[loadingMsg]}
                  </motion.p>
                  <p className="text-sm text-muted-foreground/50">This may take 10-30 seconds</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      <AuthModal open={authOpen} onOpenChange={setAuthOpen} mode={authMode} onModeChange={setAuthMode} />
    </div>
  );
}
