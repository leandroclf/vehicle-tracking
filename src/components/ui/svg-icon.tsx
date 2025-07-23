import React from 'react';

interface SvgIconProps {
  className?: string;
  width?: number;
  height?: number;
  fill?: string;
  stroke?: string;
}

export const SvgIcon: React.FC<SvgIconProps> = ({ 
  className = '', 
  width = 24, 
  height = 24, 
  fill = 'none', 
  stroke = 'currentColor' 
}) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill={fill}
    stroke={stroke}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    id="svg"
  >
    <text x="10" y="20" id="svg-link-text">text</text>
  </svg>
);

// Componente para SVG seguro sem data URI
export const SafeSvgIcon: React.FC<SvgIconProps> = ({ 
  className = '', 
  width = 24, 
  height = 24 
}) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="10"/>
    <path d="M12 6v6l4 2"/>
  </svg>
);

// Utilitário para criar SVG data URI seguro
export const createSafeSvgDataUri = (svgContent: string): string => {
  // Remove caracteres problemáticos e codifica corretamente
  const cleanSvg = svgContent
    .replace(/[\r\n\t]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Usa encodeURIComponent em vez de base64 para melhor compatibilidade
  return `data:image/svg+xml,${encodeURIComponent(cleanSvg)}`;
};

// Hook para carregar SVG de forma segura
export const useSafeSvg = (svgContent: string) => {
  const [dataUri, setDataUri] = React.useState<string>('');
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    try {
      const uri = createSafeSvgDataUri(svgContent);
      setDataUri(uri);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar SVG');
      setDataUri('');
    }
  }, [svgContent]);

  return { dataUri, error };
};