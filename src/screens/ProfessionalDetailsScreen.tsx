import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Text,
  View,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Fetch, Put } from '../api';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'ProfessionalDetails'>;

const categories = ['Self-employed', 'Employed', 'Student', 'Other'];

const ProfessionalDetailsScreen = ({ navigation }: Props) => {
  const [selectedCategory, setSelectedCategory] = useState(categories[0]);
  const [form, setForm] = useState({
    income: '',
    address: '',
    company: '',
    industry: '',
  });
  const [fetching, setFetching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadDetails = async () => {
      setFetching(true);
      try {
        const data: any = await Fetch('user/get-current-user', undefined, 8000);
        const user = data?.data;
        console.log(user);
        if (user?.professionalDetails) {
          setSelectedCategory(
            user.professionalDetails.employmentType || categories[0],
          );
          setForm({
            industry: user.professionalDetails.industry || '',
            company: user.professionalDetails.companyName || '',
            income: user.professionalDetails.monthlyIncome || '',
            address: user.professionalDetails.businessAddress || '',
          });
        }
      } catch {
        // ignore
      } finally {
        setFetching(false);
      }
    };
    loadDetails();
  }, []);

  const update = (key: keyof typeof form, value: string) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const allFilled =
    selectedCategory &&
    form.industry.trim() &&
    form.company.trim() &&
    form.income.trim() &&
    form.address.trim();

  const handleSave = async () => {
    if (!allFilled) {
      setMessage('Please fill all fields before continuing.');
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      await Put('/user', {
        professionalDetails: {
          industry: form.industry,
          companyName: form.company,
          monthlyIncome: form.income,
          businessAddress: form.address,
          employmentType: selectedCategory,
        },
      });
      setMessage('Professional details updated.');
      navigation.navigate('BankDetails');
    } catch (error: any) {
      setMessage(error?.message || 'Unable to update professional details.');
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
                <Text style={styles.headerTitle}>Professional Details</Text>
                <Text style={styles.headerSubtitle}>
                  Tell us how you work to tailor your journey and limits.
                </Text>
              </View>
            </View>

            <View style={styles.card}>
              <View style={styles.fieldLabelRow}>
                <Text style={styles.fieldLabel}>Employment type</Text>
                <Icon name="briefcase" size={16} color="#94A3B8" />
              </View>
              {categories.map(category => (
                <TouchableOpacity
                  key={category}
                  style={styles.radioRow}
                  onPress={() => setSelectedCategory(category)}
                >
                  <View
                    style={[
                      styles.radio,
                      selectedCategory === category && styles.radioActive,
                    ]}
                  />
                  <Text style={styles.radioLabel}>{category}</Text>
                </TouchableOpacity>
              ))}

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Industry</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Retail / IT / Manufacturing"
                  placeholderTextColor="#9CA3AF"
                  value={form.industry}
                  onChangeText={text => update('industry', text)}
                  editable={!fetching && !loading}
                />
              </View>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Company / Business name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Registered name as per GST/PAN"
                  placeholderTextColor="#9CA3AF"
                  value={form.company}
                  onChangeText={text => update('company', text)}
                  editable={!fetching && !loading}
                />
              </View>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Monthly income</Text>
                <TextInput
                  style={styles.input}
                  placeholder="₹75,000"
                  keyboardType="numeric"
                  placeholderTextColor="#9CA3AF"
                  value={form.income}
                  onChangeText={text => update('income', text)}
                  editable={!fetching && !loading}
                />
              </View>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>
                  Company / Business address
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Full address with city and state"
                  placeholderTextColor="#9CA3AF"
                  value={form.address}
                  onChangeText={text => update('address', text)}
                  editable={!fetching && !loading}
                />
              </View>
              {message && <Text style={styles.message}>{message}</Text>}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
        <View style={styles.bottomBar}>
          <TouchableOpacity
            onPress={handleSave}
            style={styles.button}
            disabled={!allFilled || loading || fetching}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Continue</Text>
            )}
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
    backgroundColor: '#fff',
  },
  scrollContent: {
    paddingBottom: 50,
    backgroundColor: '#fff',
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
    flex: 1,
    padding: 16,
    height: '100%',
    paddingBottom: 32,
    borderTopEndRadius: 36,
    borderTopLeftRadius: 36,
    backgroundColor: '#fff',
  },
  fieldGroup: {
    marginBottom: 18,
  },
  fieldLabelRow: {
    marginBottom: 6,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  fieldLabel: {
    marginBottom: 6,
    color: '#0F172A',
    fontWeight: '600',
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
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1F7EE',
    marginRight: 12,
  },
  radioActive: {
    borderColor: '#00BE99',
    backgroundColor: '#00BE99',
  },
  radioLabel: {
    color: '#0F172A',
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
    color: '#0F9F75',
    fontWeight: '600',
    marginTop: 6,
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

export default ProfessionalDetailsScreen;
