import { useEffect, useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
} from 'react-native';

import { Fetch } from '../api';

type FaqItem = {
  _id?: string;
  question: string;
  answer: string;
  categoryName?: string;
};

type FaqCategory = {
  _id: string;
  name: string;
  description?: string;
};

type FaqGroup = {
  title: string;
  description?: string;
  items: FaqItem[];
};

const FaqsScreen = () => {
  const [groups, setGroups] = useState<FaqGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadFaqs = async () => {
      setLoading(true);
      setMessage(null);
      try {
        const [categoryResp, faqResp]: any = await Promise.all([
          Fetch(
            'faqcategory',
            { pagination: false, sortKey: 'name', sortDir: 'asc' },
            8000,
            false,
          ),
          Fetch(
            'faq',
            { pagination: false, isActive: true, sortKey: 'createdAt', sortDir: 'desc' },
            8000,
            false,
          ),
        ]);

        const categories: FaqCategory[] =
          categoryResp?.data?.result ||
          categoryResp?.data ||
          [];
        const faqs: FaqItem[] =
          faqResp?.data?.result ||
          faqResp?.data ||
          [];

        const byCategory = new Map<string, FaqGroup>();
        categories.forEach((category) => {
          byCategory.set(category.name, {
            title: category.name,
            description: category.description,
            items: [],
          });
        });

        faqs.forEach((faq) => {
          const title = faq.categoryName || 'General';
          if (!byCategory.has(title)) {
            byCategory.set(title, { title, items: [] });
          }
          byCategory.get(title)?.items.push(faq);
        });

        const nextGroups = Array.from(byCategory.values()).filter(
          (group) => group.items.length > 0,
        );
        setGroups(nextGroups);
        if (!nextGroups.length) {
          setMessage('No FAQs available right now.');
        }
      } catch (error: any) {
        setGroups([]);
        setMessage('Unable to load FAQs right now.');
      } finally {
        setLoading(false);
      }
    };

    loadFaqs();
  }, []);

  const groupedCount = useMemo(
    () => groups.reduce((sum, group) => sum + group.items.length, 0),
    [groups],
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        <Text style={styles.mainTitle}>FAQs</Text>
        <View style={styles.highlight}>
          <Text style={styles.highlightTitle}>Still unsure?</Text>
          <Text style={styles.highlightCopy}>
            Our support team can walk you through documentation, timelines, and
            repayment options—just tap Help & Support.
          </Text>
        </View>

        {loading && (
          <View style={styles.loader}>
            <ActivityIndicator color="#fff" />
            <Text style={styles.loaderText}>Loading FAQs...</Text>
          </View>
        )}

        {!loading && message && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>{message}</Text>
          </View>
        )}

        {!loading &&
          groups.map((category) => (
            <View key={category.title} style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{category.title}</Text>
                <Text style={styles.sectionCount}>
                  {category.items.length} / {groupedCount}
                </Text>
              </View>
              {category.description && (
                <Text style={styles.sectionDescription}>
                  {category.description}
                </Text>
              )}
              {category.items.map((faq) => (
                <View key={faq._id || faq.question} style={styles.card}>
                  <View style={styles.badgeDot} />
                  <Text style={styles.question}>{faq.question}</Text>
                  <Text style={styles.answer}>{faq.answer}</Text>
                </View>
              ))}
            </View>
          ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#00BE99',
  },
  container: {
    padding: 16,
    paddingBottom: 8,
  },
  mainTitle: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 12,
  },
  highlight: {
    backgroundColor: '#F7FFFA',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#22C55E',
  },
  highlightTitle: {
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  highlightCopy: {
    color: '#0F172A',
    lineHeight: 20,
  },
  loader: {
    alignItems: 'center',
    marginVertical: 20,
  },
  loaderText: {
    color: '#E6FFFA',
    marginTop: 8,
    fontWeight: '600',
  },
  emptyState: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 16,
    marginVertical: 12,
  },
  emptyText: {
    color: '#E6FFFA',
    textAlign: 'center',
  },
  section: {
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E6FFFA',
  },
  sectionCount: {
    color: '#E6FFFA',
    fontSize: 12,
  },
  sectionDescription: {
    color: '#D1FAE5',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00BE99',
    marginBottom: 8,
  },
  question: {
    fontWeight: '700',
    color: '#0F172A',
  },
  answer: {
    marginTop: 8,
    color: '#64748B',
  },
});

export default FaqsScreen;
