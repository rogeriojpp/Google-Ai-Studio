/// <reference types="google.maps" />
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  APIProvider,
  APILoadingStatus,
  AdvancedMarker,
  InfoWindow,
  Map,
  Pin,
  useAdvancedMarkerRef,
  useApiLoadingStatus,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import {
  AlertCircle,
  Car,
  ExternalLink,
  Loader2,
  MapPin,
  Navigation,
  X,
} from 'lucide-react';

interface CustomerMapModalProps {
  isOpen: boolean;
  cliente: string;
  endereco: string;
  onClose: () => void;
}

interface ResolvedPlaceInfo {
  position: google.maps.LatLngLiteral;
  formattedAddress: string;
  displayName: string;
}

interface RouteSummary {
  distanceMeters: number;
  durationMillis: number;
}

const ATTRIBUTION_IDS = ['gmp_mcp_codeassist_v1_aistudio'];
const BRASILIA_DEFAULT_CENTER: google.maps.LatLngLiteral = {
  lat: -15.793889,
  lng: -47.882778,
};

function getGoogleMapsApiKey(): string {
  const viteKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined) || '';
  if (viteKey) return viteKey;
  if (typeof process !== 'undefined' && process.env?.GOOGLE_MAPS_API_KEY) {
    return process.env.GOOGLE_MAPS_API_KEY;
  }
  return '';
}

function isQuotaExhaustionError(err: unknown): boolean {
  if (!err) return false;
  const text =
    err instanceof Error
      ? `${err.name} ${err.message}`
      : typeof err === 'object'
        ? JSON.stringify(err)
        : String(err);
  const upper = text.toUpperCase();
  return (
    upper.includes('OVER_QUERY_LIMIT') ||
    upper.includes('RESOURCE_EXHAUSTED') ||
    upper.includes('QUOTAEXCEEDED') ||
    upper.includes('OVERQUOTAMAPERROR') ||
    upper.includes('429')
  );
}

function formatarDistancia(metros: number): string {
  if (metros < 1000) return `${Math.round(metros)} m`;
  return `${(metros / 1000).toFixed(1).replace('.', ',')} km`;
}

function formatarDuracao(millis: number): string {
  const totalMin = Math.max(1, Math.round(millis / 60000));
  if (totalMin < 60) return `${totalMin} min`;
  const horas = Math.floor(totalMin / 60);
  const mins = totalMin % 60;
  return mins > 0 ? `${horas}h ${mins}min` : `${horas}h`;
}

interface CustomerMapContentProps {
  cliente: string;
  endereco: string;
  onPlaceResolved: (info: ResolvedPlaceInfo | null) => void;
}

