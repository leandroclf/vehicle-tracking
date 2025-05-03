'use client';

import { useState } from 'react';
import { Settings, Map, Layers, AlertOctagon, Anchor } from 'lucide-react';

type MapInfoDisplay = 
  | 'none'
  | 'velocidade'
  | 'placa_velocidade' 
  | 'marca_modelo_placa'
  | 'placa'
  | 'marca_modelo'
  | 'marca_modelo_placa_velocidade'
  | 'nome_placa_velocidade'
  | 'condutor_placa_velocidade';

interface MapCustomizationProps {
  onInfoDisplayChange?: (value: MapInfoDisplay) => void;
  onMapTypeChange?: (type: string) => void;
  onShowNegativeGeofences?: (show: boolean) => void;
  onShowRiskAreas?: (show: boolean) => void;
  onShowAnchors?: (show: boolean) => void;
  onShowGroupedVehicles?: (show: boolean) => void;
  onShowVehicleIndicators?: (show: boolean) => void;
  onAllowMapMarker?: (allow: boolean) => void;
  onAllowVehicleSearch?: (allow: boolean) => void;
  onAllowAddressSearch?: (allow: boolean) => void;
}

export default function MapCustomizationPanel({
  onInfoDisplayChange,
  onMapTypeChange,
  onShowNegativeGeofences,
  onShowRiskAreas,
  onShowAnchors,
  onShowGroupedVehicles,
  onShowVehicleIndicators,
  onAllowMapMarker,
  onAllowVehicleSearch,
  onAllowAddressSearch
}: MapCustomizationProps) {
  const [infoDisplay, setInfoDisplay] = useState<MapInfoDisplay>('placa_velocidade');
  const [mapType, setMapType] = useState('relevo');
  const [showNegativeGeofences, setShowNegativeGeofences] = useState(false);
  const [showRiskAreas, setShowRiskAreas] = useState(false);
  const [showAnchors, setShowAnchors] = useState(false);
  const [allowMapMarker, setAllowMapMarker] = useState(false);
  const [allowVehicleSearch, setAllowVehicleSearch] = useState(false);
  const [allowAddressSearch, setAllowAddressSearch] = useState(false);
  const [showGroupedVehicles, setShowGroupedVehicles] = useState(true);
  const [showVehicleIndicators, setShowVehicleIndicators] = useState(false);
  
  const [showInfoDropdown, setShowInfoDropdown] = useState(false);
  
  const infoOptions = [
    { value: 'none', label: 'Nenhuma informação' },
    { value: 'velocidade', label: 'Velocidade' },
    { value: 'marca_modelo_placa', label: 'Marca, modelo e placa' },
    { value: 'placa_velocidade', label: 'Placa e velocidade' },
    { value: 'marca_modelo', label: 'Marca, modelo' },
    { value: 'placa', label: 'Placa' },
    { value: 'marca_modelo_placa', label: 'Marca, modelo, placa' },
    { value: 'marca_modelo_placa_velocidade', label: 'Marca, modelo, placa e velocidade' },
    { value: 'nome_placa_velocidade', label: 'Nome, placa e velocidade' },
    { value: 'condutor_placa_velocidade', label: 'Condutor, placa e velocidade' },
  ];
  
  const handleInfoDisplayChange = (value: MapInfoDisplay) => {
    setInfoDisplay(value);
    setShowInfoDropdown(false);
    onInfoDisplayChange?.(value);
  };
  
  const toggleNegativeGeofences = () => {
    const newValue = !showNegativeGeofences;
    setShowNegativeGeofences(newValue);
    onShowNegativeGeofences?.(newValue);
  };
  
  const toggleRiskAreas = () => {
    const newValue = !showRiskAreas;
    setShowRiskAreas(newValue);
    onShowRiskAreas?.(newValue);
  };
  
  const toggleAnchors = () => {
    const newValue = !showAnchors;
    setShowAnchors(newValue);
    onShowAnchors?.(newValue);
  };
  
  const toggleGroupedVehicles = () => {
    const newValue = !showGroupedVehicles;
    setShowGroupedVehicles(newValue);
    onShowGroupedVehicles?.(newValue);
  };
  
  const toggleVehicleIndicators = () => {
    const newValue = !showVehicleIndicators;
    setShowVehicleIndicators(newValue);
    onShowVehicleIndicators?.(newValue);
  };
  
  const toggleAllowMapMarker = () => {
    const newValue = !allowMapMarker;
    setAllowMapMarker(newValue);
    onAllowMapMarker?.(newValue);
  };
  
  const toggleAllowVehicleSearch = () => {
    const newValue = !allowVehicleSearch;
    setAllowVehicleSearch(newValue);
    onAllowVehicleSearch?.(newValue);
  };
  
  const toggleAllowAddressSearch = () => {
    const newValue = !allowAddressSearch;
    setAllowAddressSearch(newValue);
    onAllowAddressSearch?.(newValue);
  };

  return (
    <div className="bg-white rounded-lg shadow-md w-full max-w-md">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-3">
          <Settings className="h-6 w-6" />
          <h2 className="text-xl font-semibold">Customização do mapa</h2>
        </div>
        <button 
          className="text-gray-500 hover:text-gray-700"
          onClick={() => {}}
        >
          <span className="text-2xl">×</span>
        </button>
      </div>
      
      <div className="p-4 border-b">
        <h3 className="text-lg font-medium mb-4">Informações dos ativos no mapa</h3>
        <div className="relative">
          <button
            onClick={() => setShowInfoDropdown(!showInfoDropdown)}
            className="w-full p-3 bg-gray-200 rounded-md text-left flex justify-between items-center"
          >
            <span>{infoOptions.find(opt => opt.value === infoDisplay)?.label || 'Selecione'}</span>
            <span>▼</span>
          </button>
          
          {showInfoDropdown && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
              {infoOptions.map(option => (
                <button
                  key={option.value}
                  className={`w-full p-3 text-left hover:bg-blue-50 flex justify-between items-center ${
                    option.value === infoDisplay ? 'bg-blue-500 text-white' : ''
                  }`}
                  onClick={() => handleInfoDisplayChange(option.value as MapInfoDisplay)}
                >
                  {option.label}
                  {option.value === infoDisplay && (
                    <span className="text-white">✓</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <div className="p-4 border-b">
        <h3 className="text-lg font-medium mb-4">Funcionalidades no mapa</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label htmlFor="allow-marker" className="flex items-center space-x-2">
              <span>Criar um marcador no mapa</span>
            </label>
            <div className="relative inline-block w-12 h-6">
              <input
                type="checkbox"
                id="allow-marker"
                className="opacity-0 w-0 h-0"
                checked={allowMapMarker}
                onChange={toggleAllowMapMarker}
              />
              <span
                className={`absolute cursor-pointer inset-0 rounded-full ${
                  allowMapMarker ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${
                    allowMapMarker ? 'transform translate-x-6' : ''
                  }`}
                ></span>
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <label htmlFor="allow-vehicle-search" className="flex items-center space-x-2">
              <span>Pesquisar ativos</span>
            </label>
            <div className="relative inline-block w-12 h-6">
              <input
                type="checkbox"
                id="allow-vehicle-search"
                className="opacity-0 w-0 h-0"
                checked={allowVehicleSearch}
                onChange={toggleAllowVehicleSearch}
              />
              <span
                className={`absolute cursor-pointer inset-0 rounded-full ${
                  allowVehicleSearch ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${
                    allowVehicleSearch ? 'transform translate-x-6' : ''
                  }`}
                ></span>
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <label htmlFor="allow-address-search" className="flex items-center space-x-2">
              <span>Pesquisar endereço</span>
            </label>
            <div className="relative inline-block w-12 h-6">
              <input
                type="checkbox"
                id="allow-address-search"
                className="opacity-0 w-0 h-0"
                checked={allowAddressSearch}
                onChange={toggleAllowAddressSearch}
              />
              <span
                className={`absolute cursor-pointer inset-0 rounded-full ${
                  allowAddressSearch ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${
                    allowAddressSearch ? 'transform translate-x-6' : ''
                  }`}
                ></span>
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <label htmlFor="group-vehicles" className="flex items-center space-x-2">
              <span>Ativos agrupados</span>
            </label>
            <div className="relative inline-block w-12 h-6">
              <input
                type="checkbox"
                id="group-vehicles"
                className="opacity-0 w-0 h-0"
                checked={showGroupedVehicles}
                onChange={toggleGroupedVehicles}
              />
              <span
                className={`absolute cursor-pointer inset-0 rounded-full ${
                  showGroupedVehicles ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${
                    showGroupedVehicles ? 'transform translate-x-6' : ''
                  }`}
                ></span>
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <label htmlFor="vehicle-indicators" className="flex items-center space-x-2">
              <span>Indicadores dos ativos</span>
            </label>
            <div className="relative inline-block w-12 h-6">
              <input
                type="checkbox"
                id="vehicle-indicators"
                className="opacity-0 w-0 h-0"
                checked={showVehicleIndicators}
                onChange={toggleVehicleIndicators}
              />
              <span
                className={`absolute cursor-pointer inset-0 rounded-full ${
                  showVehicleIndicators ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${
                    showVehicleIndicators ? 'transform translate-x-6' : ''
                  }`}
                ></span>
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-4 border-b">
        <h3 className="text-lg font-medium mb-4">Exibir no mapa</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label htmlFor="show-positive-geofences" className="flex items-center space-x-2">
              <span>Todas as cercas positivas</span>
            </label>
            <div className="relative inline-block w-12 h-6">
              <input
                type="checkbox"
                id="show-positive-geofences"
                className="opacity-0 w-0 h-0"
                checked={false}
                onChange={() => {}}
              />
              <span className="absolute cursor-pointer inset-0 rounded-full bg-gray-300">
                <span className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full"></span>
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <label htmlFor="show-negative-geofences" className="flex items-center space-x-2">
              <span>Todas as cercas negativas</span>
              <span className="text-red-500">❗</span>
            </label>
            <div className="relative inline-block w-12 h-6">
              <input
                type="checkbox"
                id="show-negative-geofences"
                className="opacity-0 w-0 h-0"
                checked={showNegativeGeofences}
                onChange={toggleNegativeGeofences}
              />
              <span
                className={`absolute cursor-pointer inset-0 rounded-full ${
                  showNegativeGeofences ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${
                    showNegativeGeofences ? 'transform translate-x-6' : ''
                  }`}
                ></span>
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <label htmlFor="show-risk-areas" className="flex items-center space-x-2">
              <span>Todas as áreas de risco</span>
              <span className="text-red-500">❗</span>
            </label>
            <div className="relative inline-block w-12 h-6">
              <input
                type="checkbox"
                id="show-risk-areas"
                className="opacity-0 w-0 h-0"
                checked={showRiskAreas}
                onChange={toggleRiskAreas}
              />
              <span
                className={`absolute cursor-pointer inset-0 rounded-full ${
                  showRiskAreas ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${
                    showRiskAreas ? 'transform translate-x-6' : ''
                  }`}
                ></span>
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <label htmlFor="show-anchors" className="flex items-center space-x-2">
              <span>Todas as âncoras</span>
            </label>
            <div className="relative inline-block w-12 h-6">
              <input
                type="checkbox"
                id="show-anchors"
                className="opacity-0 w-0 h-0"
                checked={showAnchors}
                onChange={toggleAnchors}
              />
              <span
                className={`absolute cursor-pointer inset-0 rounded-full ${
                  showAnchors ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${
                    showAnchors ? 'transform translate-x-6' : ''
                  }`}
                ></span>
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-4 border-b">
        <h3 className="text-lg font-medium mb-4">Tipo de mapa</h3>
        <div className="flex justify-between">
          <button
            className="p-3 border rounded-md w-48 text-center"
            onClick={() => {
              setMapType('relevo');
              onMapTypeChange?.('relevo');
            }}
          >
            Relevo
          </button>
          <div className="w-36 h-24 rounded-md overflow-hidden">
            <img
              src="https://developers.google.com/maps/documentation/javascript/examples/full/images/terrain.png"
              alt="Mapa de relevo"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="text-lg font-medium mb-4">Ícone no mapa</h3>
        {/* Aqui pode ser adicionado o seletor de ícones */}
      </div>
    </div>
  );
} 