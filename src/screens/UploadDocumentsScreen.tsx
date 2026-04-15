import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { launchImageLibrary } from 'react-native-image-picker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { RootStackParamList } from '../navigation/types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Fetch, Post } from '../api';

type Props = NativeStackScreenProps<RootStackParamList, 'UploadDocuments'>;
type DocumentKey =
  | 'pan'
  | 'aadhaar'
  | 'salarySlip'
  | 'itrFiling'
  | 'bankStatement';
type NumberFieldKey = 'panNumber' | 'aadhaarNumber';
type EmploymentProfile = 'employed' | 'self_employed';
type DocumentAsset = {
  uri: string;
  type: string;
  name: string;
  size?: number;
  isRemote?: boolean;
};

const DOCUMENT_META: Record<
  DocumentKey,
  { label: string; apiField: string; numberField?: NumberFieldKey }
> = {
  pan: { label: 'PAN Card', apiField: 'pan', numberField: 'panNumber' },
  aadhaar: {
    label: 'Aadhaar Card',
    apiField: 'aadhaar',
    numberField: 'aadhaarNumber',
  },
  salarySlip: { label: 'Salary Slip', apiField: 'salarySlip' },
  itrFiling: { label: 'ITR Filing', apiField: 'itrFiling' },
  bankStatement: { label: 'Bank Statement', apiField: 'bankStatement' },
};

const EMPLOYED_REQUIRED_DOCS: DocumentKey[] = ['pan', 'aadhaar', 'salarySlip'];
const SELF_EMPLOYED_REQUIRED_DOCS: DocumentKey[] = [
  'pan',
  'aadhaar',
  'itrFiling',
  'bankStatement',
];
const PAN_NUMBER_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const AADHAAR_NUMBER_REGEX = /^[0-9]{12}$/;
const ALLOWED_DOC_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/pdf',
];
const MAX_DOC_SIZE_MB = 10;
const MAX_DOC_SIZE_BYTES = MAX_DOC_SIZE_MB * 1024 * 1024;

const getEmploymentProfile = (employmentType?: string): EmploymentProfile => {
  const normalized = String(employmentType || '').toLowerCase();
  if (normalized.includes('self')) return 'self_employed';
  return 'employed';
};

const getFileNameFromUrl = (value?: string | null) => {
  if (!value) return 'document';
  try {
    const withoutQuery = value.split('?')[0];
    const raw = withoutQuery.split('/').pop();
    return raw || 'document';
  } catch {
    return 'document';
  }
};

const getMimeTypeFromUrl = (value?: string | null) => {
  const lower = String(value || '').toLowerCase();
  if (lower.endsWith('.pdf')) return 'application/pdf';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg';
};

const toRemoteAsset = (uri: string): DocumentAsset => ({
  uri,
  type: getMimeTypeFromUrl(uri),
  name: getFileNameFromUrl(uri),
  isRemote: true,
});

