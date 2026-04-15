import { useEffect, useMemo, useState } from 'react';
import {
  Text,
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Fetch } from '../api';

type ApplicationStatus =
  | 'submitted'
  | 'in_review'
  | 'routed_to_lenders'
  | 'offers_available'
  | 'offer_accepted'
  | 'rejected'
  | 'closed'
  | string;

type LoanApplication = {
  _id: string;
  applicationId?: string;
  status: ApplicationStatus;
  createdAt?: string;
  requestedLoan?: {
    amount?: number;
    tenureMonths?: number;
    purpose?: string;
    loanType?: string;
  };
  applicantSnapshot?: {
    name?: string;
    email?: string;
    phone?: { number?: string };
  };
};

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  submitted: '#34D399',
  in_review: '#F59E0B',
  routed_to_lenders: '#6366F1',
  offers_available: '#22C55E',
  offer_accepted: '#10B981',
  rejected: '#EF4444',
  closed: '#9CA3AF',
};

const STATUS_FILTERS: { label: string; value: string | null }[] = [
  { label: 'All', value: null },
  { label: 'Submitted', value: 'submitted' },
  { label: 'In review', value: 'in_review' },
  { label: 'Offers', value: 'offers_available' },
  { label: 'Accepted', value: 'offer_accepted' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Closed', value: 'closed' },
];

const STATUS_PROGRESS: Record<ApplicationStatus, number> = {
  submitted: 20,
  in_review: 45,
  routed_to_lenders: 60,
  offers_available: 80,
  offer_accepted: 100,
  rejected: 100,
  closed: 100,
};

const SUMMARY_KEYS = [
  { key: 'submitted', label: 'Submitted' },
  { key: 'in_review', label: 'In review' },
  { key: 'closed', label: 'Closed' },
] as const;

const DATE_FILTERS = [
  { label: 'All time', value: 'all' as const },
  { label: 'Last 7d', value: '7d' as const },
  { label: 'Last 30d', value: '30d' as const },
];

const MyLoanRequestsScreen = () => {
  const [leads, setLeads] = useState<LoanApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<'all' | '7d' | '30d'>('all');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const buildDateRange = () => {
    if (dateFilter === 'all') return {};
    const now = new Date();
    const from = new Date(now.getTime());
    if (dateFilter === '7d') from.setDate(now.getDate() - 7);
    if (dateFilter === '30d') from.setDate(now.getDate() - 30);
    return { startDate: from.toISOString(), endDate: now.toISOString() };
  };

  const loadLeads = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const dateRange = buildDateRange();
      const params: any = {
        pagination: false,
        sortKey: 'createdAt',
        sortDir: 'desc',
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(dateFilter !== 'all' ? dateRange : {}),
      };
      const data: any = await Fetch('loan-applications/my-history', params);
      const list: LoanApplication[] = data?.data?.result || data?.data || [];
      setLeads(list);
      if (!list.length) setMessage('No requests yet. Submit a form to begin.');
    } catch (error: any) {
      setMessage(error?.message || 'Unable to load requests right now.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadLeads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, dateFilter]);

  const summary = useMemo(() => {
    const base = { submitted: 0, in_review: 0, closed: 0 };
    leads.forEach(lead => {
      if (lead.status === 'submitted') {
        base.submitted += 1;
      } else if (
        lead.status === 'closed' ||
        lead.status === 'rejected' ||
        lead.status === 'offer_accepted'
      ) {
        base.closed += 1;
      } else {
        base.in_review += 1;
      }
    });
    return base;
  }, [leads]);

  const formatDate = (value?: string) => {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatStatusLabel = (value?: string) => {
    if (!value) return 'Submitted';
    return value
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  };

  const renderPayloadDetails = (
    payload?: Record<string, string>,
    isExpanded?: boolean,
  ) => {
    if (!payload) return null;
    const entries = Object.entries(payload).filter(([, v]) => v);
    if (!entries.length) return null;
    const prettify = (key: string) =>
      key
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/[_-]/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());

    const visibleEntries = isExpanded ? entries : entries.slice(0, 4);

    return (
      <View style={styles.payloadGrid}>
        {visibleEntries.map(([key, value]) => (
          <View key={key} style={styles.payloadItem}>
            <Text style={styles.payloadKey}>{prettify(key)}</Text>
            <Text style={styles.payloadValue} numberOfLines={2}>
              {value}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadLeads();
            }}
          />
        }
      >
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Icon name="clipboard" size={24} color="#0F172A" />
          </View>
          <View style={styles.heroText}>
            <Text style={styles.heroTitle}>My requests</Text>
            <Text style={styles.heroSubtitle}>
              Track submissions across Personal, Home, Education, and Business.
            </Text>
          </View>
        </View>

        <View style={styles.filtersCard}>
          <View style={styles.filterRow}>
            {STATUS_FILTERS.map(filter => {
              const active = statusFilter === filter.value;
              return (
                <TouchableOpacity
                  key={filter.label}
                  onPress={() => setStatusFilter(filter.value)}
                  style={[styles.chip, active && styles.chipActive]}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[styles.chipText, active && styles.chipTextActive]}
                  >
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={styles.filterRow}>
            {DATE_FILTERS.map(filter => {
              const active = dateFilter === filter.value;
              return (
                <TouchableOpacity
                  key={filter.value}
                  onPress={() => setDateFilter(filter.value)}
                  style={[styles.chip, active && styles.chipActive]}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[styles.chipText, active && styles.chipTextActive]}
                  >
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.summaryRow}>
          {SUMMARY_KEYS.map(item => (
            <View key={item.key} style={styles.summaryChip}>
              <Text style={styles.summaryValue}>{summary[item.key]}</Text>
              <Text style={styles.summaryLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        {loading && (
          <View style={styles.loader}>
            <ActivityIndicator color="#00BE99" />
          </View>
        )}

        {!loading && message && <Text style={styles.message}>{message}</Text>}

        {!loading &&
          leads.map(lead => {
            const color = STATUS_COLORS[lead.status] || '#00BE99';
            const progressValue = STATUS_PROGRESS[lead.status] ?? 0;
            const progressBarWidth = Math.min(Math.max(progressValue, 0), 100);
            const isExpanded = expanded.has(lead._id);
            const applicantName = lead.applicantSnapshot?.name;
            const applicantEmail = lead.applicantSnapshot?.email;
            const applicantPhone = lead.applicantSnapshot?.phone?.number;
            const loanType = lead.requestedLoan?.loanType || 'Loan request';
            const payload = {
              amount: lead.requestedLoan?.amount
                ? `₹${lead.requestedLoan.amount}`
                : '',
              tenureMonths: lead.requestedLoan?.tenureMonths
                ? `${lead.requestedLoan.tenureMonths} months`
                : '',
              purpose: lead.requestedLoan?.purpose || '',
              applicationId: lead.applicationId || '',
            };
            return (
              <TouchableOpacity
                key={lead._id}
                style={[styles.card, isExpanded && styles.cardExpanded]}
                activeOpacity={0.92}
                onPress={() => {
                  const next = new Set(expanded);
                  if (next.has(lead._id)) {
                    next.delete(lead._id);
                  } else {
                    next.add(lead._id);
                  }
                  setExpanded(next);
                }}
              >
                <View style={styles.cardHeader}>
                  <View
                    style={[styles.statusDot, { backgroundColor: color }]}
                  />
                  <Text style={styles.cardTitle}>{loanType}</Text>
                  <Text style={[styles.statusLabel, { color }]}>
                    {formatStatusLabel(lead.status)}
                  </Text>
                </View>
                <View style={styles.cardMetaRow}>
                  <Text style={styles.cardMeta}>
                    Created {formatDate(lead.createdAt)}
                  </Text>
                  {progressValue > 0 && (
                    <Text style={styles.cardMeta}>
                      Progress {progressValue}%
                    </Text>
                  )}
                </View>
                {(applicantName || applicantEmail || applicantPhone) && (
                  <View style={styles.contactRow}>
                    {applicantName && (
                      <View style={styles.contactPill}>
                        <Icon name="user" size={14} color="#0F172A" />
                        <Text style={styles.contactText}>
                          {applicantName}
                        </Text>
                      </View>
                    )}
                    {applicantEmail && (
                      <View style={styles.contactPill}>
                        <Icon name="mail" size={14} color="#0F172A" />
                        <Text style={styles.contactText}>
                          {applicantEmail}
                        </Text>
                      </View>
                    )}
                    {applicantPhone && (
                      <View style={styles.contactPill}>
                        <Icon name="phone" size={14} color="#0F172A" />
                        <Text style={styles.contactText}>
                          {applicantPhone}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
                {renderPayloadDetails(payload, isExpanded)}
                <View style={styles.cardFooter}>
                  {progressValue > 0 && (
                    <View style={styles.progressTrack}>
                      <View
                        style={[
                          styles.progressFill,
                          { width: `${progressBarWidth}%` },
                        ]}
                      />
                    </View>
                  )}
                  <View style={styles.footerRow}>
                    <Text style={styles.footerLabel}>
                      {isExpanded ? 'Hide details' : 'View details'}
                    </Text>
                    <Icon
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={16}
                      color="#0F172A"
                    />
                  </View>
                  {progressValue > 0 && (
                    <Text style={styles.progressText}>
                      {Math.round(progressBarWidth)}% complete
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#00BE99' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  heroIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#E0F2F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: { marginLeft: 12, flex: 1 },
  heroTitle: { color: '#fff', fontWeight: '700', fontSize: 18 },
  heroSubtitle: { color: '#D1FAE5', fontSize: 12, marginTop: 4 },
  filtersCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipActive: {
    backgroundColor: '#00BE99',
    borderColor: '#00BE99',
  },
  chipText: {
    color: '#0F172A',
    fontWeight: '600',
    fontSize: 12,
  },
  chipTextActive: {
    color: '#fff',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryChip: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  summaryValue: { fontWeight: '700', fontSize: 18, color: '#0F172A' },
  summaryLabel: { color: '#6B7280', marginTop: 4 },
  loader: { paddingVertical: 20, alignItems: 'center' },
  message: { color: '#0F172A', textAlign: 'center', marginVertical: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  cardExpanded: {
    borderColor: '#00BE99',
    shadowOpacity: 0.15,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 6,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  cardTitle: { flex: 1, fontWeight: '700', color: '#0F172A' },
  statusLabel: { fontWeight: '700' },
  cardMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardMeta: { color: '#6B7280', fontSize: 12 },
  contactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  contactPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
  },
  contactText: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '600',
  },
  payloadGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  payloadItem: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  payloadKey: {
    color: '#6B7280',
    fontSize: 11,
    marginBottom: 4,
  },
  payloadValue: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '700',
  },
  cardFooter: {
    marginTop: 10,
    gap: 6,
  },
  progressTrack: {
    marginTop: 10,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: 8,
    backgroundColor: '#00BE99',
    borderRadius: 8,
  },
  progressText: {
    marginTop: 4,
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  footerLabel: {
    color: '#0F172A',
    fontWeight: '700',
    fontSize: 12,
  },
});

export default MyLoanRequestsScreen;
