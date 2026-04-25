import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import TelegramSender from '@/TelegramSender';

export default function CommunicationScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <TelegramSender />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