const UploadDocumentsScreen = ({ navigation }: Props) => {
  const [images, setImages] = useState<
    Record<DocumentKey, DocumentAsset | null>
  >({
    pan: null,
    aadhaar: null,
    salarySlip: null,
    itrFiling: null,
    bankStatement: null,
  });
  const [references, setReferences] = useState({
    panNumber: '',
    aadhaarNumber: '',
  });
  const [employmentProfile, setEmploymentProfile] =
    useState<EmploymentProfile>('employed');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [targetDoc, setTargetDoc] = useState<DocumentKey | null>(null);

  const updateReference = (field: NumberFieldKey, value: string) => {
    const nextValue =
      field === 'panNumber'
        ? value.toUpperCase().replace(/[^A-Z0-9]/g, '')
        : value.replace(/\D/g, '');

    setReferences(prev => ({
      ...prev,
      [field]: nextValue,
    }));
  };

  useEffect(() => {
    const loadExisting = async () => {
      setFetching(true);
      try {
        const data: any = await Fetch('user/get-current-user');
        const user = data?.data || data;
        setEmploymentProfile(
          getEmploymentProfile(user?.professionalDetails?.employmentType),
        );
        if (user?.kyc) {
          if (user.kyc.pan?.url) {
            setImages(prev => ({
              ...prev,
              pan: toRemoteAsset(user.kyc.pan.url),
            }));
            setReferences(prev => ({
              ...prev,
              panNumber: String(
                user.kyc.pan.number || prev.panNumber,
              ).toUpperCase(),
            }));
          }
          if (user.kyc.aadhaar?.url) {
            setImages(prev => ({
              ...prev,
              aadhaar: toRemoteAsset(user.kyc.aadhaar.url),
            }));
            setReferences(prev => ({
              ...prev,
              aadhaarNumber: String(
                user.kyc.aadhaar.number || prev.aadhaarNumber,
              )
                .replace(/\D/g, '')
                .slice(0, 12),
            }));
          }
          if (user.kyc?.salarySlip?.url) {
            setImages(prev => ({
              ...prev,
              salarySlip: toRemoteAsset(user.kyc.salarySlip.url),
            }));
          }
          if (user.kyc?.itrFiling?.url) {
            setImages(prev => ({
              ...prev,
              itrFiling: toRemoteAsset(user.kyc.itrFiling.url),
            }));
          }
          if (user.kyc?.bankStatement?.url) {
            setImages(prev => ({
              ...prev,
              bankStatement: toRemoteAsset(user.kyc.bankStatement.url),
            }));
          }
        }
      } catch {
        // ignore fetch errors
      } finally {
        setFetching(false);
      }
    };
    loadExisting();
  }, []);

  const openPicker = (doc: DocumentKey) => {
    if (loading || fetching) return;
    setTargetDoc(doc);
    setModalVisible(true);
  };

  const pickFromGallery = async () => {
    if (!targetDoc) return;
    setLoading(true);
    const result = await launchImageLibrary({
      quality: 0.8,
      selectionLimit: 1,
      mediaType: 'mixed',
    });
    if (result.didCancel) {
      setLoading(false);
      setModalVisible(false);
      return;
    }
    const asset = result.assets?.[0];
    const uri = asset?.uri;
    if (uri) {
      const mimeType = asset.type || '';
      if (mimeType && !ALLOWED_DOC_MIME_TYPES.includes(mimeType)) {
        setMessage(
          'Unsupported file type. Please upload JPG, PNG, WEBP, or PDF.',
        );
        setLoading(false);
        setModalVisible(false);
        return;
      }
      if (asset.fileSize && asset.fileSize > MAX_DOC_SIZE_BYTES) {
        setMessage(`File too large. Max size is ${MAX_DOC_SIZE_MB} MB.`);
        setLoading(false);
        setModalVisible(false);
        return;
      }

      const fileName =
        asset.fileName ||
        `${DOCUMENT_META[targetDoc].apiField}${
          mimeType === 'application/pdf' ? '.pdf' : '.jpg'
        }`;
      setImages(prev => ({
        ...prev,
        [targetDoc]: {
          uri,
          type: mimeType || 'image/jpeg',
          name: fileName,
          size: asset.fileSize,
        },
      }));
      setMessage('Document selected.');
    } else {
      setMessage('Upload failed, please try again.');
    }
    setLoading(false);
    setModalVisible(false);
  };

  const requiredDocKeys =
    employmentProfile === 'self_employed'
      ? SELF_EMPLOYED_REQUIRED_DOCS
      : EMPLOYED_REQUIRED_DOCS;

  const allFilled =
    requiredDocKeys.every(key => Boolean(images[key])) &&
    Boolean(references.panNumber.trim()) &&
    Boolean(references.aadhaarNumber.trim());

  const handleUpload = async () => {
    if (!allFilled) {
      setMessage('Please upload all required documents before continuing.');
      return;
    }
    const normalizedPan = references.panNumber.trim().toUpperCase();
    const normalizedAadhaar = references.aadhaarNumber.replace(/\D/g, '');
    if (!PAN_NUMBER_REGEX.test(normalizedPan)) {
      setMessage('Enter a valid PAN number (e.g. ABCDE1234F).');
      return;
    }
    if (normalizedAadhaar.length !== 12) {
      setMessage('Aadhaar number must be exactly 12 digits.');
      return;
    }
    if (!AADHAAR_NUMBER_REGEX.test(normalizedAadhaar)) {
      setMessage('Aadhaar number must be exactly 12 digits.');
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const formData = new FormData();

      const appendDocument = (key: DocumentKey) => {
        const doc = images[key];
        if (!doc) return;
        const fieldName = DOCUMENT_META[key].apiField;

        if (!doc.isRemote) {
          formData.append(fieldName, {
            uri: doc.uri,
            name: doc.name || `${fieldName}.jpg`,
            type: doc.type || 'image/jpeg',
          } as any);
        } else {
          formData.append(`${fieldName}Url`, doc.uri);
        }
      };

      requiredDocKeys.forEach(appendDocument);

      formData.append('panNumber', normalizedPan);
      formData.append('aadhaarNumber', normalizedAadhaar);

      await Post('user/upload-kyc-docs', formData, 15000, undefined, false);
      setMessage('Documents uploaded. Continue to selfie.');
      navigation.navigate('KycVerification');
    } catch (error: any) {
      setMessage(error?.message || 'Unable to upload documents.');
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
          >
            <View style={styles.header}>
              <Image
                resizeMode="cover"
                style={styles.groupImage}
                source={require('../../assets/group.png')}
              />
              <Image
                resizeMode="contain"
                style={styles.headerIcon}
                source={require('../../assets/icon.png')}
              />
              <Image
                resizeMode="cover"
                style={styles.groupImageBottom}
                source={require('../../assets/group.png')}
              />
              <View style={styles.hero}>
                <Text style={styles.headerTitle}>Upload documents</Text>
                <Text style={styles.headerSubtitle}>
                  Snap and submit your ID proofs to finish onboarding.
                </Text>
              </View>
            </View>

            <View style={styles.formCard}>
              <View style={styles.ruleCard}>
                <Text style={styles.ruleTitle}>Required documents</Text>
                <Text style={styles.ruleText}>
                  {employmentProfile === 'self_employed'
                    ? 'PAN Card, Aadhaar Card, ITR Filing, and Bank Statement.'
                    : 'PAN Card, Aadhaar Card, and Salary Slip for employed users.'}
                </Text>
              </View>

              {requiredDocKeys.map(key => (
                <View key={key} style={styles.inputContainer}>
                  {DOCUMENT_META[key].numberField && (
                    <View style={styles.inputRow}>
                      <TextInput
                        value={references[DOCUMENT_META[key].numberField]}
                        onChangeText={value =>
                          updateReference(
                            DOCUMENT_META[key].numberField as NumberFieldKey,
                            value,
                          )
                        }
                        placeholder={`${DOCUMENT_META[key].label} number`}
                        placeholderTextColor="#9CA3AF"
                        keyboardType={
                          DOCUMENT_META[key].numberField === 'aadhaarNumber'
                            ? 'number-pad'
                            : 'default'
                        }
                        maxLength={
                          DOCUMENT_META[key].numberField === 'panNumber'
                            ? 10
                            : 12
                        }
                        autoCorrect={false}
                        autoCapitalize={
                          DOCUMENT_META[key].numberField === 'panNumber'
                            ? 'characters'
                            : 'none'
                        }
                        style={styles.input}
                      />
                      <Icon name="hash" size={18} color="#94A3B8" />
                    </View>
                  )}
                  <TouchableOpacity
                    style={styles.uploadRow}
                    onPress={() => openPicker(key)}
                  >
                    <View style={styles.uploadIcon}>
                      <Icon name="upload-cloud" size={18} color="#00BE99" />
                    </View>
                    <Text style={styles.uploadLabel}>
                      {images[key]
                        ? `${DOCUMENT_META[key].label} uploaded`
                        : `Upload ${DOCUMENT_META[key].label}`}
                    </Text>
                    <Icon name="chevron-right" size={18} color="#94A3B8" />
                  </TouchableOpacity>
                  {images[key] &&
                    (images[key]?.type === 'application/pdf' ? (
                      <View style={styles.pdfPreview}>
                        <Icon name="file-text" size={18} color="#0F172A" />
                        <Text style={styles.pdfName} numberOfLines={1}>
                          {images[key]?.name}
                        </Text>
                      </View>
                    ) : (
                      <Image
                        resizeMode="contain"
                        style={styles.preview}
                        source={{ uri: images[key]?.uri as string }}
                      />
                    ))}
                </View>
              ))}
              {message && <Text style={styles.message}>{message}</Text>}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        <View style={styles.bottomBar}>
          <TouchableOpacity
            disabled={loading || fetching}
            style={[
              styles.button,
              (loading || fetching) && styles.buttonDisabled,
            ]}
            onPress={handleUpload}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Continue</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <Modal animationType="fade" transparent visible={modalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Upload Document</Text>
            <Text style={styles.modalSubtitle}>Choose source</Text>
            <Pressable style={styles.modalOption} onPress={pickFromGallery}>
              <Text style={styles.modalOptionText}>Choose from Gallery</Text>
            </Pressable>
            <Pressable
              style={styles.modalOption}
              onPress={() => setModalVisible(false)}
            >
              <Text
                style={[styles.modalOptionText, styles.modalOptionTextCancel]}
              >
                Cancel
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
    backgroundColor: '#00BE99',
  },
  scrollContent: {
    paddingBottom: 50,
  },
  header: {
    paddingTop: 32,
    paddingBottom: 36,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#00BE99',
  },
  hero: {
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  groupImage: {
    top: 0,
    left: 0,
    width: 180,
    height: 180,
    zIndex: 1000,
    position: 'absolute',
  },
  headerIcon: {
    top: 12,
    left: 24,
    width: 40,
    height: 40,
    zIndex: 110,
    position: 'absolute',
  },
  groupImageBottom: {
    right: 0,
    bottom: 0,
    width: 180,
    height: 180,
    zIndex: 900,
    position: 'absolute',
    transform: [{ rotate: '180deg' }],
  },
  headerTitle: {
    fontSize: 26,
    color: '#fff',
    fontWeight: '700',
  },
  headerSubtitle: {
    marginTop: 6,
    lineHeight: 18,
    color: '#E6FFFA',
  },
  formCard: {
    marginTop: -18,
    height: '150%',
    paddingTop: 20,
    shadowRadius: 18,
    paddingBottom: 32,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    shadowOffset: { width: 0, height: 10 },
  },
  ruleCard: {
    borderWidth: 1,
    borderRadius: 14,
    marginBottom: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderColor: '#D1F7EE',
    backgroundColor: '#F4FDF8',
  },
  ruleTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  ruleText: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 16,
    color: '#0F172A',
  },
  inputContainer: {
    marginBottom: 18,
  },
  inputRow: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#E5E7EB',
    backgroundColor: '#F8FAFC',
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },
  uploadRow: {
    marginTop: 10,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    paddingHorizontal: 12,
    alignItems: 'center',
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  uploadIcon: {
    width: 32,
    height: 32,
    marginRight: 10,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E0F2F1',
  },
  uploadLabel: {
    flex: 1,
    color: '#0F172A',
    fontWeight: '600',
  },
  preview: {
    height: 140,
    marginTop: 8,
    width: '100%',
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  pdfPreview: {
    marginTop: 8,
    height: 80,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F8FAFC',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 8,
  },
  pdfName: {
    flex: 1,
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '600',
  },
  message: {
    marginTop: 4,
    color: '#065F46',
    fontWeight: '600',
  },
  button: {
    marginTop: 0,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#00BE99',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  modalContent: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalTitle: {
    fontSize: 18,
    marginBottom: 8,
    fontWeight: '700',
  },
  modalSubtitle: {
    color: '#64748B',
    marginBottom: 16,
  },
  modalOption: {
    paddingVertical: 12,
  },
  modalOptionText: {
    fontSize: 16,
    color: '#00BE99',
  },
  modalOptionTextCancel: {
    color: '#F87171',
  },
  bottomBar: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: '#fff',
  },
});

export default UploadDocumentsScreen;
