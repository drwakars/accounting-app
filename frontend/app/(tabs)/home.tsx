import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useAuthStore } from '../../src/stores/authStore';
import { apiRequest } from '../../src/utils/api';
import { formatMoney } from '../../src/utils/format';
import { Person } from '../../src/types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function Home() {
  const { token } = useAuthStore();
  const router = useRouter();
  const [people, setPeople] = useState<Person[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Add person form
  const [newName, setNewName] = useState('');
  const [newUsd, setNewUsd] = useState('');
  const [newIqd, setNewIqd] = useState('');

  const loadPeople = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    
    try {
      const data = await apiRequest(
        `/people?search=${searchQuery}`,
        {},
        token
      );
      setPeople(data);
    } catch (error: any) {
      Alert.alert('خطأ', error.message || 'فشل تحميل البيانات');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadPeople();
  }, []);

  const handleSearch = () => {
    loadPeople();
  };

  const handleAddPerson = async () => {
    if (!newName) {
      Alert.alert('خطأ', 'الرجاء إدخال الاسم');
      return;
    }

    try {
      await apiRequest(
        '/people',
        {
          method: 'POST',
          body: JSON.stringify({
            name: newName,
            initial_usd: parseFloat(newUsd) || 0,
            initial_iqd: parseFloat(newIqd) || 0,
          }),
        },
        token
      );

      setNewName('');
      setNewUsd('');
      setNewIqd('');
      setShowAddForm(false);
      loadPeople();
      Alert.alert('نجاح', 'تم إضافة الشخص بنجاح');
    } catch (error: any) {
      Alert.alert('خطأ', error.message || 'فشل الإضافة');
    }
  };

  const renderPerson = ({ item }: { item: Person }) => (
    <TouchableOpacity
      style={styles.personCard}
      onPress={() => router.push(`/person/${item.id}`)}
    >
      <View style={styles.personHeader}>
        <Text style={styles.personName}>{item.name}</Text>
      </View>
      <View style={styles.balanceContainer}>
        <View style={styles.balanceItem}>
          <Text style={styles.balanceLabel}>USD</Text>
          <Text style={[styles.balanceAmount, item.balance_usd < 0 && styles.negative]}>
            ${formatMoney(item.balance_usd)}
          </Text>
        </View>
        <View style={styles.balanceItem}>
          <Text style={styles.balanceLabel}>IQD</Text>
          <Text style={[styles.balanceAmount, item.balance_iqd < 0 && styles.negative]}>
            {formatMoney(item.balance_iqd)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>دفتر الحسابات</Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="بحث عن شخص..."
          placeholderTextColor="#999"
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Ionicons name="search" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Add Person Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setShowAddForm(!showAddForm)}
      >
        <Ionicons name={showAddForm ? "close" : "add"} size={24} color="#fff" />
        <Text style={styles.addButtonText}>
          {showAddForm ? 'إلغاء' : 'إضافة شخص جديد'}
        </Text>
      </TouchableOpacity>

      {/* Add Person Form */}
      {showAddForm && (
        <View style={styles.addForm}>
          <TextInput
            style={styles.input}
            value={newName}
            onChangeText={setNewName}
            placeholder="الاسم الكامل"
            placeholderTextColor="#999"
          />
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.halfInput]}
              value={newUsd}
              onChangeText={setNewUsd}
              placeholder="رصيد USD"
              placeholderTextColor="#999"
              keyboardType="numeric"
            />
            <TextInput
              style={[styles.input, styles.halfInput]}
              value={newIqd}
              onChangeText={setNewIqd}
              placeholder="رصيد IQD"
              placeholderTextColor="#999"
              keyboardType="numeric"
            />
          </View>
          <TouchableOpacity style={styles.submitButton} onPress={handleAddPerson}>
            <Text style={styles.submitButtonText}>حفظ</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* People List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <FlatList
          data={people}
          renderItem={renderPerson}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => loadPeople(true)} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>لا يوجد أشخاص</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: '#007AFF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
    textAlign: 'right',
  },
  searchButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    width: 48,
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: '#34C759',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  addForm: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 8,
    gap: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    textAlign: 'right',
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  halfInput: {
    flex: 1,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 16,
  },
  personCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  personHeader: {
    marginBottom: 12,
  },
  personName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  balanceContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  balanceItem: {
    flex: 1,
  },
  balanceLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#34C759',
  },
  negative: {
    color: '#FF3B30',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 48,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
  },
});
