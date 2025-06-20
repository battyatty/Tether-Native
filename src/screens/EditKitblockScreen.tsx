import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTether } from '../context/TetherContext';
import { RootStackParamList, Task } from '../types';
import { MobileTaskInput, SimpleTaskItem, QuickTaskInput, GestureHandlerTest } from '../components';

type EditKitblockScreenNavigationProp = StackNavigationProp<RootStackParamList, 'EditKitblock'>;
type EditKitblockScreenRouteProp = RouteProp<RootStackParamList, 'EditKitblock'>;

interface Props {
  navigation: EditKitblockScreenNavigationProp;
  route: EditKitblockScreenRouteProp;
}

const EditKitblockScreen: React.FC<Props> = ({ navigation, route }) => {
  const { kitblockId } = route.params;
  const { 
    kitblocks, 
    addTaskToKitblock, 
    deleteTaskFromKitblock, 
    duplicateTaskInKitblock 
  } = useTether();
  
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [showQuickTaskInput, setShowQuickTaskInput] = useState(false);
  
  const kitblock = kitblocks.find(kb => kb.id === kitblockId);

  const handleTaskSave = async (task: Task) => {
    try {
      await addTaskToKitblock(kitblockId, task);
      // Don't close the input or show alert for rapid entry
    } catch (err) {
      Alert.alert('Error', 'Failed to add task to kitblock');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    console.log('handleDeleteTask called with taskId:', taskId);
    try {
      await deleteTaskFromKitblock(kitblockId, taskId);
      console.log('Task deleted from kitblock successfully');
      // Task deleted successfully
    } catch (err) {
      console.error('Failed to delete task from kitblock:', err);
      Alert.alert('Error', 'Failed to delete task');
    }
  };

  const handleDuplicateTask = async (taskId: string) => {
    console.log('handleDuplicateTask called with taskId:', taskId);
    try {
      await duplicateTaskInKitblock(kitblockId, taskId);
      console.log('Task duplicated in kitblock successfully');
      Alert.alert('Success', 'Task duplicated successfully!');
    } catch (err) {
      console.error('Failed to duplicate task in kitblock:', err);
      Alert.alert('Error', 'Failed to duplicate task');
    }
  };

  const handleTaskEdit = (taskId: string) => {
    if (!kitblock) return;
    const task = kitblock.tasks.find(t => t.id === taskId);
    if (task) {
      navigation.navigate('EditTask', {
        task,
        sourceType: 'kitblock',
        sourceId: kitblockId,
      });
    }
  };

  // Bulk selection handlers
  const handleLongPress = (taskId: string) => {
    if (isSelectionMode) {
      // Exit bulk action mode completely
      setIsSelectionMode(false);
      setSelectedTaskIds(new Set());
    } else {
      // Enter bulk action mode and select the pressed task
      setIsSelectionMode(true);
      setSelectedTaskIds(new Set([taskId]));
    }
  };

  const handleSelectionToggle = (taskId: string) => {
    const newSelected = new Set(selectedTaskIds);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else {
      newSelected.add(taskId);
    }
    setSelectedTaskIds(newSelected);
    
    // Exit selection mode if no items selected
    if (newSelected.size === 0) {
      setIsSelectionMode(false);
    }
  };

  const handleSelectAll = () => {
    if (!kitblock) return;
    if (selectedTaskIds.size === kitblock.tasks.length) {
      // Deselect all but STAY in selection mode (Gmail behavior)
      setSelectedTaskIds(new Set());
    } else {
      // Select all
      setSelectedTaskIds(new Set(kitblock.tasks.map(task => task.id)));
    }
  };

  const handleBulkDelete = async () => {
    const taskCount = selectedTaskIds.size;
    Alert.alert(
      'Delete Tasks',
      `Are you sure you want to delete ${taskCount} task${taskCount !== 1 ? 's' : ''} from this kitblock?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              for (const taskId of Array.from(selectedTaskIds)) {
                await deleteTaskFromKitblock(kitblockId, taskId);
              }
              setSelectedTaskIds(new Set());
              setIsSelectionMode(false);
              Alert.alert('Success', `${taskCount} task${taskCount !== 1 ? 's' : ''} deleted successfully!`);
            } catch (err) {
              Alert.alert('Error', 'Failed to delete some tasks');
            }
          }
        }
      ]
    );
  };

  const handleBulkDuplicate = async () => {
    const taskCount = selectedTaskIds.size;
    try {
      for (const taskId of Array.from(selectedTaskIds)) {
        await duplicateTaskInKitblock(kitblockId, taskId);
      }
      setSelectedTaskIds(new Set());
      setIsSelectionMode(false);
      Alert.alert('Success', `${taskCount} task${taskCount !== 1 ? 's' : ''} duplicated successfully!`);
    } catch (err) {
      Alert.alert('Error', 'Failed to duplicate some tasks');
    }
  };

  const handleCancelSelection = () => {
    setIsSelectionMode(false);
    setSelectedTaskIds(new Set());
  };

  const handleBackPress = () => {
    if (isSelectionMode) {
      // Exit selection mode
      setIsSelectionMode(false);
      setSelectedTaskIds(new Set());
    } else {
      // Normal back navigation
      navigation.goBack();
    }
  };

  const toggleSelectionMode = () => {
    if (!kitblock) return;
    
    if (!isSelectionMode) {
      // Enter selection mode with no tasks selected
      setIsSelectionMode(true);
      setSelectedTaskIds(new Set());
    } else {
      // When in selection mode, cycle through states but STAY in selection mode
      if (selectedTaskIds.size === 0) {
        // None selected -> select all (stay in selection mode)
        setSelectedTaskIds(new Set(kitblock.tasks.map(task => task.id)));
      } else if (selectedTaskIds.size === kitblock.tasks.length) {
        // All selected -> deselect all (STAY in selection mode)
        setSelectedTaskIds(new Set());
      } else {
        // Some selected -> select all (stay in selection mode)
        setSelectedTaskIds(new Set(kitblock.tasks.map(task => task.id)));
      }
      // Note: We never set setIsSelectionMode(false) here - user stays in selection mode
    }
  };

  const getSelectionIcon = () => {
    if (!kitblock) return "check-box-outline-blank";
    
    if (!isSelectionMode) {
      return "check-box-outline-blank"; // Grayed out checkbox when not in selection mode
    } else if (selectedTaskIds.size === 0) {
      return "check-box-outline-blank"; // Empty checkbox
    } else if (selectedTaskIds.size === kitblock.tasks.length) {
      return "check-box"; // Full checkbox
    } else {
      return "indeterminate-check-box"; // Partial checkbox
    }
  };

  const getSelectionColor = () => {
    if (!isSelectionMode) {
      return "#64748B"; // Gray when not in selection mode
    } else if (selectedTaskIds.size === 0) {
      return "#64748B"; // Gray for empty
    } else {
      return "#00BFA5"; // Teal for selected/partial
    }
  };

  if (!kitblock) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Kitblock not found</Text>
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

  const formatDuration = (duration: number) => {
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const getTotalDuration = () => {
    if (!kitblock) return 0;
    return kitblock.tasks.reduce((total, task) => total + task.duration, 0);
  };

  const renderKitblockStats = () => {
    const taskCount = kitblock.tasks.length;
    const duration = getTotalDuration();
    
    return (
      <View style={styles.kitblockStatsContainer}>
        <Text style={styles.kitblockStatsText}>{taskCount} task{taskCount !== 1 ? 's' : ''}</Text>
        <Text style={styles.kitblockStatsDot}> • </Text>
        <Icon name="schedule" size={14} color="#94A3B8" />
        <Text style={styles.kitblockStatsText}> {formatDuration(duration)}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Dynamic Header - Normal or Selection Mode */}
      {!isSelectionMode ? (
        // Normal Header
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleBackPress}
            >
              <Icon name="arrow-back" size={24} color="#00BFA5" />
            </TouchableOpacity>
            <View style={styles.titleContainer}>
              <Text style={styles.kitblockTitle}>{kitblock.name}</Text>
            </View>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => {/* TODO: Edit functionality */}}
            >
              <Icon name="edit" size={20} color="#00BFA5" />
            </TouchableOpacity>
          </View>
          {renderKitblockStats()}
        </View>
      ) : (
        // Selection Mode Header
        <View style={styles.selectionHeader}>
          <View style={styles.selectionLeftContainer}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleBackPress}
            >
              <Icon name="arrow-back" size={24} color="#E2E8F0" />
            </TouchableOpacity>
            
            <Text style={styles.selectionTitle}>
              {selectedTaskIds.size}
            </Text>
          </View>
          
          <View style={styles.selectionActions}>
            <TouchableOpacity
              style={styles.selectionActionButton}
              onPress={toggleSelectionMode}
            >
              <Icon 
                name={getSelectionIcon()} 
                size={24} 
                color="#E2E8F0" 
              />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.selectionActionButton}
              onPress={selectedTaskIds.size > 0 ? handleBulkDuplicate : undefined}
              disabled={selectedTaskIds.size === 0}
            >
              <Icon 
                name="content-copy" 
                size={24} 
                color={selectedTaskIds.size > 0 ? "#E2E8F0" : "#64748B"} 
              />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.selectionActionButton}
              onPress={selectedTaskIds.size > 0 ? handleBulkDelete : undefined}
              disabled={selectedTaskIds.size === 0}
            >
              <Icon 
                name="delete" 
                size={24} 
                color={selectedTaskIds.size > 0 ? "#EF4444" : "#64748B"} 
              />
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {kitblock.description && (
          <View style={styles.infoSection}>
            <Text style={styles.kitblockDescription}>{kitblock.description}</Text>
          </View>
        )}

        <View style={styles.tasksSection}>
          <Text style={styles.sectionTitle}>Tasks</Text>
          
          {kitblock.tasks.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="playlist-add" size={48} color="#64748B" />
              <Text style={styles.emptyStateText}>No tasks yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Tap the + button to add your first task
              </Text>
            </View>
          ) : (
            kitblock.tasks.map((task, index) => (
              <GestureHandlerTest 
                key={task.id}
                onSwipeLeft={() => handleDeleteTask(task.id)}
                onSwipeRight={() => handleDuplicateTask(task.id)}
              >
                <SimpleTaskItem
                  task={task}
                  index={index}
                  onDelete={handleDeleteTask}
                  onDuplicate={handleDuplicateTask}
                  onPress={handleTaskEdit}
                  onLongPress={handleLongPress}
                  formatTime={formatDuration}
                  isSelectionMode={isSelectionMode}
                  isSelected={selectedTaskIds.has(task.id)}
                  onSelectionToggle={handleSelectionToggle}
                  hideAnchor={true}
                  enableSwipe={true}
                />
              </GestureHandlerTest>
            ))
          )}
        </View>
      </ScrollView>

      {/* Add Task FAB - Hide in selection mode */}
      {!isSelectionMode && (
        <TouchableOpacity
          style={styles.addTaskFab}
          onPress={() => setShowQuickTaskInput(true)}
          activeOpacity={0.8}
        >
          <Icon name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      {/* Quick Task Input */}
      <QuickTaskInput
        visible={showQuickTaskInput}
        onSave={handleTaskSave}
        onClose={() => setShowQuickTaskInput(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
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
  header: {
    flexDirection: 'column',
    padding: 20,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftHeaderSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  kitblockTitle: {
    color: '#E2E8F0',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  kitblockStatsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kitblockStatsText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '500',
  },
  kitblockStatsDot: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '500',
  },
  headerTitle: {
    color: '#E2E8F0',
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  infoSection: {
    marginBottom: 32,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  kitblockDescription: {
    color: '#CBD5E1',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
  },
  tasksSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#E2E8F0',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  taskCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#00BFA5',
    borderWidth: 1,
    borderColor: '#334155',
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskNumber: {
    color: '#00BFA5',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 12,
    minWidth: 24,
  },
  taskInfo: {
    flex: 1,
  },
  taskName: {
    color: '#E2E8F0',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  taskDuration: {
    color: '#00BFA5',
    fontSize: 14,
    fontWeight: '500',
  },
  taskNotes: {
    color: '#94A3B8',
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 36,
  },
  selectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  selectionLeftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  selectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#E2E8F0',
  },
  selectionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  selectionActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addTaskFab: {
    position: 'absolute',
    bottom: 30,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#00BFA5',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 998,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#E2E8F0',
    marginTop: 16,
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
});

export default EditKitblockScreen;
