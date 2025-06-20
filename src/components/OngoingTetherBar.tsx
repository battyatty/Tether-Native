import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTether } from '../context/TetherContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../types';

const OngoingTetherBar: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { activeTether } = useTether();
  const { theme } = useTheme();
  const styles = createStyles(theme);

  if (!activeTether) return null;

  const currentTask = activeTether.tasks[activeTether.currentTaskIndex];
  
  // Calculate remaining time for current task (placeholder - you'll need to add this to your context)
  const remainingTime = currentTask?.duration ? currentTask.duration * 60 : 0; // Convert to seconds

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <TouchableOpacity
      onPress={() => navigation.navigate('ExecutionMode', { tetherId: activeTether.id })}
      activeOpacity={0.8}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Left side - Tether indicator */}
        <View style={styles.tetherIndicator}>
          <Text style={styles.tetherIcon}>T</Text>
        </View>
        
        {/* Middle - Tether and task info */}
        <View style={styles.textContainer}>
          <Text style={styles.tetherName} numberOfLines={1}>
            {activeTether.name}
          </Text>
          <Text style={styles.taskName} numberOfLines={1}>
            {currentTask?.name || 'No active task'}
          </Text>
        </View>
        
        {/* Right side - Time remaining */}
        <View style={styles.timeContainer}>
          <Text style={styles.timeText}>
            {formatDuration(Math.max(0, remainingTime))}
          </Text>
        </View>
      </View>
      
      {/* Progress bar at bottom */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { 
                width: `${(activeTether.currentTaskIndex / activeTether.tasks.length) * 100}%`
              }
            ]} 
          />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    backgroundColor: theme.background.secondary,
    overflow: 'hidden',
    // Removed rounded corners for now
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  tetherIndicator: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.accent.tidewake,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tetherIcon: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.text.inverse,
  },
  textContainer: {
    flex: 1,
    marginRight: 12,
  },
  tetherName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text.primary,
    marginBottom: 1,
  },
  taskName: {
    fontSize: 12,
    color: theme.text.tertiary,
  },
  timeContainer: {
    alignItems: 'flex-end',
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.accent.tidewake,
  },
  progressContainer: {
    paddingHorizontal: 12,
    paddingBottom: 4,
  },
  progressBar: {
    height: 2,
    backgroundColor: theme.border.primary,
    borderRadius: 1,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.accent.tidewake,
    borderRadius: 1,
  },
});

export default OngoingTetherBar;
