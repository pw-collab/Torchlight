import type { DiceRoller, EffectSpec } from 'open-dice-dnd'

/* ============================================================
   diceArena — the Baldur's Gate 3 staging for the physics dice.

   Out of the box open-dice-dnd treats its whole container as a
   table and throws dice across it from the left edge. The roll we
   want is the other thing entirely: one big die dropped onto a small
   dais in the middle of the screen, spinning in place until it shows
   its face.

   The engine has no option for that, so this module reaches past its
   public surface. Three things are replaced on the roller instance:

     - the camera is zoomed in, so a die fills the dais instead of
       being a speck on an 18-unit table;
     - the walls are pulled in to the edge of what the camera now
       sees, so nothing can leave the frame;
     - the throw is rewritten to drop dice near the centre with a lot
       of spin and little travel.

   Where the dice stop is still up to the physics, so once they do
   the camera slides over to them (`focusCamera`): the result always
   ends up in the middle of the dais, without touching a trajectory.

   The engine pre-simulates every throw with the same seeds it then
   plays back, and it does so through the very methods patched here,
   so the "land on the face lib/dice.ts already rolled" guarantee
   survives intact.

   All of it is written against v1.3.1 internals. Every hook is
   feature-checked: on an engine that no longer has them, `install`
   returns null and the caller keeps the stock table.
   ============================================================ */

/** The engine's table is this many world units tall at zoom 1. */
const FRUSTUM = 18

/** How much of the visible frame the dice may actually use. */
const WALL_INSET = 0.8

interface Vec3Like {
  x: number
  y: number
  z: number
  set(x: number, y: number, z: number): unknown
  copy(v: unknown): unknown
}

interface ArenaDie {
  body: {
    position: Vec3Like
    velocity: Vec3Like
    angularVelocity: Vec3Like
    quaternion: { setFromEuler(x: number, y: number, z: number): unknown }
  }
  mesh: {
    position: Vec3Like
    quaternion: { copy(q: unknown): unknown }
    material: ArenaMaterial | ArenaMaterial[]
  }
}

interface ArenaMaterial {
  transparent: boolean
  opacity: number
}

interface Seed {
  xPos: number
  yPos: number
  zPos: number
  rotAxis: [number, number, number]
  rotAngle: number
  vel: [number, number, number]
  angVel: [number, number, number]
  /** Added here: which die of the batch this is, so each gets its own spot. */
  slot?: number
}

/** The private surface of the roller this module leans on. */
interface RollerInternals {
  width: number
  height: number
  camera: { zoom: number; position: Vec3Like; updateProjectionMatrix(): void }
  dice: ArenaDie[]
  _applyDiePhysics(die: ArenaDie, seed: Seed): void
  _generateRandomSeed(): Seed
  _updatePhysicsWalls(frustum: number, aspect: number, top: number, bottom: number): void
}

function hasInternals(roller: unknown): roller is RollerInternals {
  const r = roller as Partial<RollerInternals> | null
  return !!r
    && typeof r._applyDiePhysics === 'function'
    && typeof r._generateRandomSeed === 'function'
    && typeof r._updatePhysicsWalls === 'function'
    && typeof r.camera?.updateProjectionMatrix === 'function'
}

/**
 * How far to zoom for a batch of `count` dice. A lone d20 gets the full
 * close-up; a fistful pulls the camera back just enough to give every die
 * room to come to rest flat.
 */
export function arenaZoom(count: number): number {
  const side = Math.max(5, 3.8 * Math.sqrt(Math.max(1, count)) + 1.2)
  return FRUSTUM / side
}

export interface DiceArena {
  /** Frames the dais for the next throw. Call right before `roller.roll()`. */
  prepare(count: number): void
  dispose(): void
}

/**
 * Turns a stock roller into the centre-stage arena. Returns null when the
 * engine's internals aren't what this was written against.
 */
