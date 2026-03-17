import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useAuthStore } from '../../src/stores/authStore';
import { apiRequest } from '../../src/utils/api';
import { formatMoney } from '../../src/utils/format';
import { MonthlyReport } from '../../src/types';
import { Ionicons } from '@expo/vector-icons';

export default function Reports() {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());

  function getCurrentMonth() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  const loadReport = async () => {
    setLoading(true);
    try {
      const data = await apiRequest(
        `/reports/monthly?month=${selectedMonth}`,
        {},
        token
      );
      setReport(data);
    } catch (error: any) {
      Alert.alert('خطأ', error.message || 'فشل تحميل التقرير');
    } finally {
      setLoading(false);
    }
  };

  const changeMonth = (direction: 'prev' | 'next') => {
    const [year, month] = selectedMonth.split('-').map(Number);
    let newYear = year;
    let newMonth = month;

    if (direction === 'prev') {
      newMonth--;
      if (newMonth < 1) {
        newMonth = 12;
        newYear--;
      }
    } else {
      newMonth++;
      if (newMonth > 12) {
        newMonth = 1;
        newYear++;
      }
    }

    setSelectedMonth(`${newYear}-${String(newMonth).padStart(2, '0')}`);
    setReport(null);
  };

  const getMonthName = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const monthNames = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>التقارير الشهرية</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Month Selector */}
        <View style={styles.monthSelector}>
          <TouchableOpacity
            style={styles.monthButton}
            onPress={() => changeMonth('next')}
          >
            <Ionicons name="chevron-forward" size={24} color="#007AFF" />
          </TouchableOpacity>
          
          <Text style={styles.monthText}>{getMonthName(selectedMonth)}</Text>
          
          <TouchableOpacity
            style={styles.monthButton}
            onPress={() => changeMonth('prev')}
          >
            <Ionicons name="chevron-back" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.loadButton} onPress={loadReport}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="refresh" size={20} color="#fff" />
              <Text style={styles.loadButtonText}>عرض التقرير</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Report Display */}
        {report && (
          <View style={styles.reportContainer}>
            <View style={styles.reportSection}>
              <Text style={styles.sectionTitle}>دولار أمريكي (USD)</Text>
              
              <View style={styles.reportRow}>
                <View style={styles.reportItem}>
                  <Ionicons name="arrow-down" size={24} color="#34C759" />
                  <Text style={styles.reportLabel}>الإيداعات</Text>
                  <Text style={[styles.reportValue, styles.positive]}>
                    ${formatMoney(report.deposits_usd)}
                  </Text>
                </View>
                
                <View style={styles.reportItem}>
                  <Ionicons name="arrow-up" size={24} color="#FF3B30" />
                  <Text style={styles.reportLabel}>السحوبات</Text>
                  <Text style={[styles.reportValue, styles.negative]}>
                    ${formatMoney(report.withdraws_usd)}
                  </Text>
                </View>
              </View>
              
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>الصافي:</Text>
                <Text style={[
                  styles.totalValue,
                  (report.deposits_usd - report.withdraws_usd) >= 0 ? styles.positive : styles.negative
                ]}>
                  ${formatMoney(report.deposits_usd - report.withdraws_usd)}
                </Text>
              </View>
            </View>

            <View style={styles.reportSection}>
              <Text style={styles.sectionTitle}>دينار عراقي (IQD)</Text>
              
              <View style={styles.reportRow}>
                <View style={styles.reportItem}>
                  <Ionicons name="arrow-down" size={24} color="#34C759" />
                  <Text style={styles.reportLabel}>الإيداعات</Text>
                  <Text style={[styles.reportValue, styles.positive]}>
                    {formatMoney(report.deposits_iqd)}
                  </Text>
                </View>
                
                <View style={styles.reportItem}>
                  <Ionicons name="arrow-up" size={24} color="#FF3B30" />
                  <Text style={styles.reportLabel}>السحوبات</Text>
                  <Text style={[styles.reportValue, styles.negative]}>
                    {formatMoney(report.withdraws_iqd)}
                  </Text>
                </View>
              </View>
              
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>الصافي:</Text>
                <Text style={[
                  styles.totalValue,
                  (report.deposits_iqd - report.withdraws_iqd) >= 0 ? styles.positive : styles.negative
                ]}>
                  {formatMoney(report.deposits_iqd - report.withdraws_iqd)}
                </Text>
              </View>
            </View>

            <View style={styles.summaryBox}>
              <Ionicons name="document-text" size={32} color="#007AFF" />
              <Text style={styles.summaryText}>
                إجمالي العمليات: {report.total_transactions}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
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
  content: {
    flex: 1,
    padding: 16,
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  monthButton: {
    padding: 8,
  },
  monthText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  loadButton: {
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  loadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  reportContainer: {
    gap: 16,
  },
  reportSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#1a1a1a',
    textAlign: 'center',
  },
  reportRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  reportItem: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  reportLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  reportValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 4,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  positive: {
    color: '#34C759',
  },
  negative: {
    color: '#FF3B30',
  },
  summaryBox: {
    backgroundColor: '#e3f2fd',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    gap: 12,
  },
  summaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976d2',
  },
});
