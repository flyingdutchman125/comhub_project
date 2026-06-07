import React, { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'

const createImage = (url) => new Promise((resolve, reject) => {
  const image = new Image()
  image.addEventListener('load', () => resolve(image))
  image.addEventListener('error', (error) => reject(error))
  image.src = url
})

async function getCroppedImg(imageSrc, pixelCrop) {
  if (!pixelCrop) return null
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height
  const ctx = canvas.getContext('2d')

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  )

  return canvas.toDataURL('image/jpeg', 0.85)
}

export default function CropModal({ imageSrc, aspect = 16 / 9, onCancel, onCropDone }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)

  const onCropComplete = useCallback((_, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels)
  }, [])

  const handleDone = async () => {
    try {
      // If cropping hasn't produced pixel data yet, fallback to the original image source
      const cropped = croppedAreaPixels
        ? await getCroppedImg(imageSrc, croppedAreaPixels)
        : imageSrc;
      if (onCropDone) onCropDone(cropped);
      // Close the modal after cropping is done
      if (onCancel) onCancel();
    } catch (err) {
      console.error('Crop error', err);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-60">
      <div className="bg-slate-900 rounded-[1rem] border border-slate-800 p-4 w-full max-w-2xl">
        <div style={{ position: 'relative', width: '100%', height: 400, background: '#111' }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <div className="mt-3 flex items-center gap-3">
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
          />

          <div className="ml-auto flex gap-2">
            <button type="button" onClick={onCancel} className="rounded-lg border px-4 py-2">Batal</button>
            <button type="button" onClick={handleDone} className="rounded-lg bg-cyan-500 px-4 py-2 text-white">Selesai</button>
          </div>
        </div>
      </div>
    </div>
  )
}
