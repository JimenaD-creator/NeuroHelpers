import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

const BOT_TOKEN = '<TOKEN>';
const CHAT_ID = '<USER_ID>';

export default function TelegramSender() {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastStatus, setLastStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const sendMessage = async () => {
    if (!message.trim()) {
      Alert.alert('Campo vacío', 'Por favor escribe un mensaje antes de enviar.');
      return;
    }

    setLoading(true);
    setLastStatus('idle');

    try {
      const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: message,
          parse_mode: 'HTML',
        }),
      });

      const data = await response.json();

      if (data.ok) {
        setLastStatus('success');
        setMessage('');
        Alert.alert('✅ Enviado', 'Mensaje enviado a Telegram correctamente.');
      } else {
        setLastStatus('error');
        Alert.alert('❌ Error', `Telegram respondió: ${data.description}`);
      }
    } catch (error) {
      setLastStatus('error');
      Alert.alert('❌ Error de red', 'No se pudo conectar con Telegram. Verifica tu conexión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.wrapper}
    >
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.icon}>✈️</Text>
          <Text style={styles.title}>Telegram Sender</Text>
          <Text style={styles.subtitle}>Envía mensajes a tu bot</Text>
        </View>

        {/* Chat ID indicator */}
        <View style={styles.chatIdBadge}>
          <Text style={styles.chatIdText}>📬 Chat ID: {CHAT_ID}</Text>
        </View>

        {/* Input */}
        <TextInput
          style={[styles.input, message.length > 0 && styles.inputActive]}
          placeholder="Escribe tu mensaje aquí..."
          placeholderTextColor="#94a3b8"
          value={message}
          onChangeText={setMessage}
          multiline
          numberOfLines={4}
          maxLength={4096}
          textAlignVertical="top"
        />

        {/* Character count */}
        <Text style={styles.charCount}>{message.length} / 4096</Text>

        {/* Send button */}
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={sendMessage}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Enviar mensaje</Text>
          )}
        </TouchableOpacity>

        {/* Status indicator */}
        {lastStatus !== 'idle' && (
          <View style={[styles.statusBadge, lastStatus === 'success' ? styles.statusSuccess : styles.statusError]}>
            <Text style={styles.statusText}>
              {lastStatus === 'success' ? '✅ Mensaje enviado con éxito' : '❌ Error al enviar'}
            </Text>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f1f5f9',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 5,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  icon: {
    fontSize: 40,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  chatIdBadge: {
    backgroundColor: '#eff6ff',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginBottom: 16,
    alignSelf: 'center',
  },
  chatIdText: {
    fontSize: 13,
    color: '#2563eb',
    fontWeight: '600',
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#0f172a',
    minHeight: 120,
    backgroundColor: '#f8fafc',
  },
  inputActive: {
    borderColor: '#2563eb',
    backgroundColor: '#fff',
  },
  charCount: {
    textAlign: 'right',
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 6,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: '#93c5fd',
    shadowOpacity: 0,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  statusBadge: {
    marginTop: 14,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  statusSuccess: {
    backgroundColor: '#f0fdf4',
  },
  statusError: {
    backgroundColor: '#fef2f2',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
});
