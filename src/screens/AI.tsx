import { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { ActionButton } from '@/components/ActionButton';
import { ScreenFrame } from '@/components/ScreenFrame';
import { SurfaceCard } from '@/components/SurfaceCard';
import { hidroBairroDataSource } from '@/services/HidroBairroDataSource';
import { useTheme } from '@/store/useTheme';

const QUESTION_LIMIT = 1000;

export default function AIScreen() {
  const { theme } = useTheme();
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [isAsking, setIsAsking] = useState(false);
  const [questionError, setQuestionError] = useState<string | null>(null);
  const styles = useMemo(
    () =>
      StyleSheet.create({
        badge: {
          alignSelf: 'flex-start',
          paddingHorizontal: 10,
          paddingVertical: 6,
          borderRadius: 999,
          backgroundColor: theme.colors.actionSurface,
        },
        badgeText: {
          color: theme.colors.action,
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 0.4,
          textTransform: 'uppercase',
        },
        content: {
          gap: theme.spacing.compact,
        },
        title: {
          color: theme.colors.heading,
          fontSize: 20,
          fontWeight: '700',
          lineHeight: 27,
        },
        body: {
          color: theme.colors.body,
          fontSize: 14,
          lineHeight: 21,
        },
        field: {
          minHeight: 120,
          paddingHorizontal: 14,
          paddingVertical: 12,
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.control,
          color: theme.colors.heading,
          backgroundColor: theme.colors.control,
          fontSize: 15,
          lineHeight: 22,
          textAlignVertical: 'top',
        },
        counter: {
          color: theme.colors.muted,
          fontSize: 12,
          textAlign: 'right',
        },
        error: {
          color: theme.colors.error,
          fontSize: 14,
          lineHeight: 20,
        },
        response: {
          color: theme.colors.body,
          fontSize: 15,
          lineHeight: 24,
        },
        responseStatus: {
          color: theme.colors.muted,
          fontSize: 13,
          lineHeight: 19,
        },
      }),
    [theme],
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

  return (
    <ScreenFrame
      title="Orientação por IA"
      description="Tire dúvidas sobre chuva e monitoramento com informações consultadas pela API Java."
    >
      <SurfaceCard>
        <View style={styles.content}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Assistente HidroBairro</Text>
          </View>
          <Text style={styles.title}>O que você gostaria de saber?</Text>
          <Text style={styles.body}>
            Pergunte sobre uma região, um ponto monitorado ou como agir diante
            de um alerta.
          </Text>
          <TextInput
            accessibilityLabel="Pergunta para a orientação do HidroBairro"
            autoCapitalize="sentences"
            maxLength={QUESTION_LIMIT}
            multiline
            onChangeText={setQuestion}
            placeholder="Ex.: Há algum alerta ativo perto do Terminal Campo Limpo?"
            placeholderTextColor={theme.colors.muted}
            style={styles.field}
            value={question}
          />
          <Text style={styles.counter}>
            {question.length}/{QUESTION_LIMIT}
          </Text>
          {questionError ? (
            <Text accessibilityRole="alert" style={styles.error}>
              {questionError}
            </Text>
          ) : null}
          <ActionButton
            label={isAsking ? 'Consultando o sistema...' : 'Perguntar à IA'}
            onPress={() => void submitQuestion()}
            disabled={isAsking}
          />
          <Text style={styles.responseStatus}>
            As respostas são informativas e não substituem alertas oficiais ou
            instruções de emergência.
          </Text>
        </View>
      </SurfaceCard>

      {isAsking ? (
        <SurfaceCard>
          <Text style={styles.badgeText}>Consultando dados atuais</Text>
          <Text style={styles.responseStatus}>
            A IA está preparando uma orientação com base nas informações do
            sistema.
          </Text>
        </SurfaceCard>
      ) : null}

      {answer ? (
        <SurfaceCard>
          <View style={styles.content}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Resposta da IA</Text>
            </View>
            <Text accessibilityLiveRegion="polite" style={styles.response}>
              {answer}
            </Text>
          </View>
        </SurfaceCard>
      ) : null}
    </ScreenFrame>
  );
}
