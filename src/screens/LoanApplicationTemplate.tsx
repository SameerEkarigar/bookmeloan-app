import { useEffect, useMemo, useState } from 'react';
import {
  Text,
  View,
  Image,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardTypeOptions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';

import { Fetch, Post } from '../api';
import { RootStackParamList } from '../navigation/types';
import { getStorage, removeStorage, setStorage } from '../utils/storage';

export type LoanApplicationField = {
  key: string;
  label: string;
  icon?: string;
  prefix?: string;
  helper?: string;
  placeholder: string;
  multiline?: boolean;
  keyboardType?: KeyboardTypeOptions;
};

export type LoanApplicationConfig = {
  title: string;
  badge: string;
  subtitle: string;
  endpoint: string;
  disableDraftAutofill?: boolean;
  fields: LoanApplicationField[];
  defaultValues: Record<string, string>;
};

type DocumentKey = 'income_proof' | 'bank_statement';

type DocumentAsset = {
  uri: string;
  type: string;
  name: string;
  size?: number;
};

type ExistingApplication = {
  _id: string;
  applicationId?: string;
  status?: string;
  requestedLoan?: { loanType?: string };
};

const ALLOWED_DOC_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/pdf',
];
const MAX_DOC_SIZE_MB = 10;
const MAX_DOC_SIZE_BYTES = MAX_DOC_SIZE_MB * 1024 * 1024;
const TERMINAL_APPLICATION_STATUSES = new Set(['rejected', 'closed']);

const normalizeLoanType = (value?: string | null) =>
  String(value || '')
    .trim()
    .toLowerCase();

