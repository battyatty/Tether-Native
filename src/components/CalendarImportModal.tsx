import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  FlatList,
  Switch,
  Platform,
} from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { parseICSContent, convertEventsToTasks, CalendarEvent } from '../utils/calendar';
import { Task } from '../types';

interface CalendarImportModalProps {
  visible: boolean;
  onImport: (tasks: Omit<Task, 'id'>[]) => Promise<void>;
  onClose: () => void;
}

export const CalendarImportModal: React.FC<CalendarImportModalProps> = ({
  visible,
  onImport,
  onClose,
}) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());
  const [isImporting, setIsImporting] = useState(false);
  const [isAnchored, setIsAnchored] = useState(true);
  const [importOptions, setImportOptions] = useState({
    includeCategories: true,
    smartDuration: true,
    minDurationMinutes: 5,
    dateRange: 30, // Days to look ahead
  });
  const [showPreview, setShowPreview] = useState(false);

  const handleFilePicker = async () => {
    try {
      const result = await DocumentPicker.pickSingle({
        type: [DocumentPicker.types.allFiles],
        copyTo: 'documentDirectory',
      });

      if (result.name?.endsWith('.ics')) {
        try {
          // Read file content directly from the uri
          let fileContent = '';
          
          if (result.fileCopyUri) {
            // Use fetch to read the file content
            const response = await fetch(result.fileCopyUri);
            fileContent = await response.text();
          } else if (result.uri) {
            // Fallback to original uri
            const response = await fetch(result.uri);
            fileContent = await response.text();
          }
          
          if (!fileContent) {
            Alert.alert('Error', 'Could not read the calendar file');
            return;
          }
          
          // Create date range for parsing recurring events
          const startDate = new Date();
          startDate.setDate(startDate.getDate() - 7); // Include past week
          const endDate = new Date();
          endDate.setDate(endDate.getDate() + importOptions.dateRange);
          
          const parsedEvents = parseICSContent(fileContent, { start: startDate, end: endDate });
          
          setEvents(parsedEvents);
          setSelectedEvents(new Set());
          
          // Show success message with event count
          const recurringCount = parsedEvents.filter(e => e.isRecurring).length;
          const totalCount = parsedEvents.length;
          
          Alert.alert(
            'Calendar Loaded', 
            `Found ${totalCount} events${recurringCount > 0 ? ` (${recurringCount} recurring)` : ''}`
          );
        } catch (parseError: any) {
          Alert.alert(
            'Invalid Calendar File', 
            parseError.message || 'Unable to parse calendar file. Please check the file format.'
          );
        }
      } else {
        Alert.alert('Invalid File', 'Please select a valid .ics calendar file');
      }
    } catch (error) {
      if (!DocumentPicker.isCancel(error)) {
        Alert.alert('Error', 'Failed to read calendar file');
      }
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setSelectedDate(selectedDate);
      setSelectedEvents(new Set()); // Clear selections when date changes
    }
  };

  // Filter events for the selected date
  const eventsForDate = events.filter(event => {
    const eventDate = new Date(event.scheduledDate);
    return (
      eventDate.getFullYear() === selectedDate.getFullYear() &&
      eventDate.getMonth() === selectedDate.getMonth() &&
      eventDate.getDate() === selectedDate.getDate()
    );
  });

  const toggleEventSelection = (eventId: string) => {
    const newSelected = new Set(selectedEvents);
    if (newSelected.has(eventId)) {
      newSelected.delete(eventId);
    } else {
      newSelected.add(eventId);
    }
    setSelectedEvents(newSelected);
  };

  const selectAllEvents = () => {
    if (selectedEvents.size === eventsForDate.length) {
      setSelectedEvents(new Set());
    } else {
      const eventIds = eventsForDate.map((_, index) => `${selectedDate.toDateString()}_${index}`);
      setSelectedEvents(new Set(eventIds));
    }
  };

  const handleImport = async () => {
    if (selectedEvents.size === 0) {
      Alert.alert('No Events Selected', 'Please select at least one event to import.');
      return;
    }

    setIsImporting(true);
    try {
      const selectedEventObjects = eventsForDate.filter((_, index) => 
        selectedEvents.has(`${selectedDate.toDateString()}_${index}`)
      );
      
      let tasks = convertEventsToTasks(selectedEventObjects, {
        minDurationMinutes: importOptions.minDurationMinutes,
        includeCategories: importOptions.includeCategories,
        smartDuration: importOptions.smartDuration,
      });
      
      // Set anchor properties based on user selection
      tasks = tasks.map((task, index) => ({
        ...task,
        isAnchored,
        anchoredStartTime: isAnchored ? 
          new Date(selectedEventObjects[index].dtstart).toLocaleTimeString([], { 
            hour: '2-digit',
            minute: '2-digit',
            hour12: false 
          }) : undefined,
      }));
      
      await onImport(tasks);
      
      Alert.alert(
        'Success', 
        `${selectedEvents.size} event${selectedEvents.size !== 1 ? 's' : ''} imported successfully!`,
        [{ text: 'OK', onPress: onClose }]
      );
    } catch (error) {
      console.error('Import error:', error);
      Alert.alert('Error', 'Failed to import events. Please try again.');
    } finally {
      setIsImporting(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const seconds = Math.floor((end.getTime() - start.getTime()) / 1000);
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const calculateSelectedDuration = () => {
    const selectedEventObjects = eventsForDate.filter((_, index) => 
      selectedEvents.has(`${selectedDate.toDateString()}_${index}`)
    );
    
    const totalMinutes = selectedEventObjects.reduce((sum, event) => {
      const start = new Date(event.dtstart);
      const end = new Date(event.dtend);
      const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
      return sum + Math.max(durationMinutes, importOptions.minDurationMinutes);
    }, 0);
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.floor(totalMinutes % 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getPreviewTasks = () => {
    const selectedEventObjects = eventsForDate.filter((_, index) => 
      selectedEvents.has(`${selectedDate.toDateString()}_${index}`)
    );
    
    return convertEventsToTasks(selectedEventObjects, {
      minDurationMinutes: importOptions.minDurationMinutes,
      includeCategories: importOptions.includeCategories,
      smartDuration: importOptions.smartDuration,
    });
  };

  const renderEventItem = ({ item, index }: { item: CalendarEvent; index: number }) => {
    const eventId = `${selectedDate.toDateString()}_${index}`;
    const isSelected = selectedEvents.has(eventId);

    return (
      <TouchableOpacity
        style={[
          styles.eventItem,
          isSelected && styles.eventItemSelected
        ]}
        onPress={() => toggleEventSelection(eventId)}
      >
        <View style={styles.eventCheckbox}>
          <Icon
            name={isSelected ? "check-box" : "check-box-outline-blank"}
            size={20}
            color={isSelected ? "#00BFA5" : "#64748B"}
          />
        </View>
        
        <View style={styles.eventContent}>
          <View style={styles.eventTitleRow}>
            <Text style={styles.eventTitle}>{item.summary}</Text>
            {item.isRecurring && (
              <Icon name="repeat" size={16} color="#00BFA5" />
            )}
          </View>
          <View style={styles.eventDetails}>
            <Text style={styles.eventTime}>
              {formatTime(item.dtstart)} - {formatTime(item.dtend)}
            </Text>
            <Text style={styles.eventDuration}>
              ({formatDuration(item.dtstart, item.dtend)})
            </Text>
          </View>
          {item.description && (
            <Text style={styles.eventDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}
          {item.categories && (
            <Text style={styles.eventCategories} numberOfLines={1}>
              🏷️ {item.categories}
            </Text>
          )}
          {item.location && (
            <Text style={styles.eventLocation} numberOfLines={1}>
              📍 {item.location}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Import Calendar Events</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Icon name="close" size={24} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* File Picker Section */}
          {events.length === 0 && (
            <View style={styles.filePickerSection}>
              <TouchableOpacity
                style={styles.filePickerButton}
                onPress={handleFilePicker}
              >
                <Icon name="upload-file" size={32} color="#00BFA5" />
                <Text style={styles.filePickerText}>Select Calendar File (.ics)</Text>
                <Text style={styles.filePickerSubtext}>
                  Choose an .ics file exported from Google Calendar, Apple Calendar, etc.
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Calendar Interface */}
          {events.length > 0 && (
            <>
              {/* Date Selector */}
              <View style={styles.dateSection}>
                <Text style={styles.sectionTitle}>Select Date</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Icon name="event" size={20} color="#00BFA5" />
                  <Text style={styles.dateButtonText}>
                    {selectedDate.toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </Text>
                  <Icon name="keyboard-arrow-down" size={20} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              {/* Anchor Setting */}
              <View style={styles.anchorSection}>
                <View style={styles.anchorRow}>
                  <Text style={styles.anchorLabel}>Import as Anchored Tasks</Text>
                  <Switch
                    value={isAnchored}
                    onValueChange={setIsAnchored}
                    trackColor={{ false: '#64748B', true: '#00BFA5' }}
                    thumbColor={isAnchored ? '#FFFFFF' : '#FFFFFF'}
                  />
                </View>
                <Text style={styles.anchorDescription}>
                  Anchored tasks will maintain their scheduled times
                </Text>
              </View>

              {/* Import Options */}
              <View style={styles.optionsSection}>
                <Text style={styles.sectionTitle}>Import Options</Text>
                
                <View style={styles.optionRow}>
                  <Text style={styles.optionLabel}>Include Categories as Labels</Text>
                  <Switch
                    value={importOptions.includeCategories}
                    onValueChange={(value) => setImportOptions(prev => ({ ...prev, includeCategories: value }))}
                    trackColor={{ false: '#64748B', true: '#00BFA5' }}
                    thumbColor={importOptions.includeCategories ? '#FFFFFF' : '#FFFFFF'}
                  />
                </View>
                
                <View style={styles.optionRow}>
                  <Text style={styles.optionLabel}>Smart Duration Adjustment</Text>
                  <Switch
                    value={importOptions.smartDuration}
                    onValueChange={(value) => setImportOptions(prev => ({ ...prev, smartDuration: value }))}
                    trackColor={{ false: '#64748B', true: '#00BFA5' }}
                    thumbColor={importOptions.smartDuration ? '#FFFFFF' : '#FFFFFF'}
                  />
                </View>
                
                <Text style={styles.optionDescription}>
                  Smart duration optimizes meeting times based on common patterns (e.g., shorter standups, longer interviews)
                </Text>
              </View>

              {/* Events List */}
              <View style={styles.eventsSection}>
                <View style={styles.eventsSectionHeader}>
                  <View style={styles.eventsStatsContainer}>
                    <Text style={styles.sectionTitle}>
                      Events ({eventsForDate.length})
                    </Text>
                    {eventsForDate.some(e => e.isRecurring) && (
                      <Text style={styles.recurringBadge}>
                        {eventsForDate.filter(e => e.isRecurring).length} recurring
                      </Text>
                    )}
                  </View>
                  {eventsForDate.length > 0 && (
                    <TouchableOpacity onPress={selectAllEvents} style={styles.selectAllButton}>
                      <Text style={styles.selectAllText}>
                        {selectedEvents.size === eventsForDate.length ? 'Deselect All' : 'Select All'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {eventsForDate.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Icon name="event-busy" size={48} color="#64748B" />
                    <Text style={styles.emptyStateText}>No events found</Text>
                    <Text style={styles.emptyStateSubtext}>
                      Try selecting a different date
                    </Text>
                  </View>
                ) : (
                  <FlatList
                    data={eventsForDate}
                    renderItem={renderEventItem}
                    keyExtractor={(_, index) => `${selectedDate.toDateString()}_${index}`}
                    showsVerticalScrollIndicator={false}
                    style={styles.eventsList}
                  />
                )}
              </View>
            </>
          )}
        </ScrollView>

        {/* Action Buttons */}
        {events.length > 0 && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            {selectedEvents.size > 0 && (
              <TouchableOpacity
                style={[styles.button, styles.previewButton]}
                onPress={() => setShowPreview(true)}
              >
                <Text style={styles.previewButtonText}>Preview</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={[
                styles.button,
                styles.importButton,
                (selectedEvents.size === 0 || isImporting) && styles.buttonDisabled
              ]}
              onPress={handleImport}
              disabled={selectedEvents.size === 0 || isImporting}
            >
              <Text style={styles.importButtonText}>
                {isImporting ? 'Importing...' : 
                  `Import ${selectedEvents.size} Event${selectedEvents.size !== 1 ? 's' : ''}${
                    selectedEvents.size > 0 ? ` (${calculateSelectedDuration()})` : ''
                  }`
                }
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Date Picker */}
        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            onChange={handleDateChange}
          />
        )}
      </View>
      
      {/* Preview Modal */}
      <Modal
        visible={showPreview}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPreview(false)}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Task Preview</Text>
            <TouchableOpacity onPress={() => setShowPreview(false)} style={styles.closeButton}>
              <Icon name="close" size={24} color="#94A3B8" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.previewSection}>
              <Text style={styles.sectionTitle}>
                Tasks to be Created ({getPreviewTasks().length})
              </Text>
              
              {getPreviewTasks().map((task, index) => (
                <View key={index} style={styles.previewTaskItem}>
                  <View style={styles.previewTaskHeader}>
                    <Text style={styles.previewTaskName}>{task.name}</Text>
                    <Text style={styles.previewTaskDuration}>
                      {Math.round(task.duration / 60)}min
                    </Text>
                  </View>
                  
                  {task.notes && (
                    <Text style={styles.previewTaskNotes} numberOfLines={2}>
                      {task.notes}
                    </Text>
                  )}
                  
                  <View style={styles.previewTaskMeta}>
                    {task.location && (
                      <Text style={styles.previewTaskLocation}>📍 {task.location}</Text>
                    )}
                    {task.groupLabel && (
                      <Text style={styles.previewTaskLabel}>🏷️ {task.groupLabel}</Text>
                    )}
                    {isAnchored && (
                      <Text style={styles.previewTaskAnchored}>⚓ Anchored</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
          
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => setShowPreview(false)}
            >
              <Text style={styles.cancelButtonText}>Back</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.importButton]}
              onPress={() => {
                setShowPreview(false);
                handleImport();
              }}
            >
              <Text style={styles.importButtonText}>Import Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Modal>
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
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#E2E8F0',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  filePickerSection: {
    padding: 20,
  },
  filePickerButton: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#334155',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    backgroundColor: '#1E293B',
  },
  filePickerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E2E8F0',
    marginTop: 12,
    marginBottom: 4,
  },
  filePickerSubtext: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
  },
  dateSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E2E8F0',
    marginBottom: 12,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#334155',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  dateButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#E2E8F0',
    fontWeight: '500',
  },
  anchorSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  anchorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  anchorLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E2E8F0',
  },
  anchorDescription: {
    fontSize: 14,
    color: '#94A3B8',
  },
  optionsSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#E2E8F0',
    flex: 1,
    marginRight: 12,
  },
  optionDescription: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 16,
    marginTop: 8,
  },
  eventsSection: {
    flex: 1,
    padding: 20,
  },
  eventsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  eventsStatsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recurringBadge: {
    fontSize: 12,
    color: '#00BFA5',
    backgroundColor: 'rgba(0, 191, 165, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: 'hidden',
  },
  selectAllButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  selectAllText: {
    fontSize: 14,
    color: '#00BFA5',
    fontWeight: '500',
  },
  eventsList: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#E2E8F0',
    marginTop: 16,
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#334155',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    gap: 12,
  },
  eventItemSelected: {
    backgroundColor: 'rgba(0, 191, 165, 0.1)',
    borderWidth: 1,
    borderColor: '#00BFA5',
  },
  eventCheckbox: {
    paddingTop: 2,
  },
  eventContent: {
    flex: 1,
  },
  eventTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  eventTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#E2E8F0',
    marginBottom: 4,
  },
  eventDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  eventTime: {
    fontSize: 14,
    color: '#00BFA5',
    fontWeight: '500',
  },
  eventDuration: {
    fontSize: 12,
    color: '#94A3B8',
  },
  eventDescription: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 16,
    marginBottom: 4,
  },
  eventCategories: {
    fontSize: 12,
    color: '#00BFA5',
    lineHeight: 16,
    marginBottom: 4,
  },
  eventLocation: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 16,
  },
  actions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#334155',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E2E8F0',
  },
  previewButton: {
    backgroundColor: '#475569',
  },
  previewButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E2E8F0',
  },
  importButton: {
    backgroundColor: '#00BFA5',
  },
  importButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  buttonDisabled: {
    backgroundColor: '#64748B',
    opacity: 0.5,
  },
  previewSection: {
    padding: 20,
  },
  previewTaskItem: {
    backgroundColor: '#334155',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  previewTaskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  previewTaskName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#E2E8F0',
    marginRight: 12,
  },
  previewTaskDuration: {
    fontSize: 14,
    fontWeight: '500',
    color: '#00BFA5',
  },
  previewTaskNotes: {
    fontSize: 14,
    color: '#94A3B8',
    lineHeight: 18,
    marginBottom: 8,
  },
  previewTaskMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  previewTaskLocation: {
    fontSize: 12,
    color: '#94A3B8',
  },
  previewTaskLabel: {
    fontSize: 12,
    color: '#00BFA5',
  },
  previewTaskAnchored: {
    fontSize: 12,
    color: '#F59E0B',
  },
});

export default CalendarImportModal;
