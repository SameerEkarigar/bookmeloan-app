import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Platform,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
} from 'react-native';

import { Post } from '../api';
import { setStorage } from '../utils/storage';
import LoginHero from '../components/LoginHero';
import { RootStackParamList } from '../navigation/types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<RootStackParamList, 'LoginOtp'>;

const LoginOtpScreen = ({ navigation, route }: Props) => {
  const [timer, setTimer] = useState(30);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(6).fill(''));
  const inputsRef = useRef<Array<TextInput | null>>([]);

  const resetTimer = useCallback(() => {
    setTimer(30);
  }, []);

  useEffect(() => {
    if (timer === 0) return;
    const interval = setInterval(() => setTimer(prev => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const contactLabel = route.params?.contact ?? '';
  const isEmailFlow = route.params?.from === 'email';
  const subtitleText = contactLabel
    ? isEmailFlow
      ? `Check ${contactLabel} for your secure code.`
      : `Enter the 6-digit code sent to ${contactLabel}`
    : 'Enter the 6-digit code sent to your device.';

  const handleOtpChange = (value: string, index: number) => {
    const sanitized = value.replace(/\D/g, '').slice(-1);
    const digits = [...otpDigits];
    digits[index] = sanitized;
    setOtpDigits(digits);

    if (sanitized && index < inputsRef.current.length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (
    event: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number,
  ) => {
    if (event.nativeEvent.key !== 'Backspace') return;

    const digits = [...otpDigits];
    if (digits[index]) {
      digits[index] = '';
      setOtpDigits(digits);
      return;
    }

    if (index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const otpValue = otpDigits.join('');
  const isOtpValid = otpValue.length === 6;

  const verifyOtp = async () => {
    if (!isOtpValid) return;
    setLoading(true);
    setMessage(null);
    try {
      const payload: any = { otp: otpValue };
      if (isEmailFlow) {
        payload.email = contactLabel;
      } else {
        payload.phone = { number: contactLabel.replace(/\D/g, '') };
      }
      const response = await Post<{ token?: string }>(
        '/user/verify-otp',
        payload,
      );
      const receivedToken = (response as any)?.data?.token;
      if (receivedToken) await setStorage('token', receivedToken);

      setMessage('Verified. Redirecting...');
      navigation.navigate('Home');
    } catch (error: any) {
      setMessage(error?.message || 'Invalid OTP, please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    if (timer !== 0) return;
    setMessage(null);
    setLoading(true);
    try {
      if (isEmailFlow) {
        await Post('/user/send-otp', { email: contactLabel });
      } else {
        await Post('/user/send-otp', {
          phone: { number: contactLabel.replace(/\D/g, '') },
        });
      }
      resetTimer();
      setMessage('OTP resent.');
    } catch (error: any) {
      setMessage(error?.message || 'Unable to resend OTP.');
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
            <Text style={styles.header}>Verify OTP</Text>
            <Text style={styles.subtitle}>{subtitleText}</Text>
            <View style={styles.otpBoxes}>
              {[0, 1, 2, 3, 4, 5].map(item => (
                <TextInput
                  key={item}
                  ref={ref => {
                    inputsRef.current[item] = ref;
                  }}
                  value={otpDigits[item]}
                  onChangeText={value => handleOtpChange(value, item)}
                  onKeyPress={event => handleOtpKeyPress(event, item)}
                  maxLength={1}
                  placeholder="-"
                  style={styles.otpInput}
                  keyboardType="number-pad"
                  placeholderTextColor="#94A3B8"
                  selectionColor="#0F172A"
                />
              ))}
            </View>
            <View style={styles.row}>
              <Text style={styles.timer}>Resend OTP in {timer}s</Text>
              <TouchableOpacity
                disabled={timer !== 0 || loading}
                onPress={resendOtp}
              >
                <Text style={[styles.resend, timer !== 0 && styles.disabled]}>
                  Resend
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[
                styles.primaryButton,
                (!isOtpValid || loading) && styles.primaryButtonDisabled,
              ]}
              disabled={!isOtpValid || loading}
              onPress={verifyOtp}
            >
              <Text style={styles.primaryButtonText}>Continue</Text>
            </TouchableOpacity>
            {message && <Text style={styles.message}>{message}</Text>}
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
    paddingHorizontal: 28,
    backgroundColor: '#fff',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingTop: 32,
    paddingBottom: 20,
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
  otpBoxes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  otpInput: {
    width: 55,
    height: 55,
    fontSize: 20,
    borderWidth: 1,
    borderRadius: 16,
    fontWeight: '600',
    textAlign: 'center',
    borderColor: '#D1F7EE',
    backgroundColor: '#F4FDF8',
    color: '#0F172A',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  timer: {
    color: '#0F9F75',
    letterSpacing: 1,
  },
  resend: {
    color: '#0F9F75',
    fontWeight: '700',
  },
  disabled: {
    color: '#A7F6E7',
  },
  primaryButton: {
    backgroundColor: '#00BE99',
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  message: {
    marginTop: 12,
    color: '#0F9F75',
    fontWeight: '600',
  },
});

export default LoginOtpScreen;
