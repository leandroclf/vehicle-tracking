'use client';

import { useState, useEffect, useRef, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Truck, MapPin, Bell, Clock, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Tipos para os resultados da pesquisa
interface SearchResult {
  id: string;
  type: 'vehicle' | 'geofence' | 'alert' | 'report';
  title: string;
  description?: string;
  path: string;
  icon?: React.ReactNode;
  lastUpdated?: string;
}

interface SearchCategory {
  type: 'vehicle' | 'geofence' | 'alert' | 'report';
  label: string;
  icon: React.ReactNode;
  results: SearchResult[];
}

interface GlobalSearchProps {
  className?: string;
}

export function GlobalSearch({ className }: GlobalSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedResultIndex, setSelectedResultIndex] = useState(-1);
  const [totalResults, setTotalResults] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Abrir pesquisa com atalho de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Atalho Alt+/ para abrir pesquisa global
      if (e.altKey && e.key === '/') {
        e.preventDefault();
        setIsOpen(true);
      }
      
      // Também permitir Ctrl+K como atalho alternativo (comum em muitas aplicações)
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }

      // Fechar com Escape
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    };

    // Ouvir evento personalizado para abrir pesquisa
    const handleOpenSearch = () => {
      setIsOpen(true);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open-global-search', handleOpenSearch);

    // Disparar evento para notificar que a pesquisa global está disponível
    const event = new CustomEvent('global-search-ready');
    window.dispatchEvent(event);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-global-search', handleOpenSearch);
    };
  }, [isOpen]);

  // Focar no input quando abrir e adicionar indicador visual
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
    
    // Adicionar classe visual para indicar que a pesquisa está ativa
    if (isOpen) {
      document.body.classList.add('search-active');
    } else {
      document.body.classList.remove('search-active');
    }
  }, [isOpen]);

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node) &&
        isOpen
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Simular busca de resultados
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      setTotalResults(0);
      return;
    }

    const fetchResults = async () => {
      setIsLoading(true);

      // Simulação de busca - em produção, isso viria da API
      setTimeout(() => {
        const query = searchQuery.toLowerCase();

        // Resultados simulados
        const vehicleResults: SearchResult[] = ([
          {
            id: 'v1',
            type: 'vehicle',
            title: 'Caminhão 01',
            description: 'Placa: ABC-1234 • Status: Em operação',
            path: '/dashboard/vehicles/v1',
            icon: <Truck className="h-4 w-4" />,
            lastUpdated: 'Atualizado há 5 minutos'
          },
          {
            id: 'v2',
            type: 'vehicle',
            title: 'Van de Entrega',
            description: 'Placa: XYZ-5678 • Status: Em operação',
            path: '/dashboard/vehicles/v2',
            icon: <Truck className="h-4 w-4" />,
            lastUpdated: 'Atualizado há 10 minutos'
          }
        ] as SearchResult[]).filter(item => 
          item.title.toLowerCase().includes(query) || 
          (item.description?.toLowerCase().includes(query) ?? false)
        );

        const geofenceResults: SearchResult[] = ([
          {
            id: 'g1',
            type: 'geofence',
            title: 'Centro de Distribuição',
            description: 'São Paulo, SP • 5 veículos atualmente',
            path: '/dashboard/geofences/g1',
            icon: <MapPin className="h-4 w-4" />
          },
          {
            id: 'g2',
            type: 'geofence',
            title: 'Zona de Entrega Norte',
            description: 'Guarulhos, SP • 2 veículos atualmente',
            path: '/dashboard/geofences/g2',
            icon: <MapPin className="h-4 w-4" />
          }
        ] as SearchResult[]).filter(item => 
          item.title.toLowerCase().includes(query) || 
          (item.description?.toLowerCase().includes(query) ?? false)
        );

        const alertResults: SearchResult[] = ([
          {
            id: 'a1',
            type: 'alert',
            title: 'Alerta de Manutenção',
            description: 'Caminhão 01 • Manutenção preventiva necessária',
            path: '/dashboard/alerts/a1',
            icon: <Bell className="h-4 w-4" />,
            lastUpdated: 'Criado há 2 horas'
          }
        ] as SearchResult[]).filter(item => 
          item.title.toLowerCase().includes(query) || 
          (item.description?.toLowerCase().includes(query) ?? false)
        );

        const reportResults: SearchResult[] = ([
          {
            id: 'r1',
            type: 'report',
            title: 'Relatório de Consumo Mensal',
            description: 'Outubro 2023 • Todos os veículos',
            path: '/dashboard/reports/r1',
            icon: <Clock className="h-4 w-4" />,
            lastUpdated: 'Gerado há 5 dias'
          }
        ] as SearchResult[]).filter(item => 
          item.title.toLowerCase().includes(query) || 
          (item.description?.toLowerCase().includes(query) ?? false)
        );

        // Organizar resultados por categoria
        const results: SearchCategory[] = [];

        if (vehicleResults.length > 0) {
          results.push({
            type: 'vehicle',
            label: 'Veículos',
            icon: <Truck className="h-5 w-5" />,
            results: vehicleResults
          });
        }

        if (geofenceResults.length > 0) {
          results.push({
            type: 'geofence',
            label: 'Geocercas',
            icon: <MapPin className="h-5 w-5" />,
            results: geofenceResults
          });
        }

        if (alertResults.length > 0) {
          results.push({
            type: 'alert',
            label: 'Alertas',
            icon: <Bell className="h-5 w-5" />,
            results: alertResults
          });
        }

        if (reportResults.length > 0) {
          results.push({
            type: 'report',
            label: 'Relatórios',
            icon: <Clock className="h-5 w-5" />,
            results: reportResults
          });
        }

        setSearchResults(results);
        setTotalResults(
          vehicleResults.length +
          geofenceResults.length +
          alertResults.length +
          reportResults.length
        );
        setIsLoading(false);
      }, 300);
    };

    const debounceTimer = setTimeout(() => {
      fetchResults();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  // Navegação por teclado nos resultados
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      // Calcular total de resultados para navegação
      let flatResults: SearchResult[] = [];
      searchResults.forEach(category => {
        flatResults = [...flatResults, ...category.results];
      });

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedResultIndex(prev => 
            prev < flatResults.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedResultIndex(prev => (prev > 0 ? prev - 1 : 0));
          break;
        case 'Enter':
          if (selectedResultIndex >= 0 && selectedResultIndex < flatResults.length) {
            e.preventDefault();
            const selectedResult = flatResults[selectedResultIndex];
            router.push(selectedResult.path);
            setIsOpen(false);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, searchResults, selectedResultIndex, router]);

  // Função para navegar para um resultado
  const navigateToResult = (path: string) => {
    router.push(path);
    setIsOpen(false);
  };

  // Resetar índice selecionado quando os resultados mudam
  useEffect(() => {
    setSelectedResultIndex(-1);
  }, [searchResults]);

  // Calcular índice global para cada resultado
  const getGlobalIndex = (categoryIndex: number, resultIndex: number): number => {
    let globalIndex = 0;
    for (let i = 0; i < categoryIndex; i++) {
      globalIndex += searchResults[i].results.length;
    }
    return globalIndex + resultIndex;
  };

  return (
    <>
      {/* Botão de pesquisa */}
      <button
        type="button"
        className={`flex items-center text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md px-3 py-1.5 text-sm ${className}`}
        onClick={() => setIsOpen(true)}
        aria-label="Abrir pesquisa global"

      >
        <Search className="h-4 w-4 mr-2" aria-hidden="true" />
        <span className="hidden sm:inline">Pesquisar</span>
        <span className="ml-2 text-xs bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-500 dark:text-gray-400">
          Alt+/ ou Ctrl+K
        </span>
      </button>

      {/* Modal de pesquisa */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-40"
              aria-hidden="true"
            />

            {/* Modal */}
            <motion.div
              ref={searchContainerRef}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-x-0 top-20 mx-auto max-w-3xl bg-white dark:bg-gray-800 rounded-lg shadow-2xl z-50 overflow-hidden"
              role="dialog"
              aria-modal="true"
              aria-labelledby="search-modal-title"
            >
              {/* Cabeçalho de pesquisa */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center">
                <Search className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-3" aria-hidden="true" />
                <input
                  ref={searchInputRef}
                  type="text"
                  className="flex-1 bg-transparent border-none focus:ring-0 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 text-lg"
                  placeholder="Pesquisar veículos, geocercas, alertas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Pesquisar em todo o sistema"
                  autoComplete="off"
                />
                <button
                  type="button"
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md p-1"
                  onClick={() => setIsOpen(false)}
                  aria-label="Fechar pesquisa"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>

              {/* Corpo de resultados */}
              <div className="max-h-[70vh] overflow-y-auto p-2">
                {isLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400" />
                  </div>
                ) : searchQuery.length < 2 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    Digite pelo menos 2 caracteres para pesquisar
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    Nenhum resultado encontrado para "{searchQuery}"
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="px-4 pt-2 text-xs text-gray-500 dark:text-gray-400">
                      {totalResults} {totalResults === 1 ? 'resultado encontrado' : 'resultados encontrados'}
                    </div>

                    {searchResults.map((category, categoryIndex) => (
                      <div key={category.type} className="mb-4">
                        <div className="px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center">
                          {category.icon}
                          <span className="ml-2">{category.label}</span>
                        </div>

                        <div className="space-y-1">
                          {category.results.map((result, resultIndex) => {
                            const globalIndex = getGlobalIndex(categoryIndex, resultIndex);
                            const isSelected = selectedResultIndex === globalIndex;

                            return (
                              <button
                                key={result.id}
                                className={`w-full text-left px-4 py-2 rounded-md flex items-start justify-between ${isSelected
                                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                  : 'hover:bg-gray-100 dark:hover:bg-gray-700/50 text-gray-900 dark:text-gray-100'
                                  }`}
                                onClick={() => navigateToResult(result.path)}
                                aria-selected={isSelected}
                                role="option"
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center">
                                    {result.icon && (
                                      <span className="mr-2 text-gray-500 dark:text-gray-400">
                                        {result.icon}
                                      </span>
                                    )}
                                    <span className="font-medium truncate">{result.title}</span>
                                  </div>
                                  {result.description && (
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                                      {result.description}
                                    </p>
                                  )}
                                  {result.lastUpdated && (
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                      {result.lastUpdated}
                                    </p>
                                  )}
                                </div>
                                <ChevronRight
                                  className={`h-5 w-5 ml-2 flex-shrink-0 self-center ${isSelected
                                    ? 'text-blue-500 dark:text-blue-400'
                                    : 'text-gray-400 dark:text-gray-600'
                                    }`}
                                  aria-hidden="true"
                                />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Rodapé com dicas */}
              <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-gray-500 dark:text-gray-400 gap-2">
                  <div className="flex flex-wrap gap-2 sm:gap-4">
                    <div className="flex items-center">
                      <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded mr-1.5">↑</span>
                      <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded mr-1.5">↓</span>
                      <span>Navegar</span>
                    </div>
                    <div className="flex items-center">
                      <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded mr-1.5">Enter</span>
                      <span>Selecionar</span>
                    </div>
                    <div className="flex items-center">
                      <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded mr-1.5">Esc</span>
                      <span>Fechar</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span>Pressione</span>
                    <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">Alt+/</span>
                    <span>ou</span>
                    <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">Ctrl+K</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}