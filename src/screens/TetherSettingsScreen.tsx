import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { RootStackParamList, TetherMode } from '../types';
import { useTether } from '../context/TetherContext';

type TetherSettingsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'TetherSettings'>;
type TetherSettingsScreenRouteProp = RouteProp<RootStackParamList, 'TetherSettings'>;

interface TetherSettingsScreenProps {
  navigation: TetherSettingsScreenNavigationProp;
  route: TetherSettingsScreenRouteProp;
}

const TetherSettingsScreen: React.FC<TetherSettingsScreenProps> = ({ navigation, route }) => {
  const { tetherId } = route.params;
  const { tethers, updateTetherMode } = useTether();
  
  const tether = tethers.find(t => t.id === tetherId);
  const [tempStartTime, setTempStartTime] = useState('09:00');

  if (!tether) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Tether not found</Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleModeChange = async (mode: TetherMode, startTime?: string) => {
    try {
      await updateTetherMode(tetherId, mode, startTime);
      // Changes apply immediately without closing the page
    } catch (err) {
      Alert.alert('Error', 'Failed to update tether settings');
    }
  };

  const currentMode = tether.mode || TetherMode.FLEXIBLE;

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getTotalDuration = () => {
    return tether.tasks.reduce((total, task) => total + task.duration, 0);
  };

  // Helper functions for tether time display (matching EditTetherScreen)
  const formatScheduledTime = (timeString: string): string => {
    try {
      const [hours, minutes] = timeString.split(':').map(Number);
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);
      
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return timeString;
    }
  };

  const calculateEndTime = (startTime: string, durationInSeconds: number): string => {
    try {
      const [hours, minutes] = startTime.split(':').map(Number);
      const startDate = new Date();
      startDate.setHours(hours, minutes, 0, 0);
      
      const endDate = new Date(startDate.getTime() + (durationInSeconds * 1000));
      
      return endDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return 'Invalid time';
    }
  };

  const renderTetherStats = () => {
    if (currentMode === TetherMode.FLEXIBLE || !currentMode) {
      // Flexible tether: [clock icon] Anytime • [Duration]
      return (
        <View style={styles.tetherStatsContainer}>
          <Icon name="schedule" size={14} color="#00BFA5" />
          <Text style={[styles.tetherStatsText, styles.flexibleModeColor]}> Anytime</Text>
          <Text style={[styles.tetherStatsDot, styles.flexibleModeColor]}> • </Text>
          <Text style={[styles.tetherStatsText, styles.flexibleModeColor]}>{formatTime(getTotalDuration())}</Text>
        </View>
      );
    } else {
      // Scheduled tether: [clock icon] [start time - end time] • [duration]
      const startTime = formatScheduledTime(tether.scheduledStartTime!);
      const endTime = calculateEndTime(tether.scheduledStartTime!, getTotalDuration());
      
      return (
        <View style={styles.tetherStatsContainer}>
          <Icon name="schedule" size={14} color="#BF92FF" />
          <Text style={[styles.tetherStatsText, styles.scheduledModeColor]}> {startTime} - {endTime}</Text>
          <Text style={[styles.tetherStatsDot, styles.scheduledModeColor]}> • </Text>
          <Text style={[styles.tetherStatsText, styles.scheduledModeColor]}>{formatTime(getTotalDuration())}</Text>
        </View>
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#00BFA5" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tether Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Tether Info */}
        <View style={styles.tetherInfo}>
          <Text style={styles.tetherName}>{tether.name}</Text>
          {renderTetherStats()}
        </View>

        {/* Time Mode Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Time Mode</Text>
          <Text style={styles.sectionDescription}>
            Choose how you want to schedule this tether
          </Text>

          {/* Segmented Control */}
          <View style={styles.segmentedControl}>
            <TouchableOpacity
              style={[
                styles.segmentButton,
                styles.leftSegment,
                currentMode === TetherMode.FLEXIBLE && styles.selectedSegment
              ]}
              onPress={() => handleModeChange(TetherMode.FLEXIBLE)}
            >
              <Icon 
                name="schedule" 
                size={16} 
                color={currentMode === TetherMode.FLEXIBLE ? "#FFFFFF" : "#94A3B8"} 
                style={styles.segmentIcon}
              />
              <Text style={[
                styles.segmentText,
                currentMode === TetherMode.FLEXIBLE && styles.selectedSegmentText
              ]}>
                Flexible
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.segmentButton,
                styles.rightSegment,
                currentMode === TetherMode.SCHEDULED && styles.selectedScheduledSegment
              ]}
              onPress={() => {
                const startTime = tether.scheduledStartTime || tempStartTime;
                handleModeChange(TetherMode.SCHEDULED, startTime);
              }}
            >
              <Icon 
                name="access-time" 
                size={16} 
                color={currentMode === TetherMode.SCHEDULED ? "#FFFFFF" : "#94A3B8"} 
                style={styles.segmentIcon}
              />
              <Text style={[
                styles.segmentText,
                currentMode === TetherMode.SCHEDULED && styles.selectedScheduledSegmentText
              ]}>
                Scheduled
              </Text>
            </TouchableOpacity>
          </View>

          {/* Time Picker for Scheduled Mode */}
          {currentMode === TetherMode.SCHEDULED && (
            <View style={styles.timeSection}>
              <Text style={styles.timeSectionTitle}>Start Time</Text>
              <View style={styles.timePicker}>
                <Icon name="access-time" size={20} color="#BF92FF" />
                <Text style={styles.timeValue}>
                  {tether.scheduledStartTime ? 
                    new Date(`2000-01-01T${tether.scheduledStartTime}`).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    }) : 
                    '9:00 AM'
                  }
                </Text>
                <TouchableOpacity style={styles.editTimeButton}>
                  <Text style={styles.editTimeText}>Edit</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#E2E8F0',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  tetherInfo: {
    alignItems: 'center',
    marginBottom: 32,
    paddingVertical: 16,
  },
  tetherName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E2E8F0',
    marginBottom: 4,
  },
  tetherStats: {
    fontSize: 14,
    color: '#94A3B8',
  },
  tetherStatsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tetherStatsText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '500',
  },
  tetherStatsDot: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '500',
  },
  flexibleModeColor: {
    color: '#00BFA5',
  },
  scheduledModeColor: {
    color: '#BF92FF',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#E2E8F0',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 20,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    overflow: 'hidden',
  },
  segmentButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  leftSegment: {
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },
  rightSegment: {
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    borderLeftWidth: 1,
    borderLeftColor: '#334155',
  },
  selectedSegment: {
    backgroundColor: '#00BFA5',
  },
  selectedScheduledSegment: {
    backgroundColor: '#BF92FF',
  },
  segmentIcon: {
    marginRight: 6,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#94A3B8',
  },
  selectedSegmentText: {
    color: '#FFFFFF',
  },
  selectedScheduledSegmentText: {
    color: '#FFFFFF',
  },
  timeSection: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BF92FF30',
  },
  timeSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E2E8F0',
    marginBottom: 12,
  },
  timePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timeValue: {
    flex: 1,
    fontSize: 16,
    color: '#BF92FF',
    fontWeight: '500',
  },
  editTimeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#BF92FF20',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BF92FF',
  },
  editTimeText: {
    fontSize: 14,
    color: '#BF92FF',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    color: '#EF4444',
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: '#1E293B',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#E2E8F0',
  },
});

export default TetherSettingsScreen;
