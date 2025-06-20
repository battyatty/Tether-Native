import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Task, RootStackParamList, TetherMode } from '../types';
import { useTether } from '../context/TetherContext';
import { QuickTaskInput, SimpleTaskItem, GestureHandlerTest } from '../components';

type EditTetherScreenNavigationProp = StackNavigationProp<RootStackParamList, 'EditTether'>;
type EditTetherScreenRouteProp = RouteProp<RootStackParamList, 'EditTether'>;

interface EditTetherScreenProps {
  navigation: EditTetherScreenNavigationProp;
  route: EditTetherScreenRouteProp;
}

const EditTetherScreen: React.FC<EditTetherScreenProps> = ({ navigation, route }) => {
  const { tetherId } = route.params;
  const { 
    tethers, 
    kitblocks,
    addTaskToTether, 
    updateTaskInTether, 
    deleteTaskFromTether,
    duplicateTaskInTether,
    insertKitblockIntoTether,
    startTether,
    error,
    clearError
  } = useTether();
  
  const [showTaskInput, setShowTaskInput] = useState(false);
  const [showKitblockSelector, setShowKitblockSelector] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [showQuickTaskInput, setShowQuickTaskInput] = useState(false);
  
  const tether = tethers.find(t => t.id === tetherId);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => clearError(), 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

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

  const handleTaskSave = async (task: Task) => {
    try {
      await addTaskToTether(tetherId, task);
      // Don't close the input or show alert for rapid entry
    } catch (err) {
      Alert.alert('Error', 'Failed to add task');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    console.log('handleDeleteTask called with taskId:', taskId);
    try {
      await deleteTaskFromTether(tetherId, taskId);
      console.log('Task deleted successfully');
      // Remove the success alert since the SwipeableTaskItem already shows confirmation
    } catch (err) {
      console.error('Failed to delete task:', err);
      Alert.alert('Error', 'Failed to delete task');
    }
  };

  const handleDuplicateTask = async (taskId: string) => {
    console.log('handleDuplicateTask called with taskId:', taskId);
    try {
      await duplicateTaskInTether(tetherId, taskId);
      console.log('Task duplicated successfully');
    } catch (err) {
      console.error('Failed to duplicate task:', err);
      Alert.alert('Error', 'Failed to duplicate task');
    }
  };

  const handleToggleAnchor = async (taskId: string) => {
    try {
      const task = tether.tasks.find(t => t.id === taskId);
      if (task) {
        // Simple toggle - just flip the isAnchored state
        await updateTaskInTether(tetherId, taskId, { isAnchored: !task.isAnchored });
        console.log('Task anchor toggled successfully');
      }
    } catch (err) {
      console.error('Failed to toggle task anchor:', err);
      Alert.alert('Error', 'Failed to toggle task anchor');
    }
  };

  const handleStartTether = async () => {
    try {
      await startTether(tetherId);
      Alert.alert('Success', 'Tether started!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (err) {
      Alert.alert('Error', 'Failed to start tether');
    }
  };

  const handleAddKitblock = async (kitblockId: string) => {
    try {
      await insertKitblockIntoTether(tetherId, kitblockId);
      setShowKitblockSelector(false);
      Alert.alert('Success', 'Kitblock added to tether!');
    } catch (err) {
      Alert.alert('Error', 'Failed to add kitblock');
    }
  };

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

  // Helper functions for tether time display
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
    const taskCount = tether.tasks.length;
    const taskText = `${taskCount} task${taskCount !== 1 ? 's' : ''}`;
    const currentMode = tether.mode || TetherMode.FLEXIBLE;
    
    if (tether.mode === TetherMode.FLEXIBLE || !tether.mode) {
      // Flexible tether: "Anytime" • [clock icon] [Duration]
      return (
        <View style={styles.tetherStatsContainer}>
          <Text style={[styles.tetherStatsText, styles.flexibleModeColor]}>Anytime</Text>
          <Text style={[styles.tetherStatsDot, styles.flexibleModeColor]}> • </Text>
          <Icon name="schedule" size={14} color="#00BFA5" />
          <Text style={[styles.tetherStatsText, styles.flexibleModeColor]}> {formatTime(getTotalDuration())}</Text>
        </View>
      );
    } else {
      // Scheduled tether: [clock icon] 2:00 PM - 2:45 PM
      const startTime = formatScheduledTime(tether.scheduledStartTime!);
      const endTime = calculateEndTime(tether.scheduledStartTime!, getTotalDuration());
      
      return (
        <View style={styles.tetherStatsContainer}>
          <Icon name="schedule" size={14} color="#BF92FF" />
          <Text style={[styles.tetherStatsText, styles.scheduledModeColor]}> {startTime} - {endTime}</Text>
        </View>
      );
    }
  };

  const handleTaskEdit = (taskId: string) => {
    const task = tether.tasks.find(t => t.id === taskId);
    if (task) {
      navigation.navigate('EditTask', {
        task,
        sourceType: 'tether',
        sourceId: tetherId,
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
    if (selectedTaskIds.size === tether.tasks.length) {
      // Deselect all but STAY in selection mode (Gmail behavior)
      setSelectedTaskIds(new Set());
    } else {
      // Select all
      setSelectedTaskIds(new Set(tether.tasks.map(task => task.id)));
    }
  };

  const handleBulkDelete = async () => {
    const taskCount = selectedTaskIds.size;
    Alert.alert(
      'Delete Tasks',
      `Are you sure you want to delete ${taskCount} task${taskCount !== 1 ? 's' : ''}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              for (const taskId of Array.from(selectedTaskIds)) {
                await deleteTaskFromTether(tetherId, taskId);
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
        await duplicateTaskInTether(tetherId, taskId);
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
    if (!isSelectionMode) {
      // Enter selection mode with no tasks selected
      setIsSelectionMode(true);
      setSelectedTaskIds(new Set());
    } else {
      // When in selection mode, cycle through states but STAY in selection mode
      if (selectedTaskIds.size === 0) {
        // None selected -> select all (stay in selection mode)
        setSelectedTaskIds(new Set(tether.tasks.map(task => task.id)));
      } else if (selectedTaskIds.size === tether.tasks.length) {
        // All selected -> deselect all (STAY in selection mode)
        setSelectedTaskIds(new Set());
      } else {
        // Some selected -> select all (stay in selection mode)
        setSelectedTaskIds(new Set(tether.tasks.map(task => task.id)));
      }
      // Note: We never set setIsSelectionMode(false) here - user stays in selection mode
    }
  };

  const getSelectionIcon = () => {
    if (!isSelectionMode) {
      return "check-box-outline-blank"; // Grayed out checkbox when not in selection mode
    } else if (selectedTaskIds.size === 0) {
      return "check-box-outline-blank"; // Empty checkbox
    } else if (selectedTaskIds.size === tether.tasks.length) {
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

  const renderTaskItem = (task: Task, index: number) => {
    return (
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
          onToggleAnchor={handleToggleAnchor}
          onPress={handleTaskEdit}
          onLongPress={handleLongPress}
          formatTime={formatTime}
          isSelectionMode={isSelectionMode}
          isSelected={selectedTaskIds.has(task.id)}
          onSelectionToggle={handleSelectionToggle}
          enableSwipe={true} // Enable PanResponder swipe for duplicate/delete
        />
      </GestureHandlerTest>
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
              <Text style={styles.tetherTitle}>{tether.name}</Text>
            </View>
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => navigation.navigate('TetherSettings', { tetherId })}
            >
              <Icon name="settings" size={24} color="#00BFA5" />
            </TouchableOpacity>
          </View>
          {renderTetherStats()}
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

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Tasks List */}
        <View style={styles.tasksSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Tasks</Text>
          </View>
          
          {tether.tasks.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="playlist-add" size={48} color="#64748B" />
              <Text style={styles.emptyStateText}>No tasks yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Tap the + button to add your first task
              </Text>
            </View>
          ) : (
            <View style={styles.tasksList}>
              {tether.tasks.map((task, index) => renderTaskItem(task, index))}
            </View>
          )}
        </View>

        {/* Action Buttons - Hide in selection mode */}
        {!isSelectionMode && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={() => setShowKitblockSelector(true)}
            >
              <Icon name="widgets" size={20} color="#00BFA5" />
              <Text style={styles.secondaryButtonText}>Add Kitblock</Text>
            </TouchableOpacity>
          </View>
        )}
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

      {/* Start Tether FAB - Hide in selection mode */}
      {!isSelectionMode && tether.tasks.length > 0 && (
        <TouchableOpacity
          style={styles.startTetherFab}
          onPress={handleStartTether}
          activeOpacity={0.8}
          accessibilityLabel="Start Tether"
        >
          <Icon name="play-arrow" size={24} color="#FFFFFF" />
          <Text style={styles.startTetherFabText}>Start Tether</Text>
        </TouchableOpacity>
      )}

      {/* Kitblock Selector Modal - Hide in selection mode */}
      {!isSelectionMode && showKitblockSelector && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Kitblock</Text>
              <TouchableOpacity 
                onPress={() => setShowKitblockSelector(false)}
                style={styles.modalCloseButton}
              >
                <Icon name="close" size={24} color="#94A3B8" />
              </TouchableOpacity>
            </View>
            
            {kitblocks.length === 0 ? (
              <View style={styles.emptyKitblocks}>
                <Icon name="widgets" size={48} color="#64748B" />
                <Text style={styles.emptyKitblocksText}>No kitblocks available</Text>
                <Text style={styles.emptyKitblocksSubtext}>
                  Create kitblocks to add reusable task groups
                </Text>
                <TouchableOpacity
                  style={styles.createKitblockButton}
                  onPress={() => {
                    setShowKitblockSelector(false);
                    navigation.navigate('MainTabs');
                  }}
                >
                  <Text style={styles.createKitblockButtonText}>Back to Home</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView style={styles.kitblocksList}>
                {kitblocks.map((kitblock) => (
                  <TouchableOpacity
                    key={kitblock.id}
                    style={styles.kitblockItem}
                    onPress={() => handleAddKitblock(kitblock.id)}
                  >
                    <View style={styles.kitblockInfo}>
                      <Text style={styles.kitblockName}>{kitblock.name}</Text>
                      {kitblock.description && (
                        <Text style={styles.kitblockDescription}>{kitblock.description}</Text>
                      )}
                      <Text style={styles.kitblockStats}>
                        {kitblock.tasks.length} task{kitblock.tasks.length !== 1 ? 's' : ''}
                      </Text>
                    </View>
                    <Icon name="add" size={24} color="#00BFA5" />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
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
  scrollView: {
    flex: 1,
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
  tetherTitle: {
    color: '#E2E8F0',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  tetherStatsInHeader: {
    color: '#94A3B8',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
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
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
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
  selectionTitleContainer: {
    flex: 1,
    alignItems: 'center',
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
  statsSection: {
    padding: 20,
    paddingTop: 10,
  },
  tetherName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#E2E8F0',
    marginBottom: 16,
  },
  tetherStats: {
    flexDirection: 'row',
    gap: 24,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statText: {
    fontSize: 16,
    color: '#94A3B8',
    fontWeight: '500',
  },
  tasksSection: {
    padding: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  selectionButton: {
    padding: 4,
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#E2E8F0',
  },
  tasksList: {
    gap: 2,
  },
  taskItem: {
    backgroundColor: '#1E293B',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  taskContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskHeader: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  taskNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00BFA5',
    minWidth: 24,
    textAlign: 'center',
  },
  taskName: {
    flex: 1,
    fontSize: 16,
    color: '#E2E8F0',
    fontWeight: '500',
  },
  taskDuration: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
  },
  taskActions: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 12,
  },
  taskActionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
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
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    padding: 24,
    paddingBottom: 100, // Space for FAB
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 20,
    gap: 8,
  },
  startButton: {
    backgroundColor: '#00BFA5',
  },
  secondaryButton: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#00BFA5',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00BFA5',
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
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#1E293B',
    borderRadius: 24,
    margin: 20,
    maxHeight: '70%',
    width: '90%',
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#E2E8F0',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyKitblocks: {
    alignItems: 'center',
    padding: 40,
  },
  emptyKitblocksText: {
    fontSize: 18,
    color: '#E2E8F0',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyKitblocksSubtext: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  createKitblockButton: {
    backgroundColor: '#00BFA5',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createKitblockButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  kitblocksList: {
    maxHeight: 300,
  },
  kitblockItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  kitblockInfo: {
    flex: 1,
  },
  kitblockName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E2E8F0',
    marginBottom: 4,
  },
  kitblockDescription: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 4,
    lineHeight: 18,
  },
  kitblockStats: {
    fontSize: 12,
    color: '#64748B',
  },
  addTaskFab: {
    position: 'absolute',
    bottom: 30, // Traditional FAB position in bottom right
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
  startTetherFab: {
    position: 'absolute',
    bottom: 30,
    left: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 32,
    backgroundColor: '#00BFA5',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 999,
    gap: 8,
  },
  startTetherFabText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EditTetherScreen;
