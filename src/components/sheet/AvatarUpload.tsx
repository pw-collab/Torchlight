'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { FieldError } from '@/components/ui/field'

interface Props {
  characterId: string
  portraitUrl: string | null
  /** Persists the portrait URL on the character. Rejecting marks the upload as failed. */
  onUpload: (url: string) => void | Promise<void>
  editable?: boolean
  size?: number
  height?: number
  /** Fills the parent box instead of a fixed size — the parent sets the ratio. */
  fluid?: boolean
}

const MAX_FILE_BYTES = 4 * 1024 * 1024
const MAX_DIMENSION = 512
const IMAGE_EXTENSIONS = /\.(jpe?g|png|webp|gif|avif|bmp)$/i

// Some platforms (Android pickers, a few Windows builds) hand over an empty
// MIME type, so fall back to the file name before rejecting the pick.
function isImageFile(file: File): boolean {
  return file.type ? file.type.startsWith('image/') : IMAGE_EXTENSIONS.test(file.name)
}

async function resizeImage(file: File, maxDim: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height))
      const w = Math.round(img.width * scale)
      const h = Math.round(img.height * scale)
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, w, h)
      canvas.toBlob(blob => {
        if (blob) resolve(blob)
        else reject(new Error('Canvas toBlob failed'))
      }, 'image/jpeg', 0.88)
    }
    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('Image load failed')) }
    img.src = objectUrl
  })
}

// Turns whatever blew up into something a player at the table can act on. The
// technical detail still goes to the console for whoever is debugging.
function errorMessage(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err)
  if (/bucket not found/i.test(raw)) return 'Armazenamento de retratos não configurado. Avise o mestre.'
  if (/row-level security|not authorized|unauthorized|403/i.test(raw)) return 'Sem permissão para alterar o retrato desta ficha.'
  if (/payload too large|exceeded the maximum|413/i.test(raw)) return 'Imagem grande demais para o armazenamento.'
  if (/image load failed/i.test(raw)) return 'Não foi possível ler esta imagem. Converta para JPG ou PNG.'
  if (/failed to fetch|network/i.test(raw)) return 'Falha de conexão. Verifique a rede e tente novamente.'
  return 'Erro ao salvar retrato. Tente novamente.'
}

