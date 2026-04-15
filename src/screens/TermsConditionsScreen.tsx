import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const sections = [
  {
    title: 'Acceptance',
    content:
      'Using the app means you accept the terms, our privacy practices, fee disclosures, and the flow of loans through our partners.',
  },
  {
    title: 'Eligibility',
    content:
      'You must be 18+, hold a valid government ID, and reside in India. Additional verification may be required for high-ticket offers.',
  },
  {
    title: 'Account Responsibility',
    content:
      'Treat your credentials securely. Notify us immediately if you suspect unauthorized access—logout, change password, and contact Help & Support.',
  },
  {
    title: 'Loan Offers',
    content:
      'Offers shown are indicative. Final terms depend on lender approval, due diligence, and timely submission of documents.',
  },
  {
    title: 'Fees',
    content:
      'Processing fees, GST, and third-party charges are disclosed before you accept an offer. We never hide service costs.',
  },
  {
    title: 'Repayment',
    content:
      'EMI schedules appear in Loan Status. Missing dues may incur interest or penalties per lender guidelines.',
  },
  {
    title: 'Document Usage',
    content:
      'Documents are used solely for onboarding, credit assessment, and compliance. Copies are removed once the contract ends.',
  },
  {
    title: 'Dispute Resolution',
    content:
      'Reach out via Help & Support for any grievance. We escalate and respond within 72 hours and provide mediation options.',
  },
  {
    title: 'Modification',
    content:
      'We may update these terms in response to law changes. You will be notified and continued use implies acceptance.',
  },
  {
    title: 'Termination',
    content:
      'Either party may terminate the service by settling dues and closing the account. Outstanding obligations survive termination.',
  },
];

const TermsConditionsScreen = () => (
  <SafeAreaView style={styles.safeArea}>
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Terms & Conditions</Text>
      <Text style={styles.subtitle}>
        Read these carefully before accepting to continue using BookMe Loan
        services.
      </Text>
      <View style={styles.grid}>
        {sections.map(section => (
          <View key={section.title} style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionContent}>{section.content}</Text>
          </View>
        ))}
      </View>
      <View style={styles.footer}>
        <Text style={styles.footerTitle}>Need clarity?</Text>
        <Text style={styles.footerText}>
          Contact Help & Support for plain English explanations or to download a
          PDF summary.
        </Text>
      </View>
    </ScrollView>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#00BE99',
  },
  container: {
    padding: 16,
    paddingBottom: 12,
  },
  title: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    color: '#E6FFFA',
    marginBottom: 16,
    lineHeight: 22,
  },
  grid: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
  },
  sectionCard: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionContent: {
    marginTop: 6,
    color: '#64748B',
    lineHeight: 20,
  },
  footer: {
    marginTop: 16,
    backgroundColor: '#FDF7EE',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#FDC436',
  },
  footerTitle: {
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  footerText: {
    color: '#0F172A',
    lineHeight: 20,
  },
});

export default TermsConditionsScreen;
