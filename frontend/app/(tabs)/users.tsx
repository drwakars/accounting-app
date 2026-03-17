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
} from 'react-native';
import { useAuthStore } from '../../src/stores/authStore';
import { apiRequest } from '../../src/utils/api';
import { User } from '../../src/types';
import { Ionicons } from '@expo/vector-icons';
import { formatDateShort } from '../../src/utils/format';

export default function Users() {
  const { token, user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Add user form
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'user' | 'admin'>('user');

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/admin/users', {}, token);
      setUsers(data);
    } catch (error: any) {
      Alert.alert('خطأ', error.message || 'فشل تحميل المستخدمين');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleAddUser = async () => {
    if (!newUsername || !newPassword) {
      Alert.alert('خطأ', 'الرجاء إدخال جميع البيانات');
      return;
    }

    try {
      await apiRequest(
        '/admin/users',
        {
          method: 'POST',
          body: JSON.stringify({
            username: newUsername,
            password: newPassword,
            role: newRole,
          }),
        },
        token
      );

      setNewUsername('');
      setNewPassword('');
      setNewRole('user');
      setShowAddForm(false);
      loadUsers();
      Alert.alert('نجاح', 'تم إضافة المستخدم بنجاح');
    } catch (error: any) {
      Alert.alert('خطأ', error.message || 'فشل الإضافإ');
    }
  };

  const handleDeleteUser = (userId: string, username: string) => {
    Alert.alert(
      'تأكيد الحذف',
      `هل تريد حذف ${username}؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiRequest(
                `/admin/users/${userId}`,
                { method: 'DELETE' },
                token
              );
              loadUsers();
              Alert.alert('نجاح', 'تم الحذف بنجاح');
            } catch (error: any) {
              Alert.alert('خطأ', error.message || 'فشل الحذف');
            }
          },
        },
      ]
    );
  };

  const renderUser = ({ item }: { item: User }) => {
    const isCurrentUser = item.id === currentUser?.id;
    
    return (
      <View style={styles.userCard}>
        <View style={styles.userInfo}>
          <View style={styles.userHeader}>
            <Text style={styles.username}>{item.username}</Text>
            <View style={[
              styles.roleBadge,
              item.role === 'admin' ? styles.adminBadge : styles.userBadge
            ]}>
              <Text style={styles.roleText}>
                {item.role === 'admin' ? 'مدير' : 'مستخدم'}
              </Text>
            </View>
          </View>
          <Text style={styles.date}>
            تاريخ الإنشاء: {formatDateShort(item.created_at)}
          </Text>
        </View>
        
        {!isCurrentUser && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteUser(item.id, item.username)}
          >
            <Ionicons name="trash" size={20} color="#FF3B30" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>إدارة المستخدمين</Text>
      </View>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setShowAddForm(!showAddForm)}
      >
        <Ionicons name={showAddForm ? "close" : "add"} size={24} color="#fff" />
        <Text style={styles.addButtonText}>
          {showAddForm ? 'إلغاء' : 'إضافة مستخدم'}
        </Text>
      </TouchableOpacity>

      {showAddForm && (
        <View style={styles.addForm}>
          <TextInput
            style={styles.input}
            value={newUsername}
            onChangeText={setNewUsername}
            placeholder="اسم المستخدم"
            placeholderTextColor="#999"
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="كلمة المرور"
            placeholderTextColor="#999"
            secureTextEntry
          />
          
          <View style={styles.roleSelector}>
            <Text style={styles.roleLabel}>الصلاحية:</Text>
            <View style={styles.roleButtons}>
              <TouchableOpacity
                style={[
                  styles.roleButton,
                  newRole === 'user' && styles.roleButtonActive
                ]}
                onPress={() => setNewRole('user')}
              >
                <Text style={[
                  styles.roleButtonText,
                  newRole === 'user' && styles.roleButtonTextActive
                ]}>
                  مستخدم
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.roleButton,
                  newRole === 'admin' && styles.roleButtonActive
                ]}
                onPress={() => setNewRole('admin')}
              >
                <Text style={[
                  styles.roleButtonText,
                  newRole === 'admin' && styles.roleButtonTextActive
                ]}>
                  مدير
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <TouchableOpacity style={styles.submitButton} onPress={handleAddUser}>
            <Text style={styles.submitButtonText}>حفظ</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <FlatList
          data={users}
          renderItem={renderUser}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
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
  addButton: {
    flexDirection: 'row',
    backgroundColor: '#34C759',
    marginHorizontal: 16,
    marginTop: 16,
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
  roleSelector: {
    gap: 8,
  },
  roleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  roleButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  roleButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  roleButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  roleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  roleButtonTextActive: {
    color: '#fff',
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
  userCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userInfo: {
    flex: 1,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  adminBadge: {
    backgroundColor: '#FF9500',
  },
  userBadge: {
    backgroundColor: '#007AFF',
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  date: {
    fontSize: 12,
    color: '#666',
  },
  deleteButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
