import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  useWindowDimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { Colors } from './constants/theme';
import { RoleSwitcher } from '@/components/RoleSwitcher';

const BOT_TOKEN = '8368260391:AAHo_Gr81VRg0XHA3We9s9butVaIikH17cg';
const CHAT_ID = '8648890196';

type MessageSender = 'caregiver' | 'care_receiver';

type ChatItem = {
  id: string;
  author: 'incoming' | 'outgoing';
  sender: MessageSender;
  text: string;
  time: string;
  type: 'text' | 'image';
  deliveryStatus?: 'sending' | 'sent' | 'read' | 'failed';
};

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

const SENDER_LABELS: Record<MessageSender, string> = {
  caregiver: 'Cuidador',
  care_receiver: 'Usuario BCI',
};

export default function TelegramSender() {
  const { role } = useAuth();
  const { consumePendingEmergencyChatMessage } = useApp();
  const { width } = useWindowDimensions();
  const isSmall = width < 360;
  const isMedium = width >= 360 && width < 400;
  const isCaregiver = role === 'caregiver';

  const mySender: MessageSender = isCaregiver ? 'caregiver' : 'care_receiver';
  const otherSender: MessageSender = isCaregiver ? 'care_receiver' : 'caregiver';

  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastStatus, setLastStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showSpeller, setShowSpeller] = useState(false);
  const [chat, setChat] = useState<ChatItem[]>([]);
  const [lastUpdateId, setLastUpdateId] = useState<number>(0);

  const seenIncomingIds = useRef<Set<string>>(new Set());
  const scrollRef = useRef<ScrollView>(null);

  const canSend = message.trim().length > 0 && !loading;
  const latestChatItem = chat.length > 0 ? chat[chat.length - 1] : null;
  const showPlayingCard = latestChatItem?.sender !== mySender && !isCaregiver;

  const stateLabel = useMemo(() => {
    if (isCaregiver) return 'Monitoreando';
    if (lastStatus === 'error') return 'Estado: Error';
    return 'Estado: Calmado';
  }, [lastStatus, isCaregiver]);

  useFocusEffect(
    useCallback(() => {
      const pending = consumePendingEmergencyChatMessage();
      if (!pending) return;
      const id = `emergency-${Date.now()}`;
      setChat((prev) => [
        ...prev,
        {
          id,
          author: 'outgoing',
          sender: mySender,
          text: pending.toUpperCase(),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'text',
          deliveryStatus: 'sent',
        },
      ]);
    }, [consumePendingEmergencyChatMessage, mySender])
  );

  const postMessage = async (text: string, msgType: 'text' | 'image' = 'text') => {
    const clean = text.trim();
    if (!clean) return;

    setShowSpeller(false);

    const messageId = String(Date.now());
    const localMessage: ChatItem = {
      id: messageId,
      author: 'outgoing',
      sender: mySender,
      text: msgType === 'image' ? clean : clean.toUpperCase(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: msgType,
      deliveryStatus: 'sending',
    };
    setChat((prev) => [...prev, localMessage]);
    setMessage('');
    setLoading(true);
    setLastStatus('idle');

    try {
      const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: `[${SENDER_LABELS[mySender]}] ${clean}`,
          parse_mode: 'HTML',
        }),
      });
      const data = await response.json();
      if (data.ok) {
        setLastStatus('success');
        setChat((prev) =>
          prev.map((item) => (item.id === messageId ? { ...item, deliveryStatus: 'sent' } : item))
        );
        setTimeout(() => {
          setChat((prev) =>
            prev.map((item) => (item.id === messageId ? { ...item, deliveryStatus: 'read' } : item))
          );
        }, 1800);
      } else {
        setLastStatus('error');
        setChat((prev) =>
          prev.map((item) => (item.id === messageId ? { ...item, deliveryStatus: 'failed' } : item))
        );
        Alert.alert('Error', `Telegram respondió: ${data.description}`);
      }
    } catch (_error) {
      setLastStatus('error');
      setChat((prev) =>
        prev.map((item) => (item.id === messageId ? { ...item, deliveryStatus: 'failed' } : item))
      );
      Alert.alert('Error de red', 'No se pudo conectar a Telegram.');
    } finally {
      setLoading(false);
    }
  };

  const handleImageMock = () => {
    postMessage('📷 [Imagen adjunta]', 'image');
  };

  useEffect(() => {
    let mounted = true;
    let polling = false;
    const pollUpdates = async () => {
      if (polling) return;
      polling = true;
      try {
        const url = `https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?offset=${lastUpdateId + 1}&timeout=20`;
        const res = await fetch(url);
        const data = await res.json();
        if (!mounted || !data.ok || !Array.isArray(data.result)) return;
        let maxId = lastUpdateId;
        const incomingToAppend: ChatItem[] = [];
        for (const update of data.result) {
          if (typeof update.update_id === 'number') {
            maxId = Math.max(maxId, update.update_id);
          }
          const msg = update?.message;
          if (!msg?.text) continue;
          if (String(msg?.chat?.id) !== String(CHAT_ID)) continue;
          const incomingId = `in-${update.update_id}`;
          if (seenIncomingIds.current.has(incomingId)) continue;
          seenIncomingIds.current.add(incomingId);
          incomingToAppend.push({
            id: incomingId,
            author: 'incoming',
            sender: otherSender,
            text: String(msg.text),
            time: new Date((msg.date ?? Math.floor(Date.now() / 1000)) * 1000).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
            type: 'text',
          });
        }
        if (incomingToAppend.length > 0) {
          setChat((prev) => [...prev, ...incomingToAppend]);
        }
        if (maxId > lastUpdateId) {
          setLastUpdateId(maxId);
        }
      } catch {
        // ignore poll errors
      } finally {
        polling = false;
      }
    };
    const interval = setInterval(pollUpdates, 3000);
    pollUpdates();
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [lastUpdateId, otherSender]);

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.wrapper}>
      <View style={styles.phoneFrame}>

        {/* Role Switcher */}
        <RoleSwitcher />

        {/* Chat Header */}
        <View style={styles.header}>
          <Text style={styles.headerName}>{isCaregiver ? 'María' : 'Mamá'}</Text>
          <Text style={styles.online}>En línea</Text>
          <View style={[styles.statePill, isCaregiver && styles.statePillCaregiver]}>
            <View style={[styles.stateDot, isCaregiver && styles.stateDotCaregiver]} />
            <Text style={styles.stateText}>{stateLabel}</Text>
          </View>
        </View>

        {/* Chat Messages */}
        <ScrollView
          ref={scrollRef}
          style={styles.chatArea}
          contentContainerStyle={styles.chatContent}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {chat.map((item) => (
            <MessageBubble key={item.id} item={item} mySender={mySender} />
          ))}

          {showPlayingCard && (
            <View style={styles.voiceCard}>
              <Text style={styles.voiceIcon}>🔊</Text>
              <Text style={styles.voiceTitle}>Reproduciendo...</Text>
              <Text style={styles.wave}>································</Text>
            </View>
          )}
        </ScrollView>

        {/* Bottom Input Panel */}
        {!showSpeller && (
          <View style={styles.bottomPanel}>
            {isCaregiver ? (
              <CaregiverComposer
                message={message}
                setMessage={setMessage}
                canSend={canSend}
                loading={loading}
                isSmall={isSmall}
                isMedium={isMedium}
                onSend={() => postMessage(message)}
                onImageMock={handleImageMock}
              />
            ) : (
              <PatientPanel
                message={message}
                setMessage={setMessage}
                canSend={canSend}
                loading={loading}
                isSmall={isSmall}
                isMedium={isMedium}
                onSend={() => postMessage(message)}
                onOpenSpeller={() => setShowSpeller(true)}
              />
            )}
          </View>
        )}

        {/* BCI Speller (patient only) */}
        {!isCaregiver && showSpeller && (
          <View style={styles.spellerOverlay}>
            <View style={styles.spellerOverlayHeader}>
              <Text style={styles.spellerTitle}>BCI Speller</Text>
              <TouchableOpacity onPress={() => setShowSpeller(false)}>
                <Text style={styles.close}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.composer, isSmall && styles.composerSmall, styles.composerInSpeller]}>
              <TextInput
                style={[styles.input, isSmall && styles.inputSmall]}
                placeholder="Mensaje en composición..."
                placeholderTextColor={Colors.textMuted}
                value={message}
                onChangeText={setMessage}
              />
              <TouchableOpacity
                style={[styles.sendBtn, isSmall && styles.sendBtnSmall, isMedium && styles.sendBtnMedium, !canSend && styles.sendBtnDisabled]}
                onPress={() => postMessage(message)}
                disabled={!canSend}
              >
                {loading ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.sendText}>Enviar</Text>}
              </TouchableOpacity>
            </View>

            <View style={styles.spellerGridWrap}>
              <FlatList
                data={LETTERS}
                keyExtractor={(item, index) => `${item}-${index}`}
                numColumns={5}
                contentContainerStyle={styles.spellerGridContent}
                columnWrapperStyle={styles.spellerGridRow}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.letterBtn, isSmall && styles.letterBtnSmall, styles.letterBtnExpanded]}
                    onPress={() => setMessage((prev) => prev + item)}
                  >
                    <Text style={styles.letterText}>{item}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MessageBubble({ item, mySender }: { item: ChatItem; mySender: MessageSender }) {
  const isOwn = item.sender === mySender;
  const isImage = item.type === 'image';

  const bubbleStyle = isOwn
    ? item.sender === 'caregiver'
      ? styles.bubbleOutCaregiver
      : styles.bubbleOutPatient
    : styles.bubbleIn;

  const textStyle = isOwn
    ? item.sender === 'caregiver'
      ? styles.bubbleTextCaregiver
      : styles.bubbleTextPatient
    : styles.bubbleText;

  return (
    <View style={[styles.bubble, isOwn ? styles.bubbleRight : styles.bubbleLeft, bubbleStyle]}>
      {!isOwn && (
        <Text style={styles.senderLabel}>{SENDER_LABELS[item.sender]}</Text>
      )}
      {isImage ? (
        <View style={styles.imagePreview}>
          <Ionicons name="image" size={28} color={isOwn ? (item.sender === 'caregiver' ? Colors.primary : '#2563EB') : Colors.textSecondary} />
          <Text style={[textStyle, styles.imageText]}>{item.text}</Text>
        </View>
      ) : (
        <Text style={textStyle}>{item.text}</Text>
      )}
      <View style={styles.metaRow}>
        <Text style={styles.bubbleTime}>{item.time}</Text>
        {isOwn && item.deliveryStatus && (
          <DeliveryStatus status={item.deliveryStatus} />
        )}
      </View>
    </View>
  );
}

