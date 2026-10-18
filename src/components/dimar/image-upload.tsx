'use client'

import * as React from 'react'
import { useCallback, useRef, useState } from 'react'
import { UploadCloud, Loader2, X, Link2, AlertCircle, ImageIcon } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'

interface UploadResponse {
  url: string
  thumbUrl: string
  filename: string
  size: number
}

export interface ImageUploadProps {
  /** URL actual (valor controlado) */
  value?: string
  /** Callback que recibe la URL final (subida o pegada) */
  onChange: (url: string) => void
  /** Etiqueta opcional */
  label?: string
  /** Clase extra del contenedor */
  className?: string
}

/**
 * Componente reutilizable de subida de imágenes.
 *
 * - Dropzone / clic para subir (POST /api/upload multipart/form-data).
 * - Previsualización con tamaño fijo.
 * - Indicador de carga (spinner).
 * - Validación: solo imágenes, máx 5MB.
 * - Botón "Eliminar" limpia la URL.
 * - Input alternativo para pegar una URL de imagen directamente.
 */
export function ImageUpload({
  value = '',
  onChange,
  label,
  className,
}: ImageUploadProps) {
  const toast = useAppStore((s) => s.toast)
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resetInput = () => {
    if (inputRef.current) inputRef.current.value = ''
  }

  const uploadFile = useCallback(
    async (file: File) => {
      setError(null)
      if (!file.type.startsWith('image/')) {
        setError('Solo se permiten imágenes (PNG, JPG, WebP, GIF).')
        toast('Formato no permitido', 'error')
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('La imagen excede 5MB.')
        toast('La imagen excede 5MB', 'error')
        return
      }

      setUploading(true)
      try {
        const fd = new FormData()
        fd.append('file', file)
        const res = await fetch('/api/upload', { method: 'POST', body: fd })
        const data = (await res.json()) as UploadResponse & { error?: string }
        if (!res.ok) {
          throw new Error(data.error || 'Error al subir la imagen')
        }
        onChange(data.url)
        toast('Imagen subida correctamente')
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error al subir la imagen'
        setError(msg)
        toast(msg, 'error')
      } finally {
        setUploading(false)
        resetInput()
      }
    },
    [onChange, toast],
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) uploadFile(file)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) uploadFile(file)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      inputRef.current?.click()
    }
  }

  const handleRemove = () => {
    onChange('')
    setError(null)
    resetInput()
  }

  return (
    <div className={cn('grid gap-1.5', className)}>
      {label && <label className="text-sm font-medium text-foreground">{label}</label>}

      {value && !uploading ? (
        <div className="rounded-lg border bg-card overflow-hidden">
          <div className="relative group">
            <img
              src={value}
              alt="Vista previa"
              className="w-full max-h-40 object-cover"
              onError={(e) => {
                const t = e.currentTarget as HTMLImageElement
                t.style.opacity = '0.3'
              }}
            />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-md bg-background/95 backdrop-blur px-2 py-1 text-xs font-medium text-destructive border border-border shadow-sm hover:bg-destructive hover:text-white transition-colors"
              title="Eliminar imagen"
            >
              <X className="size-3" /> Eliminar
            </button>
          </div>
          <div className="px-3 py-2 flex items-center justify-between gap-2 bg-muted/30">
            <span className="text-xs text-muted-foreground truncate flex items-center gap-1.5">
              <ImageIcon className="size-3 shrink-0" />
              {value.length > 50 ? '…' + value.slice(-45) : value}
            </span>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="text-xs font-medium text-primary hover:underline"
            >
              Cambiar
            </button>
          </div>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          onClick={() => !uploading && inputRef.current?.click()}
          onKeyDown={handleKeyDown}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            'relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center cursor-pointer transition-colors min-h-[140px]',
            dragOver
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50 hover:bg-muted/40',
            uploading && 'pointer-events-none opacity-80',
          )}
        >
          {uploading ? (
            <>
              <Loader2 className="size-7 text-primary animate-spin" />
              <p className="text-sm font-medium text-foreground">Subiendo imagen…</p>
              <p className="text-xs text-muted-foreground">Procesando con Sharp</p>
            </>
          ) : (
            <>
              <div className="grid place-items-center size-10 rounded-full bg-primary/10 text-primary">
                <UploadCloud className="size-5" />
              </div>
              <p className="text-sm font-medium text-foreground">
                Arrastra una imagen o haz clic
              </p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG, WebP o GIF · máx 5MB
              </p>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleInputChange}
          />
        </div>
      )}

      {error && (
        <p className="text-xs text-destructive flex items-center gap-1.5">
          <AlertCircle className="size-3.5 shrink-0" />
          {error}
        </p>
      )}

      {/* Alternativa: pegar URL */}
      <div className="grid gap-1.5">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link2 className="size-3" />
          <span>o pega una URL de imagen</span>
        </div>
        <input
          type="url"
          value={value && value.startsWith('http') ? value : ''}
          onChange={(e) => {
            onChange(e.target.value)
            setError(null)
          }}
          placeholder="https://picsum.photos/seed/xyz/600/600"
          className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:border-ring"
        />
      </div>
    </div>
  )
}

export default ImageUpload
