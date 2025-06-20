import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { AuthProvider } from '@/context/AuthContext';
// Import Firebase to ensure it's initialized
import '@/firebaseConfig';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={{ marginTop: 10 }}>Loading...</Text>
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen 
            name="index"
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="(tabs)" 
            options={{ headerShown: false }} 
          />
          <Stack.Screen 
            name="login" 
            options={{ headerShown: false }} 
          />
          <Stack.Screen 
            name="signup" 
            options={{ headerShown: false }} 
          />
          <Stack.Screen 
            name="transactionList" 
            options={{ 
              headerShown: true, 
              headerTitle: 'Transaction List', 
              headerStyle: { backgroundColor: '#3498db' }, 
              headerTintColor: '#fff', 
            }} 
          />
          <Stack.Screen 
            name="notifications" 
            options={{ 
              headerShown: true, 
              headerTitle: 'Notifications', 
              headerStyle: { backgroundColor: '#3498db' }, 
              headerTintColor: '#fff', 
            }} 
          />
          <Stack.Screen 
            name="upcomingTransactionList" 
            options={{ 
              headerShown: true, 
              headerTitle: 'Upcoming Transactions', 
              headerStyle: { backgroundColor: '#3498db' }, 
              headerTintColor: '#fff', 
            }} 
          />
        </Stack>
      </AuthProvider>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

