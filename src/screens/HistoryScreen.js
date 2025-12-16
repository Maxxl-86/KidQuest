
import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useData } from '../DataContext';

export default function HistoryScreen() {
  const { history } = useData();

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Verlauf</Text>
      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.title}>{item.type === 'task' ? 'Aufgabe:' : 'Belohnung:'} {item.title}</Text>
            <Text style={[styles.delta, { color: item.delta > 0 ? '#2e7d32' : '#c62828' }]}>
              {item.delta > 0 ? '+' : ''}{item.delta}
            </Text>
            <Text style={styles.date}>{new Date(item.date).toLocaleString()}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 12 },
  item: { padding: 12, backgroundColor: '#f7f7f7', borderRadius: 8, marginBottom: 8 },
  title: { fontSize: 14, fontWeight: '600' },
  delta: { fontSize: 16, fontWeight: 'bold', marginTop: 4 },
  date: { fontSize: 12, color: '#666', marginTop: 4 },
});
