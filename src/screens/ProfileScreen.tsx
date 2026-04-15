import {
  Text,
  View,
  Image,
  Modal,
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useCallback, useState } from 'react';
import { Fetch, Delete } from '../api';
import { clearStorage } from '../utils/storage';
import Icon from 'react-native-vector-icons/Feather';
import { RootStackParamList } from '../navigation/types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

const quickLinks = [
  { label: 'EMI Calculator', icon: 'divide-circle', screen: 'EMICalculator' },
];

const profileFlows = [
  {
    label: 'Professional Details',
    screen: 'ProfessionalDetails',
    icon: 'briefcase',
  },
  { label: 'Bank Details', screen: 'BankDetails', icon: 'credit-card' },
  { label: 'KYC & Verification', screen: 'KycVerification', icon: 'shield' },
  { label: 'Contact & Address', screen: 'ContactAddress', icon: 'map-pin' },
  {
    label: 'Upload Documents',
    screen: 'UploadDocuments',
    icon: 'upload-cloud',
  },
];

const sections = [
  {
    title: 'Account Controls',
    subtitle: 'Keep your profile current and configure notifications.',
    items: [
      { label: 'Edit Profile', screen: 'EditProfile', icon: 'edit-3' },
      { label: 'Settings', screen: 'Settings', icon: 'settings' },
      { label: 'Notifications', screen: 'NotificationCenter', icon: 'bell' },
    ],
  },
  {
    title: 'Loan & Support',
    subtitle: 'Track offers, documents, and assistance.',
    items: [
      { label: 'My Requests', screen: 'LoanRequests', icon: 'list' },
      { label: 'Loan Offers', screen: 'LoanOffers', icon: 'credit-card' },
      { label: 'Loan Status', screen: 'LoanStatus', icon: 'bar-chart-2' },
      { label: 'Help & Support', screen: 'HelpSupport', icon: 'headphones' },
    ],
  },
  {
    title: 'Know & Comply',
    subtitle: 'Understand policies and FAQs.',
    items: [
      { label: 'FAQs', screen: 'Faqs', icon: 'help-circle' },
      { label: 'Privacy Policy', screen: 'PrivacyPolicy', icon: 'shield' },
      {
        label: 'Terms & Conditions',
        screen: 'TermsConditions',
        icon: 'file-text',
      },
    ],
  },
];

const withImageVersion = (
  imageUrl: string | null,
  version: string | null,
): string | null => {
  if (!imageUrl) return null;
  if (!version) return imageUrl;
  const separator = imageUrl.includes('?') ? '&' : '?';
  return `${imageUrl}${separator}v=${encodeURIComponent(version)}`;
};

