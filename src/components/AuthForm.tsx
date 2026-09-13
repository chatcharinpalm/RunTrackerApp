import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { signIn, signUp } from '../services/authService';
import { colors, fontFamily, radius, spacing } from '../theme/theme';
import { useLanguage } from '../i18n/LanguageContext';

export default function AuthForm() {
  const { t } = useLanguage();
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const submit = async () => {
    if (!email || !password) {
      setMessage(t('authMissingFields'));
      return;
    }
    setBusy(true);
    setMessage(null);
    const result = mode === 'signIn' ? await signIn(email, password) : await signUp(email, password);
    setBusy(false);

    if (!result.ok) {
      setMessage(result.error ?? 'Something went wrong');
    } else if (mode === 'signUp') {
      setMessage(t('authSignUpSuccess'));
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabRow}>
        <Pressable
          style={[styles.tab, mode === 'signIn' && styles.tabActive]}
          onPress={() => setMode('signIn')}
        >
          <Text style={[styles.tabText, mode === 'signIn' && styles.tabTextActive]}>{t('signIn')}</Text>
        </Pressable>
        <Pressable
          style={[styles.tab, mode === 'signUp' && styles.tabActive]}
          onPress={() => setMode('signUp')}
        >
          <Text style={[styles.tabText, mode === 'signUp' && styles.tabTextActive]}>{t('signUp')}</Text>
        </Pressable>
      </View>

      <TextInput
        style={styles.input}
        placeholder={t('email')}
        placeholderTextColor={colors.textFaint}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder={t('password')}
        placeholderTextColor={colors.textFaint}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {message ? <Text style={styles.message}>{message}</Text> : null}

      <Pressable style={styles.submitButton} onPress={submit} disabled={busy}>
        {busy ? (
          <ActivityIndicator color={colors.onPrimary} />
        ) : (
          <Text style={styles.submitButtonText}>{mode === 'signIn' ? t('signIn') : t('signUp')}</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceHigh,
    borderRadius: radius.full,
    padding: 4,
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tab: { flex: 1, paddingVertical: 8, borderRadius: radius.full, alignItems: 'center' },
  tabActive: { backgroundColor: colors.primary },
  tabText: { fontFamily: fontFamily.monoLabel, fontSize: 12, color: colors.textMuted },
  tabTextActive: { color: colors.onPrimary },
  input: {
    backgroundColor: colors.surfaceLow,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    fontFamily: fontFamily.body,
    borderWidth: 1,
    borderColor: colors.border,
  },
  message: { color: colors.secondary, fontSize: 13, fontFamily: fontFamily.body },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitButtonText: { color: colors.onPrimary, fontFamily: fontFamily.monoLabel, letterSpacing: 0.5 },
});
