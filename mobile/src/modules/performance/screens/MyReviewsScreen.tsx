import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Card, GradientHeader } from '@/components';
import { colors, spacing } from '@/theme';
import { useGetMyCycles, useGetMyReview } from '../api';
import type { ReviewCycle } from '@/models/performances';
import { useI18n } from '@/i18n';

const formatDate = (iso: string, locale: string) =>
  new Date(iso).toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' });

export const MyReviewsScreen: React.FC = () => {
  const { t, locale } = useI18n();
  const { data: cyclesData, isLoading, refetch } = useGetMyCycles();
  const cycles = cyclesData?.data ?? [];

  const [selectedCycle, setSelectedCycle] = useState<ReviewCycle | null>(null);

  const { data: reviewData, isLoading: loadingReview } = useGetMyReview(selectedCycle?.id ?? '');
  const review = reviewData?.data ?? null;

  const onRefresh = async () => {
    await refetch();
  };

  const handleViewReview = (cycle: ReviewCycle) => {
    setSelectedCycle(cycle);
  };

  const closeModal = () => {
    setSelectedCycle(null);
  };

  const renderCycleItem = ({ item }: { item: ReviewCycle }) => {
    return (
      <TouchableOpacity onPress={() => handleViewReview(item)} activeOpacity={0.8}>
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cycleInfo}>
              <View style={styles.cycleIcon}>
                <Ionicons name="trophy-outline" size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cycleTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <View style={styles.metaRow}>
                  <Ionicons name="calendar-outline" size={12} color={colors.gray400} />
                  <Text style={styles.metaText}>{formatDate(item.announce_date, locale)}</Text>
                  {item.template && (
                    <>
                      <View style={styles.dot} />
                      <Text style={styles.metaText}>{item.template.title}</Text>
                    </>
                  )}
                </View>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.gray400} />
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <GradientHeader style={styles.header}>
        <Text style={styles.headerTitle}>{t('performance.myReviews')}</Text>
        <Text style={styles.headerSubtitle}>{t('performance.myReviewsSubtitle')}</Text>
      </GradientHeader>

      {/* List */}
      <FlatList
        data={cycles}
        keyExtractor={(item) => item.id}
        renderItem={renderCycleItem}
        contentContainerStyle={styles.list}
        onRefresh={onRefresh}
        refreshing={isLoading}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <Ionicons name="star-outline" size={48} color={colors.gray300} />
              <Text style={styles.emptyText}>{t('performance.noReviewCycles')}</Text>
            </View>
          ) : null
        }
      />

      {/* Review Detail Modal */}
      <Modal
        visible={!!selectedCycle}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeModal}
      >
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{selectedCycle?.title}</Text>
            <TouchableOpacity onPress={closeModal}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {loadingReview ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>{t('performance.loadingReview')}</Text>
              </View>
            ) : !review ? (
              <Card variant="flat" style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <Ionicons name="information-circle-outline" size={18} color={colors.info} />
                  <Text style={styles.infoText}>{t('performance.noReview')}</Text>
                </View>
              </Card>
            ) : review.status !== 'published' ? (
              <Card variant="flat" style={styles.warningCard}>
                <View style={styles.warningHeader}>
                  <Ionicons name="time-outline" size={18} color={colors.warning} />
                  <Text style={styles.warningTitle}>{t('performance.reviewInProgress')}</Text>
                </View>
                <Text style={styles.warningText}>{t('performance.reviewInProgressText')}</Text>
              </Card>
            ) : (
              <View style={styles.reviewContent}>
                {/* Score Summary */}
                {review.total_score !== undefined && (
                  <Card style={styles.scoreCard}>
                    <Text style={styles.sectionTitle}>{t('performance.overallScore')}</Text>
                    <View style={styles.scoreDisplay}>
                      <Text style={styles.scoreValue}>{review.total_score.toFixed(1)}</Text>
                      <Text style={styles.scoreLabel}>/ 100</Text>
                    </View>
                  </Card>
                )}

                {/* Attendance Summary */}
                <Card style={styles.statsCard}>
                  <Text style={styles.sectionTitle}>{t('performance.attendanceSummary')}</Text>
                  <View style={styles.statsGrid}>
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{review.attendance_days ?? '—'}</Text>
                      <Text style={styles.statLabel}>{t('performance.present')}</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={[styles.statValue, { color: colors.warning }]}>
                        {review.late_count ?? '—'}
                      </Text>
                      <Text style={styles.statLabel}>{t('attendance.late')}</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={[styles.statValue, { color: colors.error }]}>
                        {review.absent_count ?? '—'}
                      </Text>
                      <Text style={styles.statLabel}>{t('attendance.absent')}</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={[styles.statValue, { color: colors.success }]}>
                        {((review.overtime_minutes ?? 0) / 60).toFixed(1)}
                      </Text>
                      <Text style={styles.statLabel}>{t('attendance.overtime')}</Text>
                    </View>
                  </View>
                </Card>

                {/* Criteria Details */}
                {review.score_details && review.score_details.length > 0 && (
                  <Card style={styles.criteriaCard}>
                    <Text style={styles.sectionTitle}>{t('performance.criteriaScores')}</Text>
                    {review.score_details.map((detail) => (
                      <View key={detail.id} style={styles.criteriaItem}>
                        <View style={styles.criteriaHeader}>
                          <Text style={styles.criteriaName}>{detail.criteria_name}</Text>
                          <Text style={styles.criteriaScore}>
                            {detail.score} / {detail.max_score}
                          </Text>
                        </View>
                        {detail.note && <Text style={styles.criteriaNote}>"{detail.note}"</Text>}
                      </View>
                    ))}
                  </Card>
                )}

                {/* Achievements */}
                {review.achievements && (
                  <Card style={styles.achievementsCard}>
                    <View style={styles.achievementsHeader}>
                      <Ionicons name="trophy" size={16} color={colors.warning} />
                      <Text style={styles.achievementsTitle}>{t('performance.achievements')}</Text>
                    </View>
                    <Text style={styles.achievementsText}>{review.achievements}</Text>
                  </Card>
                )}

                {/* Manager Feedback */}
                {review.comment && (
                  <Card style={styles.feedbackCard}>
                    <View style={styles.feedbackHeader}>
                      <Ionicons name="chatbubble-ellipses" size={16} color={colors.info} />
                      <Text style={styles.feedbackTitle}>{t('performance.feedback')}</Text>
                    </View>
                    <Text style={styles.feedbackText}>{review.comment}</Text>
                  </Card>
                )}

                {!review.achievements && !review.comment && (
                  <Text style={styles.noFeedback}>{t('performance.noFeedback')}</Text>
                )}
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: colors.white },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  list: { padding: spacing.lg, gap: 12 },
  card: { gap: 0 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cycleInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  cycleIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cycleTitle: { fontSize: 15, fontWeight: '600', color: colors.textPrimary, marginBottom: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11, color: colors.gray400 },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.gray400,
    marginHorizontal: 2,
  },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 15, color: colors.textSecondary },
  modal: { flex: 1, backgroundColor: colors.background },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, flex: 1 },
  modalBody: { padding: spacing.lg },
  loadingContainer: { paddingVertical: 40, alignItems: 'center' },
  loadingText: { fontSize: 14, color: colors.textSecondary },
  infoCard: { padding: spacing.md },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  infoText: { flex: 1, fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
  warningCard: { padding: spacing.md, backgroundColor: colors.warningLight },
  warningHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  warningTitle: { fontSize: 14, fontWeight: '600', color: colors.warning },
  warningText: { fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
  reviewContent: { gap: 12 },
  scoreCard: { alignItems: 'center', paddingVertical: spacing.lg },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 12,
  },
  scoreDisplay: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  scoreValue: { fontSize: 48, fontWeight: '800', color: colors.primary },
  scoreLabel: { fontSize: 18, color: colors.textSecondary },
  statsCard: {},
  statsGrid: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '700', color: colors.info },
  statLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 4 },
  criteriaCard: {},
  criteriaItem: { marginBottom: 12 },
  criteriaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  criteriaName: { fontSize: 13, fontWeight: '500', color: colors.textPrimary, flex: 1 },
  criteriaScore: { fontSize: 13, fontWeight: '700', color: colors.primary },
  criteriaNote: { fontSize: 12, color: colors.textSecondary, fontStyle: 'italic', marginTop: 2 },
  achievementsCard: { backgroundColor: colors.warningLight },
  achievementsHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  achievementsTitle: { fontSize: 13, fontWeight: '600', color: colors.warning },
  achievementsText: { fontSize: 13, color: colors.textSecondary, lineHeight: 20 },
  feedbackCard: { backgroundColor: colors.infoLight },
  feedbackHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  feedbackTitle: { fontSize: 13, fontWeight: '600', color: colors.info },
  feedbackText: { fontSize: 13, color: colors.textSecondary, lineHeight: 20 },
  noFeedback: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
});
