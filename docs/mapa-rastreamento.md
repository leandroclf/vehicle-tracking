# Mapa de Rastreamento

O componente de Mapa de Rastreamento é o elemento central da interface do Yukz, permitindo visualizar a localização e o status dos veículos em tempo real.

## Visão Geral

O mapa é implementado usando a biblioteca Google Maps JavaScript API e fornece as seguintes funcionalidades:

- Visualização em tempo real da posição dos veículos
- Diferentes tipos de mapa (rodoviário, satélite, híbrido, terreno)
- Criação e visualização de geocercas
- Histórico de rotas
- Agrupamento de veículos em áreas densas
- Personalização da exibição de informações

## Componentes Principais

### GoogleMapsComponent

O componente principal que renderiza o mapa e gerencia todas as interações. Ele aceita várias propriedades para personalizar seu comportamento:

```typescript
interface GoogleMapsComponentProps {
  mapType: 'roadmap' | 'satellite' | 'hybrid' | 'terrain';
  showTraffic: boolean;
  showGeofences: boolean;
  editableGeofences: boolean;
  showRouteHistory: boolean;
  routeHistoryVehicleId: number | null;
  routeHistoryStartDate: Date | null;
  routeHistoryEndDate: Date | null;
  selectedVehicleId: number | null;
  showVehicleIndicators: boolean;
  showGroupedVehicles: boolean;
  // Callbacks para interação
  onVehicleSelect: (vehicle: Vehicle | null) => void;
  onGeofenceSelect: (geofence: Geofence | null) => void;
  onGeofenceCreate: (geofence: Partial<Geofence>) => Promise<boolean>;
  onGeofenceUpdate: (geofence: Geofence) => Promise<boolean>;
  onGeofenceDelete: (geofenceId: string) => Promise<boolean>;
  onRoutePointClick: (point: RoutePoint) => void;
}
```

### MapCustomizationPanel

Componente de interface que permite personalizar diversas opções do mapa:

- Alterar o tipo de mapa
- Mostrar/ocultar informações de veículos
- Ativar/desativar agrupamento
- Configurar exibição de geocercas
- Personalizar indicadores visuais

## Funcionalidades Detalhadas

### Rastreamento em Tempo Real

- **Atualização Automática**: Os dados dos veículos são atualizados automaticamente a cada 10 segundos.
- **Visualização Diferenciada**: Veículos são exibidos com ícones diferentes de acordo com seu status (em movimento, parado, offline).
- **Informações Resumidas**: Ao passar o mouse sobre um veículo, são exibidas informações básicas como placa, velocidade e status.
- **Detalhes Completos**: Ao clicar em um veículo, um painel lateral exibe informações detalhadas.

### Geocercas

- **Tipos de Geocerca**: Suporte para geocercas circulares e poligonais.
- **Criação Interativa**: Interface para criar geocercas diretamente no mapa.
- **Edição Visual**: Capacidade de redimensionar e reposicionar geocercas existentes.
- **Alertas Configuráveis**: Opções para gerar alertas ao entrar ou sair da geocerca.

### Histórico de Rotas

- **Filtro por Período**: Visualização de rotas filtradas por intervalo de datas.
- **Animação de Percurso**: Possibilidade de reproduzir o movimento do veículo no tempo.
- **Pontos de Interesse**: Marcação de eventos importantes durante o trajeto (paradas, excessos de velocidade).
- **Exportação de Dados**: Opção para exportar o histórico de rotas em formatos como CSV e PDF.

## Personalização Visual

O mapa suporta várias opções de personalização que podem ser configuradas pelo usuário:

- **Tipo de Mapa**: Alternar entre os modos rodoviário, satélite, híbrido e terreno.
- **Exibição de Informações**: Configurar quais informações são exibidas nos marcadores de veículos.
- **Agrupamento**: Ativar/desativar o agrupamento de veículos em áreas com alta densidade.
- **Informações de Tráfego**: Mostrar/ocultar camada de tráfego do Google Maps.
- **Temas**: Suporte para temas claro e escuro, sincronizados com as preferências do sistema.

## Implementação Técnica

O componente de mapa é implementado usando:

- **Google Maps JavaScript API**: Para renderização do mapa base.
- **React**: Para integração com o resto da aplicação.
- **@react-google-maps/api**: Biblioteca que facilita o uso do Google Maps com React.
- **Supabase Realtime**: Para receber atualizações em tempo real (versão futura).

### Inicialização do Mapa

```jsx
<GoogleMap
  mapContainerStyle={mapContainerStyle}
  center={center}
  zoom={zoom}
  options={{
    mapTypeId: mapType,
    disableDefaultUI: false,
    zoomControl: true,
    mapTypeControl: false,
    scaleControl: true,
    streetViewControl: false,
    rotateControl: false,
    clickableIcons: false,
    fullscreenControl: true,
    styles: isDarkMode ? darkModeStyle : lightModeStyle,
  }}
  onLoad={onMapLoad}
  onUnmount={onMapUnmount}
>
  {/* Camadas e componentes internos */}
</GoogleMap>
```

## Otimizações de Performance

O componente implementa várias estratégias para garantir boa performance mesmo com muitos veículos:

1. **Carregamento Preguiçoso (Lazy Loading)**: O componente de mapa é carregado assincronamente.
2. **Marcadores Clusterizados**: Veículos próximos são agrupados para reduzir o número de elementos no DOM.
3. **Renderização Seletiva**: Apenas os veículos visíveis na área atual do mapa são renderizados completamente.
4. **Throttling de Atualizações**: Limitação da frequência de atualizações para evitar sobrecarga.

## Uso Offline e Resiliência

- **Caching de Dados**: Últimas posições conhecidas são armazenadas localmente.
- **Detecção de Conectividade**: Aviso ao usuário quando há problemas de conexão.
- **Modo Offline Limitado**: Acesso ao último estado conhecido quando offline.

## Limitações e Considerações

- A API do Google Maps requer uma chave válida com billing ativado.
- O agrupamento de veículos pode dificultar a visualização individual em frotas muito densas.
- A precisão das posições depende da qualidade do sinal GPS dos dispositivos.
- Uso intensivo em dispositivos móveis pode consumir bateria rapidamente.

## Próximos Desenvolvimentos

- Implementação de heatmaps para análise de concentração de veículos.
- Suporte para desenho de rotas otimizadas.
- Integração com serviços de endereçamento reverso para melhor contextualização.
- Estimativa de tempo de chegada baseada em condições de tráfego.
- Mapas offline para áreas de interesse frequente. 