const CustomerMapContent: React.FC<CustomerMapContentProps> = ({
  cliente,
  endereco,
  onPlaceResolved,
}) => {
  const apiStatus = useApiLoadingStatus();
  const map = useMap();
  const placesLib = useMapsLibrary('places');
  const routesLib = useMapsLibrary('routes');
  const [markerRef, marker] = useAdvancedMarkerRef();

  const [buscandoLocal, setBuscandoLocal] = useState(true);
  const [erroLocal, setErroLocal] = useState<string | null>(null);
  const [placeInfo, setPlaceInfo] = useState<ResolvedPlaceInfo | null>(null);
  const [infoWindowOpen, setInfoWindowOpen] = useState(true);

  const [userPosition, setUserPosition] = useState<google.maps.LatLngLiteral | null>(
    null
  );
  const [calculandoRota, setCalculandoRota] = useState(false);
  const [erroRota, setErroRota] = useState<string | null>(null);
  const [routeSummary, setRouteSummary] = useState<RouteSummary | null>(null);
  const polylinesRef = useRef<google.maps.Polyline[]>([]);

  const limparPolylines = useCallback(() => {
    for (const p of polylinesRef.current) {
      p.setMap(null);
    }
    polylinesRef.current = [];
  }, []);

  useEffect(() => {
    return () => {
      limparPolylines();
    };
  }, [limparPolylines]);

  useEffect(() => {
    if (!placesLib || !endereco.trim()) {
      setBuscandoLocal(false);
      return;
    }

    let cancelled = false;
    setBuscandoLocal(true);
    setErroLocal(null);
    setPlaceInfo(null);
    setRouteSummary(null);
    setErroRota(null);
    setUserPosition(null);
    limparPolylines();

    const resolverEndereco = async () => {
      try {
        const queries = [endereco.trim()];
        if (
          cliente.trim() &&
          !endereco.toLowerCase().includes(cliente.trim().toLowerCase())
        ) {
          queries.push(`${cliente.trim()}, ${endereco.trim()}`);
        }

        let matchedPlace: google.maps.places.Place | null = null;

        for (const textQuery of queries) {
          const response = await placesLib.Place.searchByText({
            textQuery,
            fields: ['displayName', 'location', 'formattedAddress'],
            language: 'pt-BR',
            region: 'br',
            maxResultCount: 1,
            internalUsageAttributionIds: ATTRIBUTION_IDS,
          });

          const candidate = response?.places?.[0];
          if (candidate?.location) {
            matchedPlace = candidate;
            break;
          }
        }

        if (cancelled) return;

        if (!matchedPlace?.location) {
          setErroLocal(
            'Não foi possível posicionar este endereço no mapa automaticamente. Use o botão abaixo para abrir a busca no Google Maps.'
          );
          onPlaceResolved(null);
          setBuscandoLocal(false);
          return;
        }

        const resolved: ResolvedPlaceInfo = {
          position: {
            lat: matchedPlace.location.lat(),
            lng: matchedPlace.location.lng(),
          },
          formattedAddress: matchedPlace.formattedAddress || endereco.trim(),
          displayName: matchedPlace.displayName || cliente.trim() || 'Local do atendimento',
        };

        setPlaceInfo(resolved);
        setInfoWindowOpen(true);
        onPlaceResolved(resolved);
      } catch (err) {
        if (cancelled) return;
        if (isQuotaExhaustionError(err)) {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        }
        setErroLocal(
          'Não foi possível carregar a localização no momento. Você ainda pode abrir o GPS externo.'
        );
        onPlaceResolved(null);
      } finally {
        if (!cancelled) {
          setBuscandoLocal(false);
        }
      }
    };

    void resolverEndereco();

    return () => {
      cancelled = true;
    };
  }, [placesLib, endereco, cliente, limparPolylines, onPlaceResolved]);

  useEffect(() => {
    if (map && placeInfo && !routeSummary) {
      map.panTo(placeInfo.position);
      map.setZoom(16);
    }
  }, [map, placeInfo, routeSummary]);

  const calcularRotaComOrigem = async (origin: google.maps.LatLngLiteral) => {
    if (!placeInfo || !routesLib || !map) return;
    setUserPosition(origin);
    limparPolylines();

    try {
      const response = await routesLib.Route.computeRoutes({
        origin,
        destination: placeInfo.position,
        travelMode: 'DRIVING',
        fields: ['path', 'distanceMeters', 'durationMillis', 'viewport'],
        language: 'pt-BR',
        region: 'br',
        internalUsageAttributionIds: ATTRIBUTION_IDS,
      });

      const primaryRoute = response?.routes?.[0];
      if (!primaryRoute) {
        setErroRota('Nenhuma rota rodoviária encontrada a partir deste ponto.');
        return;
      }

      const newPolylines = primaryRoute.createPolylines();
      newPolylines.forEach((polyline) => {
        polyline.setOptions({
          strokeColor: '#3b82f6',
          strokeWeight: 6,
          strokeOpacity: 0.92,
        });
        polyline.setMap(map);
      });
      polylinesRef.current = newPolylines;

      if (primaryRoute.viewport) {
        map.fitBounds(primaryRoute.viewport);
      }

      setRouteSummary({
        distanceMeters: primaryRoute.distanceMeters ?? 0,
        durationMillis: primaryRoute.durationMillis ?? 0,
      });
    } catch (err) {
      if (isQuotaExhaustionError(err)) {
        window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
      }
      setErroRota(
        'Não foi possível calcular a rota no mapa. Utilize o botão Abrir GPS no Google Maps.'
      );
    } finally {
      setCalculandoRota(false);
    }
  };

  const handleTracarRota = () => {
    if (!placeInfo || !routesLib || !map) return;
    if (!('geolocation' in navigator)) {
      setErroRota(
        'Geolocalização não disponível neste navegador. Use o botão Abrir GPS no Google Maps.'
      );
      return;
    }

    setCalculandoRota(true);
    setErroRota(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        await calcularRotaComOrigem({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      (geoErr) => {
        setCalculandoRota(false);
        const msgLower = (geoErr.message || '').toLowerCase();
        if (geoErr.code === geoErr.PERMISSION_DENIED) {
          if (msgLower.includes('permissions policy') || msgLower.includes('policy')) {
            setErroRota(
              'O navegador bloqueou o GPS nesta visualização. Toque em Abrir GPS no Google Maps.'
            );
          } else {
            setErroRota(
              'Permissão de localização negada no navegador. Libere no cadeado ao lado do endereço ou toque em Abrir GPS no Google Maps.'
            );
          }
        } else {
          setErroRota(
            'Não foi possível obter sua localização pelo GPS. Toque em Abrir GPS no Google Maps.'
          );
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  };

  if (
    apiStatus === APILoadingStatus.FAILED ||
    apiStatus === APILoadingStatus.AUTH_FAILURE
  ) {
    return (
      <div className="h-[340px] sm:h-[400px] rounded-xl border border-slate-800 bg-[#0b1120] flex flex-col items-center justify-center p-6 text-center gap-3">
        <AlertCircle className="w-8 h-8 text-amber-400" aria-hidden="true" />
        <p className="text-sm font-medium text-slate-200">
          Não foi possível carregar o Google Maps integrado agora.
        </p>
        <p className="text-xs text-slate-400 max-w-md">
          Você ainda pode iniciar a navegação normalmente pelo botão Abrir GPS no Google Maps abaixo.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative w-full h-[340px] sm:h-[400px] rounded-xl overflow-hidden border border-slate-800 bg-[#0b1120]">
        <Map
          mapId="DEMO_MAP_ID"
          internalUsageAttributionIds={ATTRIBUTION_IDS}
          defaultCenter={BRASILIA_DEFAULT_CENTER}
          defaultZoom={12}
          gestureHandling="greedy"
          mapTypeControl={false}
          streetViewControl={true}
          fullscreenControl={true}
          style={{ width: '100%', height: '100%' }}
        >
          {placeInfo && (
            <>
              <AdvancedMarker
                ref={markerRef}
                position={placeInfo.position}
                title={cliente || placeInfo.displayName}
                onClick={() => setInfoWindowOpen(true)}
              >
                <Pin
                  background="#2563eb"
                  borderColor="#1d4ed8"
                  glyphColor="#ffffff"
                />
              </AdvancedMarker>

              {infoWindowOpen && marker && (
                <InfoWindow
                  anchor={marker}
                  maxWidth={260}
                  onCloseClick={() => setInfoWindowOpen(false)}
                >
                  <div className="text-slate-900 space-y-1 pr-1">
                    <p className="text-xs font-bold leading-snug">
                      {cliente || placeInfo.displayName}
                    </p>
                    <p className="text-[11px] text-slate-600 leading-snug">
                      {placeInfo.formattedAddress}
                    </p>
                  </div>
                </InfoWindow>
              )}
            </>
          )}

          {userPosition && (
            <AdvancedMarker position={userPosition} title="Sua localização atual">
              <Pin
                background="#10b981"
                borderColor="#047857"
                glyphColor="#ffffff"
              />
            </AdvancedMarker>
          )}
        </Map>

        {buscandoLocal && (
          <div className="absolute inset-0 bg-[#0b1120]/75 backdrop-blur-[2px] flex flex-col items-center justify-center gap-2 text-slate-200">
            <Loader2 className="w-6 h-6 animate-spin text-blue-400" aria-hidden="true" />
            <span className="text-xs font-medium">Localizando endereço no mapa...</span>
          </div>
        )}

        {!buscandoLocal && erroLocal && (
          <div className="absolute inset-x-3 bottom-3 p-3 rounded-xl bg-slate-950/95 border border-amber-500/40 text-amber-200 text-xs flex items-start gap-2 shadow-lg">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{erroLocal}</span>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="min-h-[20px] flex items-center gap-2 text-xs">
          {routeSummary ? (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-medium">
              <Car className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>
                Trajeto estimado:{' '}
                <strong className="font-mono">
                  {formatarDistancia(routeSummary.distanceMeters)}
                </strong>
                {routeSummary.durationMillis > 0 && (
                  <>
                    {' · '}
                    <strong className="font-mono">
                      {formatarDuracao(routeSummary.durationMillis)}
                    </strong>
                  </>
                )}
              </span>
            </div>
          ) : erroRota ? (
            <span className="text-amber-300 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>{erroRota}</span>
            </span>
          ) : (
            <span className="text-slate-400">
              {placeInfo
                ? 'Toque em Traçar rota aqui para visualizar o caminho ou abra o GPS externo.'
                : 'Endereço preparado para navegação externa.'}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleTracarRota}
          disabled={!placeInfo || calculandoRota}
          className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#1e293b] hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-100 border border-slate-700 text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
        >
          {calculandoRota ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <Navigation className="w-3.5 h-3.5 text-blue-400" aria-hidden="true" />
          )}
          <span>{calculandoRota ? 'Calculando rota...' : 'Traçar rota aqui'}</span>
        </button>
      </div>
    </div>
  );
};

export const CustomerMapModal: React.FC<CustomerMapModalProps> = ({
  isOpen,
  cliente,
  endereco,
  onClose,
}) => {
  const [resolvedPlace, setResolvedPlace] = useState<ResolvedPlaceInfo | null>(null);
  const apiKey = getGoogleMapsApiKey();

  const handlePlaceResolved = useCallback((info: ResolvedPlaceInfo | null) => {
    setResolvedPlace(info);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setResolvedPlace(null);
    }
  }, [isOpen, endereco]);

  if (!isOpen) return null;

  const destinationQuery = resolvedPlace?.formattedAddress || endereco.trim();
  const externalDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    destinationQuery
  )}&travelmode=driving`;

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm overflow-y-auto flex items-center justify-center p-4 print:hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="customer-map-modal-title"
    >
      <div className="w-full max-w-2xl bg-[#111827] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="px-5 py-4 border-b border-slate-800 flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-600/15 border border-blue-500/30 flex items-center justify-center shrink-0 mt-0.5">
              <MapPin className="w-4 h-4 text-blue-400" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h2
                id="customer-map-modal-title"
                className="text-sm sm:text-base font-bold text-white truncate"
              >
                {cliente ? `Localização — ${cliente}` : 'Localização do atendimento'}
              </h2>
              <p className="text-xs text-slate-400 truncate mt-0.5">{endereco}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar mapa"
            className="min-h-[40px] min-w-[40px] rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 inline-flex items-center justify-center shrink-0 transition-colors"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-4">
          {apiKey ? (
            <APIProvider
              apiKey={apiKey}
              language="pt-BR"
              region="BR"
              libraries={['places', 'marker', 'routes']}
            >
              <CustomerMapContent
                cliente={cliente}
                endereco={endereco}
                onPlaceResolved={handlePlaceResolved}
              />
            </APIProvider>
          ) : (
            <div className="h-[260px] rounded-xl border border-slate-800 bg-[#0b1120] flex flex-col items-center justify-center p-6 text-center gap-2.5">
              <MapPin className="w-8 h-8 text-blue-400" aria-hidden="true" />
              <p className="text-sm font-semibold text-white">
                Visualização rápida no Google Maps
              </p>
              <p className="text-xs text-slate-400 max-w-md">
                Chave da API do Google Maps não configurada neste ambiente. Use o botão abaixo para abrir a rota diretamente no aplicativo do Google Maps.
              </p>
            </div>
          )}

          <div className="pt-2 border-t border-slate-800 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#1e293b] hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
            >
              Fechar
            </button>
            <a
              href={externalDirectionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
            >
              <Navigation className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Abrir GPS no Google Maps</span>
              <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-85" aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
