import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAuth } from 'firebase/auth';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';


const SettingsScreen: React.FC = () => {
  const { user } = useAuth();
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(true);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  const [isDarkModeEnabled, setIsDarkModeEnabled] = useState(false);
  const [isTransactionAlertsEnabled, setIsTransactionAlertsEnabled] = useState(true);
  const [isWeeklyReportsEnabled, setIsWeeklyReportsEnabled] = useState(false);

  const toggleNotifications = () =>
    setIsNotificationsEnabled((previousState) => !previousState);
  const toggleBiometric = () =>
    setIsBiometricEnabled((previousState) => !previousState);
  const toggleDarkMode = () =>
    setIsDarkModeEnabled((previousState) => !previousState);
  const toggleTransactionAlerts = () =>
    setIsTransactionAlertsEnabled((previousState) => !previousState);
  const toggleWeeklyReports = () =>
    setIsWeeklyReportsEnabled((previousState) => !previousState);

  const handleAccountPress = () => {
    // Navigate to Account Settings or handle action
    console.log('Account settings pressed');
  };

  const handlePaymentMethodPress = () => {
    console.log('Payment method pressed');
  };

  const handleHelpAndSupportPress = () => {
    console.log('Help and support pressed');
  };

  const handleSignOut = async () => {
    try {
      await getAuth().signOut();
      router.replace('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Function to render a settings item with toggle
  const renderSwitchItem = (label: string, value: boolean, onToggle: () => void, icon: string) => (
    <View style={styles.item}>
      <View style={styles.labelContainer}>
        <Ionicons name={icon as any} size={22} color="#3498db" style={styles.icon} />
        <Text style={styles.label}>{label}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#d0d0d0', true: '#3498db' }}
        thumbColor={value ? '#fff' : '#fff'}
      />
    </View>
  );

  // Function to render a settings item with chevron
  const renderLinkItem = (label: string, onPress: () => void, icon: string, textColor = '#333') => (
    <TouchableOpacity style={styles.item} onPress={onPress}>
      <View style={styles.labelContainer}>
        <Ionicons name={icon as any} size={22} color="#3498db" style={styles.icon} />
        <Text style={[styles.label, { color: textColor }]}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#999" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Header with profile summary */}
        <View style={styles.profileSection}>
          <View style={styles.profileDetails}>
            <View style={styles.profileIcon}>
              <Text style={styles.profileInitial}>
                {user?.email ? user.email[0].toUpperCase() : 'U'}
              </Text>
            </View>
            <View>
              <Text style={styles.profileName}>{user?.email?.split('@')[0] || 'User'}</Text>
              <Text style={styles.profileEmail}>{user?.email}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.editButton}>
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Settings Sections */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Preferences</Text>
        </View>
        {renderSwitchItem('Notifications', isNotificationsEnabled, toggleNotifications, 'notifications-outline')}
      
        {renderSwitchItem('Dark Mode', isDarkModeEnabled, toggleDarkMode, 'moon-outline')}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Account & Security</Text>
        </View>
        {renderLinkItem('Account Information', handleAccountPress, 'person-outline')}
      
      
        {renderLinkItem('Change Password', handleAccountPress, 'lock-closed-outline')}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Support</Text>
        </View>
        {renderLinkItem('Help & Support', handleHelpAndSupportPress, 'help-circle-outline')}
        {renderLinkItem('Privacy Policy', handleHelpAndSupportPress, 'shield-outline')}
        {renderLinkItem('Terms of Service', handleHelpAndSupportPress, 'document-outline')}

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={20} color="#fff" style={{ marginRight: 10 }} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
        
        <Text style={styles.versionText}>App Version 1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SettingsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  profileSection: {
    backgroundColor: '#fff',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  profileDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  profileInitial: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  profileEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  editButton: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
  },
  editButtonText: {
    color: '#3498db',
    fontWeight: '500',
  },
  sectionHeader: {
    padding: 15,
    paddingBottom: 5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  item: {
    paddingVertical: 16,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 12,
  },
  label: {
    fontSize: 16,
    color: '#333',
  },
  signOutButton: {
    backgroundColor: '#e74c3c',
    marginHorizontal: 15,
    marginVertical: 30,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  signOutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  versionText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 12,
    marginBottom: 30,
  }
});
