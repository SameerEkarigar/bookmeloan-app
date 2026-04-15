import { useEffect, useMemo, useState } from 'react';
import {
  Text,
  View,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Fetch } from '../api';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { StackNavigationProp } from '@react-navigation/stack';

type ApplicationStatus =
  | 'submitted'
  | 'in_review'
  | 'routed_to_lenders'
  | 'offers_available'
  | 'offer_accepted'
  | 'rejected'
  | 'closed'
  | string;

type TimelineItem = {
  id: string;
  due: string;
  name: string;
  color: string;
  stage: string;
  amount: string;
  detail: string;
};

const statusColorMap: Record<ApplicationStatus, string> = {
  submitted: '#FBBF24',
  in_review: '#0EA5E9',
  routed_to_lenders: '#6366F1',
  offers_available: '#22C55E',
  offer_accepted: '#10B981',
  rejected: '#EF4444',
  closed: '#9CA3AF',
};

const stageLabel = (status?: string) => {
  if (!status) return 'Submitted';
  if (status === 'submitted') return 'Submitted';
  if (status === 'in_review') return 'In review';
  if (status === 'routed_to_lenders') return 'In review';
  if (status === 'offers_available') return 'In review';
  if (status === 'offer_accepted') return 'Closed';
  if (status === 'rejected') return 'Closed';
  if (status === 'closed') return 'Closed';
  return status;
};

