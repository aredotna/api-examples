import type { BlockImage } from '@aredotna/sdk/api'
import { Spinner } from '@radix-ui/themes'
import { useEffect, useState } from 'react'
import { Blurhash } from 'react-blurhash'

type ImageSize = 'small' | 'medium' | 'large' | 'square'

interface ImageProps {
  image: BlockImage
  size?: ImageSize
  alt?: string
  style?: React.CSSProperties
  containerStyle?: React.CSSProperties
}

const SimpleImage = ({
  src,
  alt,
  style,
  filename,
}: {
  src: string
  alt: string
  style?: React.CSSProperties
  filename?: string
}) => (
  <img
    key={filename || src}
    src={src}
    alt={alt}
    style={{
      width: '100%',
      height: 'auto',
      display: 'block',
      ...style,
    }}
  />
)

const BlurhashImage = ({
  src,
  alt,
  blurhash,
  aspectRatio,
  filename,
  style,
  containerStyle,
  onLoad,
  imageLoaded,
}: {
  src: string
  alt: string
  blurhash: string
  aspectRatio?: number
  filename?: string
  style?: React.CSSProperties
  containerStyle?: React.CSSProperties
  onLoad: () => void
  imageLoaded: boolean
}) => (
  <div
    key={filename || src}
    style={{
      position: 'relative',
      width: '100%',
      height: '100%',
      overflow: 'hidden',
      ...(aspectRatio ? { aspectRatio } : {}),
      ...containerStyle,
    }}
  >
    <Blurhash
      hash={blurhash}
      width="100%"
      height="100%"
      resolutionX={32}
      resolutionY={32}
      punch={1}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        opacity: imageLoaded ? 0 : 1,
        transition: 'opacity 0.3s ease-in-out',
      }}
    />
    <img
      src={src}
      alt={alt}
      onLoad={onLoad}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        ...style,
        opacity: imageLoaded ? 1 : 0,
        transition: 'opacity 0.3s ease-in-out',
        zIndex: 1,
      }}
    />
  </div>
)

function Image({
  image,
  size = 'medium',
  alt = '',
  style,
  containerStyle,
}: ImageProps): JSX.Element | null {
  const [imageLoaded, setImageLoaded] = useState(false)
  const src = image[size]?.src

  useEffect(() => {
    setImageLoaded(false)
  }, [src])

  if (!src) return null

  const hasGeometry = !!image.aspect_ratio
  const hasBlurhash = !!image.blurhash

  // Case 1: No geometry, no blurhash - plain image
  if (!hasGeometry && !hasBlurhash) {
    const img = <SimpleImage src={src} alt={alt} style={style} filename={image.filename} />

    return containerStyle ? <div style={containerStyle}>{img}</div> : img
  }

  // Case 2: Has geometry, no blurhash - sized placeholder with spinner
  if (hasGeometry && !hasBlurhash) {
    return (
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: image.aspect_ratio ?? undefined,
          overflow: 'hidden',
          ...containerStyle,
        }}
      >
        {!imageLoaded && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Spinner size="3" />
          </div>
        )}
        <img
          src={src}
          alt={alt}
          onLoad={() => setImageLoaded(true)}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            ...style,
            opacity: imageLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease-in-out',
            zIndex: 1,
          }}
        />
      </div>
    )
  }

  // Case 3: Has blurhash - sized placeholder with blurhash
  return (
    <BlurhashImage
      src={src}
      alt={alt}
      blurhash={image.blurhash!}
      aspectRatio={image.aspect_ratio ?? undefined}
      filename={image.filename}
      style={style}
      containerStyle={containerStyle}
      onLoad={() => setImageLoaded(true)}
      imageLoaded={imageLoaded}
    />
  )
}

export default Image
