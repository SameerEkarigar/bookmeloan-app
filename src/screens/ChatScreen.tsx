import { useEffect, useRef, useState } from 'react';
import {
  Text,
  View,
  Alert,
  TextInput,
  FlatList,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { io, Socket } from 'socket.io-client';
import { BASE_URL, Fetch, Post } from '../api';
import { SafeAreaView } from 'react-native-safe-area-context';

const TAG_OPTIONS = [
  'urgent_support_required',
  'manually_escalated_to_level_2',
  'identity_verification_failed',
  'support_ticket_raised_by_host',
] as const;

type SupportTone = 'assistant' | 'user';

type SupportMessage = {
  id: string;
  text: string;
  tone: SupportTone;
  createdAt?: string;
};

type TicketSummary = {
  _id: string;
  title?: string;
  status?: string;
};

const SOCKET_URL = BASE_URL.replace(/\/api\/?$/i, '');

const parseTickets = (response: any): TicketSummary[] => {
  const rows =
    response?.data?.result || response?.result || response?.data || response;
  if (!Array.isArray(rows)) return [];
  return rows
    .map((ticket: any) => ({
      _id: String(ticket?._id || ticket?.id || ''),
      title: ticket?.title || 'Support ticket',
      status: ticket?.status,
    }))
    .filter((ticket: TicketSummary) => Boolean(ticket._id));
};

const parseMessages = (response: any): SupportMessage[] => {
  const rows =
    response?.data?.messages ||
    response?.messages ||
    response?.data ||
    response ||
    [];
  if (!Array.isArray(rows)) return [];

  return rows.map((item: any, index: number) => {
    const senderType = String(item?.senderType || item?.initiatorType || '')
      .trim()
      .toLowerCase();
    const tone: SupportTone = senderType === 'agent' ? 'assistant' : 'user';
    return {
      id: String(item?.id || item?._id || `msg-${Date.now()}-${index}`),
      text: String(item?.text || item?.content || ''),
      tone,
      createdAt: item?.createdAt || item?.timestamp,
    };
  });
};

const ChatScreen = () => {
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [tickets, setTickets] = useState<TicketSummary[]>([]);
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [title, setTitle] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState('');
  const [selectedTag, setSelectedTag] = useState(TAG_OPTIONS[0]);
  const chatScrollRef = useRef<ScrollView | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const upsertMessage = (incoming: SupportMessage) => {
    setMessages(prev => {
      if (prev.some(item => item.id === incoming.id)) return prev;
      return [...prev, incoming];
    });
  };

  const fetchMessages = async (ticketId: string) => {
    setLoadingMessages(true);
    try {
      const response: any = await Fetch(`/support/tickets/${ticketId}/messages`);
      setMessages(parseMessages(response));
    } catch (error: any) {
      setMessages([]);
      Alert.alert('Unable to load chat', error?.message || 'Try again later.');
    } finally {
      setLoadingMessages(false);
    }
  };

  const refreshTickets = async (preferredTicketId?: string) => {
    const response: any = await Fetch('/support/tickets');
    const list = parseTickets(response);
    setTickets(list);
    if (!list.length) {
      setActiveTicketId(null);
      setMessages([]);
      return null;
    }
    const pickedId =
      preferredTicketId && list.some(ticket => ticket._id === preferredTicketId)
        ? preferredTicketId
        : list[0]._id;
    setActiveTicketId(pickedId);
    return pickedId;
  };

  useEffect(() => {
    const bootstrap = async () => {
      setInitializing(true);
      try {
        const me: any = await Fetch('user/get-current-user');
        const userId = String(me?.data?._id || me?.data?.id || '');
        if (!userId) {
          throw new Error('Unable to identify the current user.');
        }
        setCurrentUserId(userId);

        const pickedId = await refreshTickets();
        if (pickedId) {
          await fetchMessages(pickedId);
        }
      } catch (error: any) {
        Alert.alert(
          'Support unavailable',
          error?.message || 'Unable to initialize support chat.',
        );
      } finally {
        setInitializing(false);
      }
    };

    bootstrap();
  }, []);

  useEffect(() => {
    if (!currentUserId || !activeTicketId) return;

    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
      forceNew: true,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('register-user', currentUserId);
      socket.emit('join-ticket-room', { ticketId: activeTicketId });
    });

    socket.on('support:new-message', (payload: any) => {
      if (String(payload?.ticketId || '') !== String(activeTicketId)) return;
      const parsed = parseMessages({ data: [payload] })[0];
      if (parsed) upsertMessage(parsed);
    });

    return () => {
      socket.emit('leave-ticket-room', { ticketId: activeTicketId });
      socket.disconnect();
      socketRef.current = null;
    };
  }, [activeTicketId, currentUserId]);

  useEffect(() => {
    if (!activeTicketId) return;
    fetchMessages(activeTicketId);
  }, [activeTicketId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      chatScrollRef.current?.scrollToEnd({ animated: true });
    }, 80);
    return () => clearTimeout(timer);
  }, [messages, loadingMessages]);

  const sendMessage = async () => {
    if (!draft.trim()) return;
    if (!activeTicketId) {
      Alert.alert('No ticket selected', 'Please raise a ticket first.');
      return;
    }

    const content = draft.trim();
    setDraft('');
    try {
      const response: any = await Post(
        `/support/tickets/${activeTicketId}/messages`,
        {
          content,
        },
      );
      const parsed = parseMessages({ data: [response?.data?.message] })[0];
      if (parsed) upsertMessage(parsed);
    } catch (error: any) {
      Alert.alert('Cannot send message', error?.message || 'Try again later.');
    }
  };

  const raiseTicket = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert(
        'Missing information',
        'Please provide both title and description.',
      );
      return;
    }
    try {
      setLoading(true);
      const response: any = await Post('/support/tickets', {
        title,
        description,
        tags: [selectedTag],
      });
      const createdTicketId = String(
        response?.data?._id || response?.data?.id || '',
      );
      const nextTicketId = (await refreshTickets(createdTicketId)) || createdTicketId;
      if (nextTicketId) {
        await fetchMessages(nextTicketId);
      }
      setTitle('');
      setDescription('');
      Alert.alert(
        'Ticket raised',
        'Your request is logged with our support team.',
      );
    } catch (error: any) {
      Alert.alert('Cannot raise ticket', error?.message || 'Try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Live Support Chat</Text>

        <View style={styles.ticketCard}>
          <Text style={styles.ticketTitle}>Raise a formal ticket</Text>
          <TextInput
            placeholder="One-line summary"
            placeholderTextColor="#94A3B8"
            value={title}
            onChangeText={setTitle}
            style={styles.ticketInput}
          />
          <TextInput
            placeholder="Describe your issue in detail"
            placeholderTextColor="#94A3B8"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            style={[styles.ticketInput, styles.multiline]}
          />
          <View style={styles.tagRow}>
            {TAG_OPTIONS.map(tag => (
              <TouchableOpacity
                key={tag}
                style={[
                  styles.tagPill,
                  selectedTag === tag && styles.tagActive,
                ]}
                onPress={() => setSelectedTag(tag)}
              >
                <Text
                  style={[
                    styles.tagText,
                    selectedTag === tag && styles.tagActiveText,
                  ]}
                >
                  {tag.replace(/_/g, ' ')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={styles.ticketButton}
            onPress={raiseTicket}
            disabled={loading || initializing}
          >
            <Text style={styles.ticketButtonText}>
              {loading ? 'Submitting...' : 'Submit ticket'}
            </Text>
          </TouchableOpacity>
        </View>

        {tickets.length > 0 && (
          <View style={styles.ticketPicker}>
            <FlatList
              horizontal
              data={tickets}
              keyExtractor={item => item._id}
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.ticketPill,
                    item._id === activeTicketId && styles.ticketPillActive,
                  ]}
                  onPress={() => setActiveTicketId(item._id)}
                >
                  <Text
                    style={[
                      styles.ticketPillText,
                      item._id === activeTicketId && styles.ticketPillTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    {item.title || 'Ticket'}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        <View style={styles.chatWindow}>
          {initializing || loadingMessages ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color="#00BE99" />
            </View>
          ) : messages.length === 0 ? (
            <Text style={styles.emptyText}>
              {activeTicketId
                ? 'No messages yet. Send the first message.'
                : 'Create a ticket to start support chat.'}
            </Text>
          ) : (
            <ScrollView ref={chatScrollRef}>
              {messages.map(msg => (
                <View
                  key={msg.id}
                  style={[
                    styles.message,
                    msg.tone === 'user' ? styles.messageUser : styles.messageAssist,
                  ]}
                >
                  <Text style={styles.messageText}>{msg.text}</Text>
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        <View style={styles.inputRow}>
          <TextInput
            placeholder="Type a message"
            placeholderTextColor="#94A3B8"
            value={draft}
            onChangeText={setDraft}
            style={styles.input}
            editable={Boolean(activeTicketId)}
          />
          <TouchableOpacity
            style={styles.sendButton}
            onPress={sendMessage}
            disabled={!activeTicketId || !draft.trim()}
          >
            <Text style={styles.sendText}>Send</Text>
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
  container: {
    padding: 16,
    paddingBottom: 16,
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
  },
  chatWindow: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    minHeight: 260,
  },
  emptyText: {
    color: '#64748B',
    textAlign: 'center',
    marginTop: 24,
  },
  loadingWrap: {
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    maxWidth: '80%',
  },
  messageUser: {
    backgroundColor: '#DCFCE7',
    alignSelf: 'flex-end',
  },
  messageAssist: {
    backgroundColor: '#F8FAFC',
    alignSelf: 'flex-start',
  },
  messageText: {
    color: '#0F172A',
  },
  inputRow: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
    borderRadius: 16,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  sendButton: {
    backgroundColor: '#00BE99',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sendText: {
    color: '#fff',
    fontWeight: '700',
  },
  ticketCard: {
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 10 },
  },
  ticketTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  ticketInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  multiline: {
    height: 90,
    textAlignVertical: 'top',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  tagPill: {
    borderWidth: 1,
    borderColor: '#CBD5F5',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagActive: {
    borderColor: '#00BE99',
    backgroundColor: '#E6F9F1',
  },
  tagText: {
    color: '#64748B',
    fontSize: 12,
  },
  tagActiveText: {
    color: '#0F7D66',
    fontWeight: '600',
  },
  ticketButton: {
    backgroundColor: '#00BE99',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  ticketButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  ticketPicker: {
    marginBottom: 12,
  },
  ticketPill: {
    marginRight: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    backgroundColor: '#EEF2FF',
    maxWidth: 220,
  },
  ticketPillActive: {
    borderColor: '#00BE99',
    backgroundColor: '#D1FAE5',
  },
  ticketPillText: {
    color: '#334155',
    fontSize: 12,
  },
  ticketPillTextActive: {
    color: '#065F46',
    fontWeight: '700',
  },
});

export default ChatScreen;
