import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ActionButton } from '@/components/ActionButton';
import { ScreenFrame } from '@/components/ScreenFrame';
import { SurfaceCard } from '@/components/SurfaceCard';
import { hidroBairroDataSource } from '@/services/HidroBairroDataSource';
import { useTheme } from '@/store/useTheme';
import type { GuidanceCategory, GuidanceItem } from '@/types/domain';

type GuidanceState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | {
      status: 'ready';
      items: readonly GuidanceItem[];
      notice: string | null;
    };

const CATEGORIES: readonly {
  id: GuidanceCategory;
  label: string;
}[] = [
  { id: 'PREVENCAO', label: 'Prevenção' },
  { id: 'DURANTE_CHUVA', label: 'Durante chuva' },
  { id: 'POS_CHUVA', label: 'Após a chuva' },
];

export default function AIScreen() {
  const { theme } = useTheme();
  const [category, setCategory] = useState<GuidanceCategory>('PREVENCAO');
  const [state, setState] = useState<GuidanceState>({ status: 'loading' });
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [isAsking, setIsAsking] = useState(false);
  const [questionError, setQuestionError] = useState<string | null>(null);
  const styles = useMemo(
    () =>
      StyleSheet.create({
        filters: {
          gap: 8,
        },
        filter: {
          minHeight: 44,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: theme.spacing.compact,
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.control,
          backgroundColor: theme.colors.surface,
        },
        filterSelected: {
          borderColor: theme.colors.action,
          backgroundColor: theme.colors.actionSurface,
        },
        filterText: {
          color: theme.colors.body,
          fontSize: 14,
          fontWeight: '600',
        },
        filterTextSelected: {
          color: theme.colors.action,
        },
        badge: {
          alignSelf: 'flex-start',
          paddingHorizontal: 9,
          paddingVertical: 5,
          borderRadius: 999,
          backgroundColor: theme.colors.actionSurface,
        },
        badgeText: {
          color: theme.colors.action,
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 0.3,
          textTransform: 'uppercase',
        },
        title: {
          color: theme.colors.heading,
          fontSize: 17,
          fontWeight: '700',
        },
        body: {
          color: theme.colors.body,
          fontSize: 14,
          lineHeight: 21,
        },
        updated: {
          color: theme.colors.muted,
          fontSize: 12,
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
        empty: {
          color: theme.colors.body,
          fontSize: 14,
          lineHeight: 20,
        },
        field: {
          minHeight: 96,
          paddingHorizontal: 12,
          paddingVertical: 10,
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.control,
          color: theme.colors.heading,
          backgroundColor: theme.colors.control,
          fontSize: 15,
          textAlignVertical: 'top',
        },
      }),
    [theme],
  );

  const loadGuidance = useCallback(async () => {
    setState({ status: 'loading' });
    try {
      const result = await hidroBairroDataSource.listGuidanceItems();
      setState({
        status: 'ready',
        items: result.data,
        notice: result.provider === 'DEMONSTRACAO' ? result.notice ?? null : null,
      });
    } catch (error) {
      console.error('Não foi possível carregar as orientações.', error);
      setState({
        status: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Não foi possível carregar o conteúdo.',
      });
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadGuidance();
    }, [loadGuidance]),
  );

  async function submitQuestion() {
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion) {
      setQuestionError('Digite uma dúvida antes de enviar.');
      return;
    }

    setIsAsking(true);
    setQuestionError(null);
    setAnswer(null);
    try {
      const result = await hidroBairroDataSource.askGuidance(trimmedQuestion);
      setAnswer(result.data);
    } catch (error) {
      console.error('Não foi possível consultar a IA de orientações.', error);
      setQuestionError(
        error instanceof Error
          ? error.message
          : 'Não foi possível obter uma orientação.',
      );
    } finally {
      setIsAsking(false);
    }
  }

  const visibleItems =
    state.status === 'ready'
      ? state.items.filter((item) => item.category === category)
      : [];

  return (
    <ScreenFrame
      title="Orientação"
      description="Recomendações gerais para prevenção e cuidado durante e após chuvas."
    >
      <SurfaceCard>
        <Text style={styles.title}>Orientações do HidroBairro</Text>
        <Text style={styles.body}>
          Faça uma pergunta sobre prevenção e cuidados com chuva. As respostas
          da IA são informativas e não substituem alertas ou instruções das
          autoridades.
        </Text>
        <TextInput
          accessibilityLabel="Pergunta para a orientação do HidroBairro"
          autoCapitalize="sentences"
          maxLength={1000}
          multiline
          onChangeText={setQuestion}
          placeholder="Ex.: Como me preparar para chuva forte?"
          placeholderTextColor={theme.colors.muted}
          style={styles.field}
          value={question}
        />
        <ActionButton
          label={isAsking ? 'Consultando...' : 'Perguntar'}
          onPress={() => void submitQuestion()}
          disabled={isAsking}
        />
        {questionError ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {questionError}
          </Text>
        ) : null}
        {answer ? <Text style={styles.body}>{answer}</Text> : null}
      </SurfaceCard>

      <View style={styles.filters}>
        {CATEGORIES.map((item) => (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityState={{ selected: category === item.id }}
            onPress={() => setCategory(item.id)}
            style={[
              styles.filter,
              category === item.id && styles.filterSelected,
            ]}
          >
            <Text
              style={[
                styles.filterText,
                category === item.id && styles.filterTextSelected,
              ]}
            >
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {state.status === 'loading' && (
        <Text style={styles.empty}>Carregando orientações...</Text>
      )}
      {state.status === 'error' && (
        <SurfaceCard>
          <Text accessibilityRole="alert" style={styles.error}>
            {state.message}
          </Text>
          <ActionButton
            label="Tentar novamente"
            onPress={() => void loadGuidance()}
            variant="secondary"
          />
        </SurfaceCard>
      )}
      {state.status === 'ready' && visibleItems.length === 0 && (
        <SurfaceCard>
          <Text style={styles.empty}>
            Ainda não há orientações nesta categoria.
          </Text>
        </SurfaceCard>
      )}
      {state.status === 'ready' &&
        visibleItems.map((item) => (
          <SurfaceCard key={item.id}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {item.source === 'DEMONSTRACAO'
                  ? 'Demonstrativo'
                  : item.source === 'IA'
                    ? 'IA'
                    : 'Documentação'}
              </Text>
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.body}>{item.content}</Text>
            <Text style={styles.updated}>
              Atualizado em{' '}
              {new Date(item.updatedAt).toLocaleDateString('pt-BR')}
            </Text>
          </SurfaceCard>
        ))}
      {state.status === 'ready' && state.notice ? (
        <Text style={styles.notice}>{state.notice}</Text>
      ) : null}
    </ScreenFrame>
  );
}
