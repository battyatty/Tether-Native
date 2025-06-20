import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Animated,
  Dimensions,
  PanResponder,
  Keyboard,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Task } from '../types';
import TaskForm from './TaskForm';

interface MobileTaskInputProps {
  onSave: (task: Task) => void;
  onCancel?: () => void;
}

const MobileTaskInput: React.FC<MobileTaskInputProps> = ({ onSave, onCancel }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [recentlySaved, setRecentlySaved] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  
  // Animation values
  const slideAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // Keyboard handling
  useEffect(() => {
    const keyboardWillShow = (e: any) => {
      if (Platform.OS === 'ios') {
        setKeyboardHeight(e.endCoordinates.height);
      }
    };

    const keyboardWillHide = () => {
      setKeyboardHeight(0);
    };

    const showListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      keyboardWillShow
    );
    const hideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      keyboardWillHide
    );

    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, []);

  // Animation effects
  useEffect(() => {
    if (isOpen) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isOpen, slideAnim, opacityAnim]);

  // Handle task save and success feedback
  const handleTaskSave = (task: Task) => {
    onSave(task);
    
    // Show success feedback
    setRecentlySaved(true);
    setTimeout(() => setRecentlySaved(false), 1000);
    
    // Keep panel open for continuous task entry
    // Auto-focus handled by TaskForm component
  };

  const handleOpen = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    Keyboard.dismiss();
    setIsOpen(false);
    setRecentlySaved(false);
    onCancel?.();
  };

  // Pan responder for swipe-to-dismiss
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 10 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          const progress = Math.min(gestureState.dy / 200, 1);
          slideAnim.setValue(1 - progress);
          opacityAnim.setValue(1 - progress * 0.5);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100) {
          handleClose();
        } else {
          Animated.parallel([
            Animated.spring(slideAnim, {
              toValue: 1,
              useNativeDriver: true,
            }),
            Animated.spring(opacityAnim, {
              toValue: 1,
              useNativeDriver: true,
            }),
          ]).start();
        }
      },
    })
  ).current;

  const { height: screenHeight } = Dimensions.get('window');
  
  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [screenHeight, 0],
  });

  return (
    <>
      {/* Floating Action Button */}
      <TouchableOpacity
        style={[
          styles.fab,
          recentlySaved && styles.fabSuccess
        ]}
        onPress={handleOpen}
        activeOpacity={0.8}
        accessibilityLabel="Add new task"
      >
        <Icon 
          name={recentlySaved ? "check" : "add"} 
          size={28} 
          color="#FFFFFF" 
        />
      </TouchableOpacity>

      {/* Modal Panel */}
      <Modal
        visible={isOpen}
        transparent={true}
        animationType="none"
        statusBarTranslucent={true}
        onRequestClose={handleClose}
      >
        <View style={styles.modalContainer}>
          {/* Backdrop */}
          <Animated.View 
            style={[
              styles.backdrop,
              { opacity: opacityAnim }
            ]}
          >
            <TouchableOpacity
              style={styles.backdropTouchable}
              onPress={handleClose}
              activeOpacity={1}
            />
          </Animated.View>

          {/* Panel */}
          <Animated.View
            style={[
              styles.panel,
              {
                transform: [{ translateY }],
                marginBottom: keyboardHeight,
              }
            ]}
            {...panResponder.panHandlers}
          >
            <SafeAreaView style={styles.panelContent}>
              {/* Handle for swipe gesture */}
              <View style={styles.handle} />
              
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.headerTitle}>Add New Task</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={handleClose}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Icon name="close" size={24} color="#64748B" />
                </TouchableOpacity>
              </View>

              {/* Task Form */}
              <View style={styles.formContainer}>
                <TaskForm
                  onSave={handleTaskSave}
                  onCancel={handleClose}
                />
              </View>
            </SafeAreaView>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#00BFA5', // Tidewake-timer
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
    zIndex: 1000,
  },
  fabSuccess: {
    backgroundColor: '#10B981', // Success green
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdropTouchable: {
    flex: 1,
  },
  panel: {
    backgroundColor: '#1E293B', // Tidewake-card
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.9,
    minHeight: height * 0.6,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#334155', // Tidewake-accentSoft
  },
  panelContent: {
    flex: 1,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#64748B',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#E2E8F0', // Tidewake-text
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0F172A', // Tidewake-noteBackground
    justifyContent: 'center',
    alignItems: 'center',
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
});

export default MobileTaskInput;
