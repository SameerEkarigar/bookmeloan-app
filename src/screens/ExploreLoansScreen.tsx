import {
  Text,
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RootStackParamList } from '../navigation/types';

type NavigationProp = StackNavigationProp<RootStackParamList>;

const loanTypes = [
  {
    label: 'Personal Loan',
    copy: 'Unsecured funds for travel, wedding, or debt consolidation.',
    badge: 'Fast track',
    icon: 'user-check',
    screen: 'PersonalLoan',
    enabled: false,
  },
  {
    label: 'Home Loan',
    copy: 'Purchase or refinance residential property with competitive rates.',
    badge: 'Property backed',
    icon: 'home',
    screen: 'TrueHomeLoan',
    enabled: true,
  },
  {
    label: 'Vehicle / Asset Loan',
    copy: 'Finance equipment, vehicles, or asset-backed purchases.',
    badge: 'Asset backed',
    icon: 'truck',
    screen: 'HomeLoan',
    enabled: false,
  },
  {
    label: 'Education Loan',
    copy: 'Cover tuition, living, and forex for upcoming intakes.',
    badge: 'Admissions ready',
    icon: 'book-open',
    screen: 'EducationLoan',
    enabled: false,
  },
  // {
  //   label: 'Business Loan',
  //   copy: 'Working capital, expansion, or equipment credit for SMEs.',
  //   badge: 'SME priority',
  //   icon: 'briefcase',
  //   screen: 'BusinessLoan',
  // },
];

const ExploreLoansScreen = () => {
  const navigation = useNavigation<NavigationProp>();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.hero}>
          <View style={styles.heroTextBlock}>
            <Text style={styles.heroTitle}>Explore loan types</Text>
            <Text style={styles.heroSubtitle}>
              Pick a path to continue your application with tailored questions.
            </Text>
          </View>
          <Icon name="layers" size={24} color="#0F172A" />
        </View>

        {loanTypes.map(type => (
          <TouchableOpacity
            key={type.label}
            style={[styles.card, !type.enabled && styles.cardDisabled]}
            activeOpacity={type.enabled ? 0.9 : 1}
            disabled={!type.enabled}
            onPress={() => {
              if (type.enabled) navigation.navigate(type.screen as any);
            }}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.cardIcon, !type.enabled && styles.cardIconDisabled]}>
                <Icon
                  name={type.icon as any}
                  size={18}
                  color={type.enabled ? '#0F172A' : '#98A2B3'}
                />
              </View>
              <View style={styles.cardTitleRow}>
                <Text style={[styles.cardTitle, !type.enabled && styles.cardTitleDisabled]}>
                  {type.label}
                </Text>
                <View style={[styles.badge, !type.enabled && styles.badgeDisabled]}>
                  <Text style={[styles.badgeText, !type.enabled && styles.badgeTextDisabled]}>
                    {type.enabled ? type.badge : 'Coming soon'}
                  </Text>
                </View>
              </View>
            </View>
            <Text style={[styles.cardCopy, !type.enabled && styles.cardCopyDisabled]}>
              {type.copy}
            </Text>
            <View style={styles.cardFooter}>
              <Text style={[styles.linkText, !type.enabled && styles.linkTextDisabled]}>
                {type.enabled ? 'Start now' : 'Unavailable'}
              </Text>
              <Icon
                name="arrow-right"
                size={16}
                color={type.enabled ? '#0F172A' : '#98A2B3'}
              />
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#00BE99' },
  container: { padding: 16, paddingBottom: 20 },
  hero: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 20,
    marginBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  heroTextBlock: { flex: 1, marginRight: 10 },
  heroTitle: { fontSize: 20, fontWeight: '700', color: '#0F172A' },
  heroSubtitle: { marginTop: 6, color: '#64748B', lineHeight: 18 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardDisabled: {
    backgroundColor: '#F2F4F7',
    borderColor: '#D0D5DD',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIconDisabled: {
    backgroundColor: '#EAECF0',
  },
  cardTitleRow: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  cardTitle: { flex: 1, fontWeight: '700', fontSize: 16, color: '#0F172A' },
  cardTitleDisabled: { color: '#667085' },
  badge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeDisabled: {
    backgroundColor: '#E4E7EC',
  },
  badgeText: { color: '#16A34A', fontWeight: '700', fontSize: 12 },
  badgeTextDisabled: { color: '#667085' },
  cardCopy: { color: '#475569', lineHeight: 18, marginBottom: 10 },
  cardCopyDisabled: { color: '#98A2B3' },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 6,
  },
  linkText: { color: '#0F172A', fontWeight: '700' },
  linkTextDisabled: { color: '#98A2B3' },
});

export default ExploreLoansScreen;
