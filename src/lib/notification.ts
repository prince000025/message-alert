// Notification, Vibration, Audio Siren, and Text-to-Speech Engine for Truecaller Shield

class SoundEngine {
  private ctx: AudioContext | null = null
  private unlocked: boolean = false
  private volume: number = 0.5 // 0.0 to 1.0

  constructor() {
    if (typeof window !== 'undefined') {
      // Auto-unlock Web Audio on first user interaction anywhere on screen
      const unlockEvents = ['click', 'touchstart', 'touchend', 'keydown']
      const handleUnlock = () => {
        this.unlock()
        unlockEvents.forEach((evt) => window.removeEventListener(evt, handleUnlock))
      }
      unlockEvents.forEach((evt) => window.addEventListener(evt, handleUnlock, { passive: true }))
    }
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol))
  }

  public getVolume(): number {
    return this.volume
  }

  private initCtx(): AudioContext | null {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AudioCtx) {
        this.ctx = new AudioCtx()
      }
    }
    return this.ctx
  }

  public async unlock(): Promise<boolean> {
    try {
      const ctx = this.initCtx()
      if (!ctx) return false
      if (ctx.state === 'suspended') {
        await ctx.resume()
      }
      // Play a short silent buffer to fully warm up audio hardware
      const buffer = ctx.createBuffer(1, 1, 22050)
      const source = ctx.createBufferSource()
      source.buffer = buffer
      source.connect(ctx.destination)
      source.start(0)
      this.unlocked = true
      return true
    } catch {
      return false
    }
  }

  public isUnlocked(): boolean {
    return this.unlocked
  }

  // Play urgent high-visibility dual-tone warning siren
  async playSpamAlert() {
    try {
      await this.unlock()
      const ctx = this.initCtx()
      if (!ctx) return

      const now = ctx.currentTime
      const duration = 0.8
      const masterGain = ctx.createGain()
      masterGain.gain.setValueAtTime(this.volume * 0.6, now)
      masterGain.gain.linearRampToValueAtTime(this.volume * 0.7, now + 0.2)
      masterGain.gain.exponentialRampToValueAtTime(0.001, now + duration)
      masterGain.connect(ctx.destination)

      // Primary Siren Oscillator (880Hz -> 580Hz -> 880Hz)
      const osc1 = ctx.createOscillator()
      osc1.type = 'sawtooth'
      osc1.frequency.setValueAtTime(880, now)
      osc1.frequency.exponentialRampToValueAtTime(520, now + 0.2)
      osc1.frequency.exponentialRampToValueAtTime(920, now + 0.4)
      osc1.frequency.exponentialRampToValueAtTime(480, now + 0.6)
      osc1.frequency.exponentialRampToValueAtTime(320, now + duration)
      osc1.connect(masterGain)
      osc1.start(now)
      osc1.stop(now + duration)

      // Secondary Sub/Harmonic Oscillator for high punch on mobile speakers
      const osc2 = ctx.createOscillator()
      osc2.type = 'square'
      osc2.frequency.setValueAtTime(440, now)
      osc2.frequency.exponentialRampToValueAtTime(260, now + 0.2)
      osc2.frequency.exponentialRampToValueAtTime(460, now + 0.4)
      osc2.frequency.exponentialRampToValueAtTime(240, now + duration)

      const gain2 = ctx.createGain()
      gain2.gain.setValueAtTime(this.volume * 0.25, now)
      gain2.gain.exponentialRampToValueAtTime(0.001, now + duration)

      osc2.connect(gain2)
      gain2.connect(ctx.destination)
      osc2.start(now)
      osc2.stop(now + duration)
    } catch (e) {
      console.warn('Audio playback error:', e)
    }
  }

  // Play pleasant safe/clear confirmation tone
  async playSafeChime() {
    try {
      await this.unlock()
      const ctx = this.initCtx()
      if (!ctx) return

      const now = ctx.currentTime
      const notes = [523.25, 659.25, 783.99, 1046.5] // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        const noteStart = now + idx * 0.08
        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, noteStart)

        gain.gain.setValueAtTime(this.volume * 0.25, noteStart)
        gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.35)

        osc.connect(gain)
        gain.connect(ctx.destination)

        osc.start(noteStart)
        osc.stop(noteStart + 0.35)
      })
    } catch {
      // Ignore
    }
  }

  // Text-To-Speech: Speak alerts aloud
  speakAlert(text: string) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    try {
      window.speechSynthesis.cancel() // Stop any current speech
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 1.05
      utterance.pitch = 1.1
      utterance.volume = this.volume
      window.speechSynthesis.speak(utterance)
    } catch {
      // Ignore speech synth error
    }
  }

  stopSpeech() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
  }
}

export const soundEngine = new SoundEngine()

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied'
  }
  return await Notification.requestPermission()
}

export function getNotificationPermission(): NotificationPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied'
  }
  return Notification.permission
}

export function triggerVibration(pattern: number[] = [200, 100, 200, 100, 300]) {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern)
    } catch {
      // Vibration not permitted or supported
    }
  }
}

export function sendSystemAlert(title: string, body: string, isSpam: boolean = true) {
  if (isSpam) {
    soundEngine.playSpamAlert()
    triggerVibration([250, 100, 250, 100, 400])
  } else {
    soundEngine.playSafeChime()
    triggerVibration([80])
  }

  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: '/pwa-192x192.png',
        badge: '/shield.svg',
        tag: 'truecaller-spam-alert',
      })
    } catch {
      // Mobile browsers might require serviceWorker.showNotification
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then((reg) => {
          reg.showNotification(title, {
            body,
            icon: '/pwa-192x192.png',
            badge: '/shield.svg',
            tag: 'truecaller-spam-alert',
          })
        }).catch(() => {})
      }
    }
  }
}
