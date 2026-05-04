import { useState } from 'react';
import {
  Text,
  View,
  Platform,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
} from 'react-native';

import LoginHero from '../components/LoginHero';
import { Post } from '../api';
import { RootStackParamList } from '../navigation/types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<RootStackParamList, 'LoginEmail'>;

const LoginEmailScreen = ({ navigation }: Props) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const handleContinue = async () => {
    if (!isValidEmail || !agreed) return;
    setLoading(true);
    setMessage(null);
    try {
      const resp: any = await Post('user/send-otp', { email: email.trim() });
      const code = resp?.otp || resp?.data?.otp;
      console.log("OTP:", code);
      setMessage('OTP sent to your email.');
      navigation.navigate('LoginOtp', {
        from: 'email',
        contact: email.trim(),
        otpHint: code ? `OTP: ${code}` : undefined,
      });
    } catch (error: any) {
      setMessage(error?.message || 'Unable to send OTP.');
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
            <Text style={styles.header}>Login with Email</Text>
            <Text style={styles.subtitle}>
              Enter your email to receive a secure login link.
            </Text>
            <TextInput
              style={[styles.input, styles.inputSpacing]}
              placeholder="example@email.com"
              placeholderTextColor="#94A3B8"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
            <View style={styles.termsRow}>
              <TouchableOpacity
                style={[styles.checkbox, agreed && styles.checkboxChecked]}
                onPress={() => setAgreed(prev => !prev)}
              />
              <Text style={styles.termsText}>
                Accept <Text style={styles.linkText}>Terms & Conditions</Text>{' '}
                and <Text style={styles.linkText}>Privacy Policy</Text> to
                proceed.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleContinue}
              disabled={!isValidEmail || loading || !agreed}
            >
              <Text style={styles.primaryButtonText}>
                {loading ? 'Sending...' : 'Continue'}
              </Text>
            </TouchableOpacity>
            {message && <Text style={styles.infoText}>{message}</Text>}
            <TouchableOpacity
              style={styles.signupButton}
              onPress={() => navigation.navigate('Signup')}
            >
              <Text style={styles.signupText}>
                New here? <Text style={styles.linkText}>Create an account</Text>
              </Text>
            </TouchableOpacity>
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
    paddingTop: 32,
    paddingBottom: 20,
    paddingHorizontal: 28,
    backgroundColor: '#fff',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
  },
  header: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0B3F49',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#475467',
    marginBottom: 18,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1F7EE',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
    fontSize: 16,
    color: '#0F172A',
    backgroundColor: '#F4FDF8',
  },
  inputSpacing: {
    marginBottom: 16,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 18,
  },
  otpCell: {
    width: 56,
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D1F7EE',
    backgroundColor: '#F4FDF8',
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1,
    borderColor: '#00BE99',
    borderRadius: 5,
    marginRight: 8,
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
  primaryButton: {
    backgroundColor: '#00BE99',
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  infoText: {
    marginTop: 10,
    color: '#0F9F75',
    fontWeight: '600',
  },
  signupButton: {
    marginTop: 12,
    alignItems: 'center',
  },
  signupText: {
    color: '#0F172A',
    fontWeight: '700',
  },
});

export default LoginEmailScreen;