function CaregiverComposer({
  message, setMessage, canSend, loading, isSmall, isMedium, onSend, onImageMock,
}: {
  message: string;
  setMessage: (v: string) => void;
  canSend: boolean;
  loading: boolean;
  isSmall: boolean;
  isMedium: boolean;
  onSend: () => void;
  onImageMock: () => void;
}) {
  return (
    <View style={styles.caregiverComposerWrap}>
      <TouchableOpacity style={styles.imageBtn} onPress={onImageMock} activeOpacity={0.75}>
        <Ionicons name="camera" size={22} color={Colors.primary} />
      </TouchableOpacity>
      <TextInput
        style={[styles.input, styles.inputCaregiver, isSmall && styles.inputSmall]}
        placeholder="Escribe un mensaje..."
        placeholderTextColor={Colors.textMuted}
        value={message}
        onChangeText={setMessage}
        multiline
      />
      <TouchableOpacity
        style={[styles.sendBtn, styles.sendBtnIcon, isSmall && styles.sendBtnSmall, !canSend && styles.sendBtnDisabled]}
        onPress={onSend}
        disabled={!canSend}
        activeOpacity={0.8}
      >
        {loading
          ? <ActivityIndicator color={Colors.white} size="small" />
          : <Ionicons name="send" size={18} color={Colors.white} />
        }
      </TouchableOpacity>
    </View>
  );
}

