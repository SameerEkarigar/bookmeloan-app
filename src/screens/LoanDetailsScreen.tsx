import { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

import SimpleSlider from '../components/SimpleSlider';
import { RootStackParamList } from '../navigation/types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<RootStackParamList, 'LoanDetails'>;

type ThemeColors = {
  screenBg: string;
  cardBg: string;
  cardText: string;
  heroBg: string;
  heroAccent: string;
  inputBg: string;
  inputBorder: string;
  inputText: string;
  inputPlaceholder: string;
  labelText: string;
  buttonBg: string;
  buttonText: string;
  sliderTrack: string;
  sliderActive: string;
};

const lightColors: ThemeColors = {
  screenBg: '#00BE99',
  cardBg: '#FFFFFF',
  cardText: '#0F172A',
  heroBg: '#E0F9F0',
  heroAccent: '#DFF5EF',
  inputBg: '#F8FAFC',
  inputBorder: '#E2E8F0',
  inputText: '#0F172A',
  inputPlaceholder: '#94A3B8',
  labelText: '#64748B',
  buttonBg: '#00BE99',
  buttonText: '#FFFFFF',
  sliderTrack: '#E5F7F1',
  sliderActive: '#00BE99',
};

const LoanDetailsScreen = ({ navigation }: Props) => {
  const [interestRate, setInterestRate] = useState(10);
  const [tenure, setTenure] = useState(12);
  const colors = lightColors;
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Loan Details</Text>
          <View style={styles.hero}>
            <Text style={styles.heroTitle}>Get Loan In Few Steps</Text>
            <View style={styles.heroImagePlaceholder} />
          </View>
          <View style={styles.input}>
            <TextInput
              placeholder="Enter Amount Required"
              style={styles.inputField}
              keyboardType="number-pad"
              placeholderTextColor={colors.inputPlaceholder}
            />
          </View>
          <Text style={styles.sliderLabel}>Interest Rate</Text>
          <SimpleSlider
            minimumValue={5}
            maximumValue={20}
            step={0.5}
            value={interestRate}
            onValueChange={setInterestRate}
            activeColor={colors.sliderActive}
            trackColor={colors.sliderTrack}
          />
          <Text style={styles.sliderValue}>{interestRate.toFixed(1)}%</Text>
          <Text style={styles.sliderLabel}>Tenure</Text>
          <SimpleSlider
            minimumValue={6}
            maximumValue={60}
            step={1}
            value={tenure}
            onValueChange={setTenure}
            activeColor={colors.sliderActive}
            trackColor={colors.sliderTrack}
          />
          <Text style={styles.sliderValue}>{tenure} months</Text>
          <View style={styles.input}>
            <TextInput
              placeholder="Loan Purpose"
              style={styles.inputField}
              placeholderTextColor={colors.inputPlaceholder}
            />
          </View>
        </View>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.screenBg,
    },
    container: {
      padding: 16,
      paddingBottom: 40,
    },
    card: {
      marginTop: 12,
      backgroundColor: colors.cardBg,
      borderRadius: 28,
      padding: 16,
      shadowColor: '#000',
      shadowOpacity: 0.08,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 10 },
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.cardText,
      marginBottom: 16,
    },
    hero: {
      backgroundColor: colors.heroBg,
      borderRadius: 22,
      padding: 16,
      marginBottom: 16,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    heroTitle: {
      color: colors.cardText,
      fontWeight: '700',
      fontSize: 16,
    },
    heroImagePlaceholder: {
      width: 80,
      height: 80,
      borderRadius: 16,
      backgroundColor: colors.heroAccent,
    },
    input: {
      marginTop: 12,
      borderWidth: 1,
      borderColor: colors.inputBorder,
      borderRadius: 16,
      backgroundColor: colors.inputBg,
    },
    inputField: {
      padding: 12,
      color: colors.inputText,
    },
    sliderLabel: {
      marginTop: 16,
      color: colors.labelText,
    },
    sliderValue: {
      marginTop: 4,
      fontWeight: '700',
      color: colors.cardText,
    },
    button: {
      marginTop: 24,
      backgroundColor: colors.buttonBg,
      borderRadius: 20,
      paddingVertical: 16,
      alignItems: 'center',
    },
    buttonText: {
      color: colors.buttonText,
      fontWeight: '700',
      fontSize: 16,
    },
  });

export default LoanDetailsScreen;
