import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Switch,
  Alert,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTether } from '../context/TetherContext';
import { useTheme } from '../context/ThemeContext';
import { RootStackParamList } from '../types';

type SettingsScreenNavigationProp = StackNavigationProp<RootStackParamList>;
type SettingsScreenRouteProp = RouteProp<RootStackParamList, 'MainTabs'>;

interface SettingsScreenProps {
  navigation: SettingsScreenNavigationProp;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const { tethers } = useTether();
  const { theme, themeName, toggleTheme } = useTheme();
  
  // Mock settings state - in a real app, these would be stored in AsyncStorage or context
  const [notifications, setNotifications] = useState(true);
  const [autoStart, setAutoStart] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);

  const handleExportData = () => {
    Alert.alert(
      'Export Data',
      'Export all tethers and settings to backup file?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Export', 
          onPress: () => {
            // TODO: Implement data export
            Alert.alert('Success', 'Data exported successfully!');
          }
        }
      ]
    );
  };

  const handleImportData = () => {
    Alert.alert(
      'Import Data',
      'Import tethers and settings from backup file?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Import', 
          onPress: () => {
            // TODO: Implement data import
            Alert.alert('Success', 'Data imported successfully!');
          }
        }
      ]
    );
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will delete all tethers and reset settings. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: () => {
            // TODO: Implement data clearing
            Alert.alert('Cleared', 'All data has been cleared.');
          }
        }
      ]
    );
  };

  const SettingItem: React.FC<{
    icon: string;
    title: string;
    value?: boolean;
    onToggle?: (value: boolean) => void;
    onPress?: () => void;
    showArrow?: boolean;
    color?: string;
  }> = ({ icon, title, value, onToggle, onPress, showArrow = false, color }) => (
    <TouchableOpacity 
      style={[styles.settingItem, { backgroundColor: theme.background.secondary, borderBottomColor: theme.border.primary }]} 
      onPress={onPress}
      disabled={!onPress && !onToggle}
    >
      <View style={styles.settingLeft}>
        <Icon name={icon} size={20} color={color || theme.text.primary} />
        <Text style={[styles.settingTitle, { color: color || theme.text.primary }]}>{title}</Text>
      </View>
      <View style={styles.settingRight}>
        {onToggle && (
          <Switch
            value={value}
            onValueChange={onToggle}
            thumbColor={value ? theme.accent.tidewake : theme.text.tertiary}
            trackColor={{ false: theme.border.secondary, true: theme.accent.tidewake + '80' }}
          />
        )}
        {showArrow && (
          <Icon name="chevron-right" size={20} color={theme.text.tertiary} />
        )}
      </View>
    </TouchableOpacity>
  );

  const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
    <Text style={[styles.sectionHeader, { color: theme.text.secondary }]}>{title}</Text>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background.primary }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border.primary }]}>
          <TouchableOpacity 
            style={[styles.backButton, { backgroundColor: theme.background.secondary }]}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color={theme.text.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text.primary }]}>Settings</Text>
          <View style={styles.placeholder} />
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Icon name="anchor" size={48} color={theme.accent.tidewake} />
          <Text style={[styles.appName, { color: theme.text.primary }]}>TetherApp</Text>
          <Text style={[styles.appVersion, { color: theme.text.secondary }]}>Version 1.0.0</Text>
          <Text style={[styles.tetherCount, { color: theme.accent.tidewake }]}>{tethers.length} Tethers Created</Text>
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <SectionHeader title="Notifications" />
          <SettingItem
            icon="notifications"
            title="Enable Notifications"
            value={notifications}
            onToggle={setNotifications}
          />
          <SettingItem
            icon="volume-up"
            title="Sound"
            value={soundEnabled}
            onToggle={setSoundEnabled}
          />
          <SettingItem
            icon="vibration"
            title="Vibration"
            value={vibrationEnabled}
            onToggle={setVibrationEnabled}
          />
        </View>

        {/* Behavior */}
        <View style={styles.section}>
          <SectionHeader title="Behavior" />
          <SettingItem
            icon="play-arrow"
            title="Auto-start next task"
            value={autoStart}
            onToggle={setAutoStart}
          />
          <SettingItem
            icon="dark-mode"
            title="Theme"
            value={themeName === 'deepwake'}
            onToggle={toggleTheme}
          />
        </View>

        {/* Data Management */}
        <View style={styles.section}>
          <SectionHeader title="Data Management" />
          <SettingItem
            icon="upload"
            title="Export Data"
            onPress={handleExportData}
            showArrow
          />
          <SettingItem
            icon="download"
            title="Import Data"
            onPress={handleImportData}
            showArrow
          />
          <SettingItem
            icon="delete-forever"
            title="Clear All Data"
            onPress={handleClearData}
            showArrow
            color={theme.accent.danger}
          />
        </View>

        {/* About */}
        <View style={styles.section}>
          <SectionHeader title="About" />
          <SettingItem
            icon="help"
            title="Help & FAQ"
            onPress={() => Alert.alert('Help', 'Help documentation coming soon!')}
            showArrow
          />
          <SettingItem
            icon="feedback"
            title="Send Feedback"
            onPress={() => Alert.alert('Feedback', 'Feedback feature coming soon!')}
            showArrow
          />
          <SettingItem
            icon="info"
            title="Privacy Policy"
            onPress={() => Alert.alert('Privacy', 'Privacy policy coming soon!')}
            showArrow
          />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.text.tertiary }]}>
            Made with ⚓ for better task management
          </Text>
          <Text style={[styles.footerText, { color: theme.text.tertiary }]}>
            © 2025 TetherApp
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 12,
  },
  appVersion: {
    fontSize: 14,
    marginTop: 4,
  },
  tetherCount: {
    fontSize: 14,
    marginTop: 8,
    fontWeight: '500',
  },
  section: {
    paddingVertical: 8,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 12,
    marginBottom: 4,
    textAlign: 'center',
  },
});

export default SettingsScreen;
