import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface BulkActionFooterProps {
  selectedCount: number;
  onBulkDelete: () => void;
  onBulkDuplicate: () => void;
  onCancel: () => void;
  onSelectAll: () => void;
  totalCount: number;
}

const BulkActionFooter: React.FC<BulkActionFooterProps> = ({
  selectedCount,
  onBulkDelete,
  onBulkDuplicate,
  onCancel,
  onSelectAll,
  totalCount,
}) => {
  return (
    <View style={styles.footer}>
      <View style={styles.leftSection}>
        <TouchableOpacity onPress={onSelectAll} style={styles.selectAllButton}>
          <Text style={styles.selectAllText}>
            {selectedCount === totalCount ? 'Deselect All' : 'Select All'}
          </Text>
        </TouchableOpacity>
        <Text style={styles.selectedCount}>
          {selectedCount} selected
        </Text>
      </View>
      
      <View style={styles.rightSection}>
        <TouchableOpacity 
          onPress={onBulkDuplicate} 
          style={[styles.actionButton, styles.duplicateButton]}
          disabled={selectedCount === 0}
        >
          <Icon name="content-copy" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={onBulkDelete} 
          style={[styles.actionButton, styles.deleteButton]}
          disabled={selectedCount === 0}
        >
          <Icon name="delete" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        
        <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectAllButton: {
    marginRight: 16,
  },
  selectAllText: {
    color: '#00BFA5',
    fontSize: 14,
    fontWeight: '500',
  },
  selectedCount: {
    color: '#94A3B8',
    fontSize: 14,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 12,
    borderRadius: 8,
    marginRight: 8,
  },
  duplicateButton: {
    backgroundColor: '#00BFA5',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
  },
  cancelButton: {
    padding: 12,
  },
  cancelText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default BulkActionFooter;
