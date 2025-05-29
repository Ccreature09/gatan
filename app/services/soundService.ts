export class SoundService {
  private static instance: SoundService;
  private sounds: Map<string, HTMLAudioElement> = new Map();
  private isMuted: boolean = false;
  private isInitialized: boolean = false;

  private constructor() {
    // Only initialize sounds in the browser
    if (typeof window !== 'undefined') {
      this.initializeSounds();
    }
  }

  public static getInstance(): SoundService {
    if (!SoundService.instance) {
      SoundService.instance = new SoundService();
    }
    return SoundService.instance;
  }

  private initializeSounds() {
    if (typeof window === 'undefined' || this.isInitialized) return;
    
    // Create audio contexts for different sound effects
    this.createSound('trade_open', this.generateTone(800, 0.1, 'sine'));
    this.createSound('trade_close', this.generateTone(400, 0.1, 'sine'));
    this.createSound('trade_success', this.generateTone(600, 0.2, 'triangle', [600, 800, 1000]));
    this.createSound('button_hover', this.generateTone(300, 0.05, 'square'));
    this.createSound('button_click', this.generateTone(500, 0.1, 'triangle'));
    this.createSound('ocean_ambient', this.generateOceanSound());
    this.createSound('resource_collect', this.generateTone(700, 0.15, 'sine', [700, 900]));
    
    this.isInitialized = true;
  }
  private generateTone(frequency: number, duration: number, type: OscillatorType, sequence?: number[]): string {
    if (typeof window === 'undefined') {
      return 'data:audio/wav;base64,'; // Placeholder for SSR
    }
    
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    oscillator.type = type;

    // Create envelope
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);

    // If sequence is provided, create a melody
    if (sequence) {
      sequence.forEach((freq, index) => {
        const time = audioContext.currentTime + (index * duration / sequence.length);
        oscillator.frequency.setValueAtTime(freq, time);
      });
    }

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);

    // Convert to data URL (simplified approach)
    return 'data:audio/wav;base64,'; // Placeholder - we'll use Web Audio API directly
  }

  private generateOceanSound(): string {
    // Generate white noise for ocean sound
    return 'data:audio/wav;base64,'; // Placeholder
  }

  private createSound(name: string, dataUrl: string) {
    // For now, we'll use Web Audio API directly in play methods
    // This is a placeholder for the sound creation
  }
  private async playWebAudioTone(frequency: number, duration: number, type: OscillatorType = 'sine', sequence?: number[]) {
    if (this.isMuted || typeof window === 'undefined') return;

    // Ensure sounds are initialized
    if (!this.isInitialized) {
      this.initializeSounds();
    }

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.type = type;

      // Create envelope
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);

      if (sequence) {
        // Play sequence of frequencies
        sequence.forEach((freq, index) => {
          const time = audioContext.currentTime + (index * duration / sequence.length);
          oscillator.frequency.setValueAtTime(freq, time);
        });
      } else {
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      }

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);
    } catch (error) {
      console.warn('Audio playback failed:', error);
    }
  }

  public async playTradeOpen() {
    await this.playWebAudioTone(800, 0.15, 'sine', [600, 800]);
  }

  public async playTradeClose() {
    await this.playWebAudioTone(600, 0.15, 'sine', [800, 600]);
  }

  public async playTradeSuccess() {
    await this.playWebAudioTone(700, 0.3, 'triangle', [700, 900, 1100, 1300]);
  }

  public async playButtonHover() {
    await this.playWebAudioTone(400, 0.05, 'square');
  }

  public async playButtonClick() {
    await this.playWebAudioTone(500, 0.1, 'triangle');
  }

  public async playResourceCollect() {
    await this.playWebAudioTone(800, 0.2, 'sine', [800, 1000, 1200]);
  }
  public async playOceanAmbient() {
    if (this.isMuted || typeof window === 'undefined') return;

    // Ensure sounds are initialized
    if (!this.isInitialized) {
      this.initializeSounds();
    }

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const bufferSize = audioContext.sampleRate * 2; // 2 seconds
      const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
      const data = buffer.getChannelData(0);

      // Generate pink noise for ocean sound
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.05;
        b6 = white * 0.115926;
      }

      const source = audioContext.createBufferSource();
      const gainNode = audioContext.createGain();
      
      source.buffer = buffer;
      source.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      gainNode.gain.setValueAtTime(0.02, audioContext.currentTime); // Very quiet ambient sound
      source.loop = true;
      source.start();

      // Auto-stop after 10 seconds
      setTimeout(() => {
        try {
          source.stop();
        } catch (e) {
          // Source might already be stopped
        }
      }, 10000);
    } catch (error) {
      console.warn('Ocean ambient sound failed:', error);
    }
  }
  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public isSoundMuted(): boolean {
    return this.isMuted;
  }
}

// Only create the instance when in the browser
export const soundService = typeof window !== 'undefined' ? SoundService.getInstance() : null as any;
