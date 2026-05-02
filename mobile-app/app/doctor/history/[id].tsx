import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '../../../services/api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function PatientHistory() {
  const router = useRouter();
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'consultations' | 'labs' | 'prescriptions'>('consultations');

  useEffect(() => {
    if (id) {
      fetchHistory();
    }
  }, [id]);

  const fetchHistory = async () => {
    try {
      const res = await api.getPatientHistory(id);
      if (res.data) {
        setHistory(res.data);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0D1B3A" />
        <Text style={styles.loadingText}>Fetching Patient Records...</Text>
      </View>
    );
  }

  const renderConsultation = ({ item }: { item: any }) => (
    <View style={styles.historyCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardDate}>{new Date(item.scheduled_at).toLocaleDateString()}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{item.mode.toUpperCase()}</Text>
        </View>
      </View>
      <Text style={styles.cardTitle}>Dr. {item.doctor_name}</Text>
      <Text style={styles.cardReason} numberOfLines={2}>{item.reason}</Text>
      {item.doctor_notes && (
        <View style={styles.notesSection}>
          <Text style={styles.notesLabel}>Notes:</Text>
          <Text style={styles.notesText}>{item.doctor_notes}</Text>
        </View>
      )}
    </View>
  );

  const renderLabTest = ({ item }: { item: any }) => (
    <View style={styles.historyCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardDate}>{new Date(item.completed_at).toLocaleDateString()}</Text>
        <Text style={styles.codeText}>{item.requisition_code}</Text>
      </View>
      <Text style={styles.cardTitle}>Ordered by Dr. {item.doctor_name}</Text>
      <View style={styles.testList}>
        {item.tests.map((test: any, idx: number) => (
          <Text key={idx} style={styles.testItem}>• {test.name}</Text>
        ))}
      </View>
      {item.result_summary && (
        <View style={styles.notesSection}>
          <Text style={styles.notesLabel}>Findings:</Text>
          <Text style={styles.notesText}>{item.result_summary}</Text>
        </View>
      )}
    </View>
  );

  const renderPrescription = ({ item }: { item: any }) => (
    <View style={styles.historyCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
      </View>
      <Text style={styles.cardTitle}>Dr. {item.doctor_name}</Text>
      <View style={styles.drugList}>
        {item.items.map((drug: any, idx: number) => (
          <View key={idx} style={styles.drugItem}>
            <Text style={styles.drugName}>{drug.drug_name}</Text>
            <Text style={styles.drugDosage}>{drug.dosage} - {drug.instructions}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0D1B3A', '#1a2a4e']} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>{name || 'Patient'} History</Text>
              <Text style={styles.headerSubtitle}>Complete Medical Records</Text>
            </View>
          </View>

          <View style={styles.tabContainer}>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'consultations' && styles.activeTab]}
              onPress={() => setActiveTab('consultations')}
            >
              <Text style={[styles.tabText, activeTab === 'consultations' && styles.activeTabText]}>Visits</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'labs' && styles.activeTab]}
              onPress={() => setActiveTab('labs')}
            >
              <Text style={[styles.tabText, activeTab === 'labs' && styles.activeTabText]}>Labs</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'prescriptions' && styles.activeTab]}
              onPress={() => setActiveTab('prescriptions')}
            >
              <Text style={[styles.tabText, activeTab === 'prescriptions' && styles.activeTabText]}>Scripts</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <FlatList
        data={history ? history[activeTab] : []}
        renderItem={
          activeTab === 'consultations' ? renderConsultation :
          activeTab === 'labs' ? renderLabTest : renderPrescription
        }
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={64} color="#CBD5E1" />
            <Text style={styles.emptyText}>No {activeTab} found for this patient.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  header: {
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    marginBottom: 20,
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  activeTab: {
    backgroundColor: '#fff',
  },
  tabText: {
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#0D1B3A',
  },
  listContent: {
    padding: 20,
  },
  historyCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardDate: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  cardReason: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  badge: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  notesSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4A90E2',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 13,
    color: '#64748B',
    fontStyle: 'italic',
  },
  testList: {
    marginTop: 8,
  },
  testItem: {
    fontSize: 13,
    color: '#475569',
    marginBottom: 2,
  },
  codeText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: 'bold',
  },
  drugList: {
    marginTop: 10,
  },
  drugItem: {
    marginBottom: 8,
  },
  drugName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  drugDosage: {
    fontSize: 12,
    color: '#64748B',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
  },
});
