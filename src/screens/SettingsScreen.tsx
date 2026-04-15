import {
  Text,
  View,
  Image,
  Switch,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { BASE_URL, Fetch, Put } from '../api';
import { useCallback, useState } from 'react';
import Icon from 'react-native-vector-icons/Feather';
import { RootStackParamList } from '../navigation/types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

const withImageVersion = (
  imageUrl: string | null,
  version: string | null,
): string | null => {
  if (!imageUrl) return null;
  if (!version) return imageUrl;
  const separator = imageUrl.includes('?') ? '&' : '?';
  return `${imageUrl}${separator}v=${encodeURIComponent(version)}`;
};

const resolveProfileImageUrl = (user: any): string | null => {
  const candidates = [
    user?.profilePicture,
    user?.profilePictureUrl,
    user?.profilePicture?.url,
    user?.profilePicture?.location,
    user?.profile?.profilePicture,
    user?.profile?.profilePictureUrl,
  ];

  const picked = candidates.find(
    value => typeof value === 'string' && value.trim().length > 0,
  ) as string | undefined;

  if (!picked) return null;
  const normalized = picked.trim();
  if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
    return normalized;
  }

  const base = String(BASE_URL || '').replace(/\/$/, '');
  if (!base) return normalized;
  const path = normalized.startsWith('/') ? normalized : `/${normalized}`;
  return `${base}${path}`;
};

const SettingsScreen = ({ navigation }: Props) => {
  const [toggles, setToggles] = useState({
    sms: true,
    push: true,
    email: true,
  });
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
      const loadPrefs = async () => {
        try {
          const response: any = await Fetch('user/get-current-user');
          const user = response?.data || response;
          const prefs = user?.notificationPreferences;
          if (!active || !user) return;
          if (prefs) {
            setToggles({
              sms: !!prefs.sms,
              push: !!prefs.push,
              email: !!prefs.email,
            });
          }
          setName(user.name || user.fullName || 'Guest User');
          setEmail(user.email || 'example@gmail.com');
          console.log(user);
          const imageUrl = resolveProfileImageUrl(user);
          setProfilePicture(imageUrl);
          setProfilePictureVersion(String(user.updatedAt || Date.now()));
        } catch {
          // ignore fetch errors; keep defaults
        }
      };
      loadPrefs();
      return () => {
        active = false;
      };
    }, []),
  );

  const avatarUri = withImageVersion(profilePicture, profilePictureVersion);

  const updateServer = async (next: typeof toggles) => {
    setLoading(true);
    try {
      await Put('user', { notificationPreferences: next });
    } catch {
      // ignore errors to avoid blocking UI
    } finally {
      setLoading(false);
    }
  };

  const toggleValue = (key: keyof typeof toggles) => {
    const next = { ...toggles, [key]: !toggles[key] };
    setToggles(next);
    updateServer(next);
  };

  console.log('skjjkdjk', avatarUri);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.profileHero}>
          <Image
            source={
              avatarUri
                ? { uri: avatarUri }
                : require('../../assets/person.png')
            }
            style={styles.avatar}
          />
          <View style={styles.profileTextBlock}>
            <Text style={styles.profileName}>{name}</Text>
            <Text style={styles.profileEmail}>{email}</Text>
          </View>
        </View>
        <Text style={styles.header}>Settings</Text>
        <Text style={styles.description}>
          Control alerts, personalize your experience, and keep your data
          secure. Everything is synced across devices instantly.
        </Text>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Icon name="bell" size={18} color="#00BE99" />
            <Text style={styles.sectionTitle}>Notifications & Alerts</Text>
          </View>
          <Text style={styles.sectionSub}>
            Manage push, email, and SMS alerts synced with your profile.
          </Text>
          <View style={styles.row}>
            <Text style={styles.rowText}>Push notifications</Text>
            <Switch
              value={toggles.push}
              onValueChange={() => toggleValue('push')}
              trackColor={{ false: '#E5F7F1', true: '#22C55E' }}
              thumbColor="#fff"
            />
          </View>
          <View style={styles.row}>
            <Text style={styles.rowText}>Email alerts</Text>
            <Switch
              value={toggles.email}
              onValueChange={() => toggleValue('email')}
              trackColor={{ false: '#E5F7F1', true: '#22C55E' }}
              thumbColor="#fff"
            />
          </View>
          <View style={styles.row}>
            <Text style={styles.rowText}>SMS messages</Text>
            <Switch
              value={toggles.sms}
              onValueChange={() => toggleValue('sms')}
              trackColor={{ false: '#E5F7F1', true: '#22C55E' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Quick Access</Text>
          <Text style={styles.sectionSub}>Open relevant spaces instantly.</Text>
          {[
            {
              label: 'Notifications',
              icon: 'bell',
              screen: 'NotificationCenter',
            },
            {
              label: 'Terms & Conditions',
              icon: 'file-text',
              screen: 'TermsConditions',
            },
            {
              label: 'Privacy Policy',
              icon: 'shield',
              screen: 'PrivacyPolicy',
            },
            {
              label: 'Help & Support',
              icon: 'help-circle',
              screen: 'HelpSupport',
            },
          ].map(item => (
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

        <TouchableOpacity
          style={styles.bottomButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.bottomText}>Back to Profile</Text>
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
    paddingBottom: 16,
  },
  profileHero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: '#fff',
  },
  profileTextBlock: {
    flex: 1,
  },
  profileName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  profileEmail: {
    color: '#E6FFFA',
    marginTop: 2,
    fontSize: 13,
  },
  header: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  description: {
    color: '#E6FFFA',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionSub: {
    color: '#64748B',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  rowText: {
    fontWeight: '600',
    color: '#0F172A',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5F7F1',
  },
  menuText: {
    flex: 1,
    fontWeight: '600',
    color: '#0F172A',
  },
  menuSub: {
    color: '#94A3B8',
    fontSize: 12,
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
  preferenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  bottomButton: {
    marginTop: 10,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5F7F1',
  },
  bottomText: {
    color: '#00BE99',
    fontWeight: '700',
    fontSize: 16,
  },
});

export default SettingsScreen;
