import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Text,
  View,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Fetch, Put } from '../api';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'ContactAddress'>;

const ContactAddressScreen = ({ navigation }: Props) => {
  const [relation, setRelation] = useState('Friend');
  const [form, setForm] = useState({
    name: '',
    relationship: '',
    city: '',
    phone: '',
    state: '',
    street: '',
    pincode: '',
  });
  const [fetching, setFetching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const update = (key: keyof typeof form, value: string) =>
    setForm(prev => ({ ...prev, [key]: value }));

  useEffect(() => {
    const loadUser = async () => {
      setFetching(true);
      try {
        const data: any = await Fetch('user/get-current-user');
        const user = data?.data;
        if (user) {
          setForm(prev => ({
            name: user.emergencyContact?.name || '',
            city: user.addresses?.[0]?.city || prev.city,
            state: user.addresses?.[0]?.state || prev.state,
            street: user.addresses?.[0]?.street || prev.street,
            phone: user.emergencyContact?.phoneNumber || prev.phone,
            pincode: user.addresses?.[0]?.postalCode || prev.pincode,
            relationship:
              user.emergencyContact?.relationship || prev.relationship,
          }));
          setRelation(user.emergencyContact?.relationship || relation);
        }
      } catch (error) {
        // ignore fetch errors; keep defaults
      } finally {
        setFetching(false);
      }
    };
    loadUser();
  }, []);

  const allFilled =
    form.name.trim() &&
    form.relationship.trim() &&
    form.phone.trim() &&
    form.pincode.trim() &&
    form.state.trim() &&
    form.city.trim() &&
    form.street.trim();

  const handleSave = async () => {
    if (!allFilled) {
      setMessage('Please fill all fields before saving.');
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      await Put(
        '/user',
        {
          emergencyContact: {
            name: form.name,
            phoneNumber: form.phone,
            relationship: form.relationship || relation,
          },
          addresses: [
            {
              street: form.street,
              city: form.city,
              state: form.state,
              postalCode: form.pincode,
              country: 'India',
              label: 'home',
              isDefault: true,
            },
          ],
        },
        12000,
        false,
      );
      setMessage('Contact & address updated.');
      navigation.navigate('LoanDetails');
    } catch (error: any) {
      setMessage(error?.message || 'Unable to update details.');
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
            bounces={false}
            style={styles.scroll}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
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
              <Image
                source={require('../../assets/group.png')}
                style={styles.groupImageBottom}
                resizeMode="cover"
              />
              <View style={styles.headerContent}>
                <Text style={styles.headerTitle}>Contact & Address</Text>
                <Text style={styles.headerSubtitle}>
                  Add an emergency contact and your latest address.
                </Text>
              </View>
            </View>

            <View style={styles.card}>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Emergency contact</Text>
                <View style={styles.fieldGroup}>
                  <TextInput
                    value={form.name}
                    placeholder="Contact name"
                    placeholderTextColor="#9CA3AF"
                    style={[styles.input, { marginTop: 12 }]}
                    onChangeText={text => update('name', text)}
                    editable={!fetching && !loading}
                  />
                </View>
                <View style={styles.fieldGroup}>
                  <TextInput
                    value={form.relationship}
                    placeholder="Select relation"
                    placeholderTextColor="#9CA3AF"
                    editable={!fetching && !loading}
                    style={[styles.input, { marginTop: 12 }]}
                    onChangeText={text => update('relationship', text)}
                  />
                </View>
                <View style={styles.fieldGroup}>
                  <TextInput
                    placeholder="+91"
                    value={form.phone}
                    style={styles.input}
                    keyboardType="phone-pad"
                    placeholderTextColor="#9CA3AF"
                    onChangeText={text => update('phone', text)}
                    editable={!fetching && !loading}
                  />
                </View>
              </View>

              <View style={styles.fieldLabelRow}>
                <Text style={styles.fieldLabel}>Address details</Text>
              </View>
              <View style={styles.fieldGroup}>
                <TextInput
                  style={styles.input}
                  placeholder="Pin code"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="number-pad"
                  value={form.pincode}
                  onChangeText={text => update('pincode', text)}
                  editable={!fetching && !loading}
                />
              </View>
              <View style={styles.fieldGroup}>
                <TextInput
                  style={styles.input}
                  placeholder="State"
                  placeholderTextColor="#9CA3AF"
                  value={form.state}
                  onChangeText={text => update('state', text)}
                  editable={!fetching && !loading}
                />
              </View>
              <View style={styles.fieldGroup}>
                <TextInput
                  style={styles.input}
                  placeholder="City"
                  placeholderTextColor="#9CA3AF"
                  value={form.city}
                  onChangeText={text => update('city', text)}
                  editable={!fetching && !loading}
                />
              </View>
              <View style={styles.fieldGroup}>
                <TextInput
                  style={styles.input}
                  placeholder="Street"
                  placeholderTextColor="#9CA3AF"
                  value={form.street}
                  onChangeText={text => update('street', text)}
                  editable={!fetching && !loading}
                />
              </View>
              {message && <Text style={styles.message}>{message}</Text>}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.button}
            onPress={handleSave}
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
  },
  scrollContent: {
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
    height: '100%',
    paddingBottom: 32,
    borderTopEndRadius: 36,
    borderTopLeftRadius: 36,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
  },
  fieldGroup: {
    marginBottom: 14,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    alignItems: 'center',
  },
  fieldLabel: {
    fontWeight: '600',
    color: '#0F172A',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
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
  verify: {
    color: '#00BE99',
    fontWeight: '700',
    fontSize: 12,
  },
  verifyButton: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#00BE99',
    borderRadius: 16,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FFFA',
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

export default ContactAddressScreen;