export function installArena(roller: DiceRoller): DiceArena | null {
  if (!hasInternals(roller)) return null
  const r: RollerInternals = roller

  let count = 1
  let zoom = arenaZoom(1)
  let nextSlot = 0
  /** Half-extents of what the camera sees, in world units. */
  let half = { x: FRUSTUM / 2 / zoom, z: FRUSTUM / 2 / zoom }

  const frame = () => {
    const aspect = r.height > 0 ? r.width / r.height : 1
    r.camera.zoom = zoom
    // `focusCamera` leaves the camera over wherever the last dice stopped.
    r.camera.position.x = 0
    r.camera.position.z = 0
    r.camera.updateProjectionMatrix()
    // The walls stand inside the frame, not on it: the dais is a disc drawn
    // in a square canvas, and dice left to reach the corners would come to
    // rest outside the ring.
    const top = (FRUSTUM / 2 / zoom) * WALL_INSET
    r._updatePhysicsWalls((FRUSTUM / zoom) * WALL_INSET, aspect, top, -top)
    half = { x: top * aspect, z: top }
  }

  const stockSeed = r._generateRandomSeed.bind(r)
  r._generateRandomSeed = () => {
    const seed = stockSeed()
    seed.slot = nextSlot++
    return seed
  }

  // Everything here is a pure function of the seed, which is what keeps the
  // engine's prediction and its playback on the same trajectory.
  r._applyDiePhysics = (die, seed) => {
    const slot = (seed.slot ?? 0) % Math.max(1, count)
    const cols = Math.ceil(Math.sqrt(count))
    const rows = Math.ceil(count / cols)
    const col = slot % cols
    const row = Math.floor(slot / cols)
    // Dice start spread over the middle of the dais, never stacked.
    const spread = (index: number, total: number, extent: number) =>
      total > 1 ? (index / (total - 1) - 0.5) * extent * 1.1 : 0

    const x = spread(col, cols, half.x) + (seed.xPos - 0.5) * 0.5
    const z = spread(row, rows, half.z) + (seed.zPos - 0.5) * 0.5
    // Staggered heights so a pool lands as a patter, not one thud.
    const y = 4.5 + seed.yPos * 1.5 + slot * 0.25

    die.body.position.set(x, y, z)
    die.mesh.position.copy(die.body.position)

    die.body.quaternion.setFromEuler(
      seed.rotAxis[0] * Math.PI * 2,
      seed.rotAxis[1] * Math.PI * 2,
      seed.rotAxis[2] * Math.PI * 2,
    )
    die.mesh.quaternion.copy(die.body.quaternion)

    // Little travel: the die should worry the middle of the dais, not cross it.
    const drift = 3.5
    die.body.velocity.set(
      (seed.vel[0] - 0.5) * 2 * drift,
      -3,
      (seed.vel[2] - 0.5) * 2 * drift,
    )

    // A lot of spin, and never a lazy axis — that is the whole look.
    const spin = (n: number) => (n < 0.5 ? -1 : 1) * (10 + Math.abs(n - 0.5) * 2 * 14)
    die.body.angularVelocity.set(spin(seed.angVel[0]), spin(seed.angVel[1]), spin(seed.angVel[2]))
  }

  // The engine's own resize handler restores the stock camera and walls. It
  // was registered first, so this runs after it and frames the dais again.
  const onResize = () => frame()
  window.addEventListener('resize', onResize)

  frame()

  return {
    prepare(n) {
      count = Math.max(1, n)
      zoom = arenaZoom(count)
      nextSlot = 0
      frame()
    },
    dispose() {
      window.removeEventListener('resize', onResize)
    },
  }
}

/**
 * Fades a settled die back — the die that advantage or disadvantage threw
 * away. It stays on the dais, readable, but clearly not the one that counts.
 */
export function fadeDie(to = 0.3, duration = 360): EffectSpec {
  return {
    scope: 'die',
    create({ die }) {
      const mesh = (die as ArenaDie).mesh
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      materials.forEach(m => { m.transparent = true })
      const start = performance.now()
      return {
        update() {
          const t = Math.min((performance.now() - start) / duration, 1)
          const eased = 1 - Math.pow(1 - t, 3)
          materials.forEach(m => { m.opacity = 1 - (1 - to) * eased })
          return t >= 1
        },
      }
    },
  }
}

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)

/**
 * The camera's whole reaction to the dice stopping: it slides over so the
 * result sits in the middle of the dais, and on the way it can push in (a
 * crit) or rattle (a fumble).
 *
 * This stands in for the engine's own `slowMoZoom` and `screenShake`. Both
 * of those save the camera's position when they start and put it back when
 * they end, which would undo the slide.
 */
export function focusCamera({ punch = 0, shake = 0, duration = 420 }: {
  /** Extra zoom at the peak, as a fraction of the framing zoom. */
  punch?: number
  /** Jitter at the start, in world units. */
  shake?: number
  duration?: number
} = {}): EffectSpec {
  return {
    scope: 'once',
    create({ roller }) {
      if (!hasInternals(roller)) return { update: () => true }
      const { camera, dice } = roller
      if (dice.length === 0) return { update: () => true }

      const fromX = camera.position.x
      const fromZ = camera.position.z
      const toX = dice.reduce((sum, d) => sum + d.body.position.x, 0) / dice.length
      const toZ = dice.reduce((sum, d) => sum + d.body.position.z, 0) / dice.length
      const baseZoom = camera.zoom
      // The push-in outlasts the slide: in fast, held, then eased back out.
      const total = punch ? Math.max(duration, 900) : duration
      const start = performance.now()

      return {
        update() {
          const elapsed = performance.now() - start
          const slide = easeOut(Math.min(elapsed / duration, 1))
          const t = Math.min(elapsed / total, 1)
          const jitter = shake * (1 - Math.min(elapsed / duration, 1))
          camera.position.x = fromX + (toX - fromX) * slide + (Math.random() - 0.5) * jitter
          camera.position.z = fromZ + (toZ - fromZ) * slide + (Math.random() - 0.5) * jitter
          if (punch) {
            const amount = t < 0.3 ? easeOut(t / 0.3) : t < 0.6 ? 1 : 1 - easeOut((t - 0.6) / 0.4)
            camera.zoom = baseZoom * (1 + punch * amount)
            camera.updateProjectionMatrix()
          }
          if (t < 1) return false
          camera.position.x = toX
          camera.position.z = toZ
          if (punch) {
            camera.zoom = baseZoom
            camera.updateProjectionMatrix()
          }
          return true
        },
      }
    },
  }
}
