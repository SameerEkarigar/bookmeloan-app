import React from 'react';
import {
  Text,
  View,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { RootStackParamList } from '../navigation/types';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<RootStackParamList, 'CreditScore'>;

const insights = [
  {
    title: 'On-time payments',
    value: '95%',
    detail: 'Payments recorded on schedule',
  },
  {
    title: 'Credit utilization',
    value: '32%',
    detail: 'Below the healthy 35% threshold',
  },
  {
    title: 'Public records',
    value: 'Clean',
    detail: 'No collections or liens found',
  },
];

const CreditScoreScreen = ({ navigation }: Props) => (
  <SafeAreaView style={styles.safeArea}>
    <ScrollView contentContainerStyle={styles.container}>
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
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={20} color={ACCENT} />
        </TouchableOpacity>
        <Text style={styles.title}>Credit Score</Text>
        <Text style={styles.subtitle}>
          See how lenders view you and keep everything in great shape.
        </Text>
      </View>

      <View style={styles.scoreCard}>
        <Text style={styles.scoreLabel}>Fresh score</Text>
        <Text style={styles.scoreValue}>781</Text>
        <Text style={styles.scoreGrade}>Excellent</Text>
        <View style={styles.rangeRow}>
          <Text style={styles.rangeText}>300</Text>
          <View style={styles.rangeBar}>
            <View style={[styles.rangeFill, { width: '78%' }]} />
          </View>
          <Text style={styles.rangeText}>900</Text>
        </View>
        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeLabel}>Stable</Text>
            <Text style={styles.badgeValue}>+4 pts</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeLabel}>Report age</Text>
            <Text style={styles.badgeValue}>12m</Text>
          </View>
        </View>
      </View>

      <View style={styles.infoCard}>
        {insights.map(insight => (
          <View key={insight.title} style={styles.infoRow}>
            <Icon name="star" size={18} color={ACCENT} />
            <View style={styles.infoText}>
              <Text style={styles.infoTitle}>{insight.title}</Text>
              <Text style={styles.infoDetail}>{insight.detail}</Text>
            </View>
            <Text style={styles.infoValue}>{insight.value}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={styles.ctaButton}
        onPress={() => navigation.navigate('LoanStatus')}
      >
        <Text style={styles.ctaText}>View detailed report</Text>
        <Icon name="chevron-right" size={20} color={'#00BE99'} />
      </TouchableOpacity>
    </ScrollView>
  </SafeAreaView>
);

const ACCENT = '#14B8A6';
const WHITE = '#FFFFFF';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#00BE99',
  },
  container: {
    paddingBottom: 40,
  },
  header: {
    height: 200,
    backgroundColor: '#00BE99',
    paddingTop: 32,
    paddingHorizontal: 16,
    paddingBottom: 24,
    justifyContent: 'flex-end',
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupImage: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 120,
    height: 120,
    zIndex: 10,
  },
  headerIcon: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 42,
    height: 42,
    zIndex: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: WHITE,
  },
  subtitle: {
    marginTop: 6,
    color: '#E6FFFA',
    fontSize: 14,
    lineHeight: 20,
  },
  scoreCard: {
    marginTop: -8,
    marginHorizontal: 16,
    backgroundColor: WHITE,
    borderRadius: 28,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0F4F1',
  },
  scoreLabel: {
    fontSize: 12,
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scoreValue: {
    fontSize: 56,
    fontWeight: '800',
    color: '#0F172A',
  },
  scoreGrade: {
    fontSize: 18,
    fontWeight: '700',
    color: ACCENT,
    marginBottom: 16,
  },
  rangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  rangeText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  rangeBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E2E8EF',
    marginHorizontal: 12,
  },
  rangeFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: ACCENT,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  badge: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0F4F1',
    borderRadius: 16,
    padding: 12,
    marginRight: 10,
  },
  badgeLabel: {
    fontSize: 12,
    color: '#94A3B8',
  },
  badgeValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  infoCard: {
    marginTop: 16,
    marginHorizontal: 16,
    backgroundColor: WHITE,
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E0F4F1',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  infoDetail: {
    fontSize: 12,
    color: '#94A3B8',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  ctaButton: {
    marginTop: 20,
    borderRadius: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    marginHorizontal: 16,
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: WHITE,
    justifyContent: 'center',
  },
  ctaText: {
    fontSize: 16,
    marginRight: 8,
    color: '#00BE99',
    fontWeight: '700',
  },
});

export default CreditScoreScreen;