export function AvatarUpload({ characterId, portraitUrl, onUpload, editable = true, size = 96, height, fluid = false }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hovering, setHovering] = useState(false)
  const [dragging, setDragging] = useState(false)

  // Local preview object URLs have to be released by hand, otherwise every pick
  // leaks the full file for as long as the sheet stays open.
  const previewRef = useRef<string | null>(null)
  function swapPreview(next: string | null) {
    if (previewRef.current?.startsWith('blob:')) URL.revokeObjectURL(previewRef.current)
    previewRef.current = next
    setPreview(next)
  }
  useEffect(() => () => {
    if (previewRef.current?.startsWith('blob:')) URL.revokeObjectURL(previewRef.current)
  }, [])

  const displayUrl = preview ?? portraitUrl

  async function processFile(file: File) {
    if (!isImageFile(file)) {
      setError('Formato inválido. Use JPG, PNG ou WebP.')
      return
    }
    if (file.size > MAX_FILE_BYTES) {
      setError('Arquivo muito grande. Máximo 4 MB.')
      return
    }
    setError(null)

    swapPreview(URL.createObjectURL(file))
    setUploading(true)

    try {
      const blob = await resizeImage(file, MAX_DIMENSION)
      const supabase = createClient()
      const path = `${characterId}/portrait.jpg`
      // Upload as a File so the multipart part carries an explicit name and
      // content type — storage-js drops the `contentType` option for raw Blobs.
      const jpeg = new File([blob], 'portrait.jpg', { type: 'image/jpeg' })
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, jpeg, { contentType: 'image/jpeg', upsert: true })

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      // The path is stable across re-uploads, so the timestamp is what makes the
      // CDN and the <img> pick up the new file.
      const url = `${data.publicUrl}?t=${Date.now()}`

      // Wait for the sheet to actually persist the URL. Without this the
      // portrait looked saved and silently vanished on the next page load.
      await onUpload(url)
      swapPreview(null)
    } catch (err) {
      console.error('[AvatarUpload] falha ao salvar retrato', err)
      setError(errorMessage(err))
      swapPreview(null)
    } finally {
      setUploading(false)
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) processFile(file)
    e.target.value = ''
  }

  function handleClick() {
    if (editable && !uploading) inputRef.current?.click()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (editable && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      inputRef.current?.click()
    }
  }

  function handleDragOver(e: React.DragEvent) {
    if (!editable) return
    e.preventDefault()
    setDragging(true)
  }

  function handleDragLeave() {
    setDragging(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    if (!editable) return
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 4,
      flexShrink: 0,
      ...(fluid ? { width: '100%', height: '100%' } : null),
    }}>
      <div
        role={editable ? 'button' : undefined}
        tabIndex={editable ? 0 : undefined}
        aria-label={editable ? (displayUrl ? 'Alterar retrato' : 'Adicionar retrato') : 'Retrato do personagem'}
        aria-busy={uploading || undefined}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onMouseEnter={() => editable && setHovering(true)}
        onMouseLeave={() => { setHovering(false); setDragging(false) }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          position: 'relative',
          cursor: editable ? 'pointer' : 'default',
          outline: 'none',
          // Fluid: take the parent's width and whatever height is left after
          // an error message, so the box never overflows its frame.
          ...(fluid
            ? { width: '100%', flex: '1 1 auto', minHeight: 0 }
            : { width: size, height: height ?? size, flexShrink: 0 }),
        }}
      >
        {/* Image or placeholder */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: displayUrl ? 'transparent' : 'var(--card)',
            overflow: 'hidden',
            transition: 'filter 200ms',
            filter: (hovering || dragging) && editable ? 'brightness(0.55)' : 'none',
          }}
        >
          {displayUrl ? (
            <img
              src={displayUrl}
              alt="Retrato"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          ) : (
            /* Placeholder texture */
            <div style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundImage: 'repeating-linear-gradient(135deg, var(--border) 0px, var(--border) 1px, transparent 1px, transparent 8px)',
            }}>
              {!hovering && !dragging && (
                <span style={{ fontSize: 28, opacity: 0.25, userSelect: 'none', color: 'var(--gold-oxidized)' }}>✦</span>
              )}
            </div>
          )}
        </div>

        {/* Hover / drag overlay label */}
        {editable && (hovering || dragging) && (
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2,
              pointerEvents: 'none',
            }}
          >
            <span style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 10,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--foreground)',
              textAlign: 'center',
              lineHeight: 1.4,
              padding: '0 8px',
            }}>
              {uploading
                ? <span className="animate-flicker">...</span>
                : dragging
                  ? 'Soltar'
                  : displayUrl ? '✎ Alterar' : '+ Retrato'
              }
            </span>
          </div>
        )}

        {/* Loading spinner */}
        {uploading && (
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.45)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 3,
            }}
          >
            <span className="animate-flicker" style={{ color: 'var(--candle-amber)', fontSize: 20 }}>✦</span>
          </div>
        )}

        {/* Square portrait frame — the portrait's only outline, so the boxes
            that wrap it (see FloatingVitals) draw none of their own. */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            border: '1px solid var(--primary)',
            pointerEvents: 'none',
            zIndex: 4,
          }}
        />

        {/* Drag highlight ring */}
        {dragging && (
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: -2,
              border: '2px solid var(--candle-amber)',
              boxShadow: '0 0 12px var(--primary)',
              zIndex: 5,
              pointerEvents: 'none',
            }}
          />
        )}
      </div>

      {/* Hidden file input */}
      {editable && (
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{ display: 'none' }}
          tabIndex={-1}
        />
      )}

      {/* Error message */}
      {error && (
        <FieldError
          className="text-center text-[10px] leading-snug text-[var(--blood-bright)]"
          style={{ maxWidth: fluid ? '100%' : size }}
        >
          {error}
        </FieldError>
      )}
    </div>
  )
}