function PatientPanel({
  message, setMessage, canSend, loading, isSmall, isMedium, onSend, onOpenSpeller,
}: {
  message: string;
  setMessage: (v: string) => void;
  canSend: boolean;
  loading: boolean;
  isSmall: boolean;
  isMedium: boolean;
  onSend: () => void;
  onOpenSpeller: () => void;
}) {
  return (
    <>
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={[styles.quickBtn, isSmall && styles.quickBtnSmall, styles.spellerToggle]}
          onPress={onOpenSpeller}
          activeOpacity={0.82}
        >
          <Ionicons name="create" size={24} color={Colors.primary} />
          <Text style={[styles.quickText, styles.spellerToggleText, isSmall && styles.quickTextSmall]}>Escribir (Speller)</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.composer, isSmall && styles.composerSmall]}>
        <TextInput
          style={[styles.input, isSmall && styles.inputSmall]}
          placeholder="Mensaje en composición..."
          placeholderTextColor={Colors.textMuted}
          value={message}
          onChangeText={setMessage}
        />
        <TouchableOpacity
          style={[styles.sendBtn, isSmall && styles.sendBtnSmall, isMedium && styles.sendBtnMedium, !canSend && styles.sendBtnDisabled]}
          onPress={onSend}
          disabled={!canSend}
        >
          {loading ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.sendText}>Enviar</Text>}
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerLabel}>Auto-scan activo</Text>
        <View style={styles.scanDots}>
          <View style={[styles.dot, styles.dotOn]} />
          <View style={[styles.dot, styles.dotOn]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
      </View>
    </>
  );
}

