
import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useData } from '../DataContext';

export default function RewardsScreen() {
  const { rewards, redeemReward } = useData();

  const handleRedeem = (id) => {
    const res = redeemReward(id);
    if (!res.ok) Alert.alert('Hinweis', res.reason);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={rewards}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={<Text style={styles.header}>Belohnungen</Text>}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.points}>{item.cost} Punkte</Text>
            </View>
            <TouchableOpacity style={styles.button} onPress={() => handleRedeem(item.id)}>
              <Text style={styles.buttonText}>Einlösen</Text>
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
  points: { fontSize: 14, color: '#1e88e5', marginTop: 4 },
  button: { backgroundColor: '#1e88e5', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  buttonText: { color: '#fff', fontWeight: 'bold' },
});
