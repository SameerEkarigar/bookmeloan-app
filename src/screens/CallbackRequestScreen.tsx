import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Post } from '../api';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'CallbackRequest'>;

const CallbackRequestScreen = ({ navigation }: Props) => {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const isValid = /^\d{10}$/.test(phone.replace(/\D/g, '')) && name.trim();

  const handleSubmit = async () => {
    if (!isValid) {
      setMessage('Please enter valid name and 10-digit phone.');
      return;
    }
    setLoading(true);
    try {
      await Post('/user/request-callback', {
        name: name.trim(),
        phone: phone.replace(/\D/g, ''),
      });
      setMessage("Callback request sent! We'll call you within 30 mins.");
      setTimeout(() => navigation.goBack(), 2000);
    } catch (error: any) {
      setMessage(error.message || 'Request failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backBtn}
            >
              <Icon name="arrow-left" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.title}>Request Callback</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.subtitle}>
              Enter your details and we'll call you back to discuss loan
              options.
            </Text>
            <View style={styles.field}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                value={name}
                onChangeText={setName}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                placeholder="+91"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
                maxLength={13}
              />
            </View>
            <TouchableOpacity
              style={[
                styles.submitBtn,
                (!isValid || loading) && styles.submitBtnDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!isValid || loading}
            >
              <Text style={styles.submitText}>
                {loading ? 'Sending...' : 'Request Callback Call'}
              </Text>
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
    flexGrow: 1,
    paddingBottom: 50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#00BE99',
  },
  backBtn: {
    padding: 8,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  card: {
    flex: 1,
    marginTop: -20,
    padding: 24,
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  subtitle: {
    fontSize: 16,
    color: '#475467',
    lineHeight: 22,
    marginBottom: 24,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1F7EE',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#F4FDF8',
  },
  submitBtn: {
    backgroundColor: '#00BE99',
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  message: {
    marginTop: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
});

export default CallbackRequestScreen;
