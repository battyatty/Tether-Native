import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
  PanResponder,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { formatTime } from '../utils/helpers';
import { Task } from '../types';

interface SimpleTaskItemProps {
  task: Task;
  index: number;
  onDelete: (taskId: string) => void;
  onDuplicate: (taskId: string) => void; // Restore duplicate functionality
  onToggleAnchor?: (taskId: string) => void;
  onPress?: (taskId: string) => void;
  onLongPress?: (taskId: string) => void;
  formatTime: (seconds: number) => string;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onSelectionToggle?: (taskId: string) => void;
  hideAnchor?: boolean;
  enableSwipe?: boolean; // New prop to enable swipe functionality
}

// Function to format 24-hour time string to 12-hour format with AM/PM
const formatAnchoredTime = (timeString: string): string => {
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
    return timeString; // Return original if parsing fails
  }
};

const SimpleTaskItem: React.FC<SimpleTaskItemProps> = ({
  task,
  index,
  onDelete,
  onDuplicate, // Restore duplicate functionality
  onToggleAnchor,
  onPress,
  onLongPress,
  formatTime,
  isSelectionMode = false,
  isSelected = false,
  onSelectionToggle,
  hideAnchor = false,
  enableSwipe = false,
}) => {
  const translateX = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only enable swipe if enableSwipe is true and not in selection mode
        return enableSwipe && !isSelectionMode && Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 10;
      },
      onPanResponderMove: (evt, gestureState) => {
        translateX.setValue(gestureState.dx);
      },
      onPanResponderRelease: (evt, gestureState) => {
        const { dx } = gestureState;
        
        if (dx > 100) {
          // Swipe right - duplicate
          onDuplicate(task.id);
          resetPosition();
        } else if (dx < -100) {
          // Swipe left - delete
          Alert.alert(
            'Delete Task',
            `Are you sure you want to delete "${task.name}"?`,
            [
              { 
                text: 'Cancel', 
                style: 'cancel',
                onPress: resetPosition
              },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: () => {
                  onDelete(task.id);
                  resetPosition();
                }
              }
            ]
          );
        } else {
          resetPosition();
        }
      },
    })
  ).current;

  const resetPosition = () => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
    }).start();
  };
  const handlePress = () => {
    if (isSelectionMode) {
      onSelectionToggle?.(task.id);
    } else {
      onPress?.(task.id);
    }
  };

  const handleLongPress = () => {
    if (!isSelectionMode) {
      onLongPress?.(task.id);
    }
  };

  const handleAnchorPress = () => {
    onToggleAnchor?.(task.id);
  };

  if (enableSwipe && !isSelectionMode) {
    return (
      <Animated.View
        style={[
          styles.taskItem,
          isSelected && styles.selectedTaskItem,
          !hideAnchor && task.isAnchored && styles.anchoredTaskItem,
          {
            transform: [{ translateX }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity 
          style={styles.taskContent}
          onPress={handlePress}
          onLongPress={handleLongPress}
          activeOpacity={0.7}
        >
          <View style={styles.taskHeader}>
            {isSelectionMode && (
              <View style={styles.checkbox}>
                <Icon 
                  name={isSelected ? "check-box" : "check-box-outline-blank"} 
                  size={20} 
                  color={isSelected ? "#00BFA5" : "#64748B"} 
                />
              </View>
            )}
            <Text style={styles.taskName}>{task.name}</Text>
            <Text style={styles.taskDuration}>{formatTime(task.duration)}</Text>
            {!isSelectionMode && (
              <View style={styles.taskActions}>
                {!hideAnchor && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={handleAnchorPress}
                  >
                    <Icon 
                      name="anchor" 
                      size={16} 
                      color={task.isAnchored ? "#BF92FF" : "#64748B"} 
                    />
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
          {!hideAnchor && task.isAnchored && task.anchoredStartTime && (
            <View style={styles.anchoredRow}>
              <Text style={styles.anchoredTime}>
                Anchored to {formatAnchoredTime(task.anchoredStartTime)}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <View style={[
      styles.taskItem,
      isSelected && styles.selectedTaskItem,
      !hideAnchor && task.isAnchored && styles.anchoredTaskItem
    ]}>
      <TouchableOpacity 
        style={styles.taskContent}
        onPress={handlePress}
        onLongPress={handleLongPress}
        activeOpacity={0.7}
      >
        <View style={styles.taskHeader}>
          {isSelectionMode && (
            <View style={styles.checkbox}>
              <Icon 
                name={isSelected ? "check-box" : "check-box-outline-blank"} 
                size={20} 
                color={isSelected ? "#00BFA5" : "#64748B"} 
              />
            </View>
          )}
          <Text style={styles.taskName}>{task.name}</Text>
          <Text style={styles.taskDuration}>{formatTime(task.duration)}</Text>
          {!isSelectionMode && (
            <View style={styles.taskActions}>
              {!hideAnchor && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleAnchorPress}
                >
                  <Icon 
                    name="anchor" 
                    size={16} 
                    color={task.isAnchored ? "#BF92FF" : "#64748B"} 
                  />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
        {!hideAnchor && task.isAnchored && task.anchoredStartTime && (
          <View style={styles.anchoredRow}>
            <Text style={styles.anchoredTime}>
              Anchored to {formatAnchoredTime(task.anchoredStartTime)}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  taskItem: {
    backgroundColor: '#1E293B',
    marginVertical: 2,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#00BFA5',
  },
  selectedTaskItem: {
    borderLeftColor: '#3B82F6',
    backgroundColor: '#1E40AF20',
  },
  anchoredTaskItem: {
    borderLeftColor: '#BF92FF',
  },
  taskContent: {
    padding: 12,
    borderRadius: 12,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    marginRight: 8,
  },
  taskInfo: {
    flex: 1,
  },
  taskName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#E2E8F0',
    marginRight: 12,
  },
  anchoredRow: {
    marginTop: 6,
  },
  anchoredTime: {
    fontSize: 12,
    color: '#BF92FF',
    fontWeight: '400',
    marginRight: 8,
  },
  taskDuration: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
    marginRight: 8,
  },
  taskActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 6,
    marginLeft: 6,
  },
});

export default SimpleTaskItem;
