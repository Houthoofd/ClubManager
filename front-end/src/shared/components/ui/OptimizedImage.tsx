import React, { useState, useEffect, useRef } from "react";
import { Spinner } from "@patternfly/react-core";

interface OptimizedImageProps extends Omit<
  React.ImgHTMLAttributes<HTMLImageElement>,
  "onLoad" | "onError"
> {
  /**
   * Source de l'image (URL ou chemin)
   */
  src: string;

  /**
   * Texte alternatif (obligatoire pour l'accessibilité)
   */
  alt: string;

  /**
   * URL de l'image en basse résolution pour le blur-up effect
   */
  placeholderSrc?: string;

  /**
   * Affiche un spinner pendant le chargement
   */
  showLoader?: boolean;

  /**
   * Classe CSS pour le conteneur
   */
  containerClassName?: string;

  /**
   * Style du conteneur
   */
  containerStyle?: React.CSSProperties;

  /**
   * Callback appelé quand l'image est chargée
   */
  onImageLoad?: () => void;

  /**
   * Callback appelé en cas d'erreur
   */
  onImageError?: (error: Error) => void;

  /**
   * Active le lazy loading natif du navigateur
   * @default true
   */
  lazy?: boolean;

  /**
   * Largeurs responsive pour srcset (en px)
   * @example [400, 800, 1200]
   */
  responsiveWidths?: number[];

  /**
   * Formats d'image à supporter (WebP, AVIF)
   */
  formats?: ("webp" | "avif" | "jpeg" | "png")[];
}

/**
 * Composant d'image optimisé avec:
 * - ✅ Lazy loading natif
 * - ✅ Blur-up effect (progressive loading)
 * - ✅ WebP/AVIF support avec fallback
 * - ✅ Responsive images (srcset)
 * - ✅ Intersection Observer pour chargement différé
 *
 * @example
 * ```tsx
 * <OptimizedImage
 *   src="/images/article.jpg"
 *   alt="Article description"
 *   placeholderSrc="/images/article-thumb.jpg"
 *   responsiveWidths={[400, 800, 1200]}
 *   formats={['webp', 'jpeg']}
 * />
 * ```
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  placeholderSrc,
  showLoader = false,
  containerClassName = "",
  containerStyle = {},
  onImageLoad,
  onImageError,
  lazy = true,
  responsiveWidths = [],
  formats = ["webp", "jpeg"],
  className = "",
  style = {},
  ...imgProps
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(!lazy);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer pour le lazy loading manuel
  useEffect(() => {
    if (!lazy || isInView) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: "50px", // Charge 50px avant d'entrer dans le viewport
        threshold: 0.01,
      },
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [lazy, isInView]);

  // Gestion du chargement de l'image
  const handleLoad = () => {
    setIsLoaded(true);
    setHasError(false);
    onImageLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onImageError?.(new Error(`Failed to load image: ${src}`));
  };

  // Génère le srcset pour responsive images
  const generateSrcSet = (baseSrc: string, widths: number[]): string => {
    if (widths.length === 0) return "";

    return widths
      .map((width) => {
        // Assume que l'API peut resize les images avec un paramètre ?w=
        const url = `${baseSrc}${baseSrc.includes("?") ? "&" : "?"}w=${width}`;
        return `${url} ${width}w`;
      })
      .join(", ");
  };

  // Génère l'URL pour un format spécifique
  const getFormatUrl = (baseSrc: string, format: string): string => {
    // Remplace l'extension par le nouveau format
    return baseSrc.replace(/\.(jpg|jpeg|png|gif)$/i, `.${format}`);
  };

  // Détermine quelle source afficher
  const currentSrc = isInView ? src : placeholderSrc || "";
  const shouldShowPlaceholder = placeholderSrc && !isLoaded;

  return (
    <div
      ref={containerRef}
      className={`optimized-image-container ${containerClassName}`}
      style={{
        position: "relative",
        overflow: "hidden",
        ...containerStyle,
      }}
    >
      {/* Loader */}
      {showLoader && !isLoaded && !hasError && isInView && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 2,
          }}
        >
          <Spinner size="lg" />
        </div>
      )}

      {/* Image placeholder (blur-up) */}
      {shouldShowPlaceholder && (
        <img
          src={placeholderSrc}
          alt=""
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: "blur(10px)",
            transform: "scale(1.1)",
            transition: "opacity 0.3s ease-in-out",
            opacity: isLoaded ? 0 : 1,
            zIndex: 1,
          }}
        />
      )}

      {/* Image principale avec <picture> pour formats modernes */}
      {isInView && (
        <picture>
          {/* WebP source */}
          {formats.includes("webp") && (
            <source
              type="image/webp"
              srcSet={
                responsiveWidths.length > 0
                  ? generateSrcSet(getFormatUrl(src, "webp"), responsiveWidths)
                  : getFormatUrl(src, "webp")
              }
            />
          )}

          {/* AVIF source */}
          {formats.includes("avif") && (
            <source
              type="image/avif"
              srcSet={
                responsiveWidths.length > 0
                  ? generateSrcSet(getFormatUrl(src, "avif"), responsiveWidths)
                  : getFormatUrl(src, "avif")
              }
            />
          )}

          {/* Fallback JPEG/PNG */}
          <img
            ref={imgRef}
            src={currentSrc}
            alt={alt}
            className={className}
            loading={lazy ? "lazy" : "eager"}
            srcSet={responsiveWidths.length > 0 ? generateSrcSet(src, responsiveWidths) : undefined}
            sizes={responsiveWidths.length > 0 ? "100vw" : undefined}
            onLoad={handleLoad}
            onError={handleError}
            style={{
              display: "block",
              width: "100%",
              height: "auto",
              opacity: isLoaded ? 1 : 0,
              transition: "opacity 0.3s ease-in-out",
              ...style,
            }}
            {...imgProps}
          />
        </picture>
      )}

      {/* Fallback en cas d'erreur */}
      {hasError && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
            minHeight: "200px",
            backgroundColor: "#f5f5f5",
            color: "#666",
            fontSize: "14px",
          }}
        >
          Image non disponible
        </div>
      )}
    </div>
  );
};

export default OptimizedImage;
