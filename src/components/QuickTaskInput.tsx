import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Keyboard,
  Animated,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Task } from '../types';

interface QuickTaskInputProps {
  visible: boolean;
  onSave: (task: Task) => void;
  onClose: () => void;
}

const QuickTaskInput: React.FC<QuickTaskInputProps> = ({ visible, onSave, onClose }) => {
  const [taskName, setTaskName] = useState('');
  const [duration, setDuration] = useState(5); // Default 5 minutes
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const textInputRef = useRef<TextInput>(null);
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Duration options in minutes
  const durationOptions = [1, 2, 3, 5, 10, 15, 20, 30, 45, 60];

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
      // Focus input after animation
      setTimeout(() => textInputRef.current?.focus(), 100);
    } else {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
      Keyboard.dismiss();
    }
  }, [visible]);

  const handleSave = () => {
    if (!taskName.trim()) return;

    const newTask: Task = {
      id: Date.now().toString(),
      name: taskName.trim(),
      duration: duration * 60, // Convert minutes to seconds
      completed: false,
      isAnchored: false,
    };

    onSave(newTask);
    
    // Clear input but keep modal open for rapid entry
    setTaskName('');
    setDuration(5);
    textInputRef.current?.focus();
  };

  const handleInputBlur = () => {
    // Save task if there's content when user taps away
    if (taskName.trim()) {
      handleSave();
    }
  };

  const handleClose = () => {
    setTaskName('');
    setDuration(5);
    onClose();
  };

  if (!visible) return null;

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [200, 0],
  });

  return (
    <>
      {/* Subtle backdrop - only dims content slightly */}
      {visible && (
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        />
      )}
      
      {/* Keyboard-attached input */}
      <Animated.View
        style={[
          styles.keyboardAttachment,
          {
            bottom: keyboardHeight,
            transform: [{ translateY }],
          },
        ]}
      >
        {/* Task Name Input Row */}
        <View style={styles.inputRow}>
          <TextInput
            ref={textInputRef}
            style={styles.taskInput}
            placeholder="Enter a new task"
            placeholderTextColor="#64748B"
            value={taskName}
            onChangeText={setTaskName}
            returnKeyType="done"
            onSubmitEditing={handleSave}
            onBlur={handleInputBlur}
            multiline={false}
          />
          <Text style={styles.durationDisplay}>{duration}m</Text>
        </View>

        {/* Duration Picker Row */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.durationScrollView}
          contentContainerStyle={styles.durationOptions}
        >
          {durationOptions.map((minutes) => (
            <TouchableOpacity
              key={minutes}
              style={[
                styles.durationOption,
                duration === minutes && styles.durationOptionSelected,
              ]}
              onPress={() => setDuration(minutes)}
            >
              <Text
                style={[
                  styles.durationOptionText,
                  duration === minutes && styles.durationOptionTextSelected,
                ]}
              >
                {minutes}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.2)', // Much more subtle
    zIndex: 1000,
  },
  keyboardAttachment: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: '#1E293B', // Match keyboard area
    borderTopWidth: 1,
    borderTopColor: '#334155',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 12,
    paddingBottom: 8,
    paddingHorizontal: 16,
    zIndex: 1001,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  taskInput: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#E2E8F0',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  durationDisplay: {
    color: '#00BFA5',
    fontSize: 16,
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'center',
  },
  durationScrollView: {
    flexGrow: 0,
    marginBottom: 4,
  },
  durationOptions: {
    gap: 8,
    paddingHorizontal: 4,
  },
  durationOption: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    minWidth: 40,
    alignItems: 'center',
  },
  durationOptionSelected: {
    backgroundColor: '#00BFA5',
    borderColor: '#00BFA5',
  },
  durationOptionText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#94A3B8',
  },
  durationOptionTextSelected: {
    color: '#FFFFFF',
  },
});

export default QuickTaskInput;
