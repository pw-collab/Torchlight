'use client'

import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase'

interface Props {
  characterId: string
  portraitUrl: string | null
  onUpload: (url: string) => void
  editable?: boolean
  size?: number
  height?: number
}

const PORTRAIT_RADIUS = 8

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

export function AvatarUpload({ characterId, portraitUrl, onUpload, editable = true, size = 96, height }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hovering, setHovering] = useState(false)
  const [dragging, setDragging] = useState(false)

  const displayUrl = preview ?? portraitUrl

  async function processFile(file: File) {
    if (!file.type.startsWith('image/')) {
      setError('Formato inválido. Use JPG, PNG ou WebP.')
      return
    }
    if (file.size > 4 * 1024 * 1024) {
      setError('Arquivo muito grande. Máximo 4 MB.')
      return
    }
    setError(null)

    const localUrl = URL.createObjectURL(file)
    setPreview(localUrl)
    setUploading(true)

    try {
      const blob = await resizeImage(file, 512)
      const supabase = createClient()
      const path = `${characterId}/portrait.jpg`
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, blob, { contentType: 'image/jpeg', upsert: true })

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      const url = `${data.publicUrl}?t=${Date.now()}`
      onUpload(url)
      setPreview(url)
    } catch (err) {
      setError('Erro ao salvar retrato. Tente novamente.')
      setPreview(null)
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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
      <div
        role={editable ? 'button' : undefined}
        tabIndex={editable ? 0 : undefined}
        aria-label={editable ? (displayUrl ? 'Alterar retrato' : 'Adicionar retrato') : 'Retrato do personagem'}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onMouseEnter={() => editable && setHovering(true)}
        onMouseLeave={() => { setHovering(false); setDragging(false) }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          position: 'relative',
          width: size,
          height: height ?? size,
          cursor: editable ? 'pointer' : 'default',
          outline: 'none',
          flexShrink: 0,
        }}
      >
        {/* Image or placeholder */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: PORTRAIT_RADIUS,
            background: displayUrl ? 'transparent' : 'rgba(26,20,8,0.85)',
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
              backgroundImage: 'repeating-linear-gradient(135deg, rgba(139,112,48,0.04) 0px, rgba(139,112,48,0.04) 1px, transparent 1px, transparent 8px)',
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
              borderRadius: PORTRAIT_RADIUS,
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
              color: '#f5f0e8',
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
              borderRadius: PORTRAIT_RADIUS,
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

        {/* Square portrait frame */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: PORTRAIT_RADIUS,
            border: '1px solid rgba(139,112,48,0.45)',
            boxShadow: 'inset 0 0 0 1px rgba(212,170,60,0.12)',
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
              borderRadius: PORTRAIT_RADIUS + 2,
              border: '2px solid var(--candle-amber)',
              boxShadow: '0 0 12px rgba(212,170,60,0.5)',
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
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: 10,
          color: 'var(--blood-bright)',
          textAlign: 'center',
          maxWidth: size,
          lineHeight: 1.4,
          margin: 0,
        }}>
          {error}
        </p>
      )}
    </div>
  )
}
