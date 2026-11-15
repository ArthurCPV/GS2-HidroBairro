import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Callout, Marker } from 'react-native-maps';
import { useTheme } from '@/store/useTheme';
import type { AlertSeverity } from '@/types/domain';
import type { RiskMapProps } from './RiskMapTypes';

function getSeverityLabel(severity: AlertSeverity) {
  return severity === 'CRITICO' ? 'Crítico' : 'Atenção';
}

export default function RiskMap({
  pointsData,
  alertsData,
  region,
  onRegionChangeComplete,
  userLocationEnabled,
}: RiskMapProps) {
  const { theme } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        map: {
          flex: 1,
        },
        callout: {
          width: 220,
          gap: 5,
          padding: 12,
          borderRadius: 10,
          backgroundColor: theme.colors.surface,
        },
        pointName: {
          color: theme.colors.heading,
          fontSize: 14,
          fontWeight: '700',
        },
        source: {
          color: theme.colors.muted,
          fontSize: 10,
          fontWeight: '700',
          letterSpacing: 0.4,
        },
        status: {
          fontSize: 12,
          fontWeight: '600',
          lineHeight: 17,
        },
        alertMessage: {
          color: theme.colors.body,
          fontSize: 12,
          lineHeight: 17,
        },
      }),
    [theme],
  );

  return (
    <MapView
      accessibilityLabel="Mapa com pontos de monitoramento"
      onRegionChangeComplete={onRegionChangeComplete}
      region={region}
      showsCompass
      showsMyLocationButton={false}
      showsUserLocation={userLocationEnabled}
      style={styles.map}
    >
      {pointsData.data
        .filter((point) => point.active)
        .map((point) => {
          const alert = alertsData.data.find(
            (item) => item.pointId === point.id && item.status === 'ATIVO',
          );
          const pinColor = alert
            ? alert.severity === 'CRITICO'
              ? theme.colors.error
              : theme.colors.warning
            : theme.colors.action;
          const statusColor = alert
            ? alert.severity === 'CRITICO'
              ? theme.colors.error
              : theme.colors.warning
            : theme.colors.body;

          return (
            <Marker
              key={point.id}
              accessibilityLabel={`${point.name}. ${
                alert
                  ? `Alerta ${getSeverityLabel(alert.severity)}`
                  : 'Sem alerta ativo recebido'
              }`}
              coordinate={{
                latitude: point.latitude,
                longitude: point.longitude,
              }}
              pinColor={pinColor}
            >
              <Callout>
                <View style={styles.callout}>
                  <Text style={styles.pointName}>{point.name}</Text>
                  {pointsData.provider === 'DEMONSTRACAO' && (
                    <Text style={styles.source}>PONTO DEMONSTRATIVO</Text>
                  )}
                  {alert ? (
                    <>
                      <Text style={[styles.status, { color: statusColor }]}>
                        {alertsData.provider === 'DEMONSTRACAO'
                          ? 'Alerta demonstrativo'
                          : 'Alerta ativo'}{' '}
                        - {getSeverityLabel(alert.severity)}
                      </Text>
                      <Text numberOfLines={2} style={styles.alertMessage}>
                        {alert.message}
                      </Text>
                    </>
                  ) : (
                    <Text style={styles.status}>
                      Nenhum alerta ativo recebido
                    </Text>
                  )}
                </View>
              </Callout>
            </Marker>
          );
        })}
    </MapView>
  );
}
