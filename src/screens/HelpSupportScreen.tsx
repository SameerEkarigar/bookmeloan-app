import {
  Text,
  View,
  Linking,
  Platform,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { RootStackParamList } from '../navigation/types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<RootStackParamList, 'HelpSupport'>;

const METHODS = [
  {
    label: 'Chat with support',
    detail: 'Live advisor in under 30 sec',
    type: 'chat',
  },
  {
    label: 'Email a specialist',
    detail: 'Expect reply within 2 hrs',
    type: 'email',
  },
  { label: 'Call banking desk', detail: 'Mon-Fri · 9AM-8PM', type: 'call' },
];

const HELP_TIPS = [
  'Keep your application ID handy while chatting.',
  'Track tokens, verifications, and EMIs from Loan Status.',
  'Update documents through the Documents upload flow at anytime.',
];

const openEmail = () => {
  const mailto = 'mailto:support@bookme.loan?subject=Assistance%20Request';
  Linking.openURL(mailto);
};

const openCall = () => {
  const telScheme =
    Platform.OS === 'ios' ? 'telprompt:+911234567890' : 'tel:+911234567890';
  Linking.openURL(telScheme);
};

const HelpSupportScreen = ({ navigation }: Props) => {
  const handleAction = (type: 'chat' | 'email' | 'call') => {
    if (type === 'chat') navigation.navigate('Chat');
    if (type === 'email') openEmail();
    if (type === 'call') openCall();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Help & Support</Text>
        <Text style={styles.subtitle}>
          Our specialists are ready. Select chat, email, or phone depending on
          how fast you need an answer.
        </Text>
        <View style={styles.grid}>
          {METHODS.map(method => (
            <TouchableOpacity
              key={method.label}
              style={styles.card}
              onPress={() =>
                handleAction(method.type as 'chat' | 'email' | 'call')
              }
            >
              <Text style={styles.cardTitle}>{method.label}</Text>
              <Text style={styles.cardSubtitle}>{method.detail}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.illustration}>
          <Text style={styles.illustrationTitle}>Need other help?</Text>
          <Text style={styles.illustrationText}>
            Browse FAQs, Privacy, and Terms screens for policy details, or tap
            Help & Support for urgent escalations.
          </Text>
        </View>
        <View style={styles.tips}>
          {HELP_TIPS.map(tip => (
            <View key={tip} style={styles.tipRow}>
              <View style={styles.tipDot} />
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.primaryButtonText}>Back to Home</Text>
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
  container: {
    padding: 16,
    paddingBottom: 12,
  },
  title: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    color: '#E6FFFA',
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  card: {
    width: '32%',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 8 },
  },
  cardTitle: {
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
    fontSize: 12,
  },
  cardSubtitle: {
    color: '#64748B',
    fontSize: 11,
    lineHeight: 16,
  },
  illustration: {
    marginTop: 20,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
  },
  illustrationTitle: {
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  illustrationText: {
    color: '#64748B',
    lineHeight: 20,
  },
  tips: {
    marginTop: 16,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  tipDot: {
    width: 8,
    height: 8,
    marginTop: 8,
    marginRight: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  tipText: {
    flex: 1,
    color: '#fff',
  },
  primaryButton: {
    marginTop: 16,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#00BE99',
    fontWeight: '700',
    fontSize: 16,
  },
});

export default HelpSupportScreen;