const ProfileScreen = ({ navigation }: Props) => {
  const [modalAction, setModalAction] = useState<'logout' | 'delete' | null>(
    null,
  );
  const [_loading, setLoading] = useState(false);
  const [name, setName] = useState('Guest User');
  const [email, setEmail] = useState('example@gmail.com');
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [profilePictureVersion, setProfilePictureVersion] = useState<
    string | null
  >(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const loadUser = async () => {
        setLoading(true);
        try {
          const data: any = await Fetch('user/get-current-user');
          const user = data?.data || data;
          if (active && user) {
            const imageUrl =
              typeof user.profilePicture === 'string'
                ? user.profilePicture
                : typeof user.profilePictureUrl === 'string'
                ? user.profilePictureUrl
                : null;
            setName(user.name || user.fullName || 'Guest User');
            setEmail(user.email || 'example@gmail.com');
            setProfilePicture(imageUrl);
            setProfilePictureVersion(String(user.updatedAt || Date.now()));
          }
        } catch {
          // ignore fetch errors; keep defaults
        } finally {
          if (active) setLoading(false);
        }
      };
      loadUser();
      return () => {
        active = false;
      };
    }, []),
  );

  const avatarUri = withImageVersion(profilePicture, profilePictureVersion);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.hero}>
          <Image
            source={
              avatarUri
                ? { uri: avatarUri }
                : require('../../assets/person.png')
            }
            style={styles.avatar}
          />
          <TouchableOpacity
            onPress={() => navigation.navigate('EditProfile')}
            activeOpacity={0.7}
          >
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.email}>{email}</Text>
          </TouchableOpacity>
          {/* <View style={styles.statsRow}>
            <View>
              <Text style={styles.statsLabel}>Tier</Text>
              <Text style={styles.statsValue}>Gold</Text>
            </View>
            <View>
              <Text style={styles.statsLabel}>Loans</Text>
              <Text style={styles.statsValue}>4 Active</Text>
            </View>
            <View>
              <Text style={styles.statsLabel}>Rating</Text>
              <Text style={styles.statsValue}>4.9/5</Text>
            </View>
          </View> */}
        </View>
        <View style={styles.quickLinksSection}>
          {quickLinks.map(link => (
            <TouchableOpacity
              key={link.label}
              style={styles.quickLink}
              onPress={() => navigation.navigate(link.screen as any)}
            >
              <View style={styles.quickLinkIcon}>
                <Icon name={link.icon} size={20} color="#00BE99" />
              </View>
              <Text style={styles.quickLinkText}>{link.label}</Text>
              <Icon name="chevron-right" size={20} color="#00BE99" />
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.profileFlowsCard}>
          <Text style={styles.sectionHeader}>Complete your profile</Text>
          <Text style={styles.sectionSubheader}>
            Jump back into any section to edit or update details.
          </Text>
          {profileFlows.map(flow => (
            <TouchableOpacity
              key={flow.label}
              style={styles.flowRow}
              onPress={() => navigation.navigate(flow.screen as any)}
            >
              <View style={styles.flowIcon}>
                <Icon name={flow.icon} size={16} color="#00BE99" />
              </View>
              <View style={styles.flowTextBlock}>
                <Text style={styles.flowLabel}>{flow.label}</Text>
                <Text style={styles.flowHint}>Tap to review or update</Text>
              </View>
              <Icon name="chevron-right" size={18} color="#94A3B8" />
            </TouchableOpacity>
          ))}
        </View>
        {sections.map(section => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionSubtitle}>{section.subtitle}</Text>
            <View style={styles.card}>
              {section.items.map(item => (
                <TouchableOpacity
                  key={item.label}
                  style={styles.menuRow}
                  onPress={() => navigation.navigate(item.screen as any)}
                >
                  <View style={styles.iconCircle}>
                    <Icon name={item.icon} size={18} color="#0F172A" />
                  </View>
                  <Text style={styles.menuText}>{item.label}</Text>
                  <Icon name="chevron-right" size={20} color="#94A3B8" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
        <View style={styles.footerActions}>
          <TouchableOpacity
            style={styles.footerButton}
            onPress={() => setModalAction('logout')}
          >
            <Icon name="log-out" size={18} color="#0FBE99" />
            <Text style={[styles.footerButtonText, styles.logoutText]}>
              Logout
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.footerButton, styles.deleteButton]}
            onPress={() => setModalAction('delete')}
          >
            <Icon name="trash-2" size={18} color="#fff" />
            <Text style={[styles.footerButtonText, styles.deleteButtonText]}>
              Delete My Account
            </Text>
          </TouchableOpacity>
        </View>
        <ConfirmModal
          action={modalAction}
          visible={!!modalAction}
          navigation={navigation}
          onClose={() => setModalAction(null)}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const ConfirmModal = ({
  visible,
  action,
  onClose,
  navigation,
}: {
  visible: boolean;
  action: 'logout' | 'delete' | null;
  onClose: () => void;
  navigation: Props['navigation'];
}) => {
  if (!action) return null;
  const title = action === 'logout' ? 'Logout' : 'Delete Account';
  const message =
    action === 'logout'
      ? 'You will be quietly logged out. Continue?'
      : 'This permanently removes your account and data. Continue?';
  const perform = async () => {
    if (action === 'logout') {
      await clearStorage();
      onClose();
      navigation.reset({
        index: 0,
        routes: [{ name: 'LoginMobile' as keyof RootStackParamList }],
      });
      return true;
    }
    // delete account
    try {
      await Delete('user/me');
      await clearStorage();
      onClose();
      navigation.reset({
        index: 0,
        routes: [{ name: 'LoginMobile' as keyof RootStackParamList }],
      });
    } catch (error: any) {
      onClose();
      Alert.alert(
        'Delete failed',
        error?.message || 'Unable to delete account.',
      );
    }
    return false;
  };

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Icon
            name={action === 'logout' ? 'log-out' : 'trash-2'}
            size={28}
            color="#0F172A"
          />
          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={styles.modalMessage}>{message}</Text>
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.modalCancel} onPress={onClose}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modalConfirm,
                action === 'delete' && styles.modalDelete,
              ]}
              onPress={perform}
            >
              <Text style={styles.modalConfirmText}>{title}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
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
  hero: {
    padding: 12,
    borderRadius: 28,
    marginBottom: 16,
    alignItems: 'center',
    backgroundColor: '#00BE99',
  },
  quickLinksSection: {
    marginBottom: 20,
  },
  quickLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#00BE99',
    borderRadius: 28,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  quickLinkIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#00BE99',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  quickLinkText: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#0B3F49',
  },
  profileFlowsCard: {
    padding: 16,
    borderRadius: 24,
    marginBottom: 20,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionSubheader: {
    marginTop: 4,
    color: '#64748B',
  },
  flowRow: {
    marginTop: 12,
    padding: 12,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FFFD',
    borderWidth: 1,
    borderColor: '#E6F5F0',
  },
  flowIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E0F2F1',
    marginRight: 12,
  },
  flowTextBlock: {
    flex: 1,
  },
  flowLabel: {
    color: '#0F172A',
    fontWeight: '700',
  },
  flowHint: {
    color: '#94A3B8',
    fontSize: 12,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginBottom: 12,
    borderWidth: 3,
    borderColor: '#fff',
  },
  name: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  email: {
    color: '#E6FFFA',
    marginBottom: 12,
  },
  statsRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  statsLabel: {
    color: '#E6FFFA',
    fontSize: 12,
  },
  statsValue: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  sectionSubtitle: {
    color: '#E6FFFA',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5F7F1',
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: '#EFF9F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuText: {
    flex: 1,
    fontWeight: '600',
    color: '#0F172A',
  },
  footerActions: {
    marginTop: 20,
    gap: 12,
  },
  footerButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5F7F1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    gap: 8,
  },
  footerButtonText: {
    color: '#00BE99',
    fontWeight: '700',
  },
  logoutText: {
    color: '#0FBE99',
  },
  deleteButtonText: {
    color: '#fff',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginVertical: 12,
  },
  modalMessage: {
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  modalCancel: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modalCancelText: {
    color: '#0F172A',
    fontWeight: '600',
  },
  modalConfirm: {
    backgroundColor: '#00BE99',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modalDelete: {
    backgroundColor: '#EF4444',
  },
  modalConfirmText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default ProfileScreen;
