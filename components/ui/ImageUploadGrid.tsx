'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/components/ui/Toaster'

type PendingItem = { id: string; file: File; preview: string }

interface Props {
  bucket: string
  userId: string
  maxImages?: number
  uploadedUrls: string[]
  onUrlsChange: (urls: string[]) => void
  label?: string
}

export default function ImageUploadGrid({
  bucket,
  userId,
  maxImages = 5,
  uploadedUrls,
  onUrlsChange,
  label = 'Photos',
}: Props) {
  const [pending, setPending] = useState<PendingItem[]>([])

  const total = uploadedUrls.length + pending.length
  const canAdd = total < maxImages

  async function handleFiles(files: FileList) {
    const available = maxImages - uploadedUrls.length - pending.length
    if (available <= 0) {
      toast(`Maximum ${maxImages} images allowed.`, 'error')
      return
    }

    const toProcess = Array.from(files).slice(0, available)
    const newItems: PendingItem[] = toProcess.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file,
      preview: URL.createObjectURL(file),
    }))

    setPending((prev) => [...prev, ...newItems])

    const supabase = createClient()
    const newUrls: string[] = []

    for (const item of newItems) {
      try {
        const ext = item.file.name.split('.').pop()
        const path = `${userId}/${item.id}.${ext}`
        
        // Check file size (max 5MB)
        if (item.file.size > 5 * 1024 * 1024) {
          toast('File too large. Max 5MB per image.', 'error')
          setPending((prev) => prev.filter((p) => p.id !== item.id))
          URL.revokeObjectURL(item.preview)
          continue
        }

        const { error } = await supabase.storage.from(bucket).upload(path, item.file, {
          upsert: false,
        })

        setPending((prev) => prev.filter((p) => p.id !== item.id))
        URL.revokeObjectURL(item.preview)

        if (error) {
          console.error('Upload error:', error)
          toast('Upload failed: ' + error.message, 'error')
          continue
        }

        // Get signed URL for public access
        const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path)
        
        // Add cache busting parameter
        const urlWithCache = `${publicUrl}?t=${Date.now()}`
        newUrls.push(urlWithCache)
        toast('Image uploaded successfully', 'success')
      } catch (err) {
        console.error('Unexpected error during upload:', err)
        toast('An error occurred during upload', 'error')
        setPending((prev) => prev.filter((p) => p.id !== item.id))
        URL.revokeObjectURL(item.preview)
      }
    }

    if (newUrls.length > 0) {
      onUrlsChange([...uploadedUrls, ...newUrls])
    }
  }

  function removeUploaded(index: number) {
    onUrlsChange(uploadedUrls.filter((_, i) => i !== index))
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
  }

  return (
    <div className="form-group">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <label className="form-label" style={{ margin: 0 }}>{label}</label>
        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-400)' }}>
          {total}/{maxImages} photos
        </span>
      </div>

      {/* Thumbnails grid */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>

        {/* Uploaded thumbnails */}
        {uploadedUrls.map((url, i) => (
          <div
            key={url}
            style={{
              position: 'relative',
              width: 100,
              height: 100,
              borderRadius: 10,
              overflow: 'hidden',
              border: '2px solid var(--color-border)',
              flexShrink: 0,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={`Photo ${i + 1}`}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
            {i === 0 && (
              <span style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                background: 'rgba(0,0,0,0.55)', color: '#fff',
                fontSize: '0.65rem', fontWeight: 700,
                textAlign: 'center', padding: '3px 0', letterSpacing: '0.04em',
              }}>
                MAIN
              </span>
            )}
            <button
              type="button"
              onClick={() => removeUploaded(i)}
              aria-label="Remove photo"
              style={{
                position: 'absolute', top: 4, right: 4,
                background: 'rgba(0,0,0,0.65)',
                color: '#fff', border: 'none', borderRadius: '50%',
                width: 22, height: 22, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, lineHeight: 1, fontWeight: 700,
              }}
            >×</button>
          </div>
        ))}

        {/* Pending thumbnails (uploading) */}
        {pending.map((item) => (
          <div
            key={item.id}
            style={{
              position: 'relative',
              width: 100,
              height: 100,
              borderRadius: 10,
              overflow: 'hidden',
              border: '2px solid var(--color-accent)',
              flexShrink: 0,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.preview}
              alt="Uploading…"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter: 'brightness(0.6)' }}
            />
            {/* Spinner overlay */}
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{
                width: 24, height: 24, border: '3px solid rgba(255,255,255,0.3)',
                borderTopColor: '#fff', borderRadius: '50%',
                animation: 'spin 0.7s linear infinite',
              }} />
            </div>
            <span style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              background: 'rgba(0,0,0,0.55)', color: '#fff',
              fontSize: '0.65rem', fontWeight: 700,
              textAlign: 'center', padding: '3px 0',
            }}>
              UPLOADING
            </span>
          </div>
        ))}

        {/* Add button */}
        {canAdd && (
          <label
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            style={{
              width: 100,
              height: 100,
              borderRadius: 10,
              border: '2px dashed var(--color-border)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              gap: 4,
              color: 'var(--color-text-400)',
              fontSize: '0.75rem',
              transition: 'border-color 0.2s, background 0.2s',
              background: 'var(--color-surface-800)',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--color-accent)'
              ;(e.currentTarget as HTMLElement).style.color = 'var(--color-accent)'
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)'
              ;(e.currentTarget as HTMLElement).style.color = 'var(--color-text-400)'
            }}
          >
            <span style={{ fontSize: '1.5rem', lineHeight: 1, fontWeight: 300 }}>+</span>
            <span>Add photo</span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              style={{ display: 'none' }}
              onChange={(e) => e.target.files && handleFiles(e.target.files)}
            />
          </label>
        )}
      </div>

      {total === 0 && (
        <p style={{ color: 'var(--color-text-400)', fontSize: '0.8rem', marginTop: 8 }}>
          Drag &amp; drop or click &ldquo;Add photo&rdquo; to upload images.
        </p>
      )}
    </div>
  )
}
