import React, { useMemo, useState, useRef } from 'react';
import {
  Text,
  View,
  Animated,
  StatusBar,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import SimpleSlider from '../components/SimpleSlider';
import { RootStackParamList } from '../navigation/types';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<RootStackParamList, 'EMICalculator'>;

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  currency: 'INR',
  style: 'currency',
  maximumFractionDigits: 0,
});

const EMICalculatorScreen = ({ navigation }: Props) => {
  const [months, setMonths] = useState(10);
  const [loanAmount, setLoanAmount] = useState(10000);
  const [interestRate, setInterestRate] = useState(10);

  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  React.useEffect(() => {
    // Initial entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous pulse animation for amount
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.02,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  const { monthlyPayment, totalPayment, totalInterest } = useMemo(() => {
    const monthlyRate = interestRate / 1200;
    const numerator =
      loanAmount * monthlyRate * Math.pow(1 + monthlyRate, months);
    const denominator = Math.pow(1 + monthlyRate, months) - 1;

    const emi = !denominator ? 0 : Math.round(numerator / denominator);
    const total = emi * months;
    const interest = total - loanAmount;

    return {
      monthlyPayment: emi,
      totalPayment: total,
      totalInterest: interest,
    };
  }, [loanAmount, interestRate, months]);

  const principalPercentage = ((loanAmount / totalPayment) * 100).toFixed(1);
  const interestPercentage = ((totalInterest / totalPayment) * 100).toFixed(1);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={GRADIENT_START} />
      <View style={styles.root}>
        {/* Gradient background effect */}
        <View style={styles.gradientBg}>
          <View style={styles.gradientCircle1} />
          <View style={styles.gradientCircle2} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          bounces={false}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animated.View
            style={[
              styles.header,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <TouchableOpacity
              style={styles.headerIcon}
              onPress={() => navigation.goBack()}
            >
              <Icon name="arrow-left" size={24} color={WHITE} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>EMI Calculator</Text>
            <TouchableOpacity style={styles.headerIcon}>
              <Icon name="information-outline" size={24} color={WHITE} />
            </TouchableOpacity>
          </Animated.View>

          {/* EMI Card */}
          <Animated.View
            style={[
              styles.emiCard,
              {
                opacity: fadeAnim,
                transform: [{ scale: pulseAnim }, { translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.emiCardGlow} />
            <Icon
              name="cash-multiple"
              size={32}
              color={ACCENT}
              style={styles.emiIcon}
            />
            <Text style={styles.emiLabel}>Monthly EMI</Text>
            <Text style={styles.emiAmount}>
              {currencyFormatter.format(monthlyPayment)}
            </Text>
            <View style={styles.emiDivider} />

            {/* Quick stats */}
            <View style={styles.quickStats}>
              <View style={styles.statItem}>
                <Icon name="bank" size={18} color={TEXT_MUTED} />
                <Text style={styles.statValue}>
                  {currencyFormatter.format(loanAmount)}
                </Text>
                <Text style={styles.statLabel}>Principal</Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statItem}>
                <Icon name="chart-line" size={18} color={TEXT_MUTED} />
                <Text style={styles.statValue}>
                  {currencyFormatter.format(totalInterest)}
                </Text>
                <Text style={styles.statLabel}>Interest</Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statItem}>
                <Icon name="wallet" size={18} color={TEXT_MUTED} />
                <Text style={styles.statValue}>
                  {currencyFormatter.format(totalPayment)}
                </Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
            </View>

            {/* Progress bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={
                    [
                      styles.progressFill,
                      { width: `${principalPercentage}%` },
                    ] as any
                  }
                />
              </View>
              <View style={styles.progressLabels}>
                <View style={styles.progressLabelItem}>
                  <View
                    style={[styles.progressDot, { backgroundColor: ACCENT }]}
                  />
                  <Text style={styles.progressText}>
                    Principal {principalPercentage}%
                  </Text>
                </View>
                <View style={styles.progressLabelItem}>
                  <View
                    style={[
                      styles.progressDot,
                      { backgroundColor: PROGRESS_BG },
                    ]}
                  />
                  <Text style={styles.progressText}>
                    Interest {interestPercentage}%
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Controls Card */}
          <Animated.View
            style={[
              styles.controlsCard,
              {
                opacity: fadeAnim,
              },
            ]}
          >
            {/* Loan amount */}
            <View style={styles.controlBlock}>
              <View style={styles.controlHeader}>
                <View style={styles.controlTitleRow}>
                  <Icon name="cash" size={20} color={ACCENT} />
                  <Text style={styles.controlLabel}>Loan Amount</Text>
                </View>
                <Text style={styles.controlValue}>
                  {currencyFormatter.format(loanAmount)}
                </Text>
              </View>
              <SimpleSlider
                minimumValue={1000}
                maximumValue={100000}
                step={1000}
                value={loanAmount}
                onValueChange={setLoanAmount}
              />
              <View style={styles.rangeLabels}>
                <Text style={styles.rangeLabel}>₹1K</Text>
                <Text style={styles.rangeLabel}>₹100K</Text>
              </View>
            </View>

            {/* Interest rate */}
            <View style={styles.controlBlock}>
              <View style={styles.controlHeader}>
                <View style={styles.controlTitleRow}>
                  <Icon name="percent" size={20} color={ACCENT} />
                  <Text style={styles.controlLabel}>Interest Rate</Text>
                </View>
                <Text style={styles.controlValue}>
                  {interestRate.toFixed(1)}% p.a.
                </Text>
              </View>
              <SimpleSlider
                minimumValue={5}
                maximumValue={20}
                step={0.5}
                value={interestRate}
                onValueChange={setInterestRate}
              />
              <View style={styles.rangeLabels}>
                <Text style={styles.rangeLabel}>5%</Text>
                <Text style={styles.rangeLabel}>20%</Text>
              </View>
            </View>

            {/* Repayment */}
            <View style={styles.controlBlock}>
              <View style={styles.controlHeader}>
                <View style={styles.controlTitleRow}>
                  <Icon name="calendar-clock" size={20} color={ACCENT} />
                  <Text style={styles.controlLabel}>Loan Tenure</Text>
                </View>
                <Text style={styles.controlValue}>
                  {months} {months === 1 ? 'Month' : 'Months'}
                </Text>
              </View>
              <SimpleSlider
                minimumValue={6}
                maximumValue={60}
                step={1}
                value={months}
                onValueChange={setMonths}
              />
              <View style={styles.rangeLabels}>
                <Text style={styles.rangeLabel}>6M</Text>
                <Text style={styles.rangeLabel}>60M</Text>
              </View>
            </View>

            {/* CTA */}
            <TouchableOpacity
              style={styles.primaryButton}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('ExploreLoans')}
            >
              <View style={styles.buttonGlow} />
              <Icon
                name="check-circle"
                size={22}
                color={WHITE}
                style={styles.buttonIcon}
              />
              <Text style={styles.primaryButtonText}>Explore Loan Types</Text>
              <Icon name="arrow-right" size={22} color={WHITE} />
            </TouchableOpacity>
          </Animated.View>

          {/* Footer spacing */}
          <View style={styles.footer} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const GRADIENT_START = '#00BE99';
const GRADIENT_END = '#14B8A6';
const ACCENT = '#14B8A6';
const WHITE = '#FFFFFF';
const TEXT_DARK = '#0F172A';
const TEXT_MUTED = '#64748B';
const CARD_BG = '#FFFFFF';
const PROGRESS_BG = '#E2E8F0';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: GRADIENT_START,
  },
  root: {
    flex: 1,
    backgroundColor: GRADIENT_START,
  },
  gradientBg: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  gradientCircle1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: GRADIENT_END,
    opacity: 0.3,
    top: -100,
    right: -100,
  },
  gradientCircle2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: GRADIENT_END,
    opacity: 0.2,
    bottom: 100,
    left: -50,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: WHITE,
  },
  emiCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    backgroundColor: CARD_BG,
    borderRadius: 28,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
    overflow: 'hidden',
  },
  emiCardGlow: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: ACCENT,
    opacity: 0.08,
  },
  emiIcon: {
    marginBottom: 8,
  },
  emiLabel: {
    fontSize: 13,
    color: TEXT_MUTED,
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  emiAmount: {
    fontSize: 42,
    fontWeight: '800',
    color: TEXT_DARK,
    marginBottom: 20,
  },
  emiDivider: {
    height: 1,
    backgroundColor: PROGRESS_BG,
    marginBottom: 20,
  },
  quickStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT_DARK,
    marginTop: 6,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: TEXT_MUTED,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: PROGRESS_BG,
    marginHorizontal: 8,
  },
  progressContainer: {
    marginTop: 4,
  },
  progressBar: {
    height: 8,
    backgroundColor: PROGRESS_BG,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: ACCENT,
    borderRadius: 4,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  progressLabelItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  progressText: {
    fontSize: 11,
    color: TEXT_MUTED,
    fontWeight: '600',
  },
  controlsCard: {
    marginHorizontal: 20,
    backgroundColor: CARD_BG,
    borderRadius: 28,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  controlBlock: {
    marginBottom: 28,
  },
  controlHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  controlTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: TEXT_DARK,
    marginLeft: 10,
  },
  controlValue: {
    fontSize: 16,
    fontWeight: '800',
    color: ACCENT,
  },
  rangeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  rangeLabel: {
    fontSize: 11,
    color: TEXT_MUTED,
    fontWeight: '600',
  },
  primaryButton: {
    marginTop: 8,
    backgroundColor: ACCENT,
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
    overflow: 'hidden',
  },
  buttonGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: WHITE,
    opacity: 0.1,
  },
  buttonIcon: {
    marginRight: 10,
  },
  primaryButtonText: {
    color: WHITE,
    fontWeight: '700',
    fontSize: 16,
    flex: 1,
  },
  footer: {
    height: 20,
  },
});

export default EMICalculatorScreen;
