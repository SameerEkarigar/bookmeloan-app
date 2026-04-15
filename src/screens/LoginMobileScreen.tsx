import { useState } from 'react';
import {
  Text,
  View,
  Platform,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
} from 'react-native';

import LoginHero from '../components/LoginHero';
import { Post } from '../api';
import { RootStackParamList } from '../navigation/types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<RootStackParamList, 'LoginMobile'>;

const LoginMobileScreen = ({ navigation }: Props) => {
  const [mobile, setMobile] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const isMobileValid = /^\d{10}$/.test(mobile);

  const handleChangeMobile = (text: string) => {
    // allow only digits
    const cleaned = text.replace(/\D/g, '');
    setMobile(cleaned);

    if (cleaned.length === 0) {
      setError('');
    } else if (!/^\d{10}$/.test(cleaned)) {
      setError('Please enter a valid 10-digit mobile number');
    } else {
      setError('');
    }
  };

  const handleContinue = () => {
    if (!isMobileValid) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    if (!agreed) {
      setError('Please accept the terms to continue');
      return;
    }
    sendOtp();
  };

  const sendOtp = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const resp: any = await Post('user/send-otp', {
        phone: { number: mobile },
      });
      const code = resp?.otp || resp?.data?.otp;
      setMessage('OTP sent to your mobile.');
      navigation.navigate('LoginOtp', {
        from: 'mobile',
        contact: `+91 ${mobile}`,
        otpHint: code ? `OTP: ${code}` : undefined,
      });
    } catch (err: any) {
      setError(err?.message || 'Unable to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.topContainer}>
            <LoginHero />
          </View>

          <View style={styles.formCard}>
            <View style={styles.inputWrapper}>
              <Text style={styles.formLabel}>+91</Text>
              <TextInput
                value={mobile}
                onChangeText={handleChangeMobile}
                placeholder="Enter Your Mobile Number"
                placeholderTextColor="#9CA3AF" // make placeholder visible
                keyboardType="number-pad"
                maxLength={10}
                style={styles.inputField}
              />
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.termsRow}>
              <TouchableOpacity
                style={[styles.checkbox, agreed && styles.checkboxChecked]}
                onPress={() => setAgreed(prev => !prev)}
              />
              <View style={styles.termsCopy}>
                <Text style={styles.termsText}>
                  I agree to the{' '}
                  <Text style={styles.linkText}>Terms & Conditions</Text> and
                  acknowledge the{' '}
                  <Text style={styles.linkText}>Privacy Policy</Text>.
                </Text>
                <Text style={styles.subtleText}>
                  We use industry‑standard encryption to secure your details.
                  Loan offers are subject to eligibility and verification.
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.primaryButton,
                (!isMobileValid || loading || !agreed) &&
                  styles.primaryButtonDisabled,
              ]}
              disabled={!isMobileValid || loading || !agreed}
              onPress={handleContinue}
            >
              <Text style={styles.primaryButtonText}>
                {loading ? 'Sending...' : 'Continue'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('LoginEmail')}>
              <Text style={styles.secondaryText}>
                Login with <Text style={styles.linkText}>Email</Text>
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.createAccountButton}
              onPress={() => navigation.navigate('Signup')}
            >
              <Text style={styles.createAccountText}>
                New here? <Text style={styles.linkText}>Create an account</Text>
              </Text>
            </TouchableOpacity>
            {message && <Text style={styles.infoText}>{message}</Text>}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#00BE99',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  topContainer: {
    paddingTop: 8,
    paddingHorizontal: 16,
  },
  formCard: {
    flex: 1,
    paddingTop: 24,
    paddingBottom: 20,
    paddingHorizontal: 28,
    backgroundColor: '#fff',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
  },
  inputWrapper: {
    borderWidth: 1,
    marginBottom: 8,
    borderRadius: 16,
    paddingVertical: 8,
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 16,
    borderColor: '#00BE99',
  },
  formLabel: {
    marginRight: 12,
    fontWeight: '600',
    fontSize: 16,
  },
  inputField: {
    flex: 1,
    fontSize: 16,
    color: '#0F172A',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginBottom: 10,
  },
  otpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cellGroup: {
    flexDirection: 'row',
  },
  otpCell: {
    width: 50,
    height: 50,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#00BE99',
    backgroundColor: '#E8FFF6',
    marginRight: 8,
  },
  otpButton: {
    borderRadius: 16,
    backgroundColor: '#00A680',
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  otpButtonDisabled: {
    opacity: 0.4,
  },
  otpButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  termsRow: {
    marginTop: 12,
    marginBottom: 22,
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 1,
    marginRight: 8,
    borderRadius: 5,
    borderColor: '#00BE99',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#00BE99',
  },
  termsText: {
    fontSize: 12,
    color: '#475467',
    fontWeight: '500',
  },
  linkText: {
    color: '#00BE99',
    fontWeight: '700',
  },
  termsCopy: {
    flex: 1,
  },
  subtleText: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
  },
  primaryButton: {
    backgroundColor: '#00BE99',
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryButtonDisabled: {
    opacity: 0.4,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  secondaryText: {
    textAlign: 'center',
    color: '#475467',
    fontWeight: '600',
  },
  infoText: {
    textAlign: 'center',
    marginTop: 10,
    color: '#0F9F75',
    fontWeight: '600',
  },
  createAccountButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  createAccountText: {
    color: '#0F172A',
    fontWeight: '700',
  },
});

export default LoginMobileScreen;
