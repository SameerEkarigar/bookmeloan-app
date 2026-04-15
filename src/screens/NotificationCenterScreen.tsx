import {
  Text,
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useState, useMemo, useEffect } from 'react';
import Icon from 'react-native-vector-icons/Feather';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Fetch, Put } from '../api';

type NotificationItem = {
  _id: string;
  title: string;
  message: string;
  status?: 'unread' | 'read' | 'deleted';
  createdAt?: string;
  type?: string;
};

const icons: Record<string, string> = {
  offer: 'gift',
  doc: 'file-text',
  reminder: 'clock',
  security: 'shield',
  'offer-unlocked': 'gift',
  'profile-updated': 'user',
  'account-created': 'check-circle',
  'documents-uploaded': 'file-text',
};

const NotificationCenterScreen = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const unreadCount = useMemo(
    () => notifications.filter(item => item.status !== 'read').length,
    [notifications],
  );

  const loadNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const data: any = await Fetch('user/notifications', { limit: 1000 });
      const list = data?.data?.result || data?.result || data?.data || [];
      setNotifications(list);
    } catch (err: any) {
      setError(err?.message || 'Unable to load notifications.');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const markAll = async () => {
    if (!unreadCount) return;
    try {
      await Put('user/notifications/mark-read?markAll=true', {});
      setNotifications(prev =>
        prev.map(item => ({ ...item, status: 'read', readAt: new Date() })),
      );
    } catch (err: any) {
      setError(err?.message || 'Unable to mark all read.');
    }
  };

  const toggleRead = async (id: string, current?: string) => {
    if (current === 'read') return;
    try {
      await Put(`user/notifications/mark-read?notificationId=${id}`, {});
      setNotifications(prev =>
        prev.map(item =>
          item._id === id ? { ...item, status: 'read' } : item,
        ),
      );
    } catch (err: any) {
      setError(err?.message || 'Unable to update notification.');
    }
  };

  const formatTime = (value?: string) => {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: 'short',
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Notifications & Alerts</Text>
            <Text style={styles.subTitle}>
              {unreadCount} unread notifications
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={markAll}
          disabled={!unreadCount}
          style={[styles.markAllButton, !unreadCount && styles.markAllDisabled]}
        >
          <View style={styles.markAllIcon}>
            <Icon
              size={12}
              name="check"
              color={unreadCount ? '#0F172A' : '#94A3B8'}
            />
          </View>
          <Text style={[styles.markAllText, !unreadCount && styles.disabled]}>
            Mark all read
          </Text>
        </TouchableOpacity>

        {loading && (
          <View style={styles.loader}>
            <ActivityIndicator color="#00BE99" />
          </View>
        )}

        {!loading && error && <Text style={styles.errorText}>{error}</Text>}

        {!loading && !error && !notifications.length && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>All caught up</Text>
            <Text style={styles.emptySubtitle}>
              You’ll see loan updates, offers, and reminders here.
            </Text>
          </View>
        )}

        {!loading &&
          notifications.map(alert => (
            <View
              key={alert._id}
              style={[
                styles.card,
                alert.status === 'read' ? styles.cardRead : styles.cardUnread,
              ]}
            >
              <View style={styles.cardHeader}>
                <View style={styles.iconCircle}>
                  <Icon
                    name={icons[alert.type || ''] || 'bell'}
                    size={20}
                    color="#00BE99"
                  />
                </View>
                <View style={styles.cardTextBlock}>
                  <Text style={styles.cardTitle}>{alert.title}</Text>
                  <Text style={styles.cardSubtitle} numberOfLines={2}>
                    {alert.message}
                  </Text>
                </View>
              </View>
              <View style={styles.cardFooter}>
                <Text style={styles.cardTime}>
                  {formatTime(alert.createdAt)}
                </Text>
                {alert.status !== 'read' && (
                  <TouchableOpacity
                    onPress={() => toggleRead(alert._id, alert.status)}
                  >
                    <Text style={styles.action}>Mark read</Text>
                  </TouchableOpacity>
                )}
              </View>
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
    paddingBottom: 12,
  },
  title: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '700',
  },
  subTitle: {
    color: '#E6FFFA',
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  markAllText: {
    color: '#0F172A',
    fontWeight: '700',
  },
  disabled: {
    color: '#94A3B8',
  },
  loader: { paddingVertical: 20, alignItems: 'center' },
  errorText: { color: '#DC2626', marginVertical: 8 },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 10,
  },
  emptyTitle: { fontWeight: '700', fontSize: 16, color: '#0F172A' },
  emptySubtitle: { color: '#94A3B8', marginTop: 4 },
  markAllButton: {
    gap: 8,
    width: 170,
    borderWidth: 1,
    borderRadius: 14,
    marginBottom: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderColor: '#D1FAE5',
    backgroundColor: '#E0F2F1',
  },
  markAllDisabled: {
    backgroundColor: '#F1F5F9',
  },
  markAllIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 8 },
  },
  cardUnread: {
    borderWidth: 1,
    borderColor: '#00BE99',
  },
  cardRead: {
    opacity: 0.6,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#E6FFFA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardTextBlock: {
    flex: 1,
  },
  cardTitle: {
    fontWeight: '700',
    color: '#0F172A',
  },
  cardSubtitle: {
    color: '#64748B',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardTime: {
    fontSize: 12,
    color: '#94A3B8',
  },
  action: {
    color: '#00BE99',
    fontWeight: '600',
  },
});

export default NotificationCenterScreen;
