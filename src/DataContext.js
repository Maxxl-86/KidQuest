
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DataContext = createContext();

const STORAGE_KEY = 'familypoints_state_v1';

const defaultTasks = [
  { id: 't1', title: 'Hausaufgaben erledigt', points: 10 },
  { id: 't2', title: 'Zimmer aufräumen', points: 8 },
  { id: 't3', title: 'Müll rausbringen', points: 6 },
  { id: 't4', title: 'Zähne putzen (morgens/abends)', points: 4 },
  { id: 't5', title: 'Freundlich & respektvoll', points: 5 },
];

const defaultRewards = [
  { id: 'r1', title: '30 Min. Tablet-Zeit', cost: 30 },
  { id: 'r2', title: 'Filmabend aussuchen', cost: 50 },
  { id: 'r3', title: 'Kleines Eis', cost: 25 },
  { id: 'r4', title: 'Ausflug am Wochenende', cost: 120 },
];

export function DataProvider({ children }) {
  const [points, setPoints] = useState(0);
  const [tasks, setTasks] = useState(defaultTasks);
  const [rewards, setRewards] = useState(defaultRewards);
  const [history, setHistory] = useState([]); // {id,type,'task'|'reward',title,delta,date}
  const [adminPin, setAdminPin] = useState('1234');

  // Laden
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const state = JSON.parse(raw);
          setPoints(state.points ?? 0);
          setTasks(state.tasks ?? defaultTasks);
          setRewards(state.rewards ?? defaultRewards);
          setHistory(state.history ?? []);
          setAdminPin(state.adminPin ?? '1234');
        }
      } catch (e) {
        console.warn('Laden fehlgeschlagen', e);
      }
    })();
  }, []);

  // Speichern
  useEffect(() => {
    (async () => {
      try {
        const state = { points, tasks, rewards, history, adminPin };
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (e) {
        console.warn('Speichern fehlgeschlagen', e);
      }
    })();
  }, [points, tasks, rewards, history, adminPin]);

  const awardTask = (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    setPoints(p => p + task.points);
    setHistory(h => [{ id: `${Date.now()}`, type: 'task', title: task.title, delta: task.points, date: new Date().toISOString() }, ...h]);
  };

  const redeemReward = (rewardId) => {
    const reward = rewards.find(r => r.id === rewardId);
    if (!reward) return { ok: false, reason: 'Nicht gefunden' };
    if (points < reward.cost) return { ok: false, reason: 'Nicht genug Punkte' };
    setPoints(p => p - reward.cost);
    setHistory(h => [{ id: `${Date.now()}`, type: 'reward', title: reward.title, delta: -reward.cost, date: new Date().toISOString() }, ...h]);
    return { ok: true };
  };

  const addTask = (title, pointsVal) => {
    const id = `t${Date.now()}`;
    setTasks(prev => [{ id, title, points: pointsVal }, ...prev]);
  };

  const removeTask = (id) => setTasks(prev => prev.filter(t => t.id !== id));

  const addReward = (title, cost) => {
    const id = `r${Date.now()}`;
    setRewards(prev => [{ id, title, cost }, ...prev]);
  };

  const removeReward = (id) => setRewards(prev => prev.filter(r => r.id !== id));

  const value = useMemo(() => ({
    points,
    tasks,
    rewards,
    history,
    adminPin,
    setAdminPin,
    awardTask,
    redeemReward,
    addTask,
    removeTask,
    addReward,
    removeReward,
    setPoints,
  }), [points, tasks, rewards, history, adminPin]);

  return (
    <DataContext.Provider value={value}>{children}</DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);
