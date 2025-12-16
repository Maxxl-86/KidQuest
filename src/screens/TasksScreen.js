
import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useData } from '../DataContext';

export default function TasksScreen() {
  const { tasks, awardTask } = useData();

  return (
    <View style={styles.container}>
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={<Text style={styles.header}>Aufgaben</Text>}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.points}>+{item.points} Punkte</Text>
            </View>
            <TouchableOpacity style={styles.button} onPress={() => awardTask(item.id)}>
              <Text style={styles.buttonText}>Gemacht!</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 12 },
  item: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#f7f7f7', borderRadius: 8, marginBottom: 8 },
  title: { fontSize: 16, fontWeight: '600' },
  points: { fontSize: 14, color: '#2e7d32', marginTop: 4 },
  button: { backgroundColor: '#2e7d32', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  buttonText: { color: '#fff', fontWeight: 'bold' },
});
