import React from 'react';
import { View, Text, StyleSheet, FlatList, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Card, Badge, GradientHeader } from '@/components';
import { colors, spacing, radius } from '@/theme';
import { useGetMyAwards } from '../api';
import type { Award } from '@/models/performances';
import { useI18n } from '@/i18n';

const categoryConfig: Record<
  string,
  {
    label: string;
    icon: 'star' | 'trophy';
    color: string;
    gradient: readonly [string, string, ...string[]];
  }
> = {
  top_employee: {
    label: 'performance.topEmployee',
    icon: 'star',
    color: colors.warning,
    gradient: ['#FFD700', '#FFA500'] as const,
  },
  top_manager: {
    label: 'performance.topManager',
    icon: 'trophy',
    color: colors.primary,
    gradient: ['#667eea', '#764ba2'] as const,
  },
};

const getRankLabel = (rank: number, t: (key: string) => string) => {
  if (rank === 1) return `1 ${t('performance.firstPlaceRank')}`;
  if (rank === 2) return `2 ${t('performance.secondPlaceRank')}`;
  if (rank === 3) return `3 ${t('performance.thirdPlaceRank')}`;
  return `#${rank}`;
};

const formatDate = (iso: string, locale: string) =>
  new Date(iso).toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' });

export const MyAwardsScreen: React.FC = () => {
  const { t, locale } = useI18n();
  const { data, isLoading, refetch } = useGetMyAwards();
  const awards = data?.data ?? [];

  const onRefresh = async () => {
    await refetch();
  };

  const renderAwardItem = ({ item, index }: { item: Award; index: number }) => {
    const config = categoryConfig[item.category];
    const scaleAnim = new Animated.Value(0);

    Animated.spring(scaleAnim, {
      toValue: 1,
      delay: index * 100,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();

    return (
      <Animated.View
        style={{
          transform: [{ scale: scaleAnim }],
          opacity: scaleAnim,
        }}
      >
        <Card style={styles.awardCard}>
          <LinearGradient
            colors={config.gradient}
            style={styles.awardGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.awardHeader}>
              <View style={styles.iconBadge}>
                <Ionicons name={config.icon} size={32} color={colors.white} />
              </View>
              <Text style={styles.rankLabel}>{getRankLabel(item.rank, t)}</Text>
            </View>

            <Text style={styles.awardTitle}>{item.title}</Text>

            {item.description && (
              <Text style={styles.awardDescription} numberOfLines={2}>
                {item.description}
              </Text>
            )}

            <View style={styles.awardFooter}>
              <View style={styles.cycleInfo}>
                <Ionicons name="trophy-outline" size={12} color="rgba(255,255,255,0.8)" />
                <Text style={styles.cycleText}>{item.cycle.title}</Text>
              </View>
              <Text style={styles.dateText}>{formatDate(item.created_at, locale)}</Text>
            </View>
          </LinearGradient>

          <View style={styles.categoryBadge}>
            <Badge label={t(config.label)} variant="default" size="sm" />
          </View>
        </Card>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <GradientHeader style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>{t('performance.myAwards')}</Text>
            <Text style={styles.headerSubtitle}>{t('performance.myAwardsSubtitle')}</Text>
          </View>
          <View style={styles.trophyIcon}>
            <Ionicons name="trophy" size={32} color={colors.white} />
          </View>
        </View>

        {awards.length > 0 && (
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{awards.length}</Text>
              <Text style={styles.statLabel}>{t('performance.totalAwards')}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{awards.filter((a) => a.rank === 1).length}</Text>
              <Text style={styles.statLabel}>{t('performance.firstPlace')}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>
                {awards.filter((a) => a.category === 'top_employee').length}
              </Text>
              <Text style={styles.statLabel}>{t('performance.employee')}</Text>
            </View>
          </View>
        )}
      </GradientHeader>

      {/* List */}
      <FlatList
        data={awards}
        keyExtractor={(item) => item.id}
        renderItem={renderAwardItem}
        contentContainerStyle={styles.list}
        onRefresh={onRefresh}
        refreshing={isLoading}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <Ionicons name="trophy-outline" size={64} color={colors.gray300} />
              </View>
              <Text style={styles.emptyTitle}>{t('performance.noAwards')}</Text>
              <Text style={styles.emptyText}>{t('performance.noAwardsText')}</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: colors.white },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  trophyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: radius.md,
    padding: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  statValue: { fontSize: 20, fontWeight: '800', color: colors.white },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  list: { padding: spacing.lg, gap: 16 },
  awardCard: { position: 'relative', overflow: 'visible' },
  awardGradient: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    gap: 8,
  },
  awardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  iconBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankLabel: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.white,
  },
  awardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
    marginBottom: 4,
  },
  awardDescription: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 18,
  },
  awardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  cycleInfo: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  cycleText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
    flex: 1,
  },
  dateText: { fontSize: 11, color: 'rgba(255,255,255,0.7)' },
  categoryBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: spacing.xl },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.gray50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
