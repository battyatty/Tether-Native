import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Platform,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Task } from '../types';
import { generateId } from '../utils/helpers';
import DurationPicker from './DurationPicker';
import CustomTimePicker from './CustomTimePicker';

interface TaskFormProps {
  task?: Task;
  onSave: (task: Task) => void;
  onCancel?: () => void;
}

const TaskForm: React.FC<TaskFormProps> = ({ task, onSave, onCancel }) => {
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [hours, setHours] = useState('0');
  const [minutes, setMinutes] = useState('1');
  const [seconds, setSeconds] = useState('0');
  const [showDurationPicker, setShowDurationPicker] = useState(false);
  const [isAnchored, setIsAnchored] = useState(false);
  const [anchorTime, setAnchorTime] = useState(() => {
    // Default to 9:00 AM for new tasks
    const defaultTime = new Date();
    defaultTime.setHours(9, 0, 0, 0);
    return defaultTime;
  });
  const [showAnchorTimePicker, setShowAnchorTimePicker] = useState(false);
  
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (task) {
      setName(task.name);
      setNotes(task.notes || '');
      setHours(Math.floor(task.duration / 3600).toString());
      setMinutes(Math.floor((task.duration % 3600) / 60).toString());
      setSeconds((task.duration % 60).toString());
      setIsAnchored(task.isAnchored || false);
      
      // Parse the anchored start time if it exists
      if (task.anchoredStartTime) {
        const timeString = task.anchoredStartTime;
        const today = new Date();
        const [hours, minutes] = timeString.split(':').map(Number);
        const anchorDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes);
        setAnchorTime(anchorDate);
      }
    }
  }, [task]);

  // Auto-focus input when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 300); // Delay to allow modal animation to complete

    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a task name');
      return;
    }
    
    const totalSeconds = (parseInt(hours) * 3600) + (parseInt(minutes) * 60) + parseInt(seconds);
    if (totalSeconds <= 0) {
      Alert.alert('Error', 'Duration must be greater than 0');
      return;
    }
    
    const newTask: Task = {
      id: task?.id || generateId(),
      name: name.trim(),
      duration: totalSeconds,
      notes: notes.trim() || undefined,
      location: task?.location || undefined,
      isAnchored: isAnchored,
      anchoredStartTime: isAnchored 
        ? `${anchorTime.getHours().toString().padStart(2, '0')}:${anchorTime.getMinutes().toString().padStart(2, '0')}`
        : undefined,
      completed: task?.completed || false,
    };
    
    onSave(newTask);
    resetForm();
    
    // Auto-focus for next task entry
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
  };
  
  const resetForm = () => {
    setName('');
    setNotes('');
    setHours('0');
    setMinutes('1');
    setSeconds('0');
    setIsAnchored(false);
    // Reset to default 9:00 AM
    const defaultTime = new Date();
    defaultTime.setHours(9, 0, 0, 0);
    setAnchorTime(defaultTime);
  };

  const handleDurationSave = (newHours: number, newMinutes: number, newSeconds: number) => {
    setHours(newHours.toString());
    setMinutes(newMinutes.toString());
    setSeconds(newSeconds.toString());
    setShowDurationPicker(false);
  };

  const handleAnchorToggle = (value: boolean) => {
    setIsAnchored(value);
    if (value) {
      // When enabling anchor, set to default 9:00 AM if no time is set
      const defaultTime = new Date();
      defaultTime.setHours(9, 0, 0, 0);
      setAnchorTime(defaultTime);
    }
  };

  const handleAnchorTimeChange = (hour: number, minute: number, period: 'AM' | 'PM') => {
    const newTime = new Date();
    const hour24 = period === 'PM' && hour !== 12 ? hour + 12 : (period === 'AM' && hour === 12 ? 0 : hour);
    newTime.setHours(hour24, minute, 0, 0);
    setAnchorTime(newTime);
  };

  const dismissAnchorTimePicker = () => {
    setShowAnchorTimePicker(false);
  };

  const formatAnchorTime = () => {
    return anchorTime.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDuration = () => {
    const h = parseInt(hours);
    const m = parseInt(minutes);
    const s = parseInt(seconds);

    // If all values are 0, show 1m as default
    if (h === 0 && m === 0 && s === 0) return '1m';

    const parts = [];
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    if (s > 0) parts.push(`${s}s`);
    
    return parts.join(' ');
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.form}>
        {/* Task Name Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Task Name</Text>
          <TextInput
            ref={inputRef}
            style={styles.textInput}
            value={name}
            onChangeText={setName}
            placeholder="Enter task name"
            placeholderTextColor="#64748B"
            autoCapitalize="words"
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
            multiline={false}
          />
        </View>

        {/* Duration Section */}
        <View style={styles.durationContainer}>
          <Text style={styles.label}>Duration</Text>
          <TouchableOpacity
            style={styles.durationButton}
            onPress={() => setShowDurationPicker(true)}
          >
            <Text style={styles.durationText}>{formatDuration()}</Text>
            <Icon name="access-time" size={20} color="#00BFA5" />
          </TouchableOpacity>
        </View>

        {/* Time Anchor Section */}
        <View style={styles.anchorContainer}>
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => handleAnchorToggle(!isAnchored)}
          >
            <View style={[styles.checkbox, isAnchored && styles.checkboxChecked]}>
              {isAnchored && <Icon name="check" size={16} color="#FFFFFF" />}
            </View>
            <View style={styles.checkboxTextContainer}>
              <Text style={styles.checkboxLabel}>Anchor to specific time</Text>
              <Text style={styles.checkboxDescription}>
                Mark this task as requiring a specific start time
              </Text>
            </View>
          </TouchableOpacity>

          {isAnchored && (
            <View style={styles.anchorTimeContainer}>
              <Text style={styles.anchorTimeLabel}>Anchor Time</Text>
              <TouchableOpacity
                style={styles.anchorTimeButton}
                onPress={() => {
                  console.log('Anchor time button pressed, current state:', showAnchorTimePicker);
                  setShowAnchorTimePicker(true);
                  console.log('Setting showAnchorTimePicker to true');
                }}
              >
                <Icon name="schedule" size={20} color="#00BFA5" />
                <Text style={styles.anchorTimeText}>
                  {formatAnchorTime()}
                </Text>
              </TouchableOpacity>
              
              <Text style={styles.anchorDescription}>
                This task will be anchored to the selected time during execution mode.
              </Text>
            </View>
          )}
        </View>

        {/* Notes Section */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Notes (Optional)</Text>
          <TextInput
            style={[styles.textInput, styles.notesInput]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Add notes for execution mode..."
            placeholderTextColor="#64748B"
            multiline={true}
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          {onCancel && (
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[styles.button, styles.saveButton]}
            onPress={handleSubmit}
          >
            <Icon name={task ? "check" : "add"} size={20} color="#FFFFFF" />
            <Text style={styles.saveButtonText}>{task ? "Save Changes" : "Add Task"}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Duration Picker Modal */}
      <DurationPicker
        isVisible={showDurationPicker}
        onClose={() => setShowDurationPicker(false)}
        onSave={handleDurationSave}
        initialHours={parseInt(hours)}
        initialMinutes={parseInt(minutes)}
        initialSeconds={parseInt(seconds)}
      />

      {/* Custom Time Picker */}
      <CustomTimePicker
        isVisible={showAnchorTimePicker}
        onClose={() => setShowAnchorTimePicker(false)}
        onTimeSelect={handleAnchorTimeChange}
        initialHour={anchorTime.getHours() > 12 ? anchorTime.getHours() - 12 : (anchorTime.getHours() === 0 ? 12 : anchorTime.getHours())}
        initialMinute={anchorTime.getMinutes()}
        initialPeriod={anchorTime.getHours() >= 12 ? 'PM' : 'AM'}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  form: {
    paddingVertical: 8,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E2E8F0',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#E2E8F0',
    minHeight: 50,
  },
  notesInput: {
    minHeight: 80,
    maxHeight: 120,
  },
  durationContainer: {
    marginBottom: 32,
  },
  durationButton: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 50,
  },
  durationText: {
    fontSize: 16,
    color: '#00BFA5',
    fontWeight: '500',
  },
  anchorContainer: {
    marginBottom: 24,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#334155',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#00BFA5',
    borderColor: '#00BFA5',
  },
  checkboxTextContainer: {
    flex: 1,
  },
  checkboxLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#E2E8F0',
    marginBottom: 2,
  },
  checkboxDescription: {
    fontSize: 14,
    color: '#94A3B8',
    lineHeight: 18,
  },
  anchorTimeContainer: {
    marginTop: 16,
    paddingLeft: 32,
  },
  anchorTimeLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#94A3B8',
    marginBottom: 8,
  },
  anchorTimeButton: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  anchorTimeText: {
    fontSize: 16,
    color: '#00BFA5',
    fontWeight: '500',
  },
  anchorDescription: {
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
    lineHeight: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    minHeight: 50,
  },
  saveButton: {
    backgroundColor: '#00BFA5',
    gap: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#334155',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#94A3B8',
  },
  // iOS Time Picker Styles
  iosPickerContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  iosPickerContent: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  iosPickerHeader: {
    backgroundColor: '#1E293B',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  iosPickerBody: {
    backgroundColor: '#1E293B',
    paddingVertical: 20,
    paddingHorizontal: 20,
    minHeight: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iosPickerButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  iosPickerButtonText: {
    fontSize: 16,
    color: '#00BFA5',
  },
  iosPickerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E2E8F0',
  },
  iosPickerDoneText: {
    fontWeight: '600',
  },
});

export default TaskForm;
