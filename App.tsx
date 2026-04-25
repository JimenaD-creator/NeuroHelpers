import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MainScreen from './MainScreen';
import TelegramSender from './TelegramSender';

type Screen = 'home' | 'chat';

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');

  if (screen === 'chat') {
    return (
      <SafeAreaView style={styles.chatContainer}>
        <View style={styles.chatHeader}>
          <TouchableOpacity style={styles.backButton} onPress={() => setScreen('home')}>
            <Text style={styles.backText}>← Volver</Text>
          </TouchableOpacity>
          <Text style={styles.chatTitle}>Interfaz de chat</Text>
          <View style={styles.backSpacer} />
        </View>
        <TelegramSender />
      </SafeAreaView>
    );
  }

  return <MainScreen onOpenChat={() => setScreen('chat')} />;
}

const styles = StyleSheet.create({
  chatContainer: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  chatHeader: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  backButton: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  backText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
  },
  chatTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  backSpacer: {
    width: 64,
  },
});