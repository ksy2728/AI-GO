/**
 * Image optimization utilities for mobile performance
 */

// Modern image formats with fallbacks
export const IMAGE_FORMATS = {
  AVIF: 'image/avif',
  WEBP: 'image/webp',
  JPEG: 'image/jpeg',
  PNG: 'image/png'
} as const

export interface ImageOptimizationOptions {
  quality?: number
  format?: keyof typeof IMAGE_FORMATS
  sizes?: string
  priority?: boolean
  loading?: 'lazy' | 'eager'
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
}

export interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  style?: React.CSSProperties
  onLoad?: () => void
  onError?: () => void
}

// Device pixel ratio aware sizing
export function getOptimalImageSize(
  originalWidth: number,
  originalHeight: number,
  containerWidth: number,
  containerHeight?: number
): { width: number; height: number } {
  const devicePixelRatio = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
  const targetWidth = Math.min(containerWidth * devicePixelRatio, originalWidth)

  if (containerHeight) {
    const targetHeight = Math.min(containerHeight * devicePixelRatio, originalHeight)
    return { width: targetWidth, height: targetHeight }
  }

  // Maintain aspect ratio
  const aspectRatio = originalHeight / originalWidth
  return {
    width: targetWidth,
    height: Math.round(targetWidth * aspectRatio)
  }
}

// Generate responsive srcSet for different screen sizes
export function generateSrcSet(
  baseSrc: string,
  sizes: number[] = [320, 640, 750, 828, 1080, 1200, 1920]
): string {
  if (!baseSrc.includes('/_next/image')) {
    // For external images, return as-is
    return baseSrc
  }

  return sizes
    .map(size => {
      const url = new URL(baseSrc, window.location.origin)
      url.searchParams.set('w', size.toString())
      return `${url.toString()} ${size}w`
    })
    .join(', ')
}

// Generate sizes attribute for responsive images
export function generateSizes(breakpoints?: { [key: string]: string }): string {
  const defaultBreakpoints = {
    '(max-width: 640px)': '100vw',
    '(max-width: 768px)': '50vw',
    '(max-width: 1024px)': '33vw',
    default: '25vw'
  }

  const sizes = breakpoints || defaultBreakpoints

  return Object.entries(sizes)
    .filter(([key]) => key !== 'default')
    .map(([media, size]) => `${media} ${size}`)
    .concat([sizes.default || '100vw'])
    .join(', ')
}

// Lazy loading intersection observer
class ImageLazyLoader {
  private observer: IntersectionObserver | null = null
  private imageQueue: Set<HTMLImageElement> = new Set()

  constructor() {
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        this.handleIntersection.bind(this),
        {
          rootMargin: '50px 0px', // Load images 50px before they enter viewport
          threshold: 0.01
        }
      )
    }
  }

  private handleIntersection(entries: IntersectionObserverEntry[]) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement
        this.loadImage(img)
        this.observer?.unobserve(img)
        this.imageQueue.delete(img)
      }
    })
  }

  private loadImage(img: HTMLImageElement) {
    const src = img.dataset.src
    const srcset = img.dataset.srcset

    if (src) {
      img.src = src
      img.removeAttribute('data-src')
    }

    if (srcset) {
      img.srcset = srcset
      img.removeAttribute('data-srcset')
    }

    // Add fade-in animation
    img.style.opacity = '0'
    img.style.transition = 'opacity 0.3s ease'

    img.onload = () => {
      img.style.opacity = '1'
      img.classList.remove('lazy-loading')
      img.classList.add('lazy-loaded')
    }
  }

  public observe(img: HTMLImageElement) {
    if (this.observer) {
      this.imageQueue.add(img)
      this.observer.observe(img)
      img.classList.add('lazy-loading')
    } else {
      // Fallback for browsers without IntersectionObserver
      this.loadImage(img)
    }
  }

  public disconnect() {
    if (this.observer) {
      this.observer.disconnect()
      this.imageQueue.clear()
    }
  }
}

// Singleton lazy loader
let lazyLoader: ImageLazyLoader | null = null

export function initializeLazyLoader(): ImageLazyLoader {
  if (!lazyLoader && typeof window !== 'undefined') {
    lazyLoader = new ImageLazyLoader()
  }
  return lazyLoader!
}

// Image format detection and optimization
export function supportsWebP(): Promise<boolean> {
  return new Promise((resolve) => {
    const webP = new Image()
    webP.onload = webP.onerror = () => {
      resolve(webP.height === 2)
    }
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA'
  })
}

export function supportsAVIF(): Promise<boolean> {
  return new Promise((resolve) => {
    const avif = new Image()
    avif.onload = avif.onerror = () => {
      resolve(avif.height === 2)
    }
    avif.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A='
  })
}

// Generate blur placeholder
export function generateBlurDataURL(
  width: number = 10,
  height: number = 10
): string {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!

  canvas.width = width
  canvas.height = height

  // Create a simple gradient blur effect
  const gradient = ctx.createLinearGradient(0, 0, width, height)
  gradient.addColorStop(0, '#f3f4f6')
  gradient.addColorStop(1, '#e5e7eb')

  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)

  return canvas.toDataURL('image/jpeg', 0.1)
}

// Preload critical images
export function preloadCriticalImages(imageSrcs: string[]): Promise<void[]> {
  return Promise.all(
    imageSrcs.map(src =>
      new Promise<void>((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve()
        img.onerror = reject
        img.src = src
      })
    )
  )
}

// Image compression utility (client-side)
export function compressImage(
  file: File,
  maxWidth: number = 1920,
  maxHeight: number = 1080,
  quality: number = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    const img = new Image()

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img

      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }

      if (height > maxHeight) {
        width = (width * maxHeight) / height
        height = maxHeight
      }

      canvas.width = width
      canvas.height = height

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to compress image'))
          }
        },
        'image/jpeg',
        quality
      )
    }

    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

// Progressive image loading
export class ProgressiveImage {
  private container: HTMLElement
  private lowQualitySrc: string
  private highQualitySrc: string
  private img: HTMLImageElement | null = null
  private loaded = false

  constructor(
    container: HTMLElement,
    lowQualitySrc: string,
    highQualitySrc: string
  ) {
    this.container = container
    this.lowQualitySrc = lowQualitySrc
    this.highQualitySrc = highQualitySrc

    this.loadLowQuality()
  }

  private loadLowQuality() {
    const img = new Image()
    img.src = this.lowQualitySrc
    img.style.filter = 'blur(2px)'
    img.style.transition = 'filter 0.3s ease'
    img.className = 'progressive-image-low'

    img.onload = () => {
      this.container.appendChild(img)
      this.img = img
      this.loadHighQuality()
    }
  }

  private loadHighQuality() {
    const img = new Image()
    img.src = this.highQualitySrc

    img.onload = () => {
      if (this.img) {
        this.img.src = this.highQualitySrc
        this.img.style.filter = 'none'
        this.img.className = 'progressive-image-high'
        this.loaded = true
      }
    }
  }

  public isLoaded(): boolean {
    return this.loaded
  }
}