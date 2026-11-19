import { createElement, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/store/useTheme';
import type { AlertSeverity } from '@/types/domain';
import type { RiskMapProps } from './RiskMapTypes';

function getSeverityLabel(severity: AlertSeverity) {
  return severity === 'CRITICO' ? 'Crítico' : 'Atenção';
}

function createMapUrl(
  latitude: number,
  longitude: number,
  latitudeDelta: number,
  longitudeDelta: number,
  showUserMarker: boolean,
) {
  const bounds = [
    longitude - longitudeDelta / 2,
    latitude - latitudeDelta / 2,
    longitude + longitudeDelta / 2,
    latitude + latitudeDelta / 2,
  ]
    .map((coordinate) => coordinate.toFixed(6))
    .join(',');
  const params = new URLSearchParams({
    bbox: bounds,
    layer: 'mapnik',
  });

  if (showUserMarker) {
    params.set('marker', `${latitude.toFixed(6)},${longitude.toFixed(6)}`);
  }

  return `https://www.openstreetmap.org/export/embed.html?${params.toString()}`;
}

export default function RiskMap({
  pointsData,
  alertsData,
  region,
  userLocationEnabled,
}: RiskMapProps) {
  const { theme } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          minHeight: 0,
          gap: 8,
          padding: 8,
          backgroundColor: theme.colors.surface,
        },
        map: {
          flex: 1,
          minHeight: 180,
          overflow: 'hidden',
          borderRadius: theme.radius.control,
          backgroundColor: theme.colors.control,
        },
        legend: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 6,
        },
        legendTitle: {
          color: theme.colors.heading,
          fontSize: 12,
          fontWeight: '700',
        },
        point: {
          gap: 3,
          flexGrow: 1,
          flexBasis: '45%',
          minHeight: 48,
          padding: 6,
          borderRadius: 8,
          backgroundColor: theme.colors.control,
        },
        pointHeading: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
        },
        marker: {
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: theme.colors.action,
        },
        pointName: {
          flex: 1,
          color: theme.colors.body,
          fontSize: 11,
          fontWeight: '600',
        },
        pointStatus: {
          fontSize: 10,
          lineHeight: 13,
          fontWeight: '600',
        },
        source: {
          color: theme.colors.muted,
          fontSize: 10,
          lineHeight: 14,
        },
      }),
    [theme],
  );
  const mapUrl = createMapUrl(
    region.latitude,
    region.longitude,
    region.latitudeDelta,
    region.longitudeDelta,
    userLocationEnabled,
  );
  const mapFrame = createElement('iframe', {
    title: 'Mapa interativo da região monitorada',
    src: mapUrl,
    loading: 'lazy',
    allowFullScreen: true,
    style: {
      display: 'block',
      width: '100%',
      height: '100%',
      border: 0,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.map}>{mapFrame}</View>
      <Text style={styles.legendTitle}>Pontos demonstrativos do piloto</Text>
      <View style={styles.legend}>
        {pointsData.data
          .filter((point) => point.active)
          .map((point) => {
            const alert = alertsData.data.find(
              (item) => item.pointId === point.id && item.status === 'ATIVO',
            );
            const color = alert
              ? alert.severity === 'CRITICO'
                ? theme.colors.error
                : theme.colors.warning
              : theme.colors.action;
            const statusColor = alert ? color : theme.colors.body;

            return (
              <View key={point.id} style={styles.point}>
                <View style={styles.pointHeading}>
                  <View
                    accessibilityElementsHidden
                    importantForAccessibility="no"
                    style={[styles.marker, { backgroundColor: color }]}
                  />
                  <Text numberOfLines={1} style={styles.pointName}>
                    {point.neighborhood}
                  </Text>
                </View>
                <Text style={[styles.pointStatus, { color: statusColor }]}>
                  {alert
                    ? `${alertsData.provider === 'DEMONSTRACAO' ? 'Alerta demonstrativo' : 'Alerta ativo'} - ${getSeverityLabel(alert.severity)}`
                    : 'Nenhum alerta ativo recebido'}
                </Text>
              </View>
            );
          })}
      </View>
      <Text style={styles.source}>
        Mapa por OpenStreetMap. Os pontos listados são referências, não áreas
        de risco.
      </Text>
    </View>
  );
}
