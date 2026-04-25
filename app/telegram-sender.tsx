import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import TelegramSender from '@/TelegramSender';

export default function TelegramSenderScreen() {
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
