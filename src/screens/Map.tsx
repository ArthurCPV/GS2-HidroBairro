import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import * as Location from 'expo-location';
import { SafeAreaView } from 'react-native-safe-area-context';
import RiskMap from '../components/RiskMap';
import {
  USER_LOCATION_REGION_DELTA,
  ZONE_SOUTH_REGION,
} from '@/constants/map';
import { hidroBairroDataSource } from '@/services/HidroBairroDataSource';
import { useTheme } from '@/store/useTheme';
import type {
  Coordinates,
  DataCollection,
  FloodAlert,
  MonitoringPoint,
} from '@/types/domain';
import type { MapViewport } from '@/types/map';

type MapDataState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | {
      status: 'ready';
      points: DataCollection<readonly MonitoringPoint[]>;
      alerts: DataCollection<readonly FloodAlert[]>;
    };

type LocationState =
  | 'idle'
  | 'loading'
  | 'located'
  | 'permissionDenied'
  | 'permissionBlocked'
  | 'servicesDisabled'
  | 'error';

const EMPTY_POINTS: DataCollection<readonly MonitoringPoint[]> = {
  data: [],
  provider: 'DEMONSTRACAO',
};

const EMPTY_ALERTS: DataCollection<readonly FloodAlert[]> = {
  data: [],
  provider: 'DEMONSTRACAO',
};

const LOCATION_MESSAGES: Record<LocationState, string> = {
  idle: 'A localização só será solicitada quando você tocar no botão.',
  loading: 'Obtendo sua localização atual...',
  located: 'Mapa centralizado na sua localização atual.',
  permissionDenied:
    'Sem permissão de localização. O mapa continua na área demonstrativa da Zona Sul.',
  permissionBlocked:
    'Permissão bloqueada. Ajuste o acesso à localização nas configurações do aparelho.',
  servicesDisabled:
    'Serviços de localização desativados. O mapa continua na área demonstrativa da Zona Sul.',
  error:
    'Não foi possível obter sua localização. O mapa continua na área demonstrativa da Zona Sul.',
};

