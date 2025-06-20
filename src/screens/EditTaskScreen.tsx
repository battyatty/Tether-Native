import React from 'react';
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
import { RootStackParamList, Task } from '../types';
import { useTether } from '../context/TetherContext';
import TaskForm from '../components/TaskForm';

type EditTaskScreenNavigationProp = StackNavigationProp<RootStackParamList, 'EditTask'>;
type EditTaskScreenRouteProp = RouteProp<RootStackParamList, 'EditTask'>;

interface EditTaskScreenProps {
  navigation: EditTaskScreenNavigationProp;
  route: EditTaskScreenRouteProp;
}

const EditTaskScreen: React.FC<EditTaskScreenProps> = ({ navigation, route }) => {
  const { task, sourceType, sourceId } = route.params;
  const { updateTaskInTether, updateTaskInKitblock, duplicateTaskInTether, duplicateTaskInKitblock } = useTether();

  const handleSave = async (updatedTask: Task) => {
    try {
      if (sourceType === 'tether') {
        await updateTaskInTether(sourceId, task.id, updatedTask);
      } else if (sourceType === 'kitblock') {
        await updateTaskInKitblock(sourceId, task.id, updatedTask);
      }
      
      // Skip success modal and go back directly
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to update task');
    }
  };

  const handleDuplicate = async () => {
    try {
      if (sourceType === 'tether') {
        await duplicateTaskInTether(sourceId, task.id);
      } else if (sourceType === 'kitblock') {
        await duplicateTaskInKitblock(sourceId, task.id);
      }
      
      Alert.alert('Success', 'Task duplicated successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to duplicate task');
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleCancel}
        >
          <Icon name="close" size={24} color="#00BFA5" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Task</Text>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleDuplicate}
        >
          <Icon name="content-copy" size={24} color="#00BFA5" />
        </TouchableOpacity>
      </View>

      {/* Task Form */}
      <View style={styles.formContainer}>
        <TaskForm
          task={task}
          onSave={handleSave}
          onCancel={handleCancel}
        />
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
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
    fontSize: 18,
    fontWeight: '600',
    color: '#E2E8F0',
  },
  formContainer: {
    flex: 1,
    padding: 20,
  },
});

export default EditTaskScreen;