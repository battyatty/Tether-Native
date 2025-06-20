import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Dimensions,
  Animated,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Svg, { Circle } from 'react-native-svg';
import { useTether } from '../context/TetherContext';
import { Tether } from '../types';

const { width } = Dimensions.get('window');

type RootStackParamList = {
  Home: undefined;
  EditTether: { tetherId: string };
  CreateTether: undefined;
  Settings: undefined;
  ExecutionMode: { tetherId: string };
};

type ExecutionModeScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'ExecutionMode'
>;

type ExecutionModeScreenRouteProp = RouteProp<RootStackParamList, 'ExecutionMode'>;

interface Props {
  navigation: ExecutionModeScreenNavigationProp;
  route: ExecutionModeScreenRouteProp;
}

const ExecutionModeScreen: React.FC<Props> = ({ navigation, route }) => {
  const { tetherId } = route.params;
  const { tethers } = useTether();
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isOvertime, setIsOvertime] = useState(false);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const tether = tethers.find(t => t.id === tetherId);
  
  // Timer effect
  useEffect(() => {
    if (isSessionActive && isTimerRunning) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev > 0) {
            return prev - 1;
          } else {
            if (!isOvertime) {
              setIsOvertime(true);
            }
            return prev - 1; // Continue counting into negative (overtime)
          }
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isSessionActive, isTimerRunning, isOvertime]);

  // Reset timer when task changes
  useEffect(() => {
    if (tether && tether.tasks[currentTaskIndex]) {
      setTimeRemaining(tether.tasks[currentTaskIndex].duration);
      setIsOvertime(false);
    }
  }, [currentTaskIndex, tether]);
  
  if (!tether || !tether.tasks || tether.tasks.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Tether not found or has no tasks</Text>
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

  const currentTask = tether.tasks[currentTaskIndex];
  const isFirstTask = currentTaskIndex === 0;
  const isLastTask = currentTaskIndex === tether.tasks.length - 1;

  const handlePrevious = () => {
    if (!isFirstTask) {
      setCurrentTaskIndex(currentTaskIndex - 1);
      setIsTimerRunning(false);
    }
  };

  const handleNext = () => {
    if (!isLastTask) {
      setCurrentTaskIndex(currentTaskIndex + 1);
      setIsTimerRunning(true); // Auto-start timer for next task
    }
  };

  const handleComplete = () => {
    if (isLastTask) {
      setIsTimerRunning(false);
      // Session complete
      Alert.alert(
        'Session Complete!',
        `You've completed all tasks in "${tether.name}"`,
        [
          {
            text: 'Finish',
            onPress: () => {
              setIsSessionActive(false);
              navigation.goBack();
            }
          }
        ]
      );
    } else {
      // Move to next task and auto-start timer
      setCurrentTaskIndex(currentTaskIndex + 1);
      setIsTimerRunning(true); // Auto-start timer when completing current task
    }
  };

  const handleStartSession = () => {
    setIsSessionActive(true);
    setTimeRemaining(currentTask.duration);
    setIsTimerRunning(true);
  };

  const handleEndSession = () => {
    Alert.alert(
      'End Session?',
      'Are you sure you want to end this tether session?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Session',
          style: 'destructive',
          onPress: () => {
            setIsSessionActive(false);
            setIsTimerRunning(false);
            navigation.goBack();
          }
        }
      ]
    );
  };

  const toggleTimer = () => {
    setIsTimerRunning(!isTimerRunning);
  };

  const formatTime = (seconds: number) => {
    const absSeconds = Math.abs(seconds);
    const hours = Math.floor(absSeconds / 3600);
    const minutes = Math.floor((absSeconds % 3600) / 60);
    const secs = absSeconds % 60;
    
    const timeString = hours > 0 
      ? `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      : `${minutes}:${secs.toString().padStart(2, '0')}`;
    
    return seconds < 0 ? `+${timeString}` : timeString;
  };

  const formatDuration = (duration: number) => {
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const seconds = duration % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  // Radial timer calculations
  const radius = 80;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const progress = isOvertime 
    ? 0 
    : Math.max(0, timeRemaining / currentTask.duration);
  const strokeDashoffset = circumference * (1 - progress);

  const RadialTimer = () => (
    <View style={styles.timerContainer}>
      <Svg width={200} height={200} style={styles.timerSvg}>
        {/* Background circle */}
        <Circle
          cx={100}
          cy={100}
          r={radius}
          stroke="#334155"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress circle */}
        <Circle
          cx={100}
          cy={100}
          r={radius}
          stroke={isOvertime ? "#EF4444" : "#00BFA5"}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 100 100)`}
        />
      </Svg>
      <View style={styles.timerTextContainer}>
        <Text style={[styles.timerText, isOvertime && styles.overtimeText]}>
          {formatTime(timeRemaining)}
        </Text>
      </View>
    </View>
  );

  if (!isSessionActive) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.preSessionContainer}>
          <Text style={styles.tetherTitle}>{tether.name}</Text>
          <Text style={styles.taskCount}>{tether.tasks.length} tasks</Text>
          
          <View style={styles.taskPreview}>
            <Text style={styles.previewLabel}>First Task:</Text>
            <Text style={styles.previewTaskName}>{tether.tasks[0].name}</Text>
            <Text style={styles.previewDuration}>
              {formatDuration(tether.tasks[0].duration)}
            </Text>
          </View>

          <TouchableOpacity 
            style={styles.startButton}
            onPress={handleStartSession}
          >
            <Icon name="play-arrow" size={24} color="#FFFFFF" />
            <Text style={styles.startButtonText}>Start Session</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.headerBackButton} onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={20} color="#94A3B8" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{tether.name}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.pauseButton} onPress={toggleTimer}>
            <Icon 
              name={isTimerRunning ? "pause" : "play-arrow"} 
              size={20} 
              color="#00BFA5" 
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.stopButton} onPress={handleEndSession}>
            <Icon name="stop" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Current Task Display */}
      <View style={styles.taskContainer}>
        <Text style={styles.taskName}>{currentTask.name}</Text>
        
        <RadialTimer />
        
        {isOvertime && (
          <Text style={styles.overtimeLabel}>OVERTIME</Text>
        )}
        
        {/* Task Notes if available */}
        {currentTask.notes && (
          <Text style={styles.taskDescription}>{currentTask.notes}</Text>
        )}
      </View>

      {/* Navigation Controls */}
      <View style={styles.controls}>
        <TouchableOpacity 
          style={[styles.controlButton, isFirstTask && styles.disabledButton]}
          onPress={handlePrevious}
          disabled={isFirstTask}
        >
          <Icon name="arrow-back" size={20} color={isFirstTask ? "#64748B" : "#E2E8F0"} />
          <Text style={[styles.controlButtonText, isFirstTask && styles.disabledText]}>
            Previous
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.completeButton}
          onPress={handleComplete}
        >
          <Icon name={isLastTask ? "check" : "check-circle"} size={20} color="#FFFFFF" />
          <Text style={styles.completeButtonText}>
            {isLastTask ? 'Finish' : 'Complete'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.controlButton, isLastTask && styles.disabledButton]}
          onPress={handleNext}
          disabled={isLastTask}
        >
          <Text style={[styles.controlButtonText, isLastTask && styles.disabledText]}>
            Next
          </Text>
          <Icon name="arrow-forward" size={20} color={isLastTask ? "#64748B" : "#E2E8F0"} />
        </TouchableOpacity>
      </View>

      {/* Footer with Task Counter and Progress Bar */}
      <View style={styles.footer}>
        <View style={styles.footerTopRow}>
          <View style={styles.footerLeft}>
            <Icon name="format-list-bulleted" size={16} color="#94A3B8" />
            <Text style={styles.footerEditText}>Edit Tasks</Text>
          </View>
          <Text style={styles.footerTaskCounter}>
            Task {currentTaskIndex + 1} of {tether.tasks.length}
          </Text>
        </View>
        <View style={styles.footerProgressContainer}>
          <View style={styles.footerProgressBar}>
            <View 
              style={[
                styles.footerProgressFill, 
                { width: `${((currentTaskIndex + 1) / tether.tasks.length) * 100}%` }
              ]} 
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A', // Tidewake-background
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#E2E8F0',
    fontSize: 16,
  },
  preSessionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  tetherTitle: {
    color: '#E2E8F0',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  taskCount: {
    color: '#94A3B8',
    fontSize: 16,
    marginBottom: 40,
  },
  taskPreview: {
    backgroundColor: '#1E293B',
    padding: 24,
    borderRadius: 12,
    marginBottom: 40,
    width: '100%',
    borderWidth: 1,
    borderColor: '#334155',
  },
  previewLabel: {
    color: '#94A3B8',
    fontSize: 14,
    marginBottom: 8,
  },
  previewTaskName: {
    color: '#E2E8F0',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  previewDuration: {
    color: '#00BFA5',
    fontSize: 16,
    fontWeight: '500',
  },
  startButton: {
    backgroundColor: '#00BFA5',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 24,
    marginBottom: 16,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  cancelButtonText: {
    color: '#94A3B8',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerBackButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pauseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  stopButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  endSessionText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '500',
  },
  headerTitle: {
    color: '#E2E8F0',
    fontSize: 18,
    fontWeight: '600',
  },
  taskProgress: {
    color: '#94A3B8',
    fontSize: 14,
  },
  taskContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  taskName: {
    color: '#E2E8F0',
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 40,
  },
  taskDuration: {
    color: '#00BFA5',
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 20,
  },
  taskDescription: {
    color: '#CBD5E1',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginTop: 20,
  },
  timerContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  timerSvg: {
    transform: [{ rotate: '0deg' }],
  },
  timerTextContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: {
    color: '#E2E8F0',
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  overtimeText: {
    color: '#EF4444',
  },
  overtimeLabel: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 8,
    letterSpacing: 1,
  },
  playPauseButton: {
    backgroundColor: '#00BFA5',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    gap: 12,
  },
  controlButton: {
    backgroundColor: '#1E293B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    flex: 1,
    borderWidth: 1,
    borderColor: '#334155',
  },
  controlButtonText: {
    color: '#E2E8F0',
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 4,
  },
  completeButton: {
    backgroundColor: '#00BFA5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    flex: 1.5,
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  disabledButton: {
    backgroundColor: '#0F172A',
    borderColor: '#1E293B',
  },
  disabledText: {
    color: '#64748B',
  },
  // Footer styles
  footer: {
    backgroundColor: '#1E293B',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingHorizontal: 20,
    paddingVertical: 12,
    paddingBottom: 8,
  },
  footerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  footerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  footerEditText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '500',
  },
  footerTaskCounter: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '500',
  },
  footerProgressContainer: {
    alignItems: 'center',
  },
  footerProgressBar: {
    width: '90%',
    height: 4,
    backgroundColor: '#334155',
    borderRadius: 2,
  },
  footerProgressFill: {
    height: '100%',
    backgroundColor: '#00BFA5',
    borderRadius: 2,
  },
});

export default ExecutionModeScreen;
