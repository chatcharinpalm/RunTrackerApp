import { useState } from 'react';
import { Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useActivityTracker } from '../hooks/useActivityTracker';
import { HudGridBackground } from '../components/HudGridBackground';
import { formatDistanceKm, formatDuration, formatPaceMinPerKm, formatSpeedKmh } from '../utils/format';
import { colors, fontFamily, radius, spacing } from '../theme/theme';
import { DAILY_GOAL_METERS } from '../constants/goals';
import { GlassCard, Label, MonoValue, Badge, PillButton, LanguageToggle } from '../components/ui';
import { PulseRing } from '../components/PulseRing';
import { ProgressRing } from '../components/ProgressRing';
import { Hud3DOrb } from '../components/Hud3DOrb';
import { IconBadge } from '../components/IconBadge';
import { useLanguage } from '../i18n/LanguageContext';
import type { ActivityType } from '../types';

export default function TrackingScreen() {
  const { t } = useLanguage();
  const [activityType, setActivityType] = useState<ActivityType>('running');
  const tracker = useActivityTracker(activityType);

  const isRunning = activityType === 'running';
  const speedLabel = isRunning
    ? formatPaceMinPerKm(tracker.currentSpeedMs)
    : formatSpeedKmh(tracker.currentSpeedMs);
  const speedUnit = isRunning ? '/KM' : 'KM/H';
  const isActive = tracker.status === 'tracking' || tracker.status === 'paused';
  const goalMeters = DAILY_GOAL_METERS[activityType];
  const goalProgress = tracker.distanceMeters / goalMeters;

  return (
    <View style={styles.root}>
      <HudGridBackground />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>{t('trackHeaderTitle')}</Text>
              <View style={styles.recordingRow}>
                {tracker.status === 'tracking' ? (
                  <PulseRing color={colors.primary} size={7} />
                ) : (
                  <View style={[styles.statusDot, tracker.status === 'paused' && styles.statusDotPaused]} />
                )}
                <Label>{tracker.status === 'paused' ? t('trackPaused') : t('trackRecording')}</Label>
              </View>
            </View>
            <LanguageToggle />
          </View>

          {/* 3D GPS beacon hero — a real WebGL scene, themed as a location pin + accuracy ring + orbiting satellites */}
          <View style={styles.orbHero}>
            <Hud3DOrb size={132} />
          </View>

          {/* Mode toggle — locked once a session has started */}
          <View style={styles.modeSwitch}>
            {(['running', 'cycling'] as ActivityType[]).map((mode) => (
              <Pressable
                key={mode}
                disabled={isActive}
                onPress={() => setActivityType(mode)}
                style={[styles.modeButton, activityType === mode && styles.modeButtonActive]}
              >
                <Text style={[styles.modeButtonText, activityType === mode && styles.modeButtonTextActive]}>
                  {mode === 'running' ? t('modeRun') : t('modeCycle')}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* GPS telemetry row */}
          <View style={styles.gpsRow}>
            <View style={styles.recordingRow}>
              {tracker.accuracyMeters !== null ? (
                <PulseRing color={colors.tertiary} size={6} />
              ) : (
                <View style={styles.statusDot} />
              )}
              <Label>
                {tracker.accuracyMeters !== null
                  ? `${t('gpsAccuracy')}: ±${tracker.accuracyMeters.toFixed(1)}m`
                  : t('gpsWaiting')}
              </Label>
            </View>
          </View>

          {tracker.permissionDenied ? (
            <GlassCard glowVariant="secondary">
              <Text style={styles.permissionText}>{t('permissionError')}</Text>
            </GlassCard>
          ) : null}

          {/* Hero metric: distance, with a goal progress ring */}
          <GlassCard glowVariant={tracker.status === 'tracking' ? 'primary' : undefined}>
            <View style={styles.heroContent}>
              <View style={{ flex: 1 }}>
                <View style={styles.cardHeaderRow}>
                  <Label>{t('totalDistance')}</Label>
                  <Badge tone="primary">REALTIME</Badge>
                </View>
                <View style={styles.heroRow}>
                  <MonoValue size={Platform.OS === 'web' ? 36 : 44} color={colors.text}>
                    {formatDistanceKm(tracker.distanceMeters)}
                  </MonoValue>
                  <Text style={styles.heroUnit}>KM</Text>
                </View>
                <Text style={styles.goalText}>
                  {(goalMeters / 1000).toFixed(0)} KM {t('goalLabel')}
                </Text>
              </View>
              <ProgressRing progress={goalProgress} size={92} strokeWidth={8}>
                <MonoValue size={16}>{Math.min(100, Math.round(goalProgress * 100))}%</MonoValue>
              </ProgressRing>
            </View>
          </GlassCard>

          {/* Speed / pace + elapsed time */}
          <View style={styles.row}>
            <GlassCard style={styles.halfCard}>
              <View style={styles.metricLabelRow}>
                <IconBadge name="speedometer-outline" size={26} />
                <Label>{isRunning ? t('currentPace') : t('groundSpeed')}</Label>
              </View>
              <View style={styles.heroRow}>
                <MonoValue size={26}>{speedLabel}</MonoValue>
                <Text style={styles.metricUnit}>{speedUnit}</Text>
              </View>
            </GlassCard>
            <GlassCard style={styles.halfCard}>
              <View style={styles.metricLabelRow}>
                <IconBadge name="time-outline" size={26} />
                <Label>{t('elapsedTime')}</Label>
              </View>
              <MonoValue size={26}>{formatDuration(tracker.elapsedMs)}</MonoValue>
            </GlassCard>
          </View>

          {/* Max speed + calories */}
          <View style={styles.row}>
            <GlassCard style={styles.halfCard}>
              <View style={styles.metricLabelRow}>
                <IconBadge name="flash-outline" size={26} />
                <Label>{t('maxSpeed')}</Label>
              </View>
              <View style={styles.heroRow}>
                <MonoValue size={26}>{formatSpeedKmh(tracker.maxSpeedMs)}</MonoValue>
                <Text style={styles.metricUnit}>KM/H</Text>
              </View>
            </GlassCard>
            <GlassCard style={styles.halfCard}>
              <View style={styles.metricLabelRow}>
                <IconBadge name="flame-outline" size={26} color={colors.secondary} />
                <Label>{t('calories')}</Label>
              </View>
              <View style={styles.heroRow}>
                <MonoValue size={26} color={colors.secondary}>
                  {Math.round(tracker.caloriesKcal)}
                </MonoValue>
                <Text style={styles.metricUnit}>KCAL</Text>
              </View>
            </GlassCard>
          </View>

          <View style={styles.spacer} />

          {/* Controls */}
          {tracker.status === 'idle' || tracker.status === 'finished' ? (
            <PillButton
              label={tracker.status === 'finished' ? t('startNewSession') : t('startTracking')}
              onPress={tracker.start}
              variant="primary"
            />
          ) : (
            <View style={styles.controlsRow}>
              <PillButton
                label={tracker.status === 'tracking' ? t('pause') : t('resume')}
                onPress={tracker.status === 'tracking' ? tracker.pause : tracker.resume}
                variant="secondary"
                flex={1}
              />
              <PillButton label={t('finishAndSave')} onPress={tracker.finish} variant="danger" flex={1} />
            </View>
          )}

          {tracker.status === 'finished' ? <Text style={styles.savedText}>{t('savedLocally')}</Text> : null}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  safeArea: { flex: 1 },
  container: { padding: spacing.md, gap: spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 4 },
  orbHero: { alignItems: 'center', justifyContent: 'center', marginVertical: spacing.xs },
  headerTitle: {
    fontFamily: fontFamily.headline,
    fontSize: 19,
    color: colors.text,
    marginBottom: 4,
  },
  recordingRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.textFaint },
  statusDotPaused: { backgroundColor: colors.secondary },
  modeSwitch: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceHigh,
    borderRadius: radius.full,
    padding: 4,
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modeButton: { flex: 1, paddingVertical: 8, borderRadius: radius.full, alignItems: 'center' },
  modeButtonActive: { backgroundColor: colors.primary },
  modeButtonText: { fontFamily: fontFamily.monoLabel, fontSize: 12, color: colors.textMuted },
  modeButtonTextActive: { color: colors.onPrimary },
  gpsRow: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surfaceLow,
    borderRadius: radius.md,
  },
  permissionText: { color: colors.secondary, fontFamily: fontFamily.bodyMedium, fontSize: 13 },
  heroContent: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  metricLabelRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: 4 },
  heroRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 4 },
  heroUnit: { fontFamily: fontFamily.headline, fontSize: 18, color: colors.primary },
  goalText: { fontFamily: fontFamily.monoLabel, fontSize: 10, color: colors.textFaint, marginTop: 6, letterSpacing: 0.5 },
  metricUnit: { fontFamily: fontFamily.monoLabel, fontSize: 11, color: colors.textMuted },
  row: { flexDirection: 'row', gap: spacing.sm },
  halfCard: { flex: 1 },
  spacer: { height: spacing.sm },
  controlsRow: { flexDirection: 'row', gap: spacing.sm },
  savedText: { color: colors.primary, textAlign: 'center', marginTop: spacing.sm, fontFamily: fontFamily.bodyMedium },
});
