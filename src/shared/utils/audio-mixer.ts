import { logger } from './logger';

export class AudioMixer {
  private audioContext: AudioContext | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;
  private tabSource: MediaStreamAudioSourceNode | null = null;
  private micGain: GainNode | null = null;
  private tabGain: GainNode | null = null;
  private destination: MediaStreamAudioDestinationNode | null = null;

  constructor() {
    this.audioContext = new AudioContext();
    this.destination = this.audioContext.createMediaStreamDestination();
    
    this.micGain = this.audioContext.createGain();
    this.tabGain = this.audioContext.createGain();

    this.micGain.connect(this.destination);
    this.tabGain.connect(this.destination);
    
    // Also connect tab audio to the hardware output (speakers) so user can hear it
    // Do NOT connect mic to speakers to avoid feedback loop
    this.tabGain.connect(this.audioContext.destination);

    // Default 50/50 mix
    this.micGain.gain.value = 0.5;
    this.tabGain.gain.value = 0.5;
  }

  async mixStreams(micStream: MediaStream | null, tabStream: MediaStream | null): Promise<MediaStream> {
    if (!this.audioContext || !this.destination) {
      throw new Error('AudioMixer not initialized');
    }

    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    if (micStream) {
      this.micSource = this.audioContext.createMediaStreamSource(micStream);
      this.micSource.connect(this.micGain!);
    }

    if (tabStream) {
      this.tabSource = this.audioContext.createMediaStreamSource(tabStream);
      this.tabSource.connect(this.tabGain!);
    }

    return this.destination.stream;
  }

  setMicrophoneGain(volume: number) {
    if (this.micGain) {
      this.micGain.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  setTabAudioGain(volume: number) {
    if (this.tabGain) {
      this.tabGain.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  getMixedStream(): MediaStream | null {
    return this.destination?.stream || null;
  }

  stop() {
    if (this.audioContext) {
      this.audioContext.close();
    }
    this.micSource?.disconnect();
    this.tabSource?.disconnect();
    this.micGain?.disconnect();
    this.tabGain?.disconnect();
    this.destination?.disconnect();
  }

  getAudioContext(): AudioContext | null {
    return this.audioContext;
  }
}
