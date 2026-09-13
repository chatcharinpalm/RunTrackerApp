import { useCallback, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { HudGridBackground } from '../components/HudGridBackground';
import { getProfile, setWeightKg } from '../db/profileRepository';
import { useAuth } from '../hooks/useAuth';
import { useAutoSync } from '../hooks/useAutoSync';
import { signOut } from '../services/authService';
import { isSupabaseConfigured } from '../services/supabaseClient';
import AuthForm from '../components/AuthForm';
import { colors, fontFamily, radius, spacing } from '../theme/theme';
import { GlassCard, Label, PillButton, LanguageToggle } from '../components/ui';
import { IconBadge } from '../components/IconBadge';
import { useLanguage } from '../i18n/LanguageContext';

export default function ProfileScreen() {
  const { t } = useLanguage();
  const { user, initializing } = useAuth();
  const { lastStatus, isSyncing, runSync } = useAutoSync(user?.id ?? null);
  const [weightInput, setWeightInput] = useState('65');
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      getProfile().then((p) => setWeightInput(String(p.weight_kg)));
    }, [])
  );

  const saveWeight = async () => {
    const parsed = parseFloat(weightInput.replace(',', '.'));
    if (Number.isNaN(parsed) || parsed <= 0 || parsed > 400) {
      setSavedMessage(t('weightInvalid'));
      return;
    }
    await setWeightKg(parsed);
    setSavedMessage(t('weightSaved'));
  };

  const syncSummary = (() => {
    if (!isSupabaseConfigured) return t('notConfigured');
    if (isSyncing) return t('syncing');
    if (!lastStatus) return '';
    switch (lastStatus.state) {
      case 'idle':
        return lastStatus.uploaded > 0
          ? `${t('syncSuccessPrefix')} ${lastStatus.uploaded} ${t('activitiesWord')}`
          : t('syncUpToDate');
      case 'error':
        return `${t('syncFailedPrefix')} ${lastStatus.message}`;
      case 'skipped':
        if (lastStatus.reason === 'offline') return t('syncOffline');
        if (lastStatus.reason === 'signed-out') return t('syncSignedOut');
        return '';
    }
  })();

  return (
    <View style={styles.root}>
      <HudGridBackground />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <IconBadge name="person-circle" set="mci" size={64} />
            <Text style={styles.title}>{t('profileTitle')}</Text>
            <View style={{ flex: 1 }} />
            <LanguageToggle />
          </View>

          <GlassCard>
            <View style={styles.cardTitleRow}>
              <IconBadge name="scale-bathroom" set="mci" size={32} />
              <Label style={styles.cardTitleLabel}>{t('weightLabel')}</Label>
            </View>
            <View style={styles.weightRow}>
              <TextInput
                style={styles.weightInput}
                keyboardType="decimal-pad"
                value={weightInput}
                onChangeText={setWeightInput}
              />
              <Pressable style={styles.saveButton} onPress={saveWeight}>
                <Text style={styles.saveButtonText}>{t('save')}</Text>
              </Pressable>
            </View>
            {savedMessage ? <Text style={styles.savedMessage}>{savedMessage}</Text> : null}
          </GlassCard>

          <GlassCard style={styles.card} delay={80}>
            <View style={styles.cardTitleRow}>
              <IconBadge name="cloud-sync-outline" set="mci" size={32} color={colors.tertiary} />
              <Label style={styles.cardTitleLabel}>{t('accountAndSync')}</Label>
            </View>
            {initializing ? (
              <Text style={styles.mutedText}>{t('checkingSignIn')}</Text>
            ) : user ? (
              <>
                <Text style={styles.emailText}>{user.email}</Text>
                <Text style={styles.mutedText}>{syncSummary}</Text>
                <View style={styles.actionsRow}>
                  <PillButton label={t('syncNow')} onPress={() => runSync()} variant="secondary" disabled={isSyncing} flex={1} />
                  <PillButton label={t('signOut')} onPress={() => signOut()} variant="secondary" flex={1} />
                </View>
              </>
            ) : (
              <>
                <Text style={styles.mutedText}>{syncSummary}</Text>
                <AuthForm />
              </>
            )}
          </GlassCard>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  safeArea: { flex: 1 },
  content: { padding: spacing.md, gap: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { fontFamily: fontFamily.headline, fontSize: 20, color: colors.text },
  card: { gap: spacing.xs },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  cardTitleLabel: { flex: 1 },
  weightRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  weightInput: {
    flex: 1,
    backgroundColor: colors.surfaceLow,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: colors.text,
    fontFamily: fontFamily.mono,
    borderWidth: 1,
    borderColor: colors.border,
  },
  saveButton: { backgroundColor: colors.primary, borderRadius: radius.md, paddingHorizontal: 18, justifyContent: 'center' },
  saveButtonText: { color: colors.onPrimary, fontFamily: fontFamily.monoLabel },
  savedMessage: { color: colors.primary, fontSize: 12, marginTop: spacing.xs, fontFamily: fontFamily.body },
  emailText: { color: colors.text, fontFamily: fontFamily.bodySemiBold, marginTop: spacing.xs },
  mutedText: { color: colors.textMuted, fontSize: 12, fontFamily: fontFamily.body, marginTop: 2 },
  actionsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
});
