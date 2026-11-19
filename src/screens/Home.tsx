import { useMemo, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { ActionButton } from '@/components/ActionButton';
import { DataSummary } from '@/components/DataSummary';
import { RoutePlaceholder } from '@/components/RoutePlaceholder';
import { SurfaceCard } from '@/components/SurfaceCard';
import { useAuth } from '@/store/AuthProvider';
import { useTheme } from '@/store/useTheme';

export default function HomeScreen() {
  const { session, signOut } = useAuth();
  const { theme } = useTheme();
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const styles = useMemo(
    () =>
      StyleSheet.create({
        accountName: {
          color: theme.colors.heading,
          fontSize: 16,
          fontWeight: '700',
        },
        role: {
          color: theme.colors.body,
          fontSize: 13,
        },
        error: {
          color: theme.colors.error,
          fontSize: 14,
        },
      }),
    [theme],
  );

  return (
    <RoutePlaceholder
      title="HidroBairro Sul"
      description="Acompanhe alertas e pontos de monitoramento do piloto na Zona Sul de São Paulo."
    >
      <DataSummary />
      <SurfaceCard>
        <Text style={styles.accountName}>
          {session.status === 'authenticated' ? session.user.email : ''}
        </Text>
        {session.status === 'authenticated' ? (
          <Text style={styles.role}>
            Perfil: {session.user.role === 'GESTOR' ? 'Gestor' : 'Cidadão'}
          </Text>
        ) : null}
        {signOutError ? (
          <Text
            accessibilityRole="alert"
            style={styles.error}
          >
            {signOutError}
          </Text>
        ) : null}
        <ActionButton
          label="Sair da sessão"
          onPress={() => {
            void signOut().catch((error: unknown) => {
              console.error('Não foi possível encerrar a sessão.', error);
              setSignOutError(
                error instanceof Error
                  ? error.message
                  : 'Não foi possível encerrar a sessão.',
              );
            });
          }}
          variant="secondary"
        />
      </SurfaceCard>
    </RoutePlaceholder>
  );
}