import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuthStore } from '../../src/stores/authStore';
import { apiRequest } from '../../src/utils/api';
import { formatDate } from '../../src/utils/format';
import { AuditLog } from '../../src/types';

export default function Audit() {
  const { token } = useAuthStore();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/admin/audit?limit=100', {}, token);
      setLogs(data);
    } catch (error: any) {
      Alert.alert('خطأ', error.message || 'فشل تحميل السجل');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const getActionText = (action: string) => {
    const actions: { [key: string]: string } = {
      'login': 'تسجيل دخول',
      'create_person': 'إضافة شخص',
      'delete_person': 'حذف شخص',
      'deposit_transaction': 'إيداع',
      'withdraw_transaction': 'سحب',
      'update_transaction': 'تعديل عملية',
      'delete_transaction': 'حذف عملية',
      'create_user': 'إضافة مستخدم',
      'delete_user': 'حذف مستخدم',
    };
    return actions[action] || action;
  };

  const renderLog = ({ item }: { item: AuditLog }) => (
    <View style={styles.logCard}>
      <View style={styles.logHeader}>
        <Text style={styles.actorName}>{item.actor_username}</Text>
        <Text style={styles.actionText}>{getActionText(item.action)}</Text>
      </View>
      {item.entity_type && (
        <Text style={styles.entityText}>
          {item.entity_type}: {item.entity_id}
        </Text>
      )}
      <Text style={styles.timeText}>{formatDate(item.created_at)}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>سجل التدقيق</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <FlatList
          data={logs}
          renderItem={renderLog}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>لا يوجد سجلات</Text>
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
  listContainer: {
    padding: 16,
  },
  logCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  actorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  entityText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  timeText: {
    fontSize: 12,
    color: '#999',
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
    fontSize: 16,
    color: '#999',
  },
});
