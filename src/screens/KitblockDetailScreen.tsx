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
import { MobileTaskInput, SimpleTaskItem, QuickTaskInput } from '../components';

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
      // Remove the success alert since the SwipeableTaskItem already shows confirmation
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
    return kitblock.tasks.reduce((total, task) => total + task.duration, 0);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.leftHeaderSection}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color="#00BFA5" />
          </TouchableOpacity>
          <Text style={styles.kitblockTitle}>{kitblock.name}</Text>
        </View>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => {/* TODO: Edit functionality */}}
        >
          <Icon name="edit" size={20} color="#00BFA5" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.infoSection}>
          
          {kitblock.description && (
            <Text style={styles.kitblockDescription}>{kitblock.description}</Text>
          )}
          
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{kitblock.tasks.length}</Text>
              <Text style={styles.statLabel}>Tasks</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{formatDuration(getTotalDuration())}</Text>
              <Text style={styles.statLabel}>Duration</Text>
            </View>
          </View>
        </View>

        <View style={styles.tasksSection}>
          <Text style={styles.sectionTitle}>Tasks</Text>
          
          {kitblock.tasks.map((task, index) => (
            <SimpleTaskItem
              key={task.id}
              task={task}
              index={index}
              onDelete={handleDeleteTask}
              onDuplicate={handleDuplicateTask}
              onPress={handleTaskEdit}
              onLongPress={() => {}} // No selection mode in this screen
              formatTime={formatDuration}
              isSelectionMode={false}
              isSelected={false}
              onSelectionToggle={() => {}} // No selection mode in this screen
              hideAnchor={true}
              enableSwipe={true}
            />
          ))}
        </View>
      </ScrollView>

      {/* Add Task FAB */}
      <TouchableOpacity
        style={styles.addTaskFab}
        onPress={() => setShowQuickTaskInput(true)}
        activeOpacity={0.8}
      >
        <Icon name="add" size={24} color="#FFFFFF" />
      </TouchableOpacity>

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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
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
    flex: 1,
    textAlign: 'center',
    marginLeft: 15,
    marginRight: 15,
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
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#1E293B',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    color: '#00BFA5',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    color: '#94A3B8',
    fontSize: 14,
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
});

export default EditKitblockScreen;
