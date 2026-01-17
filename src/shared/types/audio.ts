export type AudioMode = "mic-only" | "tab-only" | "mic+tab";

export type AudioSourceStatus =
  | "ready"
  | "recording"
  | "error"
  | "denied"
  | "unavailable"
  | "waiting";

export interface AudioStreamInfo {
  sampleRate: number;
  channels: number;
  duration: number;
}
