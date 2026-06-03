import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Text,
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

type Props = NativeStackScreenProps<RootStackParamList, 'HomeLoanDocumentsScreen'>;
type DocumentKey =
  | 'panImage'
  | 'aadhaarImage'
  | 'bankStatement'
  | 'propertyDetails'
  | 'salarySlip'
  | 'itrFiling';

type EmploymentProfile = 'salaried' | 'self-employed';
type DocumentAsset = {
  uri: string;
  type: string;
  name: string;
  size?: number;
  isRemote?: boolean;
};

const DOCUMENT_META: Record<DocumentKey, { label: string; apiField: string }> = {
  panImage: {
    label: 'PAN Card',
    apiField: 'pan',
  },
  aadhaarImage: {
    label: 'Aadhaar Card',
    apiField: 'aadhaar',
  },
  bankStatement: {
    label: "6 Months' Bank Statement",
    apiField: 'bankStatement',
  },
  propertyDetails: {
    label: 'Property Details',
    apiField: 'propertyDetails',
  },
  salarySlip: {
    label: 'Salary Slip',
    apiField: 'salarySlip',
  },
  itrFiling: {
    label: 'ITR Filing (Past 3 Years)',
    apiField: 'itrFiling',
  },
};

const EMPLOYED_REQUIRED_DOCS: DocumentKey[] = [
  'panImage',
  'aadhaarImage',
  'salarySlip',
  'bankStatement',
  'propertyDetails',
];

const SELF_EMPLOYED_REQUIRED_DOCS: DocumentKey[] = [
  'panImage',
  'aadhaarImage',
  'itrFiling',
  'bankStatement',
  'propertyDetails',
];

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
  if (normalized.includes('self')) {
    return 'self-employed';
  }
  return 'salaried';
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
  const [images, setImages] = useState<Record<DocumentKey, DocumentAsset | null>>({
    panImage: null,
    aadhaarImage: null,
    bankStatement: null,
    propertyDetails: null,
    salarySlip: null,
    itrFiling: null,
  });

  const [loanType, setLoanType] = useState<'Home Loan' | 'Personal Loan'>('Home Loan');
  const [employmentProfile, setEmploymentProfile] = useState<EmploymentProfile>('salaried');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [targetDoc, setTargetDoc] = useState<DocumentKey | null>(null);
