export interface AudioFile {
  name: string
  path: string
}

export interface Playlist {
  id: string
  label: string
  folder: string
  files: AudioFile[]
  color: string
  textColor: string
}

export interface Announcement {
  id: string
  label: string
  path: string
  dur: number // fraction of day width (visual)
}

export interface ScheduledAnnouncement extends Announcement {
  sf: number // start fraction (0-1)
}

export interface DaySchedule {
  bg: Playlist | null
  anns: ScheduledAnnouncement[]
  special: { id: string; label: string } | null
}

export type WeekSchedule = Record<string, DaySchedule> // key = "YYYY-Www-D"

export interface EQState {
  bands: number[] // 10 values, -12..+12 dB
  volume: number  // 0..100
  balance: number // -100..100
}

export interface EQPresets {
  presets: Record<string, number[]>
  active: string
}

export interface Library {
  playlists: Playlist[]
  announcements: Announcement[]
}

// Window API exposed by preload
declare global {
  interface Window {
    api: {
      schedule: { load: () => Promise<WeekSchedule>; save: (d: WeekSchedule) => Promise<boolean> }
      eq: { load: () => Promise<EQPresets>; save: (d: EQPresets) => Promise<boolean> }
      library: { load: () => Promise<Library>; save: (d: Library) => Promise<boolean> }
      dialog: { pickFolder: () => Promise<string | null>; pickFiles: () => Promise<string[]> }
      fs: { scanFolder: (p: string) => Promise<AudioFile[]> }
      shell: { openDataDir: () => Promise<void> }
    }
  }
}
