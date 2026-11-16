import React, { useEffect, useRef, useState } from 'react';

interface Prediction {
  label: string;
  score: number;
}

export const HotdogDetector: React.FC = () => {
  const workerRef = useRef<Worker | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading-model' | 'inferring' | 'done'>('idle');
  const [progress, setProgress] = useState<number>(0);
  const [result, setResult] = useState<{
    isHotdog: boolean;
    confidence: number;
    topPredictions: Prediction[];
  } | null>(null);

  useEffect(() => {
    workerRef.current = new Worker(new URL('../workers/classifier.worker.ts', import.meta.url), {
      type: 'module',
    });

    workerRef.current.onmessage = (e) => {
      const msg = e.data;
      if (msg.status === 'progress' && msg.progress?.progress) {
        setStatus('loading-model');
        setProgress(Math.round(msg.progress.progress));
      } else if (msg.status === 'complete') {
        setStatus('done');
        setResult({
          isHotdog: msg.isHotdog,
          confidence: msg.confidence,
          topPredictions: msg.topPredictions,
        });
      }
    };

    return () => workerRef.current?.terminate();
  }, []);

  const handleFile = (file: File) => {
    const objectUrl = URL.createObjectURL(file);
    setImagePreview(objectUrl);
    setResult(null);
    setStatus('inferring');
    workerRef.current?.postMessage({ imageUrl: objectUrl });
  };

  return (
    <section className="w-full max-w-lg p-6 bg-zinc-900 text-zinc-100 rounded-2xl border border-zinc-800 space-y-5">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">EdgeVision: Hotdog or Not</h1>
        <p className="text-sm text-zinc-400">
          Inferência Vision Transformer (ViT) 100% no navegador via WebGPU/WASM + Web Worker. Zero custo de API.
        </p>
      </header>

      <label
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
        }}
        className="flex flex-col items-center justify-center h-52 border-2 border-dashed border-zinc-700 hover:border-emerald-400 rounded-xl cursor-pointer transition">
        {imagePreview ? (
          <img src={imagePreview} alt="Preview" className="h-full w-full object-contain rounded-xl p-2" />
        ) : (
          <span className="text-sm text-zinc-400">Arraste uma foto ou clique para selecionar</span>
        )}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
      </label>

      {status === 'loading-model' && (
        <div className="text-xs text-amber-400">Baixando pesos do modelo ViT para cache local: {progress}%</div>
      )}

      {status === 'inferring' && (
        <div className="text-xs text-sky-400 animate-pulse">Executando inferência na thread Worker...</div>
      )}

      {result && (
        <div
          className={`p-4 rounded-xl border ${
            result.isHotdog ? 'bg-emerald-950/60 border-emerald-500' : 'bg-rose-950/60 border-rose-500'
          }`}>
          <div className="flex items-center justify-between">
            <span className="text-xl font-black uppercase">
              {result.isHotdog ? 'É Cachorro-Quente!' : 'Não é Cachorro-Quente'}
            </span>
            <span className="text-sm font-mono">{(result.confidence * 100).toFixed(1)}% confiança</span>
          </div>
          <ul className="mt-3 space-y-1 text-xs text-zinc-300">
            {result.topPredictions.map((p) => (
              <li key={p.label} className="flex justify-between">
                <span>{p.label}</span>
                <span className="font-mono">{(p.score * 100).toFixed(1)}%</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
};
