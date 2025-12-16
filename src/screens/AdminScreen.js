
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, Alert } from 'react-native';
import { useData } from '../DataContext';

export default function AdminScreen() {
  const { points, setPoints, tasks, rewards, addTask, removeTask, addReward, removeReward, adminPin, setAdminPin } = useData();
  const [pinInput, setPinInput] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskPts, setTaskPts] = useState('');
  const [rewardTitle, setRewardTitle] = useState('');
  const [rewardCost, setRewardCost] = useState('');

  const tryUnlock = () => {
    if (pinInput === adminPin) setUnlocked(true);
    else Alert.alert('Falscher PIN', 'Bitte erneut versuchen.');
  };

  if (!unlocked) {
    return (
      <View style={styles.container}>
        <Text style={styles.header}>Admin-Bereich</Text>
        <Text style={styles.label}>PIN eingeben:</Text>
        <TextInput
          value={pinInput}
          onChangeText={setPinInput}
          secureTextEntry
          keyboardType="numeric"
          style={styles.input}
          placeholder="****"
        />
        <TouchableOpacity style={styles.button} onPress={tryUnlock}>
          <Text style={styles.buttonText}>Entsperren</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const addPoints = (delta) => {
    setPoints(p => Math.max(0, p + delta));
  };

  const handleAddTask = () => {
    const pts = parseInt(taskPts, 10);
    if (!taskTitle || isNaN(pts)) return Alert.alert('Fehler', 'Titel und Punkte angeben');
    addTask(taskTitle, pts);
    setTaskTitle(''); setTaskPts('');
  };

  const handleAddReward = () => {
    const cost = parseInt(rewardCost, 10);
    if (!rewardTitle || isNaN(cost)) return Alert.alert('Fehler', 'Titel und Kosten angeben');
    addReward(rewardTitle, cost);
    setRewardTitle(''); setRewardCost('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Admin</Text>
      <Text style={styles.sub}>Gesamtpunkte: {points}</Text>
      <View style={styles.row}>
        <TouchableOpacity style={styles.smallBtn} onPress={() => addPoints(5)}><Text style={styles.buttonText}>+5</Text></TouchableOpacity>
        <TouchableOpacity style={styles.smallBtn} onPress={() => addPoints(10)}><Text style={styles.buttonText}>+10</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.smallBtn,{backgroundColor:'#c62828'}]} onPress={() => addPoints(-10)}><Text style={styles.buttonText}>-10</Text></TouchableOpacity>
      </View>

      <Text style={styles.section}>Aufgaben verwalten</Text>
      <View style={styles.row}>
        <TextInput style={[styles.input,{flex:2}]} placeholder="Titel" value={taskTitle} onChangeText={setTaskTitle} />
        <TextInput style={[styles.input,{flex:1}]} placeholder="Punkte" value={taskPts} onChangeText={setTaskPts} keyboardType="numeric" />
        <TouchableOpacity style={styles.button} onPress={handleAddTask}><Text style={styles.buttonText}>Hinzufügen</Text></TouchableOpacity>
      </View>
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.title}>{item.title} (+{item.points})</Text>
            <TouchableOpacity style={[styles.smallBtn,{backgroundColor:'#c62828'}]} onPress={() => removeTask(item.id)}>
              <Text style={styles.buttonText}>Entfernen</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      <Text style={styles.section}>Belohnungen verwalten</Text>
      <View style={styles.row}>
        <TextInput style={[styles.input,{flex:2}]} placeholder="Titel" value={rewardTitle} onChangeText={setRewardTitle} />
        <TextInput style={[styles.input,{flex:1}]} placeholder="Kosten" value={rewardCost} onChangeText={setRewardCost} keyboardType="numeric" />
        <TouchableOpacity style={styles.button} onPress={handleAddReward}><Text style={styles.buttonText}>Hinzufügen</Text></TouchableOpacity>
      </View>
      <FlatList
        data={rewards}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.title}>{item.title} ({item.cost})</Text>
            <TouchableOpacity style={[styles.smallBtn,{backgroundColor:'#c62828'}]} onPress={() => removeReward(item.id)}>
              <Text style={styles.buttonText}>Entfernen</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      <Text style={styles.section}>PIN ändern</Text>
      <View style={styles.row}>
        <TextInput style={[styles.input,{flex:1}]} placeholder="Neuer PIN" secureTextEntry value={pinInput} onChangeText={setPinInput} />
        <TouchableOpacity style={styles.button} onPress={() => { setAdminPin(pinInput); Alert.alert('Gespeichert', 'PIN aktualisiert'); }}>
          <Text style={styles.buttonText}>Speichern</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
  sub: { fontSize: 16, marginBottom: 8 },
  section: { fontSize: 18, fontWeight: 'bold', marginTop: 16, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 8 },
  button: { backgroundColor: '#2e7d32', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 6 },
  smallBtn: { backgroundColor: '#2e7d32', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 6, alignSelf: 'flex-start' },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  item: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, backgroundColor: '#f7f7f7', borderRadius: 8, marginBottom: 8 },
  title: { fontSize: 14, fontWeight: '600' },
});
