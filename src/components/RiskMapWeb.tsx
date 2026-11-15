import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/store/useTheme';
import type { AlertSeverity } from '@/types/domain';
import type { RiskMapProps } from './RiskMapTypes';

function getSeverityLabel(severity: AlertSeverity) {
  return severity === 'CRITICO' ? 'Crítico' : 'Atenção';
}

export default function RiskMap({
  pointsData,
  alertsData,
}: RiskMapProps) {
  const { theme } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          gap: theme.spacing.compact,
          padding: theme.spacing.element,
          backgroundColor: theme.colors.surface,
        },
        heading: {
          color: theme.colors.heading,
          fontSize: 15,
          fontWeight: '700',
        },
        description: {
          color: theme.colors.body,
          fontSize: 13,
          lineHeight: 18,
        },
        list: {
          gap: 8,
        },
        point: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          padding: 10,
          borderRadius: theme.radius.control,
          backgroundColor: theme.colors.control,
        },
        marker: {
          width: 10,
          height: 10,
          borderRadius: 5,
          backgroundColor: theme.colors.action,
        },
        pointContent: {
          flex: 1,
          gap: 2,
        },
        pointName: {
          color: theme.colors.heading,
          fontSize: 13,
          fontWeight: '600',
        },
        pointStatus: {
          color: theme.colors.body,
          fontSize: 11,
          lineHeight: 15,
        },
      }),
    [theme],
  );

  return (
    <View style={styles.container}>
      <Text accessibilityRole="header" style={styles.heading}>
        Prévia dos pontos
      </Text>
      <Text style={styles.description}>
        O mapa interativo está disponível no app para Android e iOS. No
        navegador, consulte os pontos demonstrativos abaixo.
      </Text>
      <View style={styles.list}>
        {pointsData.data
          .filter((point) => point.active)
          .map((point) => {
            const alert = alertsData.data.find(
              (item) => item.pointId === point.id && item.status === 'ATIVO',
            );
            const statusColor = alert
              ? alert.severity === 'CRITICO'
                ? theme.colors.error
                : theme.colors.warning
              : theme.colors.body;

            return (
              <View key={point.id} style={styles.point}>
                <View
                  accessibilityElementsHidden
                  importantForAccessibility="no"
                  style={[
                    styles.marker,
                    alert && { backgroundColor: statusColor },
                  ]}
                />
                <View style={styles.pointContent}>
                  <Text style={styles.pointName}>{point.neighborhood}</Text>
                  <Text style={[styles.pointStatus, { color: statusColor }]}>
                    {alert
                      ? `${alertsData.provider === 'DEMONSTRACAO' ? 'Alerta demonstrativo' : 'Alerta ativo'} - ${getSeverityLabel(alert.severity)}`
                      : 'Nenhum alerta ativo recebido'}
                  </Text>
                </View>
              </View>
            );
          })}
      </View>
    </View>
  );
}