export default function MapScreen() {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const [region, setRegion] = useState<MapViewport>(ZONE_SOUTH_REGION);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [locationState, setLocationState] = useState<LocationState>('idle');
  const [mapData, setMapData] = useState<MapDataState>({ status: 'loading' });

  const styles = useMemo(
    () =>
      StyleSheet.create({
        safeArea: {
          flex: 1,
          backgroundColor: theme.colors.background,
        },
        screen: {
          flex: 1,
          gap: theme.spacing.compact,
          paddingHorizontal: width < 520 ? 16 : theme.spacing.page,
          paddingTop: theme.spacing.compact,
          paddingBottom: theme.spacing.compact,
        },
        header: {
          gap: 4,
        },
        title: {
          color: theme.colors.heading,
          fontSize: theme.typography.heading,
          fontWeight: '700',
        },
        description: {
          color: theme.colors.body,
          fontSize: 14,
          lineHeight: 20,
        },
        locationButton: {
          minHeight: 48,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          paddingHorizontal: theme.spacing.element,
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.control,
          backgroundColor: theme.colors.actionSurface,
        },
        locationButtonPressed: {
          opacity: 0.78,
        },
        locationButtonDisabled: {
          opacity: 0.65,
        },
        locationButtonText: {
          color: theme.colors.action,
          fontSize: 15,
          fontWeight: '700',
        },
        locationStatus: {
          color:
            locationState === 'error'
              ? theme.colors.error
              : theme.colors.body,
          fontSize: 13,
          lineHeight: 18,
        },
        mapStatus: {
          color: theme.colors.body,
          fontSize: 13,
          lineHeight: 18,
        },
        mapError: {
          color: theme.colors.error,
          fontSize: 13,
          lineHeight: 18,
        },
        mapFrame: {
          flex: 1,
          minHeight: 180,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.control,
          backgroundColor: theme.colors.surface,
        },
        footer: {
          gap: 2,
        },
        footerText: {
          color: theme.colors.muted,
          fontSize: 12,
          lineHeight: 17,
        },
      }),
    [locationState, theme, width],
  );

  useEffect(() => {
    let isMounted = true;

    async function loadMapData() {
      try {
        const [points, alerts] = await Promise.all([
          hidroBairroDataSource.listMonitoringPoints(),
          hidroBairroDataSource.listAlerts(),
        ]);

        if (isMounted) {
          setMapData({ status: 'ready', points, alerts });
        }
      } catch (error) {
        console.error('Não foi possível carregar os dados do mapa.', error);
        if (isMounted) {
          setMapData({
            status: 'error',
            message:
              error instanceof Error
                ? error.message
                : 'Não foi possível carregar os pontos de monitoramento.',
          });
        }
      }
    }

    void loadMapData();
    return () => {
      isMounted = false;
    };
  }, []);

  async function centerOnUserLocation() {
    setLocationState('loading');

    try {
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        setUserLocation(null);
        setRegion(ZONE_SOUTH_REGION);
        setLocationState('servicesDisabled');
        return;
      }

      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setUserLocation(null);
        setRegion(ZONE_SOUTH_REGION);
        setLocationState(
          permission.canAskAgain ? 'permissionDenied' : 'permissionBlocked',
        );
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const coordinates = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };

      setUserLocation(coordinates);
      setRegion({
        ...coordinates,
        latitudeDelta: USER_LOCATION_REGION_DELTA,
        longitudeDelta: USER_LOCATION_REGION_DELTA,
      });
      setLocationState('located');
    } catch (error) {
      console.error('Não foi possível obter a localização do dispositivo.', error);
      setUserLocation(null);
      setRegion(ZONE_SOUTH_REGION);
      setLocationState('error');
    }
  }

  const pointsData =
    mapData.status === 'ready' ? mapData.points : EMPTY_POINTS;
  const alertsData =
    mapData.status === 'ready' ? mapData.alerts : EMPTY_ALERTS;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Text accessibilityRole="header" style={styles.title}>
            Mapa e localização
          </Text>
          <Text style={styles.description}>
            Pontos de monitoramento do piloto na Zona Sul de São Paulo.
          </Text>
        </View>

        {Platform.OS === 'web' && (
          <Text style={styles.mapStatus}>
            No navegador, o mapa usa OpenStreetMap. Ao autorizar a localização,
            sua coordenada será enviada ao provedor para centralizar o mapa.
          </Text>
        )}

        {locationState !== 'located' && (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: locationState === 'loading' }}
            disabled={locationState === 'loading'}
            onPress={() => void centerOnUserLocation()}
            style={({ pressed }) => [
              styles.locationButton,
              pressed && styles.locationButtonPressed,
              locationState === 'loading' && styles.locationButtonDisabled,
            ]}
          >
            {locationState === 'loading' && (
              <ActivityIndicator color={theme.colors.action} size="small" />
            )}
            <Text style={styles.locationButtonText}>
              {locationState === 'loading'
                ? 'Obtendo localização…'
                : 'Usar minha localização'}
            </Text>
          </Pressable>
        )}

        <Text accessibilityLiveRegion="polite" style={styles.locationStatus}>
          {LOCATION_MESSAGES[locationState]}
        </Text>

        {mapData.status === 'loading' && (
          <Text style={styles.mapStatus}>
            Carregando pontos demonstrativos...
          </Text>
        )}
        {mapData.status === 'error' && (
          <Text accessibilityRole="alert" style={styles.mapError}>
            {mapData.message}
          </Text>
        )}

        <View style={styles.mapFrame}>
          <RiskMap
            alertsData={alertsData}
            onRegionChangeComplete={setRegion}
            pointsData={pointsData}
            region={region}
            userLocationEnabled={userLocation !== null}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Os pontos exibidos não representam áreas de risco.
          </Text>
          {mapData.status === 'ready' &&
            (mapData.points.provider === 'DEMONSTRACAO' ||
              mapData.alerts.provider === 'DEMONSTRACAO') && (
              <Text style={styles.footerText}>
                Dados demonstrativos; coordenadas e alertas não representam
                condições atuais.
              </Text>
            )}
        </View>
      </View>
    </SafeAreaView>
  );
}
