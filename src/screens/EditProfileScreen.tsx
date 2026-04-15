import { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Text,
  View,
  Modal,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Platform } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import {
  launchCamera,
  launchImageLibrary,
  ImagePickerResponse,
} from 'react-native-image-picker';
import DateTimePicker, {
  DateTimePickerEvent,
  DateTimePickerAndroid,
} from '@react-native-community/datetimepicker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Fetch, Put, Post } from '../api';
import { RootStackParamList } from '../navigation/types';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = NativeStackScreenProps<RootStackParamList, 'EditProfile'>;

const getDefaultDob = () => {
  const now = new Date();
  const dob = new Date(now.getTime());
  dob.setFullYear(dob.getFullYear() - 18);
  return dob;
};
const getMaxDob = () => {
  const now = new Date();
  now.setFullYear(now.getFullYear() - 18);
  return now;
};
const GST_NUMBER_REGEX =
  /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const normalizeGstNumber = (value: string) =>
  value.toUpperCase().replace(/[^A-Z0-9]/g, '');

const initialState = {
  dob: '',
  name: '',
  email: '',
  mobile: '',
  gstNumber: '',
  profilePicture: '',
  maritalStatus: 'Single',
};

const EditProfileScreen = ({ navigation: _navigation }: Props) => {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(initialState);
  const [fetching, setFetching] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [picture, setPicture] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [dobModalVisible, setDobModalVisible] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [dobDate, setDobDate] = useState<Date | null>(getDefaultDob());
  const [maritalModalVisible, setMaritalModalVisible] = useState(false);
  const [gstLegalName, setGstLegalName] = useState('');
  const [gstVerified, setGstVerified] = useState(false);
  const [verifyingGst, setVerifyingGst] = useState(false);
  const maritalOptions = ['Single', 'Married', 'Divorced', 'Widowed'];

  useEffect(() => {
    const loadProfile = async () => {
      setFetching(true);
      try {
        const data: any = await Fetch(
          'user/get-current-user',
          undefined,
          10000,
        );
        if (data?.data) {
          const user = data.data;
          setForm({
            name: user.name || '',
            email: user.email || '',
            dob: user.dateOfBirth || '',
            mobile: user.phone?.number || '',
            gstNumber: user.professionalDetails?.gstNumber || '',
            maritalStatus: user.maritalStatus || '',
            profilePicture: user.profilePicture || '',
          });
          setIsPhoneVerified(Boolean(user.isPhoneVerified));
          setIsEmailVerified(Boolean(user.isEmailVerified));
          setGstVerified(
            user.professionalDetails?.gstVerificationStatus === 'verified',
          );
          setGstLegalName(user.professionalDetails?.gstLegalName || '');
          if (user.dateOfBirth) {
            const parsed = new Date(user.dateOfBirth);
            if (!Number.isNaN(parsed.getTime())) {
              setDobDate(parsed);
            }
          }
          setPicture(user?.profilePicture || null);
        }
      } catch (error: any) {
        setMessage(error?.message || 'Unable to load profile.');
      } finally {
        setFetching(false);
      }
    };
    loadProfile();
  }, []);

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const uploadProfilePicture = async (result: ImagePickerResponse) => {
    const asset = result.assets?.[0];
    const uri = asset?.uri;
    if (!uri) return;

    setUploadingPhoto(true);
    setMessage(null);

    try {
      const fileName = asset.fileName || `avatar-${Date.now()}.jpg`;
      const fileType = asset.type || 'image/jpeg';
      const formData = new FormData();
      formData.append('profilePicture', {
        uri,
        name: fileName,
        type: fileType,
      } as any);

      const response = await Post<{
        data?: { profilePicture?: string };
        profilePicture?: string;
      }>('/user/upload-profile-picture', formData, 12000);

      const uploadedUrl =
        (response as any)?.data?.profilePicture ||
        (response as any)?.profilePicture;
      if (uploadedUrl) {
        setPicture(uploadedUrl);
        setForm(prev => ({ ...prev, profilePicture: uploadedUrl }));
        return;
      }

      setMessage('Photo uploaded, but no URL returned.');
    } catch (error: any) {
      setMessage(error?.message || 'Unable to upload photo.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const pickImage = async (source: 'camera' | 'library') => {
    try {
      const picker = source === 'camera' ? launchCamera : launchImageLibrary;
      const result = await picker({
        mediaType: 'photo',
        selectionLimit: 1,
        quality: 0.8,
      });

      if (result.didCancel) return;
      const uri = result.assets?.[0]?.uri;
      if (uri) {
        setPicture(uri);
        await uploadProfilePicture(result);
      }
    } catch (error: any) {
      Alert.alert(
        'Image picker error',
        error?.message || 'Unable to open camera or gallery.',
      );
    }
  };

  const choosePhotoSource = () => {
    Alert.alert('Update photo', 'Choose a source', [
      { text: 'Camera', onPress: () => pickImage('camera') },
      { text: 'Gallery', onPress: () => pickImage('library') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const verifyGst = async () => {
    if (gstVerified) return;
    const gstNumber = normalizeGstNumber(form.gstNumber);
    if (!GST_NUMBER_REGEX.test(gstNumber)) {
      setMessage('Enter a valid GST number before verification.');
      return;
    }

    setVerifyingGst(true);
    setMessage(null);
    try {
      const response: any = await Post('user/verify-gst', { gstNumber }, 12000);
      const data = response?.data || response;
      setForm(prev => ({ ...prev, gstNumber: data?.gstNumber || gstNumber }));
      setGstVerified(data?.gstVerificationStatus === 'verified');
      setGstLegalName(data?.gstLegalName || '');
      setMessage('GST verified successfully.');
    } catch (error: any) {
      setMessage(error?.message || 'Unable to verify GST right now.');
    } finally {
      setVerifyingGst(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const payload: any = {
        name: form.name,
        email: form.email,
        dateOfBirth: dobDate ? dobDate.toISOString() : form.dob,
        profilePicture: picture,
        phone: { number: form.mobile },
        maritalStatus: form.maritalStatus,
      };
      console.log(isPhoneVerified, isEmailVerified);
      // If contact is already verified, avoid sending to prevent unintended changes server-side
      if (isPhoneVerified) {
        delete payload.phone;
      }
      if (isEmailVerified) {
        delete payload.email;
      }
      const normalizedGstNumber = normalizeGstNumber(form.gstNumber);
      if (normalizedGstNumber) {
        payload.professionalDetails = { gstNumber: normalizedGstNumber };
      }
      console.log(payload);
      await Put('user', payload, 12000, false);
      setMessage('Profile updated successfully.');
    } catch (error: any) {
      setMessage(error?.message || 'Unable to save changes.');
    } finally {
      setLoading(false);
    }
  };

  const fullName = form.name || 'Guest User';
  const openDobModal = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: dobDate || getDefaultDob(),
        mode: 'date',
        onChange: handleDobChange,
        maximumDate: getMaxDob(),
      });
      return;
    }
    setDobModalVisible(true);
  };

  const handleDobChange = (_event: DateTimePickerEvent, selected?: Date) => {
    if (!selected) return;
    const maxDob = getMaxDob();
    const safeDate = selected > maxDob ? maxDob : selected;
    setDobDate(safeDate);
    setForm(prev => ({ ...prev, dob: safeDate.toISOString() }));
    if (Platform.OS !== 'ios') setDobModalVisible(false);
  };

  const formattedDob = (dobDate || getDefaultDob()).toLocaleDateString(
    'en-IN',
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    },
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Green header with avatar */}
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
            <View style={styles.avatarOuter}>
              <TouchableOpacity onPress={choosePhotoSource} activeOpacity={0.8}>
                {picture ? (
                  <Image source={{ uri: picture }} style={styles.avatar} />
                ) : (
                  <Image
                    source={require('../../assets/person.png')}
                    style={styles.avatar}
                  />
                )}
                {uploadingPhoto && (
                  <View style={styles.avatarOverlay}>
                    <ActivityIndicator color="#00BE99" />
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.editBadge}
                onPress={choosePhotoSource}
              >
                <Icon name="edit-2" size={16} color="#00BE99" />
              </TouchableOpacity>
            </View>

            <Text style={styles.nameText}>{fullName}</Text>
            <Text style={styles.emailHeaderText}>{form.email}</Text>
          </View>
        </View>

        {/* White card that overlaps header */}
        <View style={styles.formCard}>
          {[
            { label: 'Full name', key: 'name' as const },
            {
              label: 'Date of birth',
              key: 'dob' as const,
              icon: 'calendar',
              type: 'dob',
            },
            {
              label: 'Marital status',
              key: 'maritalStatus' as const,
              icon: 'chevron-down',
              type: 'marital',
            },
            { label: 'Mobile number', key: 'mobile' as const },
            { label: 'Email address', key: 'email' as const },
          ].map(field => (
            <View key={field.key} style={styles.inputContainer}>
              <View style={styles.inputRow}>
                {((isContact, verified) => {
                  const editable =
                    !fetching && !loading && !(isContact && verified);
                  if (field.type === 'dob') {
                    return (
                      <TouchableOpacity
                        style={styles.fullWidthTouchable}
                        onPress={openDobModal}
                        disabled={loading || fetching}
                      >
                        <Text style={styles.selectValue}>{formattedDob}</Text>
                      </TouchableOpacity>
                    );
                  }

                  if (field.type === 'marital') {
                    return (
                      <TouchableOpacity
                        style={styles.fullWidthTouchable}
                        onPress={() => setMaritalModalVisible(true)}
                        disabled={loading || fetching}
                      >
                        <Text style={styles.selectValue}>
                          {form.maritalStatus || 'Select status'}
                        </Text>
                      </TouchableOpacity>
                    );
                  }

                  return (
                    <TextInput
                      value={form[field.key]}
                      editable={editable}
                      onChangeText={value => handleChange(field.key, value)}
                      placeholder={field.label}
                      placeholderTextColor="#9CA3AF"
                      style={[
                        styles.input,
                        isContact && verified && styles.disabledInput,
                      ]}
                    />
                  );
                })(
                  field.key === 'mobile' || field.key === 'email',
                  field.key === 'mobile' ? isPhoneVerified : isEmailVerified,
                )}

                {field.icon && (
                  <Icon
                    name={field.icon as 'calendar' | 'chevron-down'}
                    size={18}
                    color="#94A3B8"
                  />
                )}
              </View>
            </View>
          ))}

          <View style={styles.inputContainer}>
            <View style={styles.inputRow}>
              <TextInput
                value={form.gstNumber}
                editable={!fetching && !loading && !gstVerified}
                onChangeText={value =>
                  handleChange('gstNumber', normalizeGstNumber(value))
                }
                placeholder="GST number"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="characters"
                style={[styles.input, gstVerified && styles.disabledInput]}
              />
              <TouchableOpacity
                style={[
                  styles.verifyButton,
                  (gstVerified || verifyingGst) && styles.verifyButtonDisabled,
                ]}
                disabled={
                  fetching ||
                  loading ||
                  gstVerified ||
                  verifyingGst ||
                  uploadingPhoto
                }
                onPress={verifyGst}
              >
                {verifyingGst ? (
                  <ActivityIndicator color="#00BE99" size="small" />
                ) : (
                  <Text style={styles.verifyButtonText}>
                    {gstVerified ? 'Verified' : 'Verify'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
            {gstVerified && (
              <Text style={styles.helperText}>
                GST is verified and locked for edits.
              </Text>
            )}
            {gstVerified && Boolean(gstLegalName) && (
              <Text style={styles.helperText}>Legal name: {gstLegalName}</Text>
            )}
          </View>

          {(isPhoneVerified || isEmailVerified) && (
            <View style={styles.helperSection}>
              {isPhoneVerified && (
                <Text style={styles.helperText}>
                  Mobile number verified. Contact changes are locked.
                </Text>
              )}
              {isEmailVerified && (
                <Text style={styles.helperText}>
                  Email address verified. Contact changes are locked.
                </Text>
              )}
            </View>
          )}

          {message && <Text style={styles.message}>{message}</Text>}

          <TouchableOpacity
            style={styles.button}
            onPress={handleSubmit}
            disabled={loading || fetching || uploadingPhoto}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : uploadingPhoto ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <Modal visible={dobModalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Date of Birth</Text>
              <DateTimePicker
                value={dobDate || getDefaultDob()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDobChange}
                maximumDate={getMaxDob()}
              />
              {Platform.OS === 'ios' && (
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.modalButton}
                    onPress={() => setDobModalVisible(false)}
                  >
                    <Text style={styles.modalButtonText}>Done</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </Modal>

        <Modal visible={maritalModalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Marital Status</Text>
              {maritalOptions.map(option => (
                <TouchableOpacity
                  key={option}
                  style={styles.optionRow}
                  onPress={() => {
                    setForm(prev => ({ ...prev, maritalStatus: option }));
                    setMaritalModalVisible(false);
                  }}
                >
                  <Text style={styles.optionText}>{option}</Text>
                </TouchableOpacity>
              ))}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => setMaritalModalVisible(false)}
                >
                  <Text style={styles.modalButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#111827', // device frame color (just like mockup edge)
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#111827',
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: '#111827',
  },

  header: {
    paddingTop: 32,
    paddingBottom: 80,
    backgroundColor: '#00BE99',
  },
  hero: {
    alignItems: 'center',
  },
  groupImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 180,
    height: 180,
    zIndex: 1000,
  },
  headerIcon: {
    position: 'absolute',
    top: 12,
    left: 24,
    width: 40,
    height: 40,
    zIndex: 110,
  },
  groupImageBottom: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 180,
    height: 180,
    zIndex: 900,
    transform: [{ rotate: '180deg' }],
  },
  avatarOuter: {
    width: 132,
    height: 132,
    borderRadius: 66,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  avatar: {
    width: 118,
    height: 118,
    borderRadius: 59,
    objectFit: 'contain',
  },
  avatarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 59,
  },
  editBadge: {
    position: 'absolute',
    bottom: 6,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  nameText: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emailHeaderText: {
    marginTop: 4,
    fontSize: 14,
    color: '#E5F9F3',
  },

  formCard: {
    flex: 1,
    marginTop: -40,
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingHorizontal: 24,
    paddingTop: 40,
    // paddingBottom: 32,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
  },

  inputContainer: {
    marginTop: 14,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    height: 56,
  },
  input: {
    flex: 1,
    color: '#111827',
    fontSize: 15,
  },
  verifyButton: {
    minWidth: 88,
    height: 36,
    marginLeft: 10,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: '#00BE99',
    backgroundColor: '#F4FDF8',
    paddingHorizontal: 10,
  },
  verifyButtonDisabled: {
    opacity: 0.65,
  },
  verifyButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#00BE99',
  },
  selectValue: {
    flex: 1,
    color: '#111827',
    fontSize: 15,
    textAlignVertical: 'center',
    paddingVertical: 8,
  },
  disabledInput: {
    color: '#9CA3AF',
  },

  message: {
    marginTop: 16,
    color: '#F59E0B',
    textAlign: 'center',
  },

  button: {
    height: 56,
    borderRadius: 20,
    marginVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#35C187',
  },
  buttonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  fullWidthTouchable: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 10,
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginRight: 8,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  modalButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  modalButtonText: {
    color: '#00BE99',
    fontWeight: '700',
  },
  optionRow: {
    paddingVertical: 10,
  },
  optionText: {
    color: '#0F172A',
    fontWeight: '600',
  },

  link: {
    marginTop: 14,
    alignItems: 'center',
  },
  linkText: {
    color: '#E6FFFA',
    fontWeight: '600',
  },
  helperSection: {
    marginTop: 8,
    gap: 2,
  },
  helperText: {
    fontSize: 12,
    color: '#6B7280',
  },
});

export default EditProfileScreen;
