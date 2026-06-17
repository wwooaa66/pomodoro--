export type TimerMode = 'focus' | 'shortBreak' | 'longBreak'
export type TimerStatus = 'idle' | 'running' | 'paused'

export const TIMER_CONFIG: Record<TimerMode, { label: string; minutes: number }> = {
  focus:      { label: '专注', minutes: 25 },
  shortBreak: { label: '短休', minutes: 5 },
  longBreak:  { label: '长休', minutes: 15 },
}

export const STATUS_LABEL: Record<TimerStatus, string> = {
  idle:    '准备就绪',
  running: '专注中…',
  paused:  '已暂停',
}
