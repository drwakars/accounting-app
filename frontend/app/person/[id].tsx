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
  Modal,
  ScrollView,
} from 'react-native';
import { useAuthStore } from '../../src/stores/authStore';
import { apiRequest } from '../../src/utils/api';
import { formatMoney, formatDate } from '../../src/utils/format';
import { Person, Transaction } from '../../src/types';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function PersonDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuthStore();
  const router = useRouter();
  
  const [person, setPerson] = useState<Person | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddTx, setShowAddTx] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  
  // Add transaction form
  const [txType, setTxType] = useState<'deposit' | 'withdraw'>('deposit');
  const [txCurrency, setTxCurrency] = useState<'USD' | 'IQD'>('USD');
  const [txAmount, setTxAmount] = useState('');
  const [txNote, setTxNote] = useState('');

  // Edit transaction form
  const [editType, setEditType] = useState<'deposit' | 'withdraw'>('deposit');
  const [editCurrency, setEditCurrency] = useState<'USD' | 'IQD'>('USD');
  const [editAmount, setEditAmount] = useState('');
  const [editNote, setEditNote] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [personData, txData] = await Promise.all([
        apiRequest(`/people/${id}`, {}, token),
        apiRequest(`/transactions/person/${id}`, {}, token),
      ]);
      setPerson(personData);
      setTransactions(txData);
    } catch (error: any) {
      Alert.alert('خطأ', error.message || 'فشل تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const handleAddTransaction = async () => {
    if (!txAmount || parseFloat(txAmount) <= 0) {
      Alert.alert('خطأ', 'الرجاء إدخال مبلغ صحيح');
      return;
    }

    try {
      await apiRequest(
        '/transactions',
        {
          method: 'POST',
          body: JSON.stringify({
            person_id: id,
            type: txType,
            currency: txCurrency,
            amount: parseFloat(txAmount),
            note: txNote,
          }),
        },
        token
      );

      setTxAmount('');
      setTxNote('');
      setShowAddTx(false);
      loadData();
      Alert.alert('نجاح', 'تم تسجيل العملية بنجاح');
    } catch (error: any) {
      Alert.alert('خطأ', error.message || 'فشل التسجيل');
    }
  };

  const handleEditTransaction = (tx: Transaction) => {
    setEditingTx(tx);
    setEditType(tx.type as 'deposit' | 'withdraw');
    setEditCurrency(tx.currency as 'USD' | 'IQD');
    setEditAmount(tx.amount.toString());
    setEditNote(tx.note);
    setShowEditModal(true);
  };

  const handleUpdateTransaction = async () => {
    if (!editingTx || !editAmount || parseFloat(editAmount) <= 0) {
      Alert.alert('خطأ', 'الرجاء إدخال مبلغ صحيح');
      return;
    }

    try {
      await apiRequest(
        `/transactions/${editingTx.id}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            type: editType,
            currency: editCurrency,
            amount: parseFloat(editAmount),
            note: editNote,
          }),
        },
        token
      );

      setShowEditModal(false);
      setEditingTx(null);
      loadData();
      Alert.alert('نجاح', 'تم التعديل بنجاح');
    } catch (error: any) {
      Alert.alert('خطأ', error.message || 'فشل التعديل');
    }
  };

  const handleDeleteTransaction = (txId: string) => {
    Alert.alert(
      'تأكيد الحذف',
      'هل تريد حذف هذه العملية؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiRequest(
                `/transactions/${txId}`,
                { method: 'DELETE' },
                token
              );
              loadData();
              Alert.alert('نجاح', 'تم الحذف بنجاح');
            } catch (error: any) {
              Alert.alert('خطأ', error.message || 'فشل الحذف');
            }
          },
        },
      ]
    );
  };

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <View style={styles.txCard}>
      <View style={styles.txHeader}>
        <View style={styles.txInfo}>
          <View style={[
            styles.txTypeBadge,
            item.type === 'deposit' ? styles.depositBadge : styles.withdrawBadge
          ]}>
            <Ionicons 
              name={item.type === 'deposit' ? 'arrow-down' : 'arrow-up'} 
              size={16} 
              color="#fff" 
            />
            <Text style={styles.txTypeText}>
              {item.type === 'deposit' ? 'إيداع' : 'سحب'}
            </Text>
          </View>
          <Text style={styles.txCurrency}>{item.currency}</Text>
        </View>
        <Text style={[
          styles.txAmount,
          item.type === 'deposit' ? styles.positive : styles.negative
        ]}>
          {item.type === 'deposit' ? '+' : '-'}{formatMoney(item.amount)}
        </Text>
      </View>
      {item.note && <Text style={styles.txNote}>{item.note}</Text>}
      <View style={styles.txFooter}>
        <Text style={styles.txTime}>{formatDate(item.created_at)}</Text>
        <View style={styles.txActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEditTransaction(item)}
          >
            <Ionicons name="create" size={18} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteTransaction(item.id)}
          >
            <Ionicons name="trash" size={18} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (loading && !person) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>{person?.name}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.balanceSection}>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>USD</Text>
          <Text style={[
            styles.balanceAmount,
            (person?.balance_usd || 0) < 0 && styles.negative
          ]}>
            ${formatMoney(person?.balance_usd || 0)}
          </Text>
        </View>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>IQD</Text>
          <Text style={[
            styles.balanceAmount,
            (person?.balance_iqd || 0) < 0 && styles.negative
          ]}>
            {formatMoney(person?.balance_iqd || 0)}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.addTxButton}
        onPress={() => setShowAddTx(!showAddTx)}
      >
        <Ionicons name={showAddTx ? "close" : "add"} size={24} color="#fff" />
        <Text style={styles.addTxButtonText}>
          {showAddTx ? 'إلغاء' : 'إضافة عملية'}
        </Text>
      </TouchableOpacity>

      {showAddTx && (
        <View style={styles.addTxForm}>
          <View style={styles.typeSelector}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                txType === 'deposit' && styles.typeButtonActive
              ]}
              onPress={() => setTxType('deposit')}
            >
              <Ionicons name="arrow-down" size={20} color={txType === 'deposit' ? '#fff' : '#34C759'} />
              <Text style={[
                styles.typeButtonText,
                txType === 'deposit' && styles.typeButtonTextActive
              ]}>
                إيداع
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.typeButton,
                txType === 'withdraw' && styles.typeButtonActive
              ]}
              onPress={() => setTxType('withdraw')}
            >
              <Ionicons name="arrow-up" size={20} color={txType === 'withdraw' ? '#fff' : '#FF3B30'} />
              <Text style={[
                styles.typeButtonText,
                txType === 'withdraw' && styles.typeButtonTextActive
              ]}>
                سحب
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.currencySelector}>
            <TouchableOpacity
              style={[
                styles.currencyButton,
                txCurrency === 'USD' && styles.currencyButtonActive
              ]}
              onPress={() => setTxCurrency('USD')}
            >
              <Text style={[
                styles.currencyButtonText,
                txCurrency === 'USD' && styles.currencyButtonTextActive
              ]}>
                USD
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.currencyButton,
                txCurrency === 'IQD' && styles.currencyButtonActive
              ]}
              onPress={() => setTxCurrency('IQD')}
            >
              <Text style={[
                styles.currencyButtonText,
                txCurrency === 'IQD' && styles.currencyButtonTextActive
              ]}>
                IQD
              </Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.input}
            value={txAmount}
            onChangeText={setTxAmount}
            placeholder="المبلغ"
            placeholderTextColor="#999"
            keyboardType="numeric"
          />

          <TextInput
            style={styles.input}
            value={txNote}
            onChangeText={setTxNote}
            placeholder="ملاحظة (اختياري)"
            placeholderTextColor="#999"
          />

          <TouchableOpacity style={styles.submitButton} onPress={handleAddTransaction}>
            <Text style={styles.submitButtonText}>حفظ</Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={styles.sectionTitle}>العمليات</Text>

      <FlatList
        data={transactions}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>لا توجد عمليات</Text>
          </View>
        }
      />

      {/* Edit Modal */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>تعديل العملية</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView>
              <View style={styles.typeSelector}>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    editType === 'deposit' && styles.typeButtonActive
                  ]}
                  onPress={() => setEditType('deposit')}
                >
                  <Ionicons name="arrow-down" size={20} color={editType === 'deposit' ? '#fff' : '#34C759'} />
                  <Text style={[
                    styles.typeButtonText,
                    editType === 'deposit' && styles.typeButtonTextActive
                  ]}>
                    إيداع
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    editType === 'withdraw' && styles.typeButtonActive
                  ]}
                  onPress={() => setEditType('withdraw')}
                >
                  <Ionicons name="arrow-up" size={20} color={editType === 'withdraw' ? '#fff' : '#FF3B30'} />
                  <Text style={[
                    styles.typeButtonText,
                    editType === 'withdraw' && styles.typeButtonTextActive
                  ]}>
                    سحب
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.currencySelector}>
                <TouchableOpacity
                  style={[
                    styles.currencyButton,
                    editCurrency === 'USD' && styles.currencyButtonActive
                  ]}
                  onPress={() => setEditCurrency('USD')}
                >
                  <Text style={[
                    styles.currencyButtonText,
                    editCurrency === 'USD' && styles.currencyButtonTextActive
                  ]}>
                    USD
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.currencyButton,
                    editCurrency === 'IQD' && styles.currencyButtonActive
                  ]}
                  onPress={() => setEditCurrency('IQD')}
                >
                  <Text style={[
                    styles.currencyButtonText,
                    editCurrency === 'IQD' && styles.currencyButtonTextActive
                  ]}>
                    IQD
                  </Text>
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.input}
                value={editAmount}
                onChangeText={setEditAmount}
                placeholder="المبلغ"
                placeholderTextColor="#999"
                keyboardType="numeric"
              />

              <TextInput
                style={styles.input}
                value={editNote}
                onChangeText={setEditNote}
                placeholder="ملاحظة (اختياري)"
                placeholderTextColor="#999"
              />

              <TouchableOpacity style={styles.submitButton} onPress={handleUpdateTransaction}>
                <Text style={styles.submitButtonText}>حفظ التعديلات</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#007AFF',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  balanceSection: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  balanceCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#34C759',
  },
  negative: {
    color: '#FF3B30',
  },
  positive: {
    color: '#34C759',
  },
  addTxButton: {
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
  addTxButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  addTxForm: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 8,
    gap: 12,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  typeButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  typeButtonTextActive: {
    color: '#fff',
  },
  currencySelector: {
    flexDirection: 'row',
    gap: 8,
  },
  currencyButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  currencyButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  currencyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  currencyButtonTextActive: {
    color: '#fff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    textAlign: 'right',
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginBottom: 8,
    color: '#1a1a1a',
  },
  listContainer: {
    padding: 16,
  },
  txCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  txHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  txInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  txTypeBadge: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4,
    alignItems: 'center',
  },
  depositBadge: {
    backgroundColor: '#34C759',
  },
  withdrawBadge: {
    backgroundColor: '#FF3B30',
  },
  txTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  txCurrency: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  txAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  txNote: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  txFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  txTime: {
    fontSize: 12,
    color: '#999',
  },
  txActions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    padding: 4,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
});
