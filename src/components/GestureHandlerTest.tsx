import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface GestureHandlerTestProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}

const GestureHandlerTest: React.FC<GestureHandlerTestProps> = ({ children, onSwipeLeft, onSwipeRight }) => {
  const renderLeftAction = () => (
    <View style={styles.leftAction}>
      <Icon name="content-copy" size={24} color="#FFFFFF" />
      <Text style={styles.actionText}>Duplicate</Text>
    </View>
  );

  const renderRightAction = () => (
    <View style={styles.rightAction}>
      <Icon name="delete" size={24} color="#FFFFFF" />
      <Text style={styles.actionText}>Delete</Text>
    </View>
  );

  return (
    <Swipeable
      renderLeftActions={renderLeftAction}
      renderRightActions={renderRightAction}
      onSwipeableLeftOpen={() => {
        console.log('Swipe left action triggered');
        onSwipeRight?.(); // Right swipe = left action = duplicate
      }}
      onSwipeableRightOpen={() => {
        console.log('Swipe right action triggered');
        onSwipeLeft?.(); // Left swipe = right action = delete
      }}
    >
      {children}
    </Swipeable>
  );
};

const styles = StyleSheet.create({
  leftAction: {
    backgroundColor: '#00BFA5',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    borderRadius: 20,
    marginVertical: 2,
  },
  rightAction: {
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    borderRadius: 20,
    marginVertical: 2,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
});

export default GestureHandlerTest;
