import React from 'react';
import { View } from 'react-native';
import SimpleTaskItem from './SimpleTaskItem';
import { Task } from '../types';

interface SwipeableTaskItemProps {
  task: Task;
  index: number;
  onDelete: (taskId: string) => void;
  onDuplicate: (taskId: string) => void;
  onToggleAnchor?: (taskId: string) => void;
  onPress: (taskId: string) => void;
  onLongPress: (taskId: string) => void;
  formatTime: (seconds: number) => string;
  isSelectionMode: boolean;
  isSelected: boolean;
  onSelectionToggle: (taskId: string) => void;
  hideAnchor?: boolean;
}

export const SwipeableTaskItem: React.FC<SwipeableTaskItemProps> = (props) => {
  // For now, just render SimpleTaskItem without any swipe functionality
  // This is to test if the basic component works
  return (
    <View>
      <SimpleTaskItem {...props} />
    </View>
  );
};
