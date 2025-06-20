import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTether } from '../context/TetherContext';
import { RootStackParamList, Task } from '../types';
import { DurationPicker, TaskForm } from '../components';

type CreateKitblockScreenNavigationProp = StackNavigationProp<RootStackParamList, 'CreateKitblock'>;

interface Props {
  navigation: CreateKitblockScreenNavigationProp;
}

const CreateKitblockScreen: React.FC<Props> = ({ navigation }) => {
  const { createKitblock } = useTether();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTaskIndex, setEditingTaskIndex] = useState<number | null>(null);

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
      setTasks(prev => prev.map((t, index) => 
        index === editingTaskIndex ? task : t
      ));
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
          onPress: () => setTasks(prev => prev.filter((_, i) => i !== index)),
        },
      ]
    );
  };

  const handleSaveKitblock = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a kitblock name');
      return;
    }

    if (tasks.length === 0) {
      Alert.alert('Error', 'Please add at least one task');
      return;
    }

    try {
      await createKitblock(name.trim(), tasks, description.trim() || undefined);
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to create kitblock');
    }
  };

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
    return tasks.reduce((total, task) => total + task.duration, 0);
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
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#00BFA5" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Kitblock</Text>
        <TouchableOpacity
          style={[styles.saveButton, (!name.trim() || tasks.length === 0) && styles.saveButtonDisabled]}
          onPress={handleSaveKitblock}
          disabled={!name.trim() || tasks.length === 0}
        >
          <Text style={[styles.saveButtonText, (!name.trim() || tasks.length === 0) && styles.saveButtonTextDisabled]}>
            Save
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Basic Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Kitblock Name</Text>
            <TextInput
              style={styles.textInput}
              value={name}
              onChangeText={setName}
              placeholder="Enter kitblock name..."
              placeholderTextColor="#64748B"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description (Optional)</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe this kitblock..."
              placeholderTextColor="#64748B"
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* Tasks Section */}
        <View style={styles.section}>
          <View style={styles.tasksHeader}>
            <Text style={styles.sectionTitle}>Tasks</Text>
            <TouchableOpacity style={styles.addTaskButton} onPress={handleAddTask}>
              <Icon name="add" size={20} color="#FFFFFF" />
              <Text style={styles.addTaskButtonText}>Add Task</Text>
            </TouchableOpacity>
          </View>

          {tasks.length === 0 ? (
            <View style={styles.emptyTasks}>
              <Text style={styles.emptyTasksText}>No tasks added yet</Text>
              <Text style={styles.emptyTasksSubtext}>
                Add tasks to build your kitblock
              </Text>
            </View>
          ) : (
            <>
              {tasks.map((task, index) => (
                <View key={index} style={styles.taskCard}>
                  <TouchableOpacity
                    style={styles.taskContent}
                    onPress={() => handleEditTask(index)}
                    activeOpacity={0.7}
                  >                  <Text style={styles.taskName}>{task.name}</Text>
                  <Text style={styles.taskDuration}>{formatDuration(task.duration)}</Text>
                </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteTaskButton}
                    onPress={() => handleDeleteTask(index)}
                  >
                    <Icon name="delete" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}

              {/* Summary */}
              <View style={styles.summary}>
                <Text style={styles.summaryText}>
                  Total: {tasks.length} task{tasks.length !== 1 ? 's' : ''} • {formatDuration(getTotalDuration())}
                </Text>
              </View>
            </>
          )}
        </View>
      </ScrollView>
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
    color: '#E2E8F0',
    fontSize: 20,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#00BFA5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  saveButtonDisabled: {
    backgroundColor: '#1E293B',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonTextDisabled: {
    color: '#64748B',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    color: '#E2E8F0',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    color: '#CBD5E1',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#1E293B',
    color: '#E2E8F0',
    fontSize: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  tasksHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addTaskButton: {
    backgroundColor: '#00BFA5',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addTaskButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  emptyTasks: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    borderStyle: 'dashed',
  },
  emptyTasksText: {
    color: '#E2E8F0',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  emptyTasksSubtext: {
    color: '#94A3B8',
    fontSize: 14,
    textAlign: 'center',
  },
  taskCard: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  taskContent: {
    flex: 1,
    padding: 12,
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
    marginBottom: 4,
  },
  deleteTaskButton: {
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summary: {
    backgroundColor: '#334155',
    padding: 16,
    borderRadius: 20,
    marginTop: 8,
  },
  summaryText: {
    color: '#E2E8F0',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default CreateKitblockScreen;
