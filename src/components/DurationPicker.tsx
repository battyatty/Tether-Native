import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface DurationPickerProps {
  isVisible: boolean;
  onClose: () => void;
  onSave: (hours: number, minutes: number, seconds: number) => void;
  initialHours: number;
  initialMinutes: number;
  initialSeconds: number;
}

const DurationPicker: React.FC<DurationPickerProps> = ({
  isVisible,
  onClose,
  onSave,
  initialHours,
  initialMinutes,
  initialSeconds,
}) => {
  const [hours, setHours] = useState(initialHours);
  const [minutes, setMinutes] = useState(initialMinutes);
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    if (isVisible) {
      setHours(initialHours);
      setMinutes(initialMinutes);
      setSeconds(initialSeconds);
    }
  }, [isVisible, initialHours, initialMinutes, initialSeconds]);

  const handleSave = () => {
    // Ensure at least 1 second is selected
    if (hours === 0 && minutes === 0 && seconds === 0) {
      setSeconds(1);
      onSave(hours, minutes, 1);
    } else {
      onSave(hours, minutes, seconds);
    }
  };

  const renderPicker = (
    value: number,
    setValue: (val: number) => void,
    max: number,
    unit: string
  ) => {
    const items = Array.from({ length: max + 1 }, (_, i) => i);
    
    return (
      <View style={styles.pickerContainer}>
        <Text style={styles.pickerLabel}>{unit}</Text>
        <ScrollView 
          style={styles.picker}
          showsVerticalScrollIndicator={false}
          snapToInterval={40}
          decelerationRate="fast"
        >
          {items.map((item) => (
            <TouchableOpacity
              key={item}
              style={[
                styles.pickerItem,
                value === item && styles.selectedPickerItem
              ]}
              onPress={() => setValue(item)}
            >
              <Text
                style={[
                  styles.pickerItemText,
                  value === item && styles.selectedPickerItemText
                ]}
              >
                {item.toString().padStart(2, '0')}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const formatTotal = () => {
    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
    if (totalSeconds === 0) return '1 second';
    
    const parts = [];
    if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
    if (minutes > 0) parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
    if (seconds > 0) parts.push(`${seconds} second${seconds !== 1 ? 's' : ''}`);
    
    return parts.join(', ');
  };

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.backdrop}>
          <TouchableOpacity
            style={styles.backdropTouch}
            onPress={onClose}
            activeOpacity={1}
          />
        </View>

        <View style={styles.pickerModal}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Set Duration</Text>
            <TouchableOpacity onPress={handleSave}>
              <Text style={styles.saveText}>Save</Text>
            </TouchableOpacity>
          </View>

          {/* Total Duration Display */}
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Total Duration</Text>
            <Text style={styles.totalValue}>{formatTotal()}</Text>
          </View>

          {/* Pickers */}
          <View style={styles.pickersContainer}>
            {renderPicker(hours, setHours, 23, 'Hours')}
            {renderPicker(minutes, setMinutes, 59, 'Minutes')}
            {renderPicker(seconds, setSeconds, 59, 'Seconds')}
          </View>

          {/* Quick Select Buttons */}
          <View style={styles.quickSelectContainer}>
            <Text style={styles.quickSelectLabel}>Quick Select</Text>
            <View style={styles.quickSelectButtons}>
              <TouchableOpacity
                style={styles.quickSelectButton}
                onPress={() => { setHours(0); setMinutes(1); setSeconds(0); }}
              >
                <Text style={styles.quickSelectButtonText}>1min</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickSelectButton}
                onPress={() => { setHours(0); setMinutes(5); setSeconds(0); }}
              >
                <Text style={styles.quickSelectButtonText}>5min</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickSelectButton}
                onPress={() => { setHours(0); setMinutes(15); setSeconds(0); }}
              >
                <Text style={styles.quickSelectButtonText}>15min</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickSelectButton}
                onPress={() => { setHours(0); setMinutes(30); setSeconds(0); }}
              >
                <Text style={styles.quickSelectButtonText}>30min</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickSelectButton}
                onPress={() => { setHours(1); setMinutes(0); setSeconds(0); }}
              >
                <Text style={styles.quickSelectButtonText}>1hr</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdropTouch: {
    flex: 1,
  },
  pickerModal: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    width: width * 0.9,
    maxHeight: height * 0.7,
    borderWidth: 1,
    borderColor: '#334155',
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
    fontSize: 18,
    fontWeight: '600',
    color: '#E2E8F0',
  },
  cancelText: {
    fontSize: 16,
    color: '#94A3B8',
  },
  saveText: {
    fontSize: 16,
    color: '#00BFA5',
    fontWeight: '600',
  },
  totalContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 4,
  },
  totalValue: {
    fontSize: 16,
    color: '#00BFA5',
    fontWeight: '600',
  },
  pickersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  pickerContainer: {
    flex: 1,
    alignItems: 'center',
  },
  pickerLabel: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 8,
    fontWeight: '500',
  },
  picker: {
    height: 120,
    width: 60,
  },
  pickerItem: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedPickerItem: {
    backgroundColor: '#00BFA5',
    borderRadius: 8,
  },
  pickerItemText: {
    fontSize: 16,
    color: '#CBD5E1',
  },
  selectedPickerItemText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  quickSelectContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  quickSelectLabel: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 12,
    fontWeight: '500',
  },
  quickSelectButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickSelectButton: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  quickSelectButtonText: {
    fontSize: 14,
    color: '#E2E8F0',
  },
});

export default DurationPicker;
