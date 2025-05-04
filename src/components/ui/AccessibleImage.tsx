'use client';

import React, { useState } from 'react';
import Image, { ImageProps } from 'next/image';
import { twMerge } from 'tailwind-merge';

interface AccessibleImageProps extends Omit<ImageProps, 'alt'> {
  alt: string;
  longDescription?: string;
  showLongDescription?: boolean;
  className?: string;
  containerClassName?: string;
  fallbackText?: string;
}

export function AccessibleImage({
  alt,
  longDescription,
  showLongDescription = false,
  className,
  containerClassName,
  fallbackText,
  ...props
}: AccessibleImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [showDescription, setShowDescription] = useState(false);
  
  const toggleDescription = () => {
    setShowDescription(!showDescription);
  };
  
  // Gerar um ID único para a imagem
  const imageId = `img-${Math.random().toString(36).substring(2, 9)}`;
  const descriptionId = `desc-${imageId}`;
  
  return (
    <div className={twMerge("relative inline-block", containerClassName)}>
      {/* Imagem com atributos de acessibilidade */}
      {!hasError ? (
        <Image
          {...props}
          alt={alt}
          className={twMerge(
            "transition-opacity",
            !isLoaded && "opacity-0",
            isLoaded && "opacity-100",
            className
          )}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          aria-describedby={longDescription ? descriptionId : undefined}
        />
      ) : (
        <div
          className={twMerge(
            "flex items-center justify-center bg-muted text-muted-foreground border border-border rounded",
            className
          )}
          role="img"
          aria-label={alt}
          style={{
            width: props.width ? `${props.width}px` : '100%',
            height: props.height ? `${props.height}px` : '100%',
          }}
        >
          {fallbackText || alt || "Imagem não disponível"}
        </div>
      )}
      
      {/* Longo texto descritivo, visível somente para leitores de tela por padrão */}
      {longDescription && (
        <>
          <div
            id={descriptionId}
            className={twMerge(
              "text-sm",
              showLongDescription || showDescription ? "mt-2 bg-muted p-2 rounded" : "sr-only"
            )}
          >
            {longDescription}
          </div>
          
          {/* Botão para mostrar/ocultar a descrição longa (para usuários que não usam leitores de tela) */}
          {!showLongDescription && (
            <button
              onClick={toggleDescription}
              className="mt-1 text-xs text-primary underline focus:outline-none focus:ring-2 focus:ring-primary"
              aria-expanded={showDescription}
              aria-controls={descriptionId}
            >
              {showDescription ? "Ocultar descrição detalhada" : "Mostrar descrição detalhada"}
            </button>
          )}
        </>
      )}
      
      {/* Indicador de carregamento */}
      {!isLoaded && !hasError && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-background/50"
          aria-hidden="true"
        >
          <span className="sr-only">Carregando imagem...</span>
          <svg
            className="animate-spin h-8 w-8 text-primary"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        </div>
      )}
    </div>
  );
} 