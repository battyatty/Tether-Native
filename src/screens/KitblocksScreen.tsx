import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  Alert,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTether } from '../context/TetherContext';
import { RootStackParamList, Kitblock } from '../types';

type KitblocksScreenNavigationProp = StackNavigationProp<RootStackParamList>;

interface Props {
  navigation: KitblocksScreenNavigationProp;
}

const KitblocksScreen: React.FC<Props> = ({ navigation }) => {
  const { kitblocks, deleteKitblock } = useTether();

  const handleDeleteKitblock = (kitblock: Kitblock) => {
    Alert.alert(
      'Delete Kitblock',
      `Are you sure you want to delete "${kitblock.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteKitblock(kitblock.id),
        },
      ]
    );
  };

  const formatDuration = (duration: number) => {
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const renderKitblockCard = ({ item: kitblock }: { item: Kitblock }) => {
    const totalDuration = kitblock.tasks.reduce((sum, task) => sum + task.duration, 0);

    return (
      <TouchableOpacity
        style={styles.kitblockCard}
        onPress={() => navigation.navigate('EditKitblock', { kitblockId: kitblock.id })}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.kitblockName}>{kitblock.name}</Text>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteKitblock(kitblock)}
          >
            <Icon name="delete" size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>
        
        {kitblock.description && (
          <Text style={styles.kitblockDescription}>{kitblock.description}</Text>
        )}
        
        <View style={styles.cardFooter}>
          <Text style={styles.taskCount}>
            {kitblock.tasks.length} task{kitblock.tasks.length !== 1 ? 's' : ''}
          </Text>
          <Text style={styles.duration}>{formatDuration(totalDuration)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#00BFA5" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Kitblocks</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => navigation.navigate('CreateKitblock')}
        >
          <Icon name="add" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {kitblocks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No kitblocks yet</Text>
          <Text style={styles.emptySubtext}>
            Create reusable task groups to speed up tether building
          </Text>
          <TouchableOpacity
            style={styles.createFirstButton}
            onPress={() => navigation.navigate('CreateKitblock')}
          >
            <Icon name="add" size={24} color="#FFFFFF" />
            <Text style={styles.createFirstButtonText}>Create Your First Kitblock</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={kitblocks}
          renderItem={renderKitblockCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
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
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#E2E8F0',
    fontSize: 20,
    fontWeight: 'bold',
  },
  createButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#00BFA5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 20,
  },
  kitblockCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#00BFA5',
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  kitblockName: {
    color: '#E2E8F0',
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  kitblockDescription: {
    color: '#CBD5E1',
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskCount: {
    color: '#94A3B8',
    fontSize: 14,
  },
  duration: {
    color: '#00BFA5',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    color: '#E2E8F0',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubtext: {
    color: '#94A3B8',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  createFirstButton: {
    backgroundColor: '#00BFA5',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 24,
  },
  createFirstButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default KitblocksScreen;