useEffect(() => {
  const loadExisting = async () => {
    setFetching(true);
    try {
      // 1. Fetch data from your current user API
      const response: any = await Fetch('user/get-current-user');
      
      // Handle instances where the payload is nested under '.data'
      const kycData = response?.data || response;

      if (kycData) {
        // Automatically sync the UI tabs with server data
        if (kycData.employmentType) {
          setEmploymentProfile(getEmploymentProfile(kycData.employmentType));
        }
        if (kycData.loanType) {
          setLoanType(kycData.loanType);
        }

        // 2. Check if documents exist and map them using your 'toRemoteAsset' helper
        setImages(prev => ({
          ...prev,
          panImage: kycData.panUrl ? toRemoteAsset(kycData.panUrl) : prev.panImage,
          aadhaarImage: kycData.aadhaarUrl ? toRemoteAsset(kycData.aadhaarUrl) : prev.aadhaarImage,
          bankStatement: kycData.bankStatementUrl ? toRemoteAsset(kycData.bankStatementUrl) : prev.bankStatement,
          propertyDetails: kycData.propertyDetailsUrl ? toRemoteAsset(kycData.propertyDetailsUrl) : prev.propertyDetails,
          salarySlip: kycData.salarySlipUrl ? toRemoteAsset(kycData.salarySlipUrl) : prev.salarySlip,
          itrFiling: kycData.itrFilingUrl ? toRemoteAsset(kycData.itrFilingUrl) : prev.itrFiling,
        }));
      }
    } catch (error) {
      console.log('FETCH EXISTING DATA ERROR:', error);
    } finally {
      setFetching(false);
    }
  };

  loadExisting();
}, []);
  const handleProfileSwitch = (profile: EmploymentProfile) => {
    setEmploymentProfile(profile);
    setMessage(null);
    setImages(prev => ({
      ...prev,
      salarySlip: null,
      itrFiling: null,
    }));
  };

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
        setMessage('Unsupported file type. Please upload JPG, PNG, WEBP, or PDF.');
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
    employmentProfile === 'self-employed'
      ? SELF_EMPLOYED_REQUIRED_DOCS
      : EMPLOYED_REQUIRED_DOCS;

  const allFilled = requiredDocKeys.every(key => Boolean(images[key]));

  const handleUpload = async () => {
    if (!allFilled) {
      setMessage('Please upload all required documents before continuing.');
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      
      formData.append('employmentType', employmentProfile);
      formData.append('loanType', loanType);

      const appendFile = (key: DocumentKey) => {
        const doc = images[key];
        if (!doc) return;

        const apiField = DOCUMENT_META[key].apiField;
        if (!doc.isRemote) {
          formData.append(apiField, {
            uri: doc.uri,
            name: doc.name || `${key}.jpg`,
            type: doc.type || 'image/jpeg',
          } as any);
        } else {
          formData.append(`${apiField}Url`, doc.uri);
        }
      };

      requiredDocKeys.forEach(appendFile);

      await Post('user/upload-kyc-docs', formData, 30000);

      setMessage('Your documents uploaded successfully. Our team will contact you soon.');
      setTargetDoc(null); 
      setModalVisible(true);

    } catch (error: any) {
      console.log('UPLOAD ERROR:', error);
      setMessage(
        error?.response?.data?.message ||
        error?.message ||
        'Unable to upload documents.'
      );
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
              
              <Text style={[styles.ruleTitle, { marginBottom: 8, marginTop: 4 }]}>Select Loan Type</Text>
              <View style={styles.tabContainer}>
                <TouchableOpacity
                  style={[
                    styles.tab,
                    loanType === 'Home Loan' && styles.activeTab,
                  ]}
                  onPress={() => setLoanType('Home Loan')}
                >
                  <Text
                    style={[
                      styles.tabText,
                      loanType === 'Home Loan' && styles.activeTabText,
                    ]}
                  >
                    Home Loan
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.tab,
                    loanType === 'Personal Loan' && styles.activeTab,
                  ]}
                  onPress={() => setLoanType('Personal Loan')}
                >
                  <Text
                    style={[
                      styles.tabText,
                      loanType === 'Personal Loan' && styles.activeTabText,
                    ]}
                  >
                    Personal Loan
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.ruleTitle, { marginBottom: 8 }]}>Select Employment Type</Text>
              <View style={styles.tabContainer}>
                <TouchableOpacity
                  style={[
                    styles.tab,
                    employmentProfile === 'salaried' && styles.activeTab,
                  ]}
                  onPress={() => handleProfileSwitch('salaried')}
                >
                  <Text
                    style={[
                      styles.tabText,
                      employmentProfile === 'salaried' && styles.activeTabText,
                    ]}
                  >
                    Salaried
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.tab,
                    employmentProfile === 'self-employed' && styles.activeTab,
                  ]}
                  onPress={() => handleProfileSwitch('self-employed')}
                >
                  <Text
                    style={[
                      styles.tabText,
                      employmentProfile === 'self-employed' && styles.activeTabText,
                    ]}
                  >
                    Self-Employed
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.ruleCard}>
                <Text style={styles.ruleTitle}>Required Documents</Text>
                <Text style={styles.ruleText}>
                  {employmentProfile === 'self-employed'
                    ? "PAN Card, Aadhaar Card, ITR Filing (Past 3 Years), 6 Months' Bank Statement, and Property Details."
                    : "PAN Card, Aadhaar Card, Salary Slip, 6 Months' Bank Statement, and Property Details."}
                </Text>
              </View>

              {fetching ? (
                <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                  <ActivityIndicator color="#00BE99" size="large" />
                  <Text style={[styles.ruleText, { marginTop: 8, color: '#64748B' }]}>Loading uploaded documents...</Text>
                </View>
              ) : (
                requiredDocKeys.map(key => (
                  <View key={key} style={styles.inputContainer}>
                    <TouchableOpacity
                      style={styles.uploadRow}
                      onPress={() => openPicker(key)}
                    >
                      <View style={styles.uploadIcon}>
                        <Icon name={images[key] ? "check" : "upload-cloud"} size={18} color="#00BE99" />
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
                          <Text style={styles.pdfName} numberOfLines={1}>{images[key]?.name}</Text>
                        </View>
                      ) : (
                        <Image
                          resizeMode="contain"
                          style={styles.preview}
                          source={{ uri: images[key]?.uri }}
                        />
                      ))}
                  </View>
                ))
              )}

              {message && !modalVisible && <Text style={styles.message}>{message}</Text>}
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
            {targetDoc ? (
              <>
                <Text style={styles.modalTitle}>Upload Document</Text>
                <Text style={styles.modalSubtitle}>Choose source</Text>
                <Pressable style={styles.modalOption} onPress={pickFromGallery}>
                  <Text style={styles.modalOptionText}>Choose from Gallery</Text>
                </Pressable>
                <Pressable
                  style={styles.modalOption}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={[styles.modalOptionText, styles.modalOptionTextCancel]}>
                    Cancel
                  </Text>
                </Pressable>
              </>
            ) : (
              <View style={{ alignItems: 'center', paddingVertical: 16 }}>
                <View style={[styles.uploadIcon, { width: 56, height: 56, borderRadius: 28, marginBottom: 16, marginRight: 0 }]}>
                  <Icon name="check-circle" size={32} color="#00BE99" />
                </View>
                <Text style={[styles.modalTitle, { textAlign: 'center' }]}>Upload Successful</Text>
                <Text style={[styles.modalSubtitle, { textAlign: 'center', marginBottom: 24, paddingHorizontal: 10, color: '#475569' }]}>
                  {message}
                </Text>
                <TouchableOpacity
                  style={[styles.button, { width: '100%' }]}
                  onPress={() => {
                    setModalVisible(false);
                    navigation.navigate('Home');
                  }}
                >
                  <Text style={styles.buttonText}>Okay</Text>
                </TouchableOpacity>
              </View>
            )}
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#00BE99',
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
    color: '#E11D48',
    fontWeight: '600',
  },
  button: {
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
    color: '#0F172A',
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