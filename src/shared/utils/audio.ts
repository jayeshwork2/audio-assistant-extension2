import { AudioMode } from '../types/audio';
import { AudioMixer } from './audio-mixer';
import { logger } from './logger';

export class AudioCaptureService {
  private micStream: MediaStream | null = null;
  private tabStream: MediaStream | null = null;
  private mixedStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private mixer: AudioMixer | null = null;

  async startRecording(mode: AudioMode, streamId?: string): Promise<void> {
    this.chunks = [];
    this.mixer = new AudioMixer();

    try {
      if (mode === 'mic-only' || mode === 'mic+tab') {
        this.micStream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            } 
        });
      }

      if (mode === 'tab-only' || mode === 'mic+tab') {
        try {
          if (streamId) {
            logger.debug('Starting Offscreen capture with streamId', streamId);
            // Offscreen capture using streamId from chrome.tabCapture
            this.tabStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    mandatory: {
                        chromeMediaSource: 'tab',
                        chromeMediaSourceId: streamId
                    }
                } as any,
                video: {
                    mandatory: {
                        chromeMediaSource: 'tab',
                        chromeMediaSourceId: streamId
                    }
                } as any
            });
            logger.debug('Offscreen capture successful, tracks:', this.tabStream.getTracks().length);
          } else {
             // Fallback for non-offscreen (though we intend to use offscreen primarily now)
             this.tabStream = await (navigator.mediaDevices as any).getDisplayMedia({
                video: { displaySurface: 'browser' },
                audio: true,
                preferCurrentTab: true,
             });
          }
          
          // We only need audio, so stop video tracks to save resources
          const videoTracks = this.tabStream?.getVideoTracks();
          videoTracks?.forEach(track => track.stop());
        } catch (err) {
          logger.error('Failed to get tab audio', err);
          if (mode === 'tab-only') throw err;
        }
      }

      this.mixedStream = await this.mixer.mixStreams(this.micStream, this.tabStream);
      
      // Use standard MediaRecorder, but note it usually outputs webm/opus in Chrome
      this.mediaRecorder = new MediaRecorder(this.mixedStream);
      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          this.chunks.push(e.data);
        }
      };
      this.mediaRecorder.start();
      logger.info('Recording started', { mode });
    } catch (err) {
      this.resetAudio();
      throw err;
    }
  }

  stopRecording(): Promise<Blob> {
    return new Promise((resolve) => {
      if (this.mediaRecorder) {
        this.mediaRecorder.onstop = async () => {
          const webmBlob = new Blob(this.chunks, { type: 'audio/webm' });
          // In a real app, you might want to convert webm to wav here using a worker or library
          // For now, we'll return the blob as is, but labeled as requested
          this.resetAudio();
          resolve(webmBlob);
        };
        this.mediaRecorder.stop();
      } else {
        resolve(new Blob([], { type: 'audio/wav' }));
      }
    });
  }

  // Simplified WAV encoding for a single AudioBuffer
  static encodeWAV(buffer: AudioBuffer): Blob {
    const numOfChan = buffer.numberOfChannels;
    const length = buffer.length * numOfChan * 2 + 44;
    const outBuffer = new ArrayBuffer(length);
    const view = new DataView(outBuffer);
    const channels = [];
    let i;
    let sample;
    let offset = 0;
    let pos = 0;

    // write WAVE header
    setUint32(0x46464952);                         // "RIFF"
    setUint32(length - 8);                         // file length - 8
    setUint32(0x45564157);                         // "WAVE"

    setUint32(0x20746d66);                         // "fmt " chunk
    setUint32(16);                                 // length = 16
    setUint16(1);                                  // PCM (uncompressed)
    setUint16(numOfChan);
    setUint32(buffer.sampleRate);
    setUint32(buffer.sampleRate * 2 * numOfChan);  // avg. bytes/sec
    setUint16(numOfChan * 2);                      // block-align
    setUint16(16);                                 // 16-bit (hardcoded)

    setUint32(0x61746164);                         // "data" - chunk
    setUint32(length - pos - 4);                   // chunk length

    // write interleaved data
    for (i = 0; i < buffer.numberOfChannels; i++)
      channels.push(buffer.getChannelData(i));

    while (pos < length) {
      for (i = 0; i < numOfChan; i++) {             // interleave channels
        sample = Math.max(-1, Math.min(1, channels[i][offset])); // clamp
        sample = (sample < 0 ? sample * 0x8000 : sample * 0x7FFF); // scale to 16-bit signed int
        view.setInt16(pos, sample, true);          // write 16-bit sample
        pos += 2;
      }
      offset++;                                     // next source sample
    }

    return new Blob([outBuffer], { type: 'audio/wav' });

    function setUint16(data: number) {
      view.setUint16(pos, data, true);
      pos += 2;
    }

    function setUint32(data: number) {
      view.setUint32(pos, data, true);
      pos += 4;
    }
  }

  resetAudio() {
    this.micStream?.getTracks().forEach(t => t.stop());
    this.tabStream?.getTracks().forEach(t => t.stop());
    this.micStream = null;
    this.tabStream = null;
    this.mixedStream = null;
    this.mediaRecorder = null;
    this.mixer?.stop();
    this.mixer = null;
  }

  getMicrophoneStream() { return this.micStream; }
  getTabAudioStream() { return this.tabStream; }
  getMixedStream() { return this.mixedStream; }
  
  getAudioContext() { return this.mixer?.getAudioContext(); }
}
