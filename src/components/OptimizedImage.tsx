'use client'

import React, { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import {
  generateSrcSet,
  generateSizes,
  generateBlurDataURL,
  initializeLazyLoader,
  getOptimalImageSize
} from '@/lib/image-optimization'
import { isSlowConnection, isMobileDevice } from '@/lib/performance'

export interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  style?: React.CSSProperties
  priority?: boolean
  quality?: number
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
  sizes?: string
  onLoad?: () => void
  onError?: () => void
  lazy?: boolean
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  style,
  priority = false,
  quality = 80,
  placeholder = 'blur',
  blurDataURL,
  sizes,
  onLoad,
  onError,
  lazy = true,
  ...props
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [useWebP, setUseWebP] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  // Detect WebP support
  useEffect(() => {
    const checkWebPSupport = async () => {
      try {
        const webP = document.createElement('img')
        webP.onload = webP.onerror = () => {
          setUseWebP(webP.height === 2)
        }
        webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA'
      } catch {
        setUseWebP(false)
      }
    }

    checkWebPSupport()
  }, [])

  // Generate optimal image parameters
  const isSlowConn = isSlowConnection()
  const isMobile = isMobileDevice()

  // Reduce quality for slow connections
  const optimizedQuality = isSlowConn ? Math.max(quality - 20, 40) : quality

  // Generate blur placeholder if not provided
  const placeholder_url = blurDataURL || (placeholder === 'blur'
    ? generateBlurDataURL(width || 10, height || 10)
    : undefined)

  // Generate responsive sizes if not provided
  const responsiveSizes = sizes || generateSizes({
    '(max-width: 640px)': '100vw',
    '(max-width: 768px)': '50vw',
    '(max-width: 1024px)': '33vw',
    default: '25vw'
  })

  // Handle image load
  const handleLoad = () => {
    setIsLoaded(true)
    onLoad?.()
  }

  // Handle image error
  const handleError = () => {
    setHasError(true)
    onError?.()
  }

  // Error fallback
  if (hasError) {
    return (
      <div
        className={`bg-gray-200 flex items-center justify-center ${className}`}
        style={{ width, height, ...style }}
      >
        <div className="text-gray-400 text-sm">Image unavailable</div>
      </div>
    )
  }

  // Optimize src for different formats
  const optimizedSrc = src.includes('/_next/image') ? src : src

  return (
    <div className={`relative overflow-hidden ${className}`} style={style}>
      <Image
        ref={imgRef}
        src={optimizedSrc}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        quality={optimizedQuality}
        placeholder={placeholder}
        blurDataURL={placeholder_url}
        sizes={responsiveSizes}
        loading={lazy && !priority ? 'lazy' : 'eager'}
        onLoad={handleLoad}
        onError={handleError}
        className={`
          transition-opacity duration-300 ease-in-out
          ${isLoaded ? 'opacity-100' : 'opacity-0'}
          ${className}
        `}
        style={{
          objectFit: 'cover',
          ...style
        }}
        {...props}
      />

      {/* Loading skeleton */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}

      {/* Progressive loading indicator */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  )
}

// Provider logo optimization for dashboard
export function OptimizedProviderLogo({
  provider,
  src,
  className = "w-6 h-6"
}: {
  provider: string
  src: string
  className?: string
}) {
  return (
    <OptimizedImage
      src={src}
      alt={`${provider} logo`}
      width={24}
      height={24}
      className={className}
      priority={true} // Provider logos are critical
      quality={90} // Higher quality for logos
      placeholder="empty" // No blur for logos
      lazy={false} // Don't lazy load critical logos
    />
  )
}

// Avatar optimization
export function OptimizedAvatar({
  src,
  alt,
  size = 40,
  className = ""
}: {
  src: string
  alt: string
  size?: number
  className?: string
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={`rounded-full ${className}`}
      quality={75}
      placeholder="blur"
      lazy={true}
    />
  )
}

// Hero image optimization
export function OptimizedHeroImage({
  src,
  alt,
  className = "",
  priority = true
}: {
  src: string
  alt: string
  className?: string
  priority?: boolean
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={1920}
      height={1080}
      className={className}
      priority={priority}
      quality={85}
      placeholder="blur"
      lazy={!priority}
      sizes="100vw"
    />
  )
}

// Icon optimization
export function OptimizedIcon({
  src,
  alt,
  size = 16,
  className = ""
}: {
  src: string
  alt: string
  size?: number
  className?: string
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={className}
      priority={false}
      quality={95} // Higher quality for small icons
      placeholder="empty"
      lazy={false} // Icons are usually small and critical
    />
  )
}