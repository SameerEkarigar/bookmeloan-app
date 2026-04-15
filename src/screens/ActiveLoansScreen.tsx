import { useEffect, useState } from 'react';
import {
  Text,
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Fetch } from '../api';
import { SafeAreaView } from 'react-native-safe-area-context';

type Loan = {
  _id: string;
  loanId?: string;
  status?: string;
  loanDetails?: {
    emiAmount?: number;
    tenureMonths?: number;
    interestRate?: number;
    principalAmount?: number;
  };
};

const ActiveLoansScreen = () => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadLoans = async () => {
    setLoading(true);
    setError(null);
    try {
      const data: any = await Fetch('loan/my', { status: 'active' });
      setLoans(data?.data || []);
    } catch (err: any) {
      setLoans([]);
      setError(err?.message || 'Unable to load active loans.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLoans();
  }, []);

  const formatAmount = (value?: number) =>
    value ? `₹${value.toLocaleString('en-IN')}` : '—';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.header}>My Active Loans</Text>
        <Text style={styles.subheader}>
          Track your disbursed loans, EMIs, and tenure at a glance.
        </Text>

        {loading && (
          <View style={styles.loader}>
            <ActivityIndicator color="#00BE99" />
          </View>
        )}

        {!loading && error && (
          <View style={styles.errorCard}>
            <Text style={styles.error}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={loadLoans}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading && !error && loans.length === 0 && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No active loans</Text>
            <Text style={styles.emptySubtitle}>
              Apply for a loan to see it listed here.
            </Text>
          </View>
        )}

        {!loading &&
          loans?.length > 0 &&
          loans.map(loan => (
            <View key={loan._id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.loanId}>{loan.loanId || 'Loan'}</Text>
                <Text style={styles.status}>{loan.status || 'Active'}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Principal</Text>
                <Text style={styles.value}>
                  {formatAmount(loan.loanDetails?.principalAmount)}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>EMI</Text>
                <Text style={styles.value}>
                  {formatAmount(loan.loanDetails?.emiAmount)}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Rate</Text>
                <Text style={styles.value}>
                  {loan.loanDetails?.interestRate
                    ? `${loan.loanDetails.interestRate}% p.a.`
                    : '—'}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Tenure</Text>
                <Text style={styles.value}>
                  {loan.loanDetails?.tenureMonths
                    ? `${loan.loanDetails.tenureMonths} months`
                    : '—'}
                </Text>
              </View>
            </View>
          ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 24 },
  error: { color: '#DC2626', marginVertical: 10 },
  safeArea: { flex: 1, backgroundColor: '#00BE99' },
  loader: { paddingVertical: 20, alignItems: 'center' },
  header: { fontSize: 22, fontWeight: '700', color: '#fff' },
  subheader: { color: '#fff', marginTop: 4, marginBottom: 12 },
  errorCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginBottom: 8,
  },
  retryBtn: {
    marginTop: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#0F172A',
  },
  retryText: { color: '#fff', fontWeight: '700' },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emptyTitle: { fontWeight: '700', fontSize: 16, color: '#0F172A' },
  emptySubtitle: { color: '#94A3B8', marginTop: 4 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  loanId: { fontWeight: '700', fontSize: 16, color: '#0F172A' },
  status: { color: '#16A34A', fontWeight: '700' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: { color: '#6B7280' },
  value: { color: '#0F172A', fontWeight: '700' },
});

export default ActiveLoansScreen;