const LoanApplicationTemplate = ({
  config,
}: {
  config: LoanApplicationConfig;
}) => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const {
    title,
    subtitle,
    badge,
    fields,
    endpoint,
    defaultValues,
    disableDraftAutofill,
  } = config;
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(defaultValues);
  const [documents, setDocuments] = useState<
    Record<DocumentKey, DocumentAsset | null>
  >({
    income_proof: null,
    bank_statement: null,
  });
  const [message, setMessage] = useState<string | null>(null);
  const [activeApplication, setActiveApplication] =
    useState<ExistingApplication | null>(null);
  const screenLoanType = normalizeLoanType(
    defaultValues['requestedLoan.loanType'] || title,
  );
  const draftKey = `loan-draft-${endpoint}-${
    defaultValues['requestedLoan.loanType'] || title
  }`;

  const completion = useMemo(() => {
    const requiredDocuments: DocumentKey[] = [
      'income_proof',
      'bank_statement',
    ];
    const totalSteps = fields.length + requiredDocuments.length;
    if (!totalSteps) return 0;
    const filledFields = fields.filter(field =>
      (form[field.key] || '').trim(),
    ).length;
    const filledDocuments = requiredDocuments.filter(
      key => documents[key]?.uri,
    ).length;
    return Math.round(((filledFields + filledDocuments) / totalSteps) * 100);
  }, [fields, form, documents]);

  const handleChange = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const pickDocument = async (
    doc: DocumentKey,
    source: 'camera' | 'library',
  ) => {
    if (loading) return;
    setMessage(null);
    const picker = source === 'camera' ? launchCamera : launchImageLibrary;
    const result = await picker({
      mediaType: source === 'camera' ? 'photo' : 'mixed',
      quality: 1,
      selectionLimit: 1,
      saveToPhotos: source === 'camera',
    });
    if (result.didCancel) return;
    if (result.errorCode) {
      setMessage(result.errorMessage || 'Unable to open document picker.');
      return;
    }
    const asset = result.assets?.[0];
    const uri = asset?.uri;
    if (!uri) {
      setMessage('No document selected. Please try again.');
      return;
    }

    const mimeType = asset.type || '';
    if (mimeType && !ALLOWED_DOC_MIME_TYPES.includes(mimeType)) {
      setMessage(
        'Unsupported file type. Please upload JPG, PNG, WEBP, or PDF.',
      );
      return;
    }

    if (asset.fileSize && asset.fileSize > MAX_DOC_SIZE_BYTES) {
      setMessage(`File too large. Max size is ${MAX_DOC_SIZE_MB} MB.`);
      return;
    }

    const fallbackName =
      doc === 'income_proof' ? 'income-proof' : 'bank-statement';
    const fileName =
      asset.fileName ||
      `${fallbackName}.${mimeType === 'application/pdf' ? 'pdf' : 'jpg'}`;

    setDocuments(prev => ({
      ...prev,
      [doc]: {
        uri,
        type: mimeType || 'image/jpeg',
        name: fileName,
        size: asset.fileSize,
      },
    }));
    setMessage(
      doc === 'income_proof'
        ? 'Income proof added.'
        : 'Bank statement added.',
    );
  };

  const handleSubmit = async () => {
    if (activeApplication) {
      setMessage(
        `You already have an active ${activeApplication.requestedLoan?.loanType || 'loan'} application (${activeApplication.applicationId || activeApplication._id}). Please wait for it to complete.`,
      );
      return;
    }
    if (!documents.income_proof || !documents.bank_statement) {
      setMessage('Please upload income proof and the latest bank statement.');
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const amountRaw = form['requestedLoan.amount'] || '';
      const tenureRaw = form['requestedLoan.tenureMonths'] || '';
      const amount = Number(String(amountRaw).replace(/[^\d.]/g, ''));
      const tenureMonths = Number(String(tenureRaw).replace(/[^\d]/g, ''));
      const purposeInput = form['requestedLoan.purpose'] || '';
      if (!amount || !tenureMonths || !purposeInput.trim()) {
        setMessage('Please fill in amount, tenure, and loan purpose.');
        setLoading(false);
        return;
      }
      const normalizePurpose = (value: string) => {
        const normalized = value.trim().toLowerCase();
        if (!normalized) return 'Other';
        if (normalized.includes('business')) return 'Business';
        if (normalized.includes('education')) return 'Education';
        if (normalized.includes('medical')) return 'Medical';
        if (normalized.includes('personal')) return 'Personal';
        return 'Other';
      };
      const purpose = normalizePurpose(purposeInput);
      const loanType = form['requestedLoan.loanType'] || title;

      const formData = new FormData();
      formData.append('income_proof', {
        uri: documents.income_proof.uri,
        name: documents.income_proof.name,
        type: documents.income_proof.type,
      } as any);
      formData.append('bank_statement', {
        uri: documents.bank_statement.uri,
        name: documents.bank_statement.name,
        type: documents.bank_statement.type,
      } as any);
      formData.append('requestedLoan.amount', String(amount || ''));
      formData.append('requestedLoan.tenureMonths', String(tenureMonths || ''));
      formData.append('requestedLoan.purpose', purpose);
      formData.append('requestedLoan.loanType', loanType);

      const response: any = await Post(endpoint, formData, 15000, undefined, false);
      const createdApplication: ExistingApplication | null =
        response?.data || response || null;
      setMessage('Request submitted successfully.');
      if (createdApplication?._id || createdApplication?.applicationId) {
        setActiveApplication(createdApplication);
      }
      await removeStorage(draftKey);
      setForm(defaultValues);
      setDocuments({ income_proof: null, bank_statement: null });
      navigation.navigate('LoanStatus');
    } catch (error: any) {
      const apiMessage =
        error?.message ||
        error?.error ||
        error?.data?.message ||
        'Unable to submit this request right now.';
      setMessage(apiMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setForm(defaultValues);
  }, [defaultValues]);

  useEffect(() => {
    const loadActiveApplication = async () => {
      try {
        const response: any = await Fetch(
          'loan-applications/my-history',
          {
            pagination: false,
            sortKey: 'createdAt',
            sortDir: 'desc',
          },
          10000,
          false,
        );
        const rows: ExistingApplication[] =
          response?.data?.result || response?.data || [];
        const pendingSameType = rows.find(
          row => {
            const rowLoanType = normalizeLoanType(row?.requestedLoan?.loanType);
            return (
            row?.status &&
            rowLoanType === screenLoanType &&
            !TERMINAL_APPLICATION_STATUSES.has(String(row.status).toLowerCase())
            );
          },
        );
        setActiveApplication(pendingSameType || null);
      } catch {
        // Non-blocking; backend will still enforce.
      }
    };

    const loadDraft = async () => {
      const draftJson = await getStorage(draftKey);
      if (draftJson) {
        try {
          const saved = JSON.parse(draftJson);
          setForm({ ...defaultValues, ...saved });
          setMessage('Draft loaded.');
        } catch {
          // ignore corrupt draft
        }
      }
    };
    loadActiveApplication();
    if (!disableDraftAutofill) {
      loadDraft();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey, disableDraftAutofill, screenLoanType]);

  const handleSaveDraft = async () => {
    try {
      await setStorage(draftKey, JSON.stringify(form));
      setMessage('Draft saved locally.');
    } catch {
      setMessage('Unable to save draft locally.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.hero}>
          <Icon name="briefcase" size={30} color="#fff" />
          <View style={styles.heroText}>
            <View style={styles.heroRow}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{badge}</Text>
              </View>
              <Text style={styles.completionText}>{completion}% complete</Text>
            </View>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>
          <Icon name="shield" size={30} color="#E6FFFA" />
        </View>

        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${completion}%` }]} />
        </View>

        <View style={styles.formCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryTitle}>Tell us about your plan</Text>
          </View>
          <Text style={styles.summaryCopy}>
            Fields mirror the Edit Profile layout so users see a familiar flow.
            Add the requested amount details and upload supporting documents to
            submit faster.
          </Text>

          {fields.map(field => (
            <View key={field.key} style={styles.inputContainer}>
              <View style={styles.inputRow}>
                {field.prefix && (
                  <Text style={styles.prefix}>{field.prefix}</Text>
                )}
                <TextInput
                  value={form[field.key]}
                  onChangeText={value => handleChange(field.key, value)}
                  placeholder={field.placeholder || field.label}
                  placeholderTextColor="#9CA3AF"
                  keyboardType={field.keyboardType}
                  multiline={field.multiline}
                  style={[styles.input, field.multiline && styles.multiline]}
                />
                {field.icon && (
                  <Icon name={field.icon as any} size={18} color="#94A3B8" />
                )}
              </View>
              <Text style={styles.inputLabel}>{field.label}</Text>
              {field.helper && (
                <Text style={styles.helper}>{field.helper}</Text>
              )}
            </View>
          ))}

          <View style={styles.documentsSection}>
            <Text style={styles.sectionTitle}>Supporting documents</Text>
            <Text style={styles.sectionCopy}>
              Upload income proof and your latest bank statement (JPG, PNG,
              WEBP, or PDF · max {MAX_DOC_SIZE_MB} MB).
            </Text>
            {(['income_proof', 'bank_statement'] as DocumentKey[]).map(key => {
              const hasDoc = Boolean(documents[key]?.uri);
              const label =
                key === 'income_proof' ? 'Income proof' : 'Bank statement';
              const docMeta = documents[key];
              const isPdf = docMeta?.type === 'application/pdf';
              return (
                <View key={key} style={styles.documentCard}>
                  <View style={styles.documentRow}>
                    <View style={styles.documentIcon}>
                      <Icon name="file-text" size={16} color="#0F172A" />
                    </View>
                    <View style={styles.documentInfo}>
                      <Text style={styles.documentTitle}>{label}</Text>
                      <Text style={styles.documentMeta}>
                        {hasDoc ? 'Document selected' : 'No file selected'}
                      </Text>
                    </View>
                    <Icon
                      name={hasDoc ? 'check-circle' : 'alert-circle'}
                      size={18}
                      color={hasDoc ? '#00BE99' : '#F97316'}
                    />
                  </View>
                  {hasDoc && (
                    <View style={styles.documentPreview}>
                      {isPdf ? (
                        <View style={styles.pdfPreview}>
                          <Icon name="file-text" size={20} color="#0F172A" />
                          <Text style={styles.pdfName} numberOfLines={1}>
                            {docMeta?.name}
                          </Text>
                        </View>
                      ) : (
                        <Image
                          source={{ uri: docMeta?.uri as string }}
                          resizeMode="cover"
                          style={styles.documentImage}
                        />
                      )}
                      <TouchableOpacity
                        style={styles.removeBadge}
                        onPress={() =>
                          setDocuments(prev => ({ ...prev, [key]: null }))
                        }
                      >
                        <Icon name="x" size={14} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  )}
                  <View style={styles.documentActions}>
                    <TouchableOpacity
                      onPress={() => pickDocument(key, 'camera')}
                      style={styles.documentButton}
                    >
                      <Icon name="camera" size={14} color="#0F172A" />
                      <Text style={styles.documentButtonText}>Capture</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => pickDocument(key, 'library')}
                      style={[styles.documentButton, styles.documentButtonLast]}
                    >
                      <Icon name="upload" size={14} color="#0F172A" />
                      <Text style={styles.documentButtonText}>Upload</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>

          {message && <Text style={styles.message}>{message}</Text>}
          {activeApplication && (
            <Text style={styles.message}>
              Active request for this loan type:{' '}
              {activeApplication.applicationId || activeApplication._id} (
              {(activeApplication.requestedLoan?.loanType || 'Loan').trim()}) is
              still in progress.
            </Text>
          )}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading || Boolean(activeApplication)}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Submit details</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleSaveDraft}
            disabled={loading}
          >
            <Text style={styles.secondaryText}>Save draft locally</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#00BE99',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    backgroundColor: '#00BE99',
  },
  hero: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00BE99',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    justifyContent: 'space-between',
  },
  heroText: {
    flex: 1,
    marginHorizontal: 12,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  badge: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  badgeText: {
    color: '#E6FFFA',
    fontWeight: '700',
    fontSize: 12,
  },
  completionText: {
    marginLeft: 10,
    color: '#E6FFFA',
    fontWeight: '600',
    fontSize: 12,
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    color: '#E6FFFA',
    marginTop: 6,
    lineHeight: 18,
  },
  progressBar: {
    height: 8,
    borderRadius: 8,
    marginHorizontal: 24,
    backgroundColor: '#0F172A',
  },
  progressFill: {
    height: 8,
    borderRadius: 8,
    backgroundColor: '#FDC436',
  },
  formCard: {
    padding: 20,
    elevation: 10,
    marginTop: 24,
    borderTopEndRadius: 32,
    borderTopStartRadius: 32,
    shadowRadius: 18,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    backgroundColor: '#fff',
    shadowOffset: { width: 0, height: 12 },
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: 18,
    color: '#0F172A',
    fontWeight: '700',
  },
  summaryEndpoint: {
    color: '#00BE99',
    fontSize: 12,
  },
  summaryCopy: {
    marginTop: 6,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 12,
  },
  inputContainer: {
    marginBottom: 14,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  prefix: {
    color: '#0F172A',
    fontWeight: '700',
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },
  multiline: {
    minHeight: 72,
  },
  inputLabel: {
    marginTop: 6,
    color: '#0F172A',
    fontWeight: '600',
    fontSize: 12,
  },
  helper: {
    color: '#94A3B8',
    fontSize: 12,
  },
  documentsSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionCopy: {
    marginTop: 4,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 12,
  },
  documentCard: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#F8FAFC',
  },
  documentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  documentIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E2E8F0',
    marginRight: 10,
  },
  documentInfo: {
    flex: 1,
  },
  documentTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  documentMeta: {
    marginTop: 2,
    fontSize: 12,
    color: '#64748B',
  },
  documentPreview: {
    marginTop: 10,
    borderRadius: 12,
    overflow: 'hidden',
  },
  documentImage: {
    width: '100%',
    height: 140,
  },
  pdfPreview: {
    height: 140,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    gap: 8,
  },
  pdfName: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '600',
  },
  removeBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 4,
  },
  documentActions: {
    flexDirection: 'row',
    marginTop: 12,
  },
  documentButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#fff',
    marginRight: 10,
  },
  documentButtonLast: {
    marginRight: 0,
  },
  documentButtonText: {
    marginLeft: 6,
    color: '#0F172A',
    fontWeight: '600',
    fontSize: 12,
  },
  message: {
    marginTop: 6,
    color: '#065F46',
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#00BE99',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
  },
  secondaryButton: {
    marginTop: 10,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  secondaryText: {
    color: '#0F172A',
    fontWeight: '600',
  },
});

export default LoanApplicationTemplate;
