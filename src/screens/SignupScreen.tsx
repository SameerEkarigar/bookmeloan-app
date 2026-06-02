import { useState } from 'react';
import {
  Alert,
  View,
  Text,
  Platform,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Post } from '../api';
import { RootStackParamList } from '../navigation/types';

import LoginHero from '../components/LoginHero';

type Props = NativeStackScreenProps<RootStackParamList, 'Signup'>;

const SignupScreen = ({ navigation }: Props) => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    mobile: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const isValidEmail = (val: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  const isValidMobile = /^\d{10}$/.test(form.mobile);
  const isNameValid = form.name.trim().length >= 3;
  const isFormValid = isNameValid && isValidEmail(form.email) && isValidMobile;

  const handleSubmit = async () => {
    if (!isFormValid) return;
    setMessage(null);
    setLoading(true);
    try {
      await Post('user', {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: { number: form.mobile },
      });
      setMessage('Account created. You can now login with OTP.');
      navigation.navigate('LoginMobile');
    } catch (error: any) {
      Alert.alert('Sign up failed', error?.message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputs = [
    {
      label: 'Full name',
      key: 'name' as const,
      placeholder: 'Your name',
      keyboardType: 'default' as const,
    },
    {
      label: 'Email',
      key: 'email' as const,
      placeholder: 'example@email.com',
      keyboardType: 'email-address' as const,
    },
    {
      label: 'Mobile number',
      key: 'mobile' as const,
      placeholder: '10 digit mobile',
      keyboardType: 'number-pad' as const,
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.topContainer}>
            <LoginHero />
          </View>

          <View style={styles.formCard}>
            <Text style={styles.header}>Create account</Text>
            <Text style={styles.subtitle}>
              We will send an OTP to verify your mobile/email.
            </Text>

            {inputs.map(input => (
              <View key={input.key} style={styles.inputGroup}>
                <Text style={styles.label}>{input.label}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={input.placeholder}
                  placeholderTextColor="#94A3B8"
                  keyboardType={input.keyboardType}
                  value={form[input.key]}
                  onChangeText={text =>
                    setForm(prev => ({ ...prev, [input.key]: text }))
                  }
                  maxLength={input.key === 'mobile' ? 10 : undefined}
                />
              </View>
            ))}

            {message && <Text style={styles.message}>{message}</Text>}

            <TouchableOpacity
              style={[
                styles.primaryButton,
                (!isFormValid || loading) && styles.primaryButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={loading || !isFormValid}
            >
              <Text style={styles.primaryButtonText}>
                {loading ? 'Creating...' : 'Create account'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate('LoginMobile')}
            >
              <Text style={styles.secondaryText}>
                Already have an account?{' '}
                <Text style={styles.linkText}>Login</Text>
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
    paddingTop: 28,
    paddingHorizontal: 16,
  },
  formCard: {
    flex: 1,
    paddingTop: 32,
    paddingBottom: 36,
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
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    color: '#0F172A',
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1F7EE',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#0F172A',
    backgroundColor: '#F4FDF8',
  },
  primaryButton: {
    backgroundColor: '#00BE99',
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  message: {
    color: '#065F46',
    fontWeight: '600',
    marginBottom: 8,
  },
  secondaryText: {
    textAlign: 'center',
    color: '#475467',
    fontWeight: '600',
    marginTop: 12,
  },
  linkText: {
    color: '#00BE99',
    fontWeight: '700',
  },
});

export default SignupScreen;
