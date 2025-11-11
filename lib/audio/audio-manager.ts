type BufferMap = Record<string, AudioBuffer>;

interface PlayOptions {
  volume?: number; // 0-1
  detune?: number;
}

interface AudioPreset {
  id: string;
  src: string;
  gain: number;
}

export class AudioManager {
  private static instance: AudioManager;

  private context: AudioContext | null = null;
  private buffers: BufferMap = {};
  private presets: Record<string, AudioPreset> = {};
  private masterGain: GainNode | null = null;
  private ambientSource: AudioBufferSourceNode | null = null;
  private ambientGain: GainNode | null = null;

  private constructor() {}

  static getInstance() {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  registerPreset(preset: AudioPreset) {
    this.presets[preset.id] = preset;
  }

  async playKey(presetId: string, options: PlayOptions = {}) {
    const buffer = await this.loadBuffer(presetId);
    if (!buffer) return;
    const ctx = await this.ensureContext();
    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const gainNode = ctx.createGain();
    const preset = this.presets[presetId];
    const masterVolume = this.masterGain?.gain.value ?? 1;
    const finalVolume = (options.volume ?? 1) * (preset?.gain ?? 1);
    gainNode.gain.value = finalVolume * masterVolume;

    source.connect(gainNode).connect(this.masterGain ?? ctx.destination);
    if (typeof options.detune === "number") {
      source.detune.value = options.detune;
    }
    source.start(0);
  }

  async playError(presetId: string) {
    await this.playKey(presetId, { detune: -120, volume: 0.8 });
  }

  async playAmbient(src: string, volume: number) {
    const ctx = await this.ensureContext();
    if (this.ambientSource) {
      try {
        this.ambientSource.stop();
      } catch (error) {
        // noop
      }
    }

    const buffer = await this.loadBufferFromUrl(src);
    if (!buffer) return;

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const gain = ctx.createGain();
    gain.gain.value = volume;

    source.connect(gain).connect(this.masterGain ?? ctx.destination);
    source.start(0);

    this.ambientSource = source;
    this.ambientGain = gain;
  }

  setMasterVolume(value: number) {
    const gain = Math.max(0, Math.min(1, value));
    if (this.masterGain) {
      this.masterGain.gain.value = gain;
    }
  }

  setAmbientVolume(value: number) {
    if (this.ambientGain) {
      this.ambientGain.gain.value = Math.max(0, Math.min(1, value));
    }
  }

  async loadBuffer(presetId: string) {
    const preset = this.presets[presetId];
    if (!preset) return null;
    if (this.buffers[presetId]) {
      return this.buffers[presetId];
    }
    const buffer = await this.loadBufferFromUrl(preset.src);
    if (buffer) {
      this.buffers[presetId] = buffer;
    }
    return buffer;
  }

  private async ensureContext() {
    if (!this.context) {
      this.context = new AudioContext();
      this.masterGain = this.context.createGain();
      this.masterGain.connect(this.context.destination);
      this.masterGain.gain.value = 1;
    }
    if (this.context.state === "suspended") {
      await this.context.resume();
    }
    return this.context;
  }

  private async loadBufferFromUrl(url: string) {
    const ctx = await this.ensureContext();
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    return await ctx.decodeAudioData(arrayBuffer);
  }
}

export const audioManager = AudioManager.getInstance();

