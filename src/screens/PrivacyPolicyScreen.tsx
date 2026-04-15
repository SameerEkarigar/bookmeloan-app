import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const sections = [
  {
    title: 'Data Collection',
    content:
      'We collect what you choose to share (KYC docs, contact information, loan preferences) plus passive diagnostics to keep the app stable.',
  },
  {
    title: 'Usage & Sharing',
    content:
      'Your data powers offer matching and lender communication. We only share with parties you authorize and with whom we have DPA agreements.',
  },
  {
    title: 'Security Controls',
    content:
      'Uploads are encrypted with AES-256, keys rotate automatically, and we keep SOC 2 type II compliance and quarterly penetration testing reports.',
  },
  {
    title: 'Retention & Consent',
    content:
      'Information is retained only for legal or servicing reasons. You can request deletion or download anytime via Help & Support.',
  },
  {
    title: 'Device Integrity',
    content:
      'We verify app signatures, monitor jailbroken devices, and alert you if unusual installs or sessions are detected.',
  },
  {
    title: 'Authentication',
    content:
      'All logins use tokenized sessions and timed OTPs. Session refresh is locked to your device ID plus geo-constraints.',
  },
  {
    title: 'Notifications',
    content:
      'Notification preferences are fully under your control—toggle email, push, and SMS per channel in Settings.',
  },
  {
    title: 'Third-party Integrations',
    content:
      'We integrate with credit bureaus and payment gateways transparently. Each integration has limited scope and logged access.',
  },
  {
    title: 'Audit Trail',
    content:
      'Every critical action (login, verification, doc upload) is logged with timestamp, IP, and device for accountability.',
  },
  {
    title: 'Updates',
    content:
      'Policy updates are versioned; we notify you ahead of impactful changes via email and in-app announcements.',
  },
];

const PrivacyPolicyScreen = () => (
  <SafeAreaView style={styles.safeArea}>
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Privacy Policy</Text>
      <Text style={styles.subtitle}>
        Protecting your identity, documents, and credit trail is central to what
        we do.
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
        <Text style={styles.footerTitle}>Your rights</Text>
        <Text style={styles.footerText}>
          You have the right to access, correct, export, or delete your data.
          Just hit Help & Support to initiate any request.
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
    padding: 18,
    marginTop: 16,
    borderWidth: 1,
    borderRadius: 18,
    borderColor: '#22C55E',
    backgroundColor: '#F6FFFA',
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

export default PrivacyPolicyScreen;
