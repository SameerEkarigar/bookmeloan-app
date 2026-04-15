import { useEffect, useState } from 'react';
import {
  Platform,
  Text,
  View,
  Image,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
} from 'react-native';
import { Fetch, Patch, Post } from '../api';
import Icon from 'react-native-vector-icons/Feather';
import { RootStackParamList } from '../navigation/types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<RootStackParamList, 'BankDetails'>;

type BankAccount = {
  _id?: string;
  ifscCode?: string;
  bankName?: string;
  branchName?: string;
  accountNumber?: string;
  accountHolderName?: string;
  isDefault?: boolean;
};

const BankDetailsScreen = ({ navigation }: Props) => {
  const [form, setForm] = useState({
    ifsc: '',
    bankName: '',
    branchName: '',
    accountNumber: '',
    accountHolderName: '',
  });
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadBankDetails = async () => {
      setFetching(true);
      try {
        const [accountsResp, userResp]: [any, any] = await Promise.all([
          Fetch('user/bank-accounts', undefined, 8000),
          Fetch('user/get-current-user', undefined, 8000),
        ]);
        const list = (accountsResp?.data || []) as BankAccount[];
        setAccounts(list);
        if (list.length > 0) {
          const primary = list.find(b => b.isDefault) || list[0];
          setForm({
            ifsc: primary.ifscCode || '',
            bankName: primary.bankName || '',
            branchName: primary.branchName || '',
            accountNumber: primary.accountNumber || '',
            accountHolderName:
              primary.accountHolderName || userResp?.data?.name || '',
          });
        } else if (userResp?.data?.name) {
          setForm(prev => ({
            ...prev,
            accountHolderName: prev.accountHolderName || userResp.data.name,
          }));
        }
      } catch {
        // ignore and keep defaults
      } finally {
        setFetching(false);
      }
    };
    loadBankDetails();
  }, []);

  const shortcuts = [
    {
      label: 'Account holder name',
      placeholder: 'Full name',
      key: 'accountHolderName' as const,
    },
    {
      label: 'Bank Name',
      placeholder: 'Select bank',
      key: 'bankName' as const,
    },
    {
      label: 'Branch Name',
      placeholder: 'Enter branch name',
      key: 'branchName' as const,
    },
    {
      label: 'Account Number',
      placeholder: 'Enter account number',
      key: 'accountNumber' as const,
    },
    {
      label: 'IFSC Code',
      placeholder: 'Enter IFSC code',
      key: 'ifsc' as const,
    },
  ];

  const handleChange = (key: keyof typeof form, value: string) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const allFilled =
    form.accountHolderName.trim() &&
    form.bankName.trim() &&
    form.branchName.trim() &&
    form.accountNumber.trim() &&
    form.ifsc.trim();

  const handleSave = async () => {
    if (!allFilled) {
      setMessage('Please fill all fields before saving.');
      return;
    }

    const payload = {
      accountHolderName: form.accountHolderName.trim(),
      bankName: form.bankName.trim(),
      branchName: form.branchName.trim(),
      accountNumber: form.accountNumber.trim(),
      ifscCode: form.ifsc.trim().toUpperCase(),
      isDefault: true,
    };

    setLoading(true);
    setMessage(null);
    try {
      const existing = accounts.find(
        account => account.accountNumber === payload.accountNumber,
      );

      if (existing?._id) {
        if (!existing.isDefault) {
          await Patch(
            `user/bank-accounts/set-accountIsDefault/${existing._id}`,
            {},
            12000,
            false,
          );
        }
        setMessage('Bank account already linked and set as primary.');
        navigation.navigate('Home');
        return;
      }

      const response: any = await Post('user/bank-accounts', payload, 12000);
      const created = response?.data || response;
      if (created?._id) {
        setAccounts(prev => [...prev, created]);
      }
      setMessage('Bank account linked successfully.');
      navigation.navigate('Home');
    } catch (error: any) {
      setMessage(error?.message || 'Unable to update bank details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.root}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <View style={styles.header}>
              <Image
                source={require('../../assets/group.png')}
                style={styles.groupImage}
                resizeMode="cover"
              />
              <Image
                source={require('../../assets/icon.png')}
                style={styles.headerIcon}
                resizeMode="contain"
              />
              <View style={styles.headerContent}>
                <Text style={styles.headerTitle}>Bank Account</Text>
                <Text style={styles.headerSubtitle}>
                  Securely link your bank so we can verify repayments instantly.
                </Text>
              </View>
            </View>

            <View style={styles.card}>
              {shortcuts.map(entry => (
                <View key={entry.label} style={styles.fieldGroup}>
                  <View style={styles.fieldLabelRow}>
                    <Text style={styles.fieldLabel}>{entry.label}</Text>
                    <Icon name="info" size={16} color="#94A3B8" />
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder={entry.placeholder}
                    placeholderTextColor="#9CA3AF"
                    value={form[entry.key]}
                    editable={!fetching && !loading}
                    onChangeText={text => handleChange(entry.key, text)}
                  />
                </View>
              ))}

              {/* <TouchableOpacity
              style={styles.verifyButton}
              onPress={handleSave}
              disabled={loading || fetching}
            >
              {loading ? (
                <ActivityIndicator color="#00BE99" />
              ) : (
                <Text style={styles.verifyText}>Verify</Text>
              )}
            </TouchableOpacity> */}
              {message && <Text style={styles.message}>{message}</Text>}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.button}
            onPress={handleSave}
            disabled={loading || fetching}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Saving...' : 'Continue'}
            </Text>
          </TouchableOpacity>
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
  root: {
    flex: 1,
    backgroundColor: '#00BE99',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    minHeight: '100%',
    paddingBottom: 50,
  },
  header: {
    height: 200,
    paddingTop: 32,
    paddingBottom: 24,
    paddingHorizontal: 16,
    justifyContent: 'flex-end',
    backgroundColor: '#00BE99',
  },
  groupImage: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 140,
    height: 140,
    zIndex: 10,
  },
  groupImageBottom: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 120,
    height: 120,
    zIndex: 10,
  },
  headerIcon: {
    position: 'absolute',
    top: 16,
    right: 24,
    width: 44,
    height: 44,
    zIndex: 12,
  },
  headerContent: {
    paddingTop: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  headerSubtitle: {
    marginTop: 8,
    color: '#E6FFFA',
    fontSize: 14,
    lineHeight: 20,
  },
  card: {
    padding: 16,
    height: '150%',
    paddingBottom: 32,
    borderTopEndRadius: 36,
    borderTopLeftRadius: 36,
    backgroundColor: '#fff',
  },
  fieldGroup: {
    marginBottom: 18,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  fieldLabel: {
    fontWeight: '600',
    color: '#0F172A',
  },
  input: {
    height: 48,
    fontSize: 16,
    borderWidth: 1,
    color: '#0F172A',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderColor: '#D1F7EE',
    backgroundColor: '#F4FDF8',
  },
  verifyButton: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#00BE99',
    borderRadius: 16,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyText: {
    color: '#00BE99',
    fontWeight: '700',
  },
  message: {
    marginTop: 8,
    color: '#0F9F75',
    fontWeight: '600',
  },
  button: {
    marginTop: 0,
    borderRadius: 16,
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: '#00BE99',
    width: '100%',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  bottomBar: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: '#fff',
  },
});

export default BankDetailsScreen;
