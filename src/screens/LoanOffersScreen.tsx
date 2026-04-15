import { useEffect, useMemo, useState } from 'react';
import {
  Text,
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Fetch, Post } from '../api';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { StackNavigationProp } from '@react-navigation/stack';
import { SafeAreaView } from 'react-native-safe-area-context';

type NavigationProp = StackNavigationProp<RootStackParamList, 'LoanOffers'>;

type Offer = {
  _id: string;
  loanType?: 'personal' | 'home' | 'education' | 'business' | string;
  title?: string;
  subtitle?: string;
  badge?: string;
  applicationId?: string;
  isGlobal?: boolean;
  offerDetails?: {
    offeredAmount?: number;
    interestRate?: number;
    tenureMonths?: number;
    processingFee?: number;
  };
  status?: string;
};

type LoanFormScreen = 'PersonalLoan' | 'HomeLoan' | 'EducationLoan' | 'BusinessLoan';

const LoanOffersScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionLoadingKey, setActionLoadingKey] = useState<string | null>(null);

  const stats = useMemo(() => {
    if (!offers.length) {
      return [
        { label: 'Offers available', value: '0', foot: 'Check back soon' },
        {
          label: 'Suggested action',
          value: 'Update profile',
          foot: 'Better matches after KYC',
        },
      ];
    }
    const rates = offers
      .map(o => o.offerDetails?.interestRate || 0)
      .filter(Boolean)
      .sort((a, b) => a - b);
    const minRate = rates[0];
    const avgProcessing =
      offers.reduce((sum, o) => sum + (o.offerDetails?.processingFee || 0), 0) /
      (offers.length || 1);
    return [
      {
        label: 'Offers available',
        value: offers.length.toString(),
        foot: 'Personalized to your profile',
      },
      {
        label: 'Lowest rate',
        value: minRate ? `${minRate}% p.a.` : '—',
        foot: 'Based on matched offers',
      },
      {
        label: 'Avg. fee',
        value: avgProcessing ? `₹${avgProcessing.toFixed(0)}` : '—',
        foot: 'Processing average',
      },
    ];
  }, [offers]);

  const fetchOffers = async (showLoader: boolean = true) => {
    if (showLoader) setLoading(true);
    try {
      const data: any = await Fetch('loan-offers/my');
      setOffers(data?.data || []);
      if (!showLoader) return;
    } catch {
      setOffers([]);
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  const formatAmount = (value?: number) => {
    if (!value) return '—';
    return `₹${value.toLocaleString('en-IN')}`;
  };

  const formatTenure = (months?: number) => (months ? `${months} Months` : '—');
  const normalizeStatus = (value?: string) => (value || 'pending').toLowerCase();
  const formatStatus = (value?: string) =>
    normalizeStatus(value)
      .split('_')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');

  const handleAcceptOffer = async (offer: Offer) => {
    const isPending = normalizeStatus(offer.status) === 'pending';
    if (!offer.applicationId || offer.isGlobal || !isPending) {
      setActionMessage('Only pending personalized offers can be accepted.');
      return;
    }

    const loadingKey = `accept:${offer._id}`;
    setActionLoadingKey(loadingKey);
    setActionMessage(null);
    try {
      await Post(`loan-offers/${offer._id}/accept`, {}, 12000, undefined, false);
      setActionMessage('Offer accepted. Start e-sign to proceed.');
      await fetchOffers(false);
    } catch (error: any) {
      setActionMessage(error?.message || 'Unable to accept offer right now.');
    } finally {
      setActionLoadingKey(null);
    }
  };

  const handleStartAgreement = async (offer: Offer) => {
    if (!offer.applicationId || offer.isGlobal) {
      setActionMessage('Agreement is available only for personalized offers.');
      return;
    }

    const loadingKey = `esign:${offer._id}`;
    setActionLoadingKey(loadingKey);
    setActionMessage(null);
    try {
      const response: any = await Post(
        `loan/${offer._id}/initiate-agreement`,
        {},
        12000,
        undefined,
        false,
      );
      const signUrl = response?.data?.signUrl || response?.signUrl;
      if (signUrl) {
        const canOpen = await Linking.canOpenURL(signUrl);
        if (canOpen) {
          await Linking.openURL(signUrl);
          setActionMessage('Agreement started. Complete e-sign to continue.');
        } else {
          setActionMessage('Agreement started. Unable to open sign link on this device.');
        }
      } else {
        setActionMessage('Agreement started. Please check your loan updates.');
      }
      await fetchOffers(false);
    } catch (error: any) {
      setActionMessage(error?.message || 'Unable to start agreement right now.');
    } finally {
      setActionLoadingKey(null);
    }
  };

  const resolveFormScreen = (loanType?: string): LoanFormScreen => {
    const normalized = String(loanType || '')
      .trim()
      .toLowerCase();
    if (normalized.includes('home') || normalized.includes('vehicle')) {
      return 'HomeLoan';
    }
    if (normalized.includes('education')) return 'EducationLoan';
    if (normalized.includes('business')) return 'BusinessLoan';
    return 'PersonalLoan';
  };

  const handlePress = (offer: Offer) => {
    const target = resolveFormScreen(offer.loanType);
    navigation.navigate(target, {
      prefill: {
        amount: offer.offerDetails?.offeredAmount,
        tenureMonths: offer.offerDetails?.tenureMonths,
        purpose: offer.subtitle || offer.title || '',
        applicationId: offer.applicationId,
        sourceOfferId: offer._id,
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Compare available loan offers</Text>
          <Text style={styles.heroSubtitle}>
            Pick the best fit for your plan – all sourced from trusted partners.
          </Text>
          <View style={styles.statsRow}>
            {stats.map(item => (
              <View key={item.label} style={styles.statChip}>
                <Text style={styles.statLabel}>{item.label}</Text>
                <Text style={styles.statValue}>{item.value}</Text>
                <Text style={styles.statFoot}>{item.foot}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Top matches</Text>
            <TouchableOpacity onPress={() => fetchOffers()}>
              <Text style={styles.sectionAction}>Refresh</Text>
            </TouchableOpacity>
          </View>
          {actionMessage && <Text style={styles.actionMessage}>{actionMessage}</Text>}

          {loading && (
            <View style={styles.loader}>
              <ActivityIndicator color="#00BE99" />
            </View>
          )}

          {!loading && !offers.length && (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No offers yet</Text>
              <Text style={styles.emptySubtitle}>
                Update your profile and preferences to see personalized offers.
              </Text>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => navigation.navigate('Settings')}
              >
                <Text style={styles.secondaryButtonText}>Adjust settings</Text>
              </TouchableOpacity>
            </View>
          )}

          {!loading &&
            offers.map(offer => {
              const normalizedStatus = normalizeStatus(offer.status);
              const canAccept =
                normalizedStatus === 'pending' &&
                !offer.isGlobal &&
                Boolean(offer.applicationId);
              const canStartAgreement =
                normalizedStatus === 'accepted' &&
                !offer.isGlobal &&
                Boolean(offer.applicationId);

              return (
                <TouchableOpacity
                  key={offer._id}
                  style={[
                    styles.offerCard,
                    offer.badge && styles.offerCardHighlighted,
                  ]}
                  activeOpacity={0.92}
                  onPress={() => handlePress(offer)}
                >
                <View style={styles.offerHeader}>
                  <View>
                    <Text style={styles.offerName}>
                      {offer.title || offer.loanType || 'Loan offer'}
                    </Text>
                    <Text style={styles.offerAmount}>
                      {formatAmount(offer.offerDetails?.offeredAmount)}
                    </Text>
                    <Text style={styles.offerSub}>
                      {formatTenure(offer.offerDetails?.tenureMonths)} ·{' '}
                      {formatStatus(offer.status)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.offerExploreButton}
                    onPress={() => handlePress(offer)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.offerExploreButtonText}>Explore type</Text>
                  </TouchableOpacity>
                </View>
                {offer.badge && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeLabel}>{offer.badge}</Text>
                  </View>
                )}
                <View style={styles.offerDetails}>
                  <View style={styles.detailBlock}>
                    <Text style={styles.detailLabel}>Interest</Text>
                    <Text style={styles.detailValue}>
                      {offer.offerDetails?.interestRate
                        ? `${offer.offerDetails.interestRate}% p.a.`
                        : '—'}
                    </Text>
                  </View>
                  <View style={styles.detailBlock}>
                    <Text style={styles.detailLabel}>Processing</Text>
                    <Text style={styles.detailValue}>
                      {formatAmount(offer.offerDetails?.processingFee)}
                    </Text>
                  </View>
                  <View style={styles.detailBlock}>
                    <Text style={styles.detailLabel}>Loan type</Text>
                    <Text style={styles.detailValue}>
                      {offer.loanType || 'N/A'}
                    </Text>
                  </View>
                </View>
                <View style={styles.progressRow}>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        offer.badge && styles.progressFillPrimary,
                      ]}
                    />
                  </View>
                  <Text style={styles.progressLabel}>
                    {offer.subtitle || 'Tailored for your profile'}
                  </Text>
                </View>

                {(canAccept || canStartAgreement) && (
                  <View style={styles.offerActionsRow}>
                    {canAccept && (
                      <TouchableOpacity
                        style={[
                          styles.actionButton,
                          styles.actionButtonPrimary,
                          actionLoadingKey === `accept:${offer._id}` &&
                            styles.actionButtonDisabled,
                        ]}
                        disabled={Boolean(actionLoadingKey)}
                        onPress={() => handleAcceptOffer(offer)}
                      >
                        {actionLoadingKey === `accept:${offer._id}` ? (
                          <ActivityIndicator color="#fff" />
                        ) : (
                          <Text style={styles.actionButtonPrimaryText}>Accept Offer</Text>
                        )}
                      </TouchableOpacity>
                    )}

                    {canStartAgreement && (
                      <TouchableOpacity
                        style={[
                          styles.actionButton,
                          styles.actionButtonSecondary,
                          actionLoadingKey === `esign:${offer._id}` &&
                            styles.actionButtonDisabled,
                        ]}
                        disabled={Boolean(actionLoadingKey)}
                        onPress={() => handleStartAgreement(offer)}
                      >
                        {actionLoadingKey === `esign:${offer._id}` ? (
                          <ActivityIndicator color="#00BE99" />
                        ) : (
                          <Text style={styles.actionButtonSecondaryText}>Start E-Sign</Text>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            );
            })}
        </View>

        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>Need help choosing?</Text>
          <Text style={styles.summarySubtitle}>
            Chat with our advisor to get a tailored breakdown, or lock in the
            best offer with one tap.
          </Text>
          <View style={styles.summaryRow}>
            <View>
              <Text style={styles.summaryValue}>
                {offers.length ? `${offers.length} offers` : 'No offers'}
              </Text>
              <Text style={styles.summaryLabel}>Ready to apply</Text>
            </View>
            <View>
              <Text style={styles.summaryValue}>Update settings</Text>
              <Text style={styles.summaryLabel}>Improve matches</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('Settings')}
        >
          <Text style={styles.primaryButtonText}>Adjust my settings</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.navigate('HelpSupport')}
          style={[styles.secondaryButton, styles.supportButton]}
        >
          <Text style={styles.secondaryButtonText}>Request a call back</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    paddingBottom: 16,
  },
  hero: {
    padding: 16,
    paddingTop: 20,
    backgroundColor: '#00BE99',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  heroTitle: {
    fontSize: 24,
    color: '#fff',
    fontWeight: '700',
    marginBottom: 8,
  },
  heroSubtitle: {
    color: '#E6FFFA',
    fontSize: 14,
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 18,
    justifyContent: 'space-between',
  },
  statChip: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 12,
    flex: 1,
    marginHorizontal: 4,
  },
  statLabel: {
    fontSize: 10,
    color: '#E6FFFA',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontWeight: '700',
    color: '#fff',
  },
  statFoot: {
    color: '#E6FFFA',
    fontSize: 10,
    marginTop: 2,
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionAction: {
    color: '#0F9F75',
    fontWeight: '600',
  },
  actionMessage: {
    marginBottom: 12,
    color: '#0F9F75',
    fontWeight: '600',
  },
  offerCard: {
    borderWidth: 1,
    borderColor: '#E5F7F1',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  offerCardHighlighted: {
    borderColor: '#00BE99',
    shadowColor: '#00BE99',
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  offerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  offerName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  offerAmount: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
  },
  offerSub: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 2,
  },
  offerExploreButton: {
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  offerExploreButtonText: {
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '700',
  },
  badge: {
    width: 'auto',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#E0F4F1',
  },
  badgeLabel: {
    color: '#00BE99',
    fontWeight: '700',
    fontSize: 12,
  },
  offerDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailBlock: {
    alignItems: 'center',
  },
  detailLabel: {
    color: '#94A3B8',
    fontSize: 11,
    marginBottom: 4,
  },
  detailValue: {
    fontWeight: '700',
    color: '#0F172A',
  },
  progressRow: {
    marginTop: 12,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E2E8EF',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#B5ECD7',
  },
  progressFillPrimary: {
    backgroundColor: '#00BE99',
  },
  progressLabel: {
    marginTop: 6,
    fontSize: 12,
    color: '#0F172A',
  },
  offerActionsRow: {
    marginTop: 14,
    flexDirection: 'row',
  },
  actionButton: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 130,
    marginRight: 10,
  },
  actionButtonPrimary: {
    backgroundColor: '#00BE99',
  },
  actionButtonSecondary: {
    borderWidth: 1,
    borderColor: '#00BE99',
    backgroundColor: '#fff',
  },
  actionButtonPrimaryText: {
    color: '#fff',
    fontWeight: '700',
  },
  actionButtonSecondaryText: {
    color: '#00BE99',
    fontWeight: '700',
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  loader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
  },
  emptyTitle: {
    fontWeight: '700',
    fontSize: 16,
    color: '#0F172A',
    marginBottom: 4,
  },
  emptySubtitle: {
    color: '#94A3B8',
    marginBottom: 12,
  },
  summary: {
    padding: 20,
    borderRadius: 20,
    marginHorizontal: 20,
    backgroundColor: '#FDF7EE',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  summarySubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryValue: {
    fontSize: 16,
    color: '#0F172A',
    fontWeight: '700',
  },
  summaryLabel: {
    fontSize: 11,
    color: '#94A3B8',
  },
  primaryButton: {
    marginTop: 16,
    borderRadius: 24,
    paddingVertical: 16,
    marginHorizontal: 20,
    alignItems: 'center',
    backgroundColor: '#00BE99',
  },
  primaryButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '700',
  },
  secondaryButton: {
    marginTop: 12,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: '#0F172A',
  },
  supportButton: {
    marginHorizontal: 20,
    borderRadius: 24,
  },
  secondaryButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
});

export default LoanOffersScreen;
