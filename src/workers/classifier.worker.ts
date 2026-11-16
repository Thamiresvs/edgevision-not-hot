import { pipeline, env } from '@huggingface/transformers';

env.allowLocalModels = false;

class ImageClassifierSingleton {
  static task = 'image-classification' as const;
  static model = 'Xenova/vit-base-patch16-224';
  static instance: any = null;

  static async getInstance(progressCallback?: (progress: any) => void) {
    if (this.instance === null) {
      this.instance = await pipeline(this.task, this.model, {
        device: 'webgpu' in navigator ? 'webgpu' : 'wasm',
        progress_callback: progressCallback,
      });
    }
    return this.instance;
  }
}

self.addEventListener('message', async (event: MessageEvent) => {
  const { imageUrl } = event.data;

  try {
    const classifier = await ImageClassifierSingleton.getInstance((progress) => {
      self.postMessage({ status: 'progress', progress });
    });

    const results = await classifier(imageUrl, { top_k: 5 });
    const hotdogMatch = results.find((r: { label: string; score: number }) =>
      r.label.toLowerCase().includes('hotdog') || r.label.toLowerCase().includes('hot dog')
    );

    self.postMessage({
      status: 'complete',
      isHotdog: Boolean(hotdogMatch && hotdogMatch.score > 0.35),
      confidence: hotdogMatch ? hotdogMatch.score : results[0]?.score ?? 0,
      topPredictions: results,
    });
  } catch (error: any) {
    self.postMessage({ status: 'error', error: error.message });
  }
});
