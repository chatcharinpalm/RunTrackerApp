import { useCallback, useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { getAllActivities } from '../db/activityRepository';
import { formatDistanceKm, formatDuration, formatSpeedKmh } from '../utils/format';
import { colors, fontFamily, radius, spacing } from '../theme/theme';
import { GlassCard, Label, MonoValue } from '../components/ui';
import { HudGridBackground } from '../components/HudGridBackground';
import { IconBadge } from '../components/IconBadge';
import { useLanguage } from '../i18n/LanguageContext';
import type { Activity } from '../types';

const DAYS_TO_SHOW = 7;
const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function lastNDaysBuckets(activities: Activity[], days: number) {
  const buckets: { label: string; distanceMeters: number }[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(now);
    day.setDate(now.getDate() - i);
    day.setHours(0, 0, 0, 0);
    const nextDay = new Date(day);
    nextDay.setDate(day.getDate() + 1);

    const distanceMeters = activities
      .filter((a) => a.start_time >= day.getTime() && a.start_time < nextDay.getTime())
      .reduce((sum, a) => sum + a.total_distance, 0);

    buckets.push({ label: DAY_LABELS[day.getDay()], distanceMeters });
  }

  return buckets;
}

export default function StatsScreen() {
  const { t } = useLanguage();
  const [activities, setActivities] = useState<Activity[]>([]);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      getAllActivities().then((rows) => {
        if (mounted) setActivities(rows);
      });
      return () => {
        mounted = false;
      };
    }, [])
  );

  const finished = activities.filter((a) => a.end_time !== null);
  const totalDistance = finished.reduce((sum, a) => sum + a.total_distance, 0);
  const totalDurationMs = finished.reduce((sum, a) => sum + ((a.end_time ?? a.start_time) - a.start_time), 0);
  const totalCalories = finished.reduce((sum, a) => sum + a.calories_burned, 0);
  const avgSpeed = finished.length
    ? finished.reduce((sum, a) => sum + a.avg_speed, 0) / finished.length
    : 0;

  const personalBest = useMemo(
    () => finished.reduce<Activity | null>((best, a) => (!best || a.total_distance > best.total_distance ? a : best), null),
    [finished]
  );

  const buckets = lastNDaysBuckets(finished, DAYS_TO_SHOW);
  const maxDistance = Math.max(...buckets.map((b) => b.distanceMeters), 1);

  return (
    <View style={styles.root}>
      <HudGridBackground />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <IconBadge name="stats-chart" size={40} />
            <Text style={styles.title}>{t('statsTitle')}</Text>
          </View>

          {personalBest ? (
            <GlassCard glowVariant="primary">
              <View style={styles.bestRow}>
                <IconBadge name="trophy" set="mci" size={48} color={colors.secondary} />
                <View style={{ flex: 1 }}>
                  <Label>{t('personalBest')}</Label>
                  <View style={styles.heroRow}>
                    <MonoValue size={24}>{formatDistanceKm(personalBest.total_distance)}</MonoValue>
                    <Text style={styles.heroUnit}>KM</Text>
                  </View>
                  <Label style={{ marginTop: 2 }}>
                    {personalBest.type === 'running' ? t('modeRun') : t('modeCycle')} ·{' '}
                    {new Date(personalBest.start_time).toLocaleDateString('en-US', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </Label>
                </View>
              </View>
            </GlassCard>
          ) : null}

          <View style={styles.summaryGrid}>
            <SummaryCard icon="flag-outline" label={t('totalActivities')} value={`${finished.length}`} delay={0} />
            <SummaryCard
              icon="navigate-outline"
              label={t('totalDistanceStat')}
              value={`${formatDistanceKm(totalDistance)} km`}
              delay={40}
            />
            <SummaryCard icon="time-outline" label={t('totalTime')} value={formatDuration(totalDurationMs)} delay={80} />
            <SummaryCard
              icon="flame-outline"
              label={t('totalCalories')}
              value={`${Math.round(totalCalories)} kcal`}
              color={colors.secondary}
              delay={120}
            />
            <SummaryCard
              icon="speedometer-outline"
              label={t('avgSpeed')}
              value={`${formatSpeedKmh(avgSpeed)} km/h`}
              delay={160}
            />
          </View>

          <Text style={styles.sectionTitle}>{t('last7Days')}</Text>
          <GlassCard delay={200}>
            <View style={styles.chart}>
              {buckets.map((bucket, i) => {
                const height = Math.max(
                  (bucket.distanceMeters / maxDistance) * 100,
                  bucket.distanceMeters > 0 ? 4 : 0
                );
                return (
                  <View key={i} style={styles.barColumn}>
                    <View style={styles.barTrack}>
                      <Animated.View
                        entering={FadeInUp.duration(500).delay(220 + i * 60)}
                        style={[styles.bar, { height }]}
                      >
                        <LinearGradient
                          colors={[colors.primary, colors.tertiary]}
                          style={StyleSheet.absoluteFill}
                          start={{ x: 0, y: 1 }}
                          end={{ x: 0, y: 0 }}
                        />
                      </Animated.View>
                    </View>
                    <Label>{bucket.label}</Label>
                  </View>
                );
              })}
            </View>
          </GlassCard>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  color,
  delay,
}: {
  icon: keyof typeof import('@expo/vector-icons').Ionicons.glyphMap;
  label: string;
  value: string;
  color?: string;
  delay?: number;
}) {
  return (
    <GlassCard style={styles.summaryCard} delay={delay}>
      <View style={styles.summaryCardInner}>
        <IconBadge name={icon} size={32} color={color} />
        <MonoValue size={15} color={color}>
          {value}
        </MonoValue>
        <Label style={styles.summaryLabel}>{label}</Label>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  safeArea: { flex: 1 },
  content: { padding: spacing.md, gap: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { fontFamily: fontFamily.headline, fontSize: 20, color: colors.text },
  bestRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  heroRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 2 },
  heroUnit: { fontFamily: fontFamily.headline, fontSize: 14, color: colors.primary },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  summaryCard: { width: '31%' },
  summaryCardInner: { alignItems: 'center', gap: 4 },
  summaryLabel: { textAlign: 'center' },
  sectionTitle: { fontFamily: fontFamily.bodySemiBold, fontSize: 14, color: colors.text, marginTop: spacing.xs },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 140,
  },
  barColumn: { alignItems: 'center', gap: 6, flex: 1 },
  barTrack: { height: 100, justifyContent: 'flex-end' },
  bar: { width: 14, borderRadius: radius.sm, overflow: 'hidden' },
});
