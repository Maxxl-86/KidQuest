
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useData } from '../DataContext';

export default function HomeScreen() {
  const { points } = useData();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Deine Punkte</Text>
      <Text style={styles.points}>{points}</Text>
      <Text style={styles.subtitle}>Sammle Punkte für gute Taten und tausche sie gegen Belohnungen ein!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  points: { fontSize: 64, fontWeight: 'bold', color: '#2e7d32' },
  subtitle: { fontSize: 14, marginTop: 12, textAlign: 'center', color: '#555' },
});
