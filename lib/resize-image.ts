/**
 * Resize an image file client-side before upload.
 * Keeps the original if it already fits within maxDim.
 * Returns a JPEG file at 0.85 quality — safe for any Vercel function body limit.
 */
export function resizeImage(file: File, maxDim = 2000): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image()
    const blobUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(blobUrl)
      const { width, height } = img

      if (width <= maxDim && height <= maxDim) {
        resolve(file)
        return
      }

      const scale = Math.min(maxDim / width, maxDim / height)
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(width * scale)
      canvas.height = Math.round(height * scale)
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)

      canvas.toBlob(
        blob =>
          resolve(
            blob
              ? new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' })
              : file
          ),
        'image/jpeg',
        0.85
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(blobUrl)
      resolve(file)
    }

    img.src = blobUrl
  })
}
