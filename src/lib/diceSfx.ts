/* ============================================================
   Collision SFX for the physics dice.

   open-dice-dnd plays a random clip from `sounds: string[]` on every
   dice impact, scaled by collision velocity — but it wants URLs, and
   this project ships no binary audio (see hooks/useDiceSound). So we
   render the same bandpass-noise "tick" that useDiceSound synthesizes
   live, bounce it through an OfflineAudioContext, and hand the engine
   WAV data URIs. Same sound design, still zero assets in the repo.
   ============================================================ */

const SAMPLE_RATE = 44100
const DURATION = 0.085

/** Three center frequencies so repeated impacts don't sound looped. */
const VARIANTS = [1500, 2100, 2900]

type OfflineCtor = typeof OfflineAudioContext

function offlineCtor(): OfflineCtor | null {
  if (typeof window === 'undefined') return null
  return (
    window.OfflineAudioContext ??
    (window as unknown as { webkitOfflineAudioContext?: OfflineCtor }).webkitOfflineAudioContext ??
    null
  )
}

/** One die edge striking the table: filtered noise with an exponential tail. */
async function renderTick(OAC: OfflineCtor, freq: number): Promise<AudioBuffer> {
  const frames = Math.ceil(SAMPLE_RATE * DURATION)
  const ctx = new OAC(1, frames, SAMPLE_RATE)

  const noise = ctx.createBuffer(1, frames, SAMPLE_RATE)
  const data = noise.getChannelData(0)
  for (let i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1

  const src = ctx.createBufferSource()
  src.buffer = noise

  const bandpass = ctx.createBiquadFilter()
  bandpass.type = 'bandpass'
  bandpass.frequency.value = freq
  bandpass.Q.value = 1.1

  const gain = ctx.createGain()
  gain.gain.setValueAtTime(1, 0)
  gain.gain.exponentialRampToValueAtTime(0.0008, DURATION)

  src.connect(bandpass)
  bandpass.connect(gain)
  gain.connect(ctx.destination)
  src.start(0)

  return ctx.startRendering()
}

/** Mono 16-bit PCM WAV. */
function encodeWav(buffer: AudioBuffer): Uint8Array {
  const samples = buffer.getChannelData(0)
  const bytes = new Uint8Array(44 + samples.length * 2)
  const view = new DataView(bytes.buffer)

  const ascii = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i))
  }

  ascii(0, 'RIFF')
  view.setUint32(4, 36 + samples.length * 2, true)
  ascii(8, 'WAVE')
  ascii(12, 'fmt ')
  view.setUint32(16, 16, true)          // PCM chunk size
  view.setUint16(20, 1, true)           // format: PCM
  view.setUint16(22, 1, true)           // channels
  view.setUint32(24, SAMPLE_RATE, true)
  view.setUint32(28, SAMPLE_RATE * 2, true) // byte rate
  view.setUint16(32, 2, true)           // block align
  view.setUint16(34, 16, true)          // bits per sample
  ascii(36, 'data')
  view.setUint32(40, samples.length * 2, true)

  for (let i = 0; i < samples.length; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]))
    view.setInt16(44 + i * 2, Math.round(clamped * 32767), true)
  }
  return bytes
}

function toDataUri(bytes: Uint8Array): string {
  let binary = ''
  // Chunked so a long clip can't blow the argument limit on String.fromCharCode.
  for (let i = 0; i < bytes.length; i += 8192) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 8192))
  }
  return `data:audio/wav;base64,${btoa(binary)}`
}

let cached: Promise<string[]> | null = null

/**
 * WAV data URIs for the engine's `sounds` option. Rendered once per page
 * and reused; resolves to `[]` if OfflineAudioContext is unavailable, which
 * just leaves the dice silent on impact.
 */
export function collisionSfx(): Promise<string[]> {
  if (cached) return cached
  const OAC = offlineCtor()
  if (!OAC) return (cached = Promise.resolve([]))

  cached = Promise.all(VARIANTS.map(freq => renderTick(OAC, freq)))
    .then(buffers => buffers.map(b => toDataUri(encodeWav(b))))
    .catch(() => [])
  return cached
}
