import { useEffect, useState } from 'react';
import {
  Text,
  View,
  Image,
  StatusBar,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import FaIcon from 'react-native-vector-icons/FontAwesome5';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';

import { Fetch } from '../api';
import { RootStackParamList } from '../navigation/types';

type NavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

const tabItems = [
  { label: 'Home', screen: 'Home' as const, icon: 'home' },
  { label: 'Loan Status', screen: 'LoanStatus' as const, icon: 'bar-chart-2' },
  { label: 'Loan Offers', screen: 'LoanOffers' as const, icon: 'credit-card' },
  { label: 'Profile', screen: 'Profile' as const, icon: 'user' },
];

const loanTypes = [
  {
    title: 'Personal Loan',
    subtitle: 'Get up to ₹10 Lakhs',
    footnote: 'in just 10 min',
    icon: 'user-check',
    screen: 'PersonalLoan' as const,
    enabled: false,
  },
  {
    title: 'Home Loan',
    subtitle: 'Get up to ₹5 Cr',
    footnote: 'Property backed',
    icon: 'home',
    screen: 'TrueHomeLoan' as const,
    enabled: true,
  },
  {
    title: 'Vehicle / Asset Loan',
    subtitle: 'Get up to ₹10 Lakhs',
    footnote: 'in just 10 min',
    icon: 'truck',
    screen: 'HomeLoan' as const,
    enabled: false,
  },
  {
    title: 'Education Loan',
    subtitle: 'Get up to ₹10 Lakhs',
    footnote: 'in just 10 min',
    icon: 'book-open',
    screen: 'EducationLoan' as const,
    enabled: false,
  },
  // {
  //   title: 'Business Loan',
  //   subtitle: 'Get up to ₹10 Lakhs',
  //   footnote: 'in just 10 min',
  //   icon: 'briefcase',
  //   screen: 'BusinessLoan' as const,
  // },
];

const HomeScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [activeTab, setActiveTab] = useState('Home');
  const [name, setName] = useState('Guest User');
  const [activeLoans, setActiveLoans] = useState<any[]>([]);
  const [activeLoading, setActiveLoading] = useState(false);
  const [activeError, setActiveError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const loadUser = async () => {
      try {
        const data: any = await Fetch('user/get-current-user');
        const user = data?.data;
        if (user && isMounted) setName(user.name || 'Guest User');
      } catch {
        // Ignore fetch errors; keep defaults
      }
    };
    const loadNotificationStats = async () => {
      try {
        const data: any = await Fetch('user/notifications-stats');
        const stats = data?.data || data;
        if (isMounted && stats) setUnreadCount(stats.unread || 0);
      } catch {
        if (isMounted) setUnreadCount(0);
      }
    };
    loadUser();
    loadNotificationStats();
    return () => {
      isMounted = false;
    };
  }, [navigation]);

  useEffect(() => {
    const loadActiveLoans = async () => {
      setActiveLoading(true);
      setActiveError(null);
      try {
        const data: any = await Fetch('loan/my', {
          status: 'active',
          limit: 5,
        });
        setActiveLoans(data?.data || data || []);
      } catch (err: any) {
        setActiveLoans([]);
        setActiveError(err?.message || 'Unable to load active loans.');
      } finally {
        setActiveLoading(false);
      }
    };
    loadActiveLoans();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#00BE99" />
      <View style={styles.wrapper}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <Image
              source={require('../../assets/group.png')}
              resizeMode="cover"
              style={styles.heroOrbLeft}
            />
            <Image
              source={require('../../assets/group.png')}
              resizeMode="cover"
              style={styles.heroOrbRight}
            />

            <View style={styles.heroTopRow}>
              <Image
                source={require('../../assets/icon.png')}
                resizeMode="contain"
                style={styles.brandIcon}
              />
              <View style={styles.heroTopIcons}>
                <TouchableOpacity
                  onPress={() => navigation.navigate('NotificationCenter')}
                >
                  <Icon name="bell" size={28} color="#fff" />
                  {unreadCount > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.heroText}>
              <Text style={styles.greeting}>
                <Text style={styles.wave}>👋 </Text>Hi, {name}
              </Text>
              <Text style={styles.heroPrompt}>
                Ready to explore your loan options?
              </Text>
            </View>

            <View style={styles.heroBody}>
              <View style={styles.heroTextBlock}>
                <Text style={styles.heroOfferHighlight}>Summer</Text>
                <Text style={styles.heroOfferTitle}>Cashback Offer</Text>
                <Text style={styles.heroOfferCopy}>
                  Get flat ₹500 off your first EMI Limited time only!
                </Text>
                {/* <TouchableOpacity
                  style={styles.ctaButton}
                  onPress={() => navigation.navigate('ExploreLoans')}
                >
                  <Text style={styles.ctaText}>Apply Now</Text>
                </TouchableOpacity> */}

                    <TouchableOpacity
                  style={styles.ctaButton}
                  onPress={() => navigation.navigate('HomeLoanDocumentsScreen')}
                >
                 <Text style={styles.ctaText}>Apply Home Loan</Text>
                </TouchableOpacity>
              </View>
              <Image
                resizeMode="cover"
                style={styles.heroPerson}
                source={require('../../assets/person.png')}
              />
            </View>
          </View>

          <View style={styles.contentCard}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Active Loans</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('ActiveLoans')}
                style={styles.sectionAction}
              >
                <Text style={styles.sectionActionText}>See all</Text>
              </TouchableOpacity>
            </View>
            {activeLoading && (
              <View style={styles.offerCard}>
                <Text style={styles.offerName}>Loading active loans...</Text>
              </View>
            )}
            {!activeLoading && activeError && (
              <TouchableOpacity
                style={styles.offerCard}
                activeOpacity={0.9}
                onPress={() => navigation.navigate('ActiveLoans')}
              >
                <Text style={styles.offerName}>Active loans unavailable</Text>
                <Text style={styles.offerMeta}>{activeError}</Text>
                <Text style={styles.offerButtonText}>Tap to view all</Text>
              </TouchableOpacity>
            )}
            {!activeLoading && !activeError && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.offerScroll}
              >
                {(activeLoans.length ? activeLoans : [])
                  .slice(0, 3)
                  .map(card => (
                    <TouchableOpacity
                      key={card._id || card.loanId}
                      style={styles.offerCard}
                      activeOpacity={0.9}
                      onPress={() => navigation.navigate('ActiveLoans')}
                    >
                      <View style={styles.offerBadge}>
                        <Text style={styles.offerBadgeText}>
                          {card.status || 'Active'}
                        </Text>
                      </View>
                      <Text style={styles.offerName}>
                        {card.loanId || 'Loan'}
                      </Text>
                      <Text style={styles.offerAmount}>
                        {card.loanDetails?.principalAmount
                          ? `₹${card.loanDetails.principalAmount.toLocaleString(
                              'en-IN',
                            )}`
                          : '—'}
                      </Text>
                      <Text style={styles.offerMeta}>
                        {card.loanDetails?.tenureMonths
                          ? `${card.loanDetails.tenureMonths} mo`
                          : '—'}{' '}
                        ·{' '}
                        {card.loanDetails?.interestRate
                          ? `${card.loanDetails.interestRate}% p.a.`
                          : '—'}
                      </Text>
                      <TouchableOpacity style={styles.offerButton}>
                        <Text style={styles.offerButtonText}>View details</Text>
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))}
                {!activeLoans.length && (
                  <TouchableOpacity
                    style={styles.offerCard}
                    activeOpacity={0.9}
                    onPress={() => navigation.navigate('ExploreLoans')}
                  >
                    <View style={styles.offerBadge}>
                      <Text style={styles.offerBadgeText}>No active</Text>
                    </View>
                    <Text style={styles.offerName}>No active loans</Text>
                    <Text style={styles.offerMeta}>
                      Explore offers to start your journey.
                    </Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            )}

            {/* <View style={styles.quickActions}>
              <TouchableOpacity
                style={styles.quickBtn}
                onPress={() => navigation.navigate('EMICalculator')}
              >
                <Icon name="calculator" size={20} color="#00BE99" />
                <Text style={styles.quickLabel}>EMI Calc</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickBtn}
                onPress={() => navigation.navigate('CallbackRequest')}
              >
                <Icon name="phone-call" size={20} color="#00BE99" />
                <Text style={styles.quickLabel}>Callback</Text>
              </TouchableOpacity>
            </View> */}
            <View style={styles.loanTypeSection}>
              <View style={styles.loanTypeHeader}>
                <View style={styles.loanTypeHeaderRow}>
                  <View style={styles.loanTypeHeaderIcon}>
                    <FaIcon name="rupee-sign" color="#fff" size={16} />
                  </View>
                  <Text style={styles.loanTypeTitle}>Explore Loan Types</Text>
                </View>
                <Text style={styles.loanTypeHint}>
                  Tap a card to open the detailed form for that category.
                </Text>
              </View>

              <View style={styles.loanTypeGrid}>
                {loanTypes.map(type => (
                  <TouchableOpacity
                    key={type.title}
                    style={[
                      styles.loanTypeCard,
                      !type.enabled && styles.loanTypeCardDisabled,
                    ]}
                    disabled={!type.enabled}
                    onPress={() => {
                      if (type.enabled) navigation.navigate(type.screen);
                    }}
                    activeOpacity={type.enabled ? 0.9 : 1}
                  >
                    <View
                      style={[
                        styles.loanTypeBadge,
                        !type.enabled && styles.loanTypeBadgeDisabled,
                      ]}
                    >
                      <Icon
                        name={type.icon}
                        size={18}
                        color={type.enabled ? '#fff' : '#EAECF0'}
                      />
                    </View>
                    <Text
                      style={[
                        styles.loanTypeCardTitle,
                        !type.enabled && styles.loanTypeCardTitleDisabled,
                      ]}
                    >
                      {type.title}
                    </Text>
                    <Text
                      style={[
                        styles.loanTypeCardSubtitle,
                        !type.enabled && styles.loanTypeCardSubtitleDisabled,
                      ]}
                    >
                      {type.subtitle}
                    </Text>
                    <Text
                      style={[
                        styles.loanTypeCardFoot,
                        !type.enabled && styles.loanTypeCardFootDisabled,
                      ]}
                    >
                      {type.enabled ? type.footnote : 'Coming soon'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.visualRow}>
              {/* <Image
                source={require('../../assets/emi.png')}
                style={styles.visualImage}
                resizeMode="cover"
              /> */}

              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.calcWrapper}
                onPress={() => navigation.navigate('EMICalculator')}
              >
                <Image
                  source={require('../../assets/calculator.png')}
                  style={styles.visualImage2}
                  resizeMode="cover"
                />
                <Image
                  resizeMode="cover"
                  style={styles.calcOverlay}
                  source={require('../../assets/calculate.png')}
                />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        <View style={styles.tabBar}>
          {tabItems.map(item => (
            <TouchableOpacity
              key={item.label}
              style={styles.tabItem}
              onPress={() => {
                setActiveTab('Home');
                navigation.navigate(item.screen);
              }}
            >
              <View
                style={[
                  styles.tabIconWrapper,
                  activeTab === item.screen && styles.tabIconActive,
                ]}
              >
                <Icon
                  size={18}
                  name={item.icon}
                  color={activeTab === item.screen ? '#fff' : '#0F172A'}
                />
              </View>
              <Text style={styles.tabLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#00BE99',
  },
  wrapper: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  heroText: {
    marginTop: 16,
  },
  scrollContent: {
    backgroundColor: '#fff',
  },
  hero: {
    backgroundColor: '#00BE99',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandIcon: {
    width: 36,
    height: 36,
  },
  heroTopIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bellIcon: {
    width: 26,
    height: 26,
  },
  heroBody: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  heroTextBlock: {
    flex: 1,
    paddingBottom: 8,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },
  wave: {
    fontSize: 22,
  },
  heroPrompt: {
    marginTop: 6,
    color: '#EAF7F4',
  },
  heroOfferHighlight: {
    fontSize: 28,
    color: '#FBBF24',
    fontWeight: '700',
  },
  heroOfferTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '600',
  },
  heroOfferCopy: {
    marginTop: 10,
    color: '#EAF7F4',
    lineHeight: 20,
  },
ctaButton: {
  borderRadius: 26,
  marginVertical: 18,
  paddingVertical: 12,
  paddingHorizontal: 20,
  minWidth: 170,
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#FBBF24',
},

ctaText: {
  fontSize: 14,
  color: '#fff',
  fontWeight: '800',
  textAlign: 'center',
},
  heroPerson: {
    width: 200,
    height: 240,
    marginRight: -20,
  },
  heroOrbLeft: {
    position: 'absolute',
    top: -40,
    left: -60,
    width: 240,
    height: 240,
  },
  heroOrbRight: {
    right: -80,
    width: 240,
    bottom: -40,
    height: 240,
    position: 'absolute',
    transform: [{ rotate: '180deg' }],
  },
  contentCard: {
    paddingTop: 16,
    marginTop: -18,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  loanTypeSection: {
    marginTop: 4,
  },
  sectionHeaderRow: {
    marginTop: 6,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontWeight: '800',
    fontSize: 18,
    color: '#0F172A',
  },
  sectionAction: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  sectionActionText: {
    color: '#00BE99',
    fontWeight: '700',
  },
  offerScroll: {
    paddingBottom: 20,
  },
  offerCard: {
    padding: 14,
    width: '100%',
    borderWidth: 1,
    marginRight: 12,
    borderRadius: 16,
    borderColor: '#E6F5F0',
    backgroundColor: '#F8FFFD',
  },
  offerBadge: {
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 10,
    alignSelf: 'flex-start',
    backgroundColor: '#E0F2F1',
  },
  offerBadgeText: {
    color: '#0F9F75',
    fontWeight: '700',
    fontSize: 11,
  },
  offerName: {
    marginTop: 10,
    color: '#0F172A',
    fontWeight: '700',
    fontSize: 16,
  },
  offerAmount: {
    marginTop: 4,
    color: '#0F172A',
    fontWeight: '800',
    fontSize: 18,
  },
  offerMeta: {
    marginTop: 4,
    color: '#64748B',
    fontSize: 12,
  },
  offerButton: {
    marginTop: 10,
    backgroundColor: '#00BE99',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  offerButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  loanTypeHeader: {
    marginBottom: 10,
  },
  loanTypeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loanTypeHeaderIcon: {
    width: 28,
    height: 28,
    marginRight: 8,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F9F75',
  },
  loanTypeTitle: {
    fontWeight: '700',
    color: '#0F172A',
    fontSize: 18,
  },
  loanTypeHint: {
    marginTop: 2,
    fontSize: 12,
    color: '#667085',
  },
  loanTypeGrid: {
    marginTop: 10,
    flexWrap: 'wrap',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  loanTypeCard: {
    padding: 16,
    marginTop: 12,
    width: '48.5%',
    borderWidth: 1,
    borderRadius: 20,
    marginBottom: 20,
    borderColor: '#E6E9EE',
    backgroundColor: '#fff',
  },
  loanTypeCardDisabled: {
    borderColor: '#D0D5DD',
    backgroundColor: '#F2F4F7',
  },
  loanTypeBadge: {
    top: -22,
    left: 16,
    width: 42,
    height: 42,
    borderRadius: 21,
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F9F75',
  },
  loanTypeBadgeDisabled: {
    backgroundColor: '#98A2B3',
  },
  loanTypeCardTitle: {
    fontSize: 16,
    marginTop: 8,
    color: '#2D3142',
    fontWeight: '700',
  },
  loanTypeCardTitleDisabled: {
    color: '#667085',
  },
  loanTypeCardSubtitle: {
    marginTop: 6,
    fontSize: 13,
    color: '#667085',
    fontWeight: '600',
  },
  loanTypeCardSubtitleDisabled: {
    color: '#98A2B3',
  },
  loanTypeCardFoot: {
    color: '#94A3B8',
    fontSize: 12,
  },
  loanTypeCardFootDisabled: {
    color: '#98A2B3',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  quickBtn: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#F4FDF8',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1F7EE',
  },
  quickLabel: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },
  visualRow: {
    gap: 16,
    marginBottom: 16,
  },
  visualImage: {
    flex: 1,
    height: 220,
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  visualImage2: {
    flex: 1,
    height: 250,
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  calcWrapper: {
    flex: 1,
    position: 'relative',
  },
  calcOverlay: {
    bottom: 55,
    height: 100,
    left: '25%',
    width: '50%',
    position: 'absolute',
  },
  tabBar: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    borderTopWidth: 1,
    paddingVertical: 10,
    flexDirection: 'row',
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderTopColor: '#E5F7F1',
    justifyContent: 'space-between',
  },
  tabItem: {
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#F97316',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  tabIconWrapper: {
    width: 36,
    height: 36,
    marginBottom: 4,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FFFD',
  },
  tabIconActive: {
    backgroundColor: '#00BE99',
  },
  tabLabel: {
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '600',
  },
});

export default HomeScreen;
