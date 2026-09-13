import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getAllActivities } from '../db/activityRepository';
import { formatDistanceKm, formatDuration, formatSpeedKmh } from '../utils/format';
import { colors, fontFamily, spacing } from '../theme/theme';
import { GlassCard, Label, MonoValue, Badge } from '../components/ui';
import { HudGridBackground } from '../components/HudGridBackground';
import { IconBadge } from '../components/IconBadge';
import { useLanguage } from '../i18n/LanguageContext';
import type { Activity } from '../types';
import type { HistoryStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<HistoryStackParamList, 'HistoryList'>;

const MAX_STAGGER_MS = 320;

export default function HistoryScreen({ navigation }: Props) {
  const { t } = useLanguage();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      setLoading(true);
      getAllActivities()
        .then((rows) => {
          if (mounted) setActivities(rows);
        })
        .finally(() => {
          if (mounted) setLoading(false);
        });
      return () => {
        mounted = false;
      };
    }, [])
  );

  const totalDistance = useMemo(
    () => activities.reduce((sum, a) => sum + a.total_distance, 0),
    [activities]
  );

  return (
    <View style={styles.root}>
      <HudGridBackground />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <IconBadge name="albums-outline" size={40} />
          <Text style={styles.title}>{t('historyTitle')}</Text>
        </View>

        {activities.length > 0 ? (
          <GlassCard style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <SummaryItem
                icon="flag-outline"
                value={`${activities.length}`}
                label={t('totalActivities')}
              />
              <View style={styles.summaryDivider} />
              <SummaryItem
                icon="navigate-outline"
                value={`${formatDistanceKm(totalDistance)} km`}
                label={t('totalDistanceStat')}
                color={colors.secondary}
              />
            </View>
          </GlassCard>
        ) : null}

        <FlatList
          data={activities}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={!loading ? <Text style={styles.emptyText}>{t('historyEmpty')}</Text> : null}
          renderItem={({ item, index }) => (
            <Pressable onPress={() => navigation.navigate('ActivityDetail', { activityId: item.id })}>
              <GlassCard style={styles.card} delay={Math.min(index * 60, MAX_STAGGER_MS)}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardTypeRow}>
                    {item.type === 'running' ? (
                      <IconBadge name="run" set="mci" size={34} />
                    ) : (
                      <IconBadge name="bike" set="mci" size={34} color={colors.secondary} />
                    )}
                    <Text style={styles.cardType}>{item.type === 'running' ? t('modeRun') : t('modeCycle')}</Text>
                  </View>
                  <Text style={styles.cardDate}>
                    {new Date(item.start_time).toLocaleDateString('en-US', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Text>
                </View>
                <View style={styles.cardStatsRow}>
                  <Stat label={t('distance')} value={`${formatDistanceKm(item.total_distance)} km`} />
                  <Stat
                    label={t('time')}
                    value={formatDuration((item.end_time ?? item.start_time) - item.start_time)}
                  />
                  <Stat label={t('avg')} value={`${formatSpeedKmh(item.avg_speed)} km/h`} />
                </View>
                {item.synced === 0 ? <Badge tone="secondary">{t('pendingSync')}</Badge> : null}
              </GlassCard>
            </Pressable>
          )}
        />
      </SafeAreaView>
    </View>
  );
}

function SummaryItem({
  icon,
  value,
  label,
  color = colors.primary,
}: {
  icon: keyof typeof import('@expo/vector-icons').Ionicons.glyphMap;
  value: string;
  label: string;
  color?: string;
}) {
  return (
    <View style={styles.summaryItem}>
      <IconBadge name={icon} size={36} color={color} />
      <View style={{ flexShrink: 1 }}>
        <MonoValue size={18}>{value}</MonoValue>
        <Label>{label}</Label>
      </View>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <MonoValue size={16}>{value}</MonoValue>
      <Label>{label}</Label>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, paddingBottom: spacing.xs },
  title: { fontFamily: fontFamily.headline, fontSize: 20, color: colors.text },
  summaryCard: { marginHorizontal: spacing.md, marginBottom: spacing.sm },
  summaryRow: { flexDirection: 'row', alignItems: 'center' },
  summaryItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  summaryDivider: { width: 1, height: 36, backgroundColor: colors.border, marginHorizontal: spacing.sm },
  listContent: { paddingHorizontal: spacing.md, paddingBottom: spacing.lg, gap: spacing.sm },
  emptyText: { color: colors.textMuted, textAlign: 'center', marginTop: 40, fontFamily: fontFamily.body },
  card: { marginBottom: spacing.sm, gap: spacing.xs },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardTypeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  cardType: { color: colors.primary, fontFamily: fontFamily.bodySemiBold },
  cardDate: { color: colors.textMuted, fontSize: 12, fontFamily: fontFamily.body },
  cardStatsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  stat: { alignItems: 'flex-start', gap: 2 },
});