function DeliveryStatus({ status }: { status: 'sending' | 'sent' | 'read' | 'failed' }) {
  if (status === 'sending') return <Text style={styles.deliveryPending}>○</Text>;
  if (status === 'failed') return <Text style={styles.deliveryFailed}>!</Text>;
  return (
    <Ionicons
      name="checkmark-done"
      size={14}
      color={status === 'read' ? '#2563EB' : '#9CA3AF'}
      style={styles.deliveryIcon}
    />
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#F3F4F8',
  },
  phoneFrame: {
    flex: 1,
    width: '100%',
    maxWidth: 390,
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerName: { color: Colors.text, fontWeight: '700', fontSize: 20 },
  online: { color: Colors.success, fontWeight: '600', marginTop: 2 },
  statePill: {
    marginTop: 8,
    backgroundColor: '#EDF0F5',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statePillCaregiver: {
    backgroundColor: '#EDE9FE',
  },
  stateDot: { width: 9, height: 9, borderRadius: 99, backgroundColor: Colors.success },
  stateDotCaregiver: { backgroundColor: Colors.primary },
  stateText: { color: Colors.text, fontWeight: '700' },
  chatArea: { flex: 1 },
  chatContent: { paddingHorizontal: 12, paddingVertical: 12, gap: 10 },
  bottomPanel: {
    paddingBottom: 0,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.white,
  },
  // Bubbles
  bubble: {
    maxWidth: '80%',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  bubbleRight: { alignSelf: 'flex-end' },
  bubbleLeft: { alignSelf: 'flex-start' },
  bubbleIn: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border },
  bubbleOutPatient: { backgroundColor: '#DBEAFE', borderWidth: 1, borderColor: '#93C5FD' },
  bubbleOutCaregiver: { backgroundColor: '#EDE9FE', borderWidth: 1, borderColor: '#A78BFA' },
  bubbleText: { color: Colors.text, fontWeight: '600', fontSize: 15 },
  bubbleTextPatient: { color: '#1D4ED8', fontWeight: '600', fontSize: 15 },
  bubbleTextCaregiver: { color: '#5B21B6', fontWeight: '600', fontSize: 15 },
  senderLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    marginBottom: 3,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  imagePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  imageText: {
    fontSize: 14,
  },
  bubbleTime: { color: Colors.textMuted, fontSize: 12, marginTop: 4 },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
    marginTop: 2,
  },
  deliveryIcon: { marginTop: 1 },
  deliveryPending: { color: '#9CA3AF', fontSize: 12, fontWeight: '700', marginTop: 1 },
  deliveryFailed: { color: Colors.emergency, fontSize: 12, fontWeight: '800', marginTop: 1 },
  voiceCard: {
    marginTop: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: '#ECEBFF',
    alignItems: 'center',
    padding: 16,
  },
  voiceIcon: { fontSize: 32 },
  voiceTitle: { marginTop: 4, fontSize: 16, fontWeight: '700', color: Colors.primary },
  wave: { marginTop: 8, color: Colors.primary, fontWeight: '700', letterSpacing: 2 },
  // Caregiver composer
  caregiverComposerWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  imageBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputCaregiver: {
    maxHeight: 80,
    height: undefined,
    paddingVertical: 8,
  },
  sendBtnIcon: {
    minWidth: 40,
    width: 40,
    height: 40,
    borderRadius: 20,
    paddingHorizontal: 0,
  },
  // Patient quick actions
  quickActions: { paddingHorizontal: 14, gap: 7, paddingTop: 8 },
  quickBtn: {
    width: '100%',
    borderWidth: 1.5,
    borderRadius: 13,
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 8,
    overflow: 'hidden',
  },
  quickBtnSmall: { height: 38, paddingHorizontal: 10 },
  quickText: { fontSize: 14, fontWeight: '700', color: Colors.text, flexShrink: 1 },
  quickTextSmall: { fontSize: 14 },
  spellerToggle: {
    borderColor: Colors.primary,
    backgroundColor: '#ECEBFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  spellerToggleText: { color: Colors.primary, textAlign: 'center' },
  // Shared composer
  composer: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  composerSmall: { gap: 6, paddingHorizontal: 10 },
  composerInSpeller: { marginTop: 0, paddingHorizontal: 0, paddingBottom: 6 },
  input: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: Colors.white,
    color: Colors.text,
    fontWeight: '600',
  },
  inputSmall: { height: 38, paddingHorizontal: 10 },
  sendBtn: {
    minWidth: 82,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
  },
  sendBtnSmall: { minWidth: 74, height: 38 },
  sendBtnMedium: { minWidth: 80 },
  sendBtnDisabled: { backgroundColor: '#A7A0F6' },
  sendText: { color: Colors.white, fontWeight: '800', fontSize: 16 },
  // Footer (patient)
  footer: {
    height: 36,
    marginTop: 2,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    gap: 10,
  },
  footerLabel: { color: Colors.textSecondary, fontWeight: '700', fontSize: 12 },
  scanDots: { flexDirection: 'row', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 9, backgroundColor: '#D1D5DB' },
  dotOn: { backgroundColor: Colors.primary },
  // Speller overlay
  spellerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F3F4F8',
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 0,
  },
  spellerOverlayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  spellerTitle: { fontSize: 22, fontWeight: '800', color: Colors.text },
  close: { fontSize: 22, color: Colors.textSecondary, fontWeight: '700' },
  spellerGridWrap: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 14,
    backgroundColor: Colors.white,
    padding: 8,
  },
  spellerGridContent: { flexGrow: 1, justifyContent: 'space-between', paddingBottom: 0 },
  spellerGridRow: { justifyContent: 'space-between', marginBottom: 0 },
  letterBtnExpanded: { flex: 1, marginHorizontal: 3, width: undefined, height: 66 },
  letterBtn: {
    width: '17.8%',
    height: 56,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFF',
  },
  letterBtnSmall: { width: '17.5%', height: 46 },
  letterText: { fontWeight: '700', color: Colors.text, fontSize: 20 },
});
