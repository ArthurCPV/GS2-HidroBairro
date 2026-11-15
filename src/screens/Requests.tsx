import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ActionButton } from '@/components/ActionButton';
import { ScreenFrame } from '@/components/ScreenFrame';
import { SurfaceCard } from '@/components/SurfaceCard';
import { hidroBairroDataSource } from '@/services/HidroBairroDataSource';
import { useTheme } from '@/store/useTheme';
import type {
  RequestCategory,
  ServiceRequest,
} from '@/types/domain';
import type { HomeTabNavigationProp } from '@/types/navigation';

type RequestsState =
  | { status: 'loading' }
  | { status: 'error' }
  | {
      status: 'ready';
      requests: readonly ServiceRequest[];
      categories: ReadonlyMap<number, string>;
    };

const STATUS_LABELS: Record<ServiceRequest['status'], string> = {
  RECEBIDA: 'Recebida',
  EM_VISTORIA: 'Em vistoria',
  CONCLUIDA: 'Concluída',
  CANCELADA: 'Cancelada',
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('pt-BR');
}

export default function RequestsScreen() {
  const navigation = useNavigation<HomeTabNavigationProp<'Requests'>>();
  const { theme } = useTheme();
  const [state, setState] = useState<RequestsState>({ status: 'loading' });
  const styles = useMemo(
    () =>
      StyleSheet.create({
        headerRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        },
        count: {
          color: theme.colors.muted,
          fontSize: 13,
        },
        cardPressable: {
          gap: theme.spacing.compact,
        },
        title: {
          color: theme.colors.heading,
          fontSize: 16,
          fontWeight: '700',
          lineHeight: 22,
        },
        protocol: {
          color: theme.colors.action,
          fontSize: 12,
          fontWeight: '700',
          letterSpacing: 0.3,
        },
        status: {
          alignSelf: 'flex-start',
          paddingHorizontal: 9,
          paddingVertical: 5,
          borderRadius: 999,
          backgroundColor: theme.colors.actionSurface,
          color: theme.colors.action,
          fontSize: 12,
          fontWeight: '700',
        },
        statusCancelled: {
          backgroundColor: theme.colors.control,
          color: theme.colors.muted,
        },
        metadata: {
          color: theme.colors.body,
          fontSize: 13,
          lineHeight: 18,
        },
        notice: {
          color: theme.colors.muted,
          fontSize: 12,
          lineHeight: 18,
        },
        error: {
          color: theme.colors.error,
          fontSize: 14,
          lineHeight: 20,
        },
        emptyTitle: {
          color: theme.colors.heading,
          fontSize: 16,
          fontWeight: '700',
        },
        emptyBody: {
          color: theme.colors.body,
          fontSize: 14,
          lineHeight: 20,
        },
      }),
    [theme],
  );

  const loadRequests = useCallback(async () => {
    setState({ status: 'loading' });
    try {
      const [requests, categories] = await Promise.all([
        hidroBairroDataSource.listServiceRequests(),
        hidroBairroDataSource.listRequestCategories(),
      ]);
      setState({
        status: 'ready',
        requests: requests.data,
        categories: new Map(
          categories.data.map((category: RequestCategory) => [
            category.id,
            category.name,
          ]),
        ),
      });
    } catch (error) {
      console.error('Não foi possível carregar as solicitações.', error);
      setState({ status: 'error' });
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadRequests();
    }, [loadRequests]),
  );

  return (
    <ScreenFrame
      title="Solicitações"
      description="Acompanhe seus registros demonstrativos de zeladoria."
    >
      <ActionButton
        label="Nova solicitação"
        onPress={() => navigation.navigate('NewRequest')}
      />
      {state.status === 'loading' && (
        <Text style={styles.emptyBody}>Carregando solicitações...</Text>
      )}
      {state.status === 'error' && (
        <SurfaceCard>
          <Text accessibilityRole="alert" style={styles.error}>
            Não foi possível carregar as solicitações.
          </Text>
          <ActionButton
            label="Tentar novamente"
            onPress={() => void loadRequests()}
            variant="secondary"
          />
        </SurfaceCard>
      )}
      {state.status === 'ready' && state.requests.length === 0 && (
        <SurfaceCard>
          <Text style={styles.emptyTitle}>Sua lista está vazia</Text>
          <Text style={styles.emptyBody}>
            Crie uma solicitação de demonstração para conhecer o fluxo.
          </Text>
        </SurfaceCard>
      )}
      {state.status === 'ready' && state.requests.length > 0 ? (
        <View style={styles.headerRow}>
          <Text style={styles.count}>
            {state.requests.length}{' '}
            {state.requests.length === 1 ? 'registro' : 'registros'}
          </Text>
        </View>
      ) : null}
      {state.status === 'ready' &&
        state.requests.map((request) => (
          <Pressable
            key={request.id}
            accessibilityRole="button"
            onPress={() =>
              navigation.navigate('RequestDetails', {
                id: String(request.id),
              })
            }
            style={({ pressed }) => pressed && { opacity: 0.75 }}
          >
            <SurfaceCard>
              <Text style={styles.protocol}>{request.protocol}</Text>
              <Text style={styles.title}>{request.title}</Text>
              <Text
                style={[
                  styles.status,
                  request.status === 'CANCELADA' && styles.statusCancelled,
                ]}
              >
                {STATUS_LABELS[request.status]}
              </Text>
              <Text style={styles.metadata}>
                {state.categories.get(request.categoryId) ??
                  'Categoria não disponível'}
                {' · '}
                {formatDate(request.createdAt)}
              </Text>
            </SurfaceCard>
          </Pressable>
        ))}
      <Text style={styles.notice}>
        Estes registros ficam apenas neste aparelho e não foram enviados à
        Prefeitura.
      </Text>
    </ScreenFrame>
  );
}