const LoanStatusScreen = () => {
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const summary = useMemo(() => {
    const total = timeline.length;
    const reviewing = timeline.filter(t => t.stage === 'In review').length;
    const closed = timeline.filter(t => t.stage === 'Closed').length;
    const submitted = total - reviewing - closed;
    return [
      {
        label: 'Loans processed',
        value: total.toString(),
        foot: `${reviewing} in review`,
      },
      {
        label: 'Submitted',
        value: submitted.toString(),
        foot: 'Awaiting decision',
      },
      {
        label: 'Closed',
        value: closed.toString(),
        foot: 'Completed / declined',
      },
    ];
  }, [timeline]);

  const loadTimeline = async () => {
    setLoading(true);
    try {
      const data: any = await Fetch('loan-applications/my-history', {
        pagination: false,
        sortKey: 'createdAt',
        sortDir: 'desc',
      });
      const applications = (data?.data?.result || data?.data || []) as any[];
      const mapped: TimelineItem[] = applications.map((application, idx) => {
        const color = statusColorMap[application.status] || '#22C55E';
        const amountValue = application.requestedLoan?.amount;
        const amount = amountValue ? `₹${amountValue}` : '—';
        const detail = application.requestedLoan?.purpose || 'Details captured';
        const created = application.createdAt
          ? new Date(application.createdAt)
          : null;
        const due = created
          ? `Requested ${created.toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}`
          : 'Requested recently';

        return {
          id: application._id || application.applicationId || String(idx),
          name: application.requestedLoan?.loanType || 'Loan request',
          amount: typeof amount === 'string' ? amount : `${amount}`,
          stage: stageLabel(application.status),
          detail,
          due,
          color,
        };
      });
      setTimeline(mapped);
    } catch (error) {
      // keep silent to avoid UI disruption; fallback to empty
      setTimeline([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTimeline();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Image
            source={require('../../assets/group.png')}
            style={styles.heroAccent}
            resizeMode="cover"
          />
          <View style={styles.heroText}>
            <Text style={styles.heroTitle}>Loan status</Text>
            <Text style={styles.heroSubtitle}>
              Follow each request, milestone, and payout in one glance. Tap any
              row to jump to the statement.
            </Text>
          </View>
          <Icon name="file-text" size={28} color="#fff" />
        </View>

        {loading && (
          <View style={styles.loader}>
            <ActivityIndicator color="#00BE99" />
          </View>
        )}

        {!loading && (
          <View style={styles.summary}>
            {summary.map(item => (
              <View key={item.label} style={styles.summaryChip}>
                <Text style={styles.summaryValue}>{item.value}</Text>
                <Text style={styles.summaryLabel}>{item.label}</Text>
                <Text style={styles.summaryFoot}>{item.foot}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.timelineCard}>
          <View style={styles.timelineHeader}>
            <Text style={styles.timelineTitle}>Loan timeline</Text>
            <TouchableOpacity onPress={loadTimeline}>
              <Text style={styles.timelineAction}>Refresh</Text>
            </TouchableOpacity>
          </View>
          {(loading || timeline.length === 0) && !loading ? (
            <Text style={styles.emptyText}>
              No requests yet. Submit a form to begin.
            </Text>
          ) : (
            timeline.map((status, index) => (
              <View key={status.id} style={styles.timelineRow}>
                <View style={styles.timelineDotWrapper}>
                  <View
                    style={[
                      styles.timelineDot,
                      { borderColor: status.color },
                      index === 0 && styles.activeDot,
                    ]}
                  >
                    {index === 0 && <View style={styles.activeInnerDot} />}
                  </View>
                  {index < timeline.length - 1 && (
                    <View style={styles.timelineConnector} />
                  )}
                </View>
                <View style={styles.timelineBody}>
                  <View style={styles.timelineRowTop}>
                    <Text style={styles.timelineName}>{status.name}</Text>
                    <Text
                      style={[styles.timelineStage, { color: status.color }]}
                    >
                      {status.stage}
                    </Text>
                  </View>
                  <Text style={styles.timelineAmount}>{status.amount}</Text>
                  <Text style={styles.timelineDetail}>{status.detail}</Text>
                  <Text style={styles.timelineDue}>{status.due}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('NotificationCenter')}
        >
          <Text style={styles.primaryText}>View alerts & notifications</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('HelpSupport')}
        >
          <Text style={styles.secondaryText}>Message support</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#00BE99',
  },
  content: {
    paddingBottom: 16,
  },
  hero: {
    padding: 16,
    paddingTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00BE99',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    justifyContent: 'space-between',
  },
  heroAccent: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 200,
    height: 200,
    borderRadius: 120,
  },
  heroText: {
    flex: 1,
    paddingRight: 12,
  },
  heroTitle: {
    fontSize: 26,
    color: '#fff',
    fontWeight: '700',
  },
  heroSubtitle: {
    marginTop: 6,
    fontSize: 14,
    color: '#E6FFFA',
    lineHeight: 20,
  },
  loader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#0F172A',
    textAlign: 'center',
    marginVertical: 12,
  },
  summary: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  summaryChip: {
    flex: 1,
    padding: 16,
    borderRadius: 18,
    marginHorizontal: 4,
    backgroundColor: '#fff',
    borderWidth: 1,
    alignItems: 'center',
    borderColor: '#E6F5F0',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  summaryLabel: {
    fontSize: 12,
    marginTop: 4,
    color: 'black',
    fontWeight: '700',
    textAlign: 'center',
  },
  summaryFoot: {
    fontSize: 11,
    marginTop: 2,
    color: '#64748B',
    textAlign: 'center',
  },
  timelineCard: {
    margin: 16,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#E5F7F1',
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  timelineTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  timelineAction: {
    color: '#0F9F75',
    fontWeight: '600',
  },
  timelineRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineDotWrapper: {
    width: 38,
    alignItems: 'center',
  },
  timelineDot: {
    width: 16,
    zIndex: 1,
    height: 16,
    marginTop: 8,
    borderWidth: 2,
    borderRadius: 8,
    alignItems: 'center',
    borderColor: '#94A3B8',
    justifyContent: 'center',
  },
  activeDot: {
    borderColor: '#00BE99',
  },
  activeInnerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00BE99',
  },
  timelineConnector: {
    top: 16,
    width: 2,
    height: '130%',
    position: 'absolute',
    backgroundColor: '#E5F7F1',
  },
  timelineBody: {
    flex: 1,
    paddingLeft: 12,
  },
  timelineRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timelineName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  timelineStage: {
    fontWeight: '700',
  },
  timelineAmount: {
    color: '#0F9F75',
    fontWeight: '700',
    marginTop: 4,
  },
  timelineDetail: {
    marginTop: 6,
    color: '#64748B',
    fontSize: 13,
  },
  timelineDue: {
    marginTop: 4,
    fontSize: 12,
    color: '#94A3B8',
  },
  primaryButton: {
    marginTop: 10,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginHorizontal: 20,
    backgroundColor: '#FBBF24',
  },
  primaryText: {
    fontSize: 16,
    color: '#000',
    fontWeight: '600',
  },
  secondaryButton: {
    marginTop: 12,
    borderRadius: 16,
    alignItems: 'center',
    paddingVertical: 16,
    marginHorizontal: 20,
    backgroundColor: '#0F172A',
  },
  secondaryText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default LoanStatusScreen;
