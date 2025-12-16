
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DataProvider } from './src/DataContext';
import HomeScreen from './src/screens/HomeScreen';
import TasksScreen from './src/screens/TasksScreen';
import RewardsScreen from './src/screens/RewardsScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import AdminScreen from './src/screens/AdminScreen';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <DataProvider>
      <NavigationContainer>
        <StatusBar style="auto" />
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarIcon: ({ focused, color, size }) => {
              let iconName;
              if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
              else if (route.name === 'Aufgaben') iconName = focused ? 'list' : 'list-outline';
              else if (route.name === 'Belohnungen') iconName = focused ? 'gift' : 'gift-outline';
              else if (route.name === 'Verlauf') iconName = focused ? 'time' : 'time-outline';
              else if (route.name === 'Admin') iconName = focused ? 'settings' : 'settings-outline';
              return <Ionicons name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: '#2e7d32',
            tabBarInactiveTintColor: 'gray',
          })}
        >
          <Tab.Screen name="Home" component={HomeScreen} />
          <Tab.Screen name="Aufgaben" component={TasksScreen} />
          <Tab.Screen name="Belohnungen" component={RewardsScreen} />
          <Tab.Screen name="Verlauf" component={HistoryScreen} />
          <Tab.Screen name="Admin" component={AdminScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </DataProvider>
  );
}
