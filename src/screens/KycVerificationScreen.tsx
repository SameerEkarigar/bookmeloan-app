import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { launchCamera } from 'react-native-image-picker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';

import { Fetch, Post } from '../api';
import { RootStackParamList } from '../navigation/types';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = NativeStackScreenProps<RootStackParamList, 'KycVerification'>;

const KycVerificationScreen = ({ navigation }: Props) => {
  const [loading, setLoading] = useState(false);
  const [selfie, setSelfie] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [fetching, setFetching] = useState(false);
  const isCameraOpeningRef = useRef(false);

  useEffect(() => {
    const loadSelfie = async () => {
      setFetching(true);
      try {
        const data: any = await Fetch('/user/get-current-user');
        const existing = data?.data?.kyc?.selfie?.url;
        if (existing) setSelfie(existing);
      } catch {
        // ignore fetch errors
      } finally {
        setFetching(false);
      }
    };
    loadSelfie();
  }, []);

  const pickSelfie = useCallback(async () => {
    if (isCameraOpeningRef.current) return;
    isCameraOpeningRef.current = true;
    setMessage(null);
    try {
      const result = await launchCamera({
        mediaType: 'photo',
        quality: 0.8,
        saveToPhotos: false,
        cameraType: 'front',
      });
      const uri = result.assets?.[0]?.uri;
      if (uri) setSelfie(uri);
    } finally {
      isCameraOpeningRef.current = false;
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      const timer = setTimeout(() => {
        pickSelfie();
      }, 250);

      return () => clearTimeout(timer);
    }, [pickSelfie]),
  );

  const uploadSelfie = async () => {
    if (!selfie) {
      setMessage('Please select a selfie first.');
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      if (selfie.startsWith('http')) {
        setMessage('Selfie already uploaded. Continue to next step.');
      } else {
        const formData = new FormData();
        formData.append('selfie', {
          uri: selfie,
          name: 'selfie.jpg',
          type: 'image/jpeg',
        } as any);
        await Post('/user/upload-selfie', formData, 15000, undefined, false);
        setMessage('Selfie uploaded. Continue to next step.');
      }
      navigation.navigate('ContactAddress');
    } catch (error: any) {
      setMessage(error?.message || 'Unable to upload selfie.');
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
              <View style={styles.headerContent}>
                <Text style={styles.headerTitle}>KYC & Verification</Text>
                <Text style={styles.headerSubtitle}>
                  Verify yourself with a quick selfie and ID check.
                </Text>
              </View>
            </View>

            <View style={styles.card}>
              <View style={styles.fieldLabelRow}>
                <Text style={styles.fieldLabel}>Verify yourself</Text>
                <Icon name="camera" size={16} color="#94A3B8" />
              </View>
              <View style={styles.cameraFrame}>
                {selfie ? (
                  <View style={styles.previewWrapper}>
                    <Image
                      resizeMode="contain"
                      style={styles.preview}
                      source={{ uri: selfie }}
                    />
                    <TouchableOpacity
                      style={styles.retakeBadge}
                      onPress={pickSelfie}
                      activeOpacity={0.8}
                    >
                      <Icon name="refresh-ccw" size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={pickSelfie}
                    activeOpacity={0.8}
                    style={styles.cameraIcon}
                  >
                    <Icon name="camera" size={28} color="#fff" />
                  </TouchableOpacity>
                )}
                <Text style={styles.cameraText}>Blink or turn head slowly</Text>
                {!selfie && (
                  <TouchableOpacity
                    onPress={pickSelfie}
                    style={styles.cameraButton}
                  >
                    <Text style={styles.cameraButtonText}>
                      Click your picture and verify yourself
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              {message && <Text style={styles.message}>{message}</Text>}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[
              styles.button,
              (!selfie || loading) && styles.buttonDisabled,
              fetching && styles.buttonDisabled,
            ]}
            onPress={uploadSelfie}
            disabled={!selfie || loading || fetching}
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
    color: '#fff',
    fontWeight: '700',
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
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
  },
  fieldLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  fieldLabel: {
    fontWeight: '600',
    color: '#0F172A',
  },
  cameraFrame: {
    borderWidth: 1,
    borderColor: '#CDEEE5',
    borderRadius: 24,
    padding: 16,
    alignItems: 'center',
    minHeight: 240,
    justifyContent: 'space-between',
    backgroundColor: '#F8FFFD',
  },
  cameraIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00BE99',
  },
  cameraText: {
    color: '#64748B',
    fontSize: 14,
  },
  cameraButton: {
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#00BE99',
    borderRadius: 16,
  },
  cameraButtonText: {
    color: '#00BE99',
    fontWeight: '600',
    fontSize: 12,
  },
  message: {
    marginTop: 12,
    color: '#0F9F75',
    fontWeight: '600',
  },
  bottomBar: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: '#fff',
  },
  button: {
    marginTop: 0,
    borderRadius: 16,
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: '#00BE99',
    width: '100%',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  previewWrapper: {
    width: '100%',
    height: 200,
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#E5F5F0',
  },
  preview: {
    height: '100%',
    width: '100%',
  },
  retakeBadge: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    padding: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
});

export default KycVerificationScreen;
