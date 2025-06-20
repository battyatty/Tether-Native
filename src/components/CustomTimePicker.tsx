import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';

interface CustomTimePickerProps {
  isVisible: boolean;
  onClose: () => void;
  onTimeSelect: (hour: number, minute: number, period: 'AM' | 'PM') => void;
  initialHour?: number;
  initialMinute?: number;
  initialPeriod?: 'AM' | 'PM';
}

const CustomTimePicker: React.FC<CustomTimePickerProps> = ({
  isVisible,
  onClose,
  onTimeSelect,
  initialHour = 9,
  initialMinute = 0,
  initialPeriod = 'AM',
}) => {
  const [selectedHour, setSelectedHour] = useState(initialHour);
  const [selectedMinute, setSelectedMinute] = useState(initialMinute);
  const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>(initialPeriod);

  const hourScrollRef = useRef<ScrollView>(null);
  const minuteScrollRef = useRef<ScrollView>(null);
  const periodScrollRef = useRef<ScrollView>(null);

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 60 }, (_, i) => i);
  const periods = ['AM', 'PM'];

  const ITEM_HEIGHT = 44;
  const VISIBLE_ITEMS = 5;
  const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

  useEffect(() => {
    if (isVisible) {
      // Scroll to initial positions when modal opens
      setTimeout(() => {
        hourScrollRef.current?.scrollTo({
          y: (selectedHour - 1) * ITEM_HEIGHT,
          animated: false,
        });
        minuteScrollRef.current?.scrollTo({
          y: selectedMinute * ITEM_HEIGHT,
          animated: false,
        });
        periodScrollRef.current?.scrollTo({
          y: (selectedPeriod === 'AM' ? 0 : 1) * ITEM_HEIGHT,
          animated: false,
        });
      }, 100);
    }
  }, [isVisible]);

  const handleScrollEnd = (
    event: any,
    items: any[],
    setter: (value: any) => void,
    scrollRef: React.RefObject<ScrollView | null>
  ) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(index, items.length - 1));
    
    // Update the selected value
    setter(items[clampedIndex]);
    
    // Snap to the exact position
    scrollRef.current?.scrollTo({
      y: clampedIndex * ITEM_HEIGHT,
      animated: true,
    });
  };

  const handleDone = () => {
    onTimeSelect(selectedHour, selectedMinute, selectedPeriod);
    onClose();
  };

  const renderSnapPicker = (
    items: (string | number)[],
    selectedValue: string | number,
    onSelect: (value: any) => void,
    scrollRef: React.RefObject<ScrollView | null>,
    width: number
  ) => (
    <View style={[styles.pickerColumn, { width }]}>
      {/* Selection indicator overlay */}
      <View style={styles.selectionIndicator} />
      
      <ScrollView
        ref={scrollRef}
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingVertical: PICKER_HEIGHT / 2 - ITEM_HEIGHT / 2 }
        ]}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        snapToAlignment="center"
        decelerationRate="fast"
        onMomentumScrollEnd={(event) => handleScrollEnd(event, items, onSelect, scrollRef)}
        scrollEventThrottle={16}
        bounces={false}
      >
        {items.map((item, index) => {
          const isSelected = selectedValue === item;
          return (
            <TouchableOpacity
              key={index}
              style={styles.pickerItem}
              onPress={() => {
                onSelect(item);
                scrollRef.current?.scrollTo({
                  y: index * ITEM_HEIGHT,
                  animated: true,
                });
              }}
            >
              <View style={styles.pickerItemTextContainer}>
                <Text
                  style={[
                    styles.pickerItemText,
                    isSelected && styles.selectedPickerItemText,
                  ]}
                >
                  {typeof item === 'number' && item < 10 ? `0${item}` : item}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  return (
    <Modal
      transparent={true}
      animationType="slide"
      visible={isVisible}
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.overlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <TouchableOpacity 
          style={styles.modalContent} 
          activeOpacity={1} 
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.headerButton} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            
            <Text style={styles.title}>Select Time</Text>
            
            <TouchableOpacity style={styles.headerButton} onPress={handleDone}>
              <Text style={[styles.doneText]}>Done</Text>
            </TouchableOpacity>
          </View>

          {/* Time Picker */}
          <View style={styles.pickerContainer}>
            {/* Hours */}
            {renderSnapPicker(hours, selectedHour, setSelectedHour, hourScrollRef, 80)}
            
            <Text style={styles.separator}>:</Text>
            
            {/* Minutes */}
            {renderSnapPicker(minutes, selectedMinute, setSelectedMinute, minuteScrollRef, 80)}
            
            {/* AM/PM */}
            {renderSnapPicker(periods, selectedPeriod, setSelectedPeriod, periodScrollRef, 60)}
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  headerButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  cancelText: {
    fontSize: 16,
    color: '#94A3B8',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#E2E8F0',
  },
  doneText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00BFA5',
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
    height: 240,
  },
  pickerColumn: {
    alignItems: 'center',
    position: 'relative',
  },
  selectionIndicator: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 36,
    backgroundColor: 'rgba(0, 191, 165, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 191, 165, 0.3)',
    marginTop: -14, // Adjusted to align with text baseline
    zIndex: 1,
    pointerEvents: 'none',
  },
  scrollView: {
    height: 220, // 5 items * 44px
  },
  scrollContent: {
    alignItems: 'center',
  },
  pickerItem: {
    paddingVertical: 0,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    width: '100%',
  },
  pickerItemTextContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: 44,
  },
  selectedPickerItem: {
    // Removed - we're using overlay indicator now
  },
  pickerItemText: {
    fontSize: 18,
    color: '#94A3B8',
    fontWeight: '500',
    textAlign: 'center',
  },
  selectedPickerItemText: {
    color: '#00BFA5',
    fontWeight: '700',
    fontSize: 20,
  },
  separator: {
    fontSize: 24,
    color: '#E2E8F0',
    fontWeight: '600',
    marginHorizontal: 12,
    alignSelf: 'center',
  },
});

export default CustomTimePicker;
