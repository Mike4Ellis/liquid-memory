/**
 * Liquid Memory Mobile - Navigation
 */
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

import HomeScreen from '../screens/HomeScreen';
import CameraScreen from '../screens/CameraScreen';
import LibraryScreen from '../screens/LibraryScreen';
import SettingsScreen from '../screens/SettingsScreen';
import PromptEditorScreen from '../screens/PromptEditorScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;
          switch (route.name) {
            case 'Home': iconName = focused ? 'home' : 'home-outline'; break;
            case 'Camera': iconName = focused ? 'camera' : 'camera-outline'; break;
            case 'Library': iconName = focused ? 'albums' : 'albums-outline'; break;
            case 'Settings': iconName = focused ? 'settings' : 'settings-outline'; break;
            default: iconName = 'help-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarAccessibilityLabel: route.name,
        tabBarActiveTintColor: colors.accentCyan,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: { backgroundColor: colors.bgPrimary, borderTopColor: colors.border },
        headerStyle: { backgroundColor: colors.bgPrimary },
        headerTintColor: colors.textPrimary,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ tabBarAccessibilityLabel: 'Home tab' }}
      />
      <Tab.Screen 
        name="Camera" 
        component={CameraScreen}
        options={{ tabBarAccessibilityLabel: 'Camera tab' }}
      />
      <Tab.Screen 
        name="Library" 
        component={LibraryScreen}
        options={{ tabBarAccessibilityLabel: 'Library tab' }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ tabBarAccessibilityLabel: 'Settings tab' }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen 
          name="PromptEditor" 
          component={PromptEditorScreen}
          options={{ headerShown: true, title: 'Edit Prompt', headerStyle: { backgroundColor: colors.bgPrimary }, headerTintColor: colors.textPrimary }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
