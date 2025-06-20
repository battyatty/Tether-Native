import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  TextInput,
  Alert,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Task } from '../types';
import { useTether } from '../context/TetherContext';
import TaskForm from '../components/TaskForm';

type RootStackParamList = {
  Home: undefined;
  EditTether: { tetherId: string };
  CreateTether: undefined;
  Settings: undefined;
};

type CreateTetherScreenNavigationProp = StackNavigationProp<RootStackParamList, 'CreateTether'>;
type CreateTetherScreenRouteProp = RouteProp<RootStackParamList, 'CreateTether'>;

interface CreateTetherScreenProps {
  navigation: CreateTetherScreenNavigationProp;
  route: CreateTetherScreenRouteProp;
}

const CreateTetherScreen: React.FC<CreateTetherScreenProps> = ({ navigation }) => {
  const { createTether } = useTether();
  const [tetherName, setTetherName] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTaskIndex, setEditingTaskIndex] = useState<number | null>(null);

  const handleSaveTether = async () => {
    if (!tetherName.trim()) {
      Alert.alert('Error', 'Please enter a tether name');
      return;
    }

    if (tasks.length === 0) {
      Alert.alert('Error', 'Please add at least one task');
      return;
    }

    try {
      await createTether(tetherName, tasks);
      Alert.alert('Success', 'Tether created successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to create tether');
    }
  };

  const handleAddTask = () => {
    setEditingTaskIndex(null);
    setShowTaskForm(true);
  };

  const handleEditTask = (index: number) => {
    setEditingTaskIndex(index);
    setShowTaskForm(true);
  };

  const handleTaskSave = (task: Task) => {
    if (editingTaskIndex !== null) {
      // Edit existing task
      const updatedTasks = [...tasks];
      updatedTasks[editingTaskIndex] = task;
      setTasks(updatedTasks);
    } else {
      // Add new task
      setTasks(prev => [...prev, task]);
    }
    setShowTaskForm(false);
    setEditingTaskIndex(null);
  };

  const handleTaskCancel = () => {
    setShowTaskForm(false);
    setEditingTaskIndex(null);
  };

  const handleDeleteTask = (index: number) => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            setTasks(prev => prev.filter((_, i) => i !== index));
          }
        }
      ]
    );
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (showTaskForm) {
    return (
      <TaskForm
        task={editingTaskIndex !== null ? tasks[editingTaskIndex] : undefined}
        onSave={handleTaskSave}
        onCancel={handleTaskCancel}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color="#E2E8F0" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create New Tether</Text>
          <TouchableOpacity 
            style={styles.saveButton}
            onPress={handleSaveTether}
          >
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>

        {/* Tether Name Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tether Name</Text>
          <TextInput
            style={styles.nameInput}
            value={tetherName}
            onChangeText={setTetherName}
            placeholder="Enter tether name..."
            placeholderTextColor="#64748B"
            maxLength={50}
          />
        </View>

        {/* Tasks Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Tasks ({tasks.length})</Text>
            <TouchableOpacity style={styles.addButton} onPress={handleAddTask}>
              <Icon name="add" size={20} color="#FFFFFF" />
              <Text style={styles.addButtonText}>Add Task</Text>
            </TouchableOpacity>
          </View>

          {tasks.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No tasks added yet</Text>
              <TouchableOpacity style={styles.emptyAddButton} onPress={handleAddTask}>
                <Icon name="add-circle-outline" size={32} color="#00BFA5" />
                <Text style={styles.emptyAddText}>Add your first task</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.tasksList}>
              {tasks.map((task, index) => (
                <View key={index} style={styles.taskCard}>
                  <View style={styles.taskInfo}>
                    <Text style={styles.taskName}>{task.name}</Text>
                    <Text style={styles.taskDuration}>{formatDuration(task.duration)}</Text>
                  </View>
                  <View style={styles.taskActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleEditTask(index)}
                    >
                      <Icon name="edit" size={18} color="#64748B" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleDeleteTask(index)}
                    >
                      <Icon name="delete" size={18} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Summary */}
        {tasks.length > 0 && (
          <View style={styles.summary}>
            <Text style={styles.summaryTitle}>Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Tasks:</Text>
              <Text style={styles.summaryValue}>{tasks.length}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Duration:</Text>
              <Text style={styles.summaryValue}>
                {formatDuration(tasks.reduce((total, task) => total + task.duration, 0))}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#E2E8F0',
  },
  saveButton: {
    backgroundColor: '#00BFA5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#E2E8F0',
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  nameInput: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#E2E8F0',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00BFA5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 16,
  },
  emptyAddButton: {
    alignItems: 'center',
  },
  emptyAddText: {
    fontSize: 14,
    color: '#00BFA5',
    marginTop: 8,
  },
  tasksList: {
    marginTop: 8,
  },
  taskCard: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 12,
    marginBottom: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  taskInfo: {
    flex: 1,
  },
  taskName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#E2E8F0',
    marginBottom: 4,
  },
  taskDuration: {
    fontSize: 14,
    color: '#00BFA5',
  },
  taskActions: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  summary: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E2E8F0',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#94A3B8',
  },
  summaryValue: {
    fontSize: 14,
    color: '#E2E8F0',
    fontWeight: '500',
  },
});

export default CreateTetherScreen;
