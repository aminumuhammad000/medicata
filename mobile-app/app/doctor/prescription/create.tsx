import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, FlatList, ActivityIndicator, Platform, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { api } from '../../../services/api';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function CreatePrescription() {
  const router = useRouter();
  const { consultationId, patientId } = useLocalSearchParams<{ consultationId: string, patientId: string }>();
  
  const [items, setItems] = useState<any[]>([]);
  const [drugQuery, setDrugQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedDrug, setSelectedDrug] = useState<any>(null);
  
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('');
  const [duration, setDuration] = useState('');
  const [quantity, setQuantity] = useState('');
  const [instructions, setInstructions] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);

  const [patientQuery, setPatientQuery] = useState('');
  const [patientResults, setPatientResults] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [isSearchingPatient, setIsSearchingPatient] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (drugQuery.length > 2) {
        searchDrugs(drugQuery);
      } else {
        setSearchResults([]);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [drugQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (patientQuery.length > 2) {
        searchPatients(patientQuery);
      } else {
        setPatientResults([]);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [patientQuery]);

  const searchDrugs = async (name: string) => {
    if (!name.trim()) return;
    setIsSearching(true);
    try {
      const res = await api.searchDrugs(name);
      if (res.data) {
        // Handle various response formats (OpenFDA vs Internal)
        const drugs = Array.isArray(res.data) ? res.data : (res.data as any).drugs || [];
        // Map OpenFDA fields to internal UI fields if necessary
        const mappedDrugs = drugs.map((d: any) => ({
          id: d.id || Math.random().toString(36).substr(2, 9),
          name: d.name || d.brand_name || d.generic_name || 'Unknown Drug',
          brand: d.brand || d.brand_name || 'Generic',
          strength: d.strength || d.strengths?.[0] || 'N/A',
        }));
        setSearchResults(mappedDrugs);
      }
    } catch (error) {
      console.error('Drug search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const searchPatients = async (query: string) => {
    setIsSearchingPatient(true);
    try {
      const res = await api.searchPatients(query);
      if (res.data) {
        setPatientResults(res.data);
      }
    } catch (error) {
      console.error('Patient search failed:', error);
    } finally {
      setIsSearchingPatient(false);
    }
  };

  const addItem = () => {
    if (!selectedDrug || !dosage || !quantity) return;
    
    setItems([...items, { 
      drug: selectedDrug, 
      drug_id: selectedDrug.id,
      dosage, 
      frequency, 
      duration_days: parseInt(duration) || 0,
      quantity: parseInt(quantity) || 0,
      instructions 
    }]);
    
    setDrugQuery('');
    setSelectedDrug(null);
    setDosage('');
    setFrequency('');
    setDuration('');
    setQuantity('');
    setInstructions('');
  };

  const handleFinish = async () => {
    const finalPatientId = patientId || selectedPatient?.id;
    if (!finalPatientId) {
      alert('Please select a patient');
      return;
    }
    if (items.length === 0) {
      alert('Please add at least one medication');
      return;
    }
    
    setIsFinishing(true);
    try {
      await api.createPrescription({
        consultation_id: consultationId || undefined,
        patient_id: finalPatientId,
        expiry_days: 30, // Default 30 days
        items: items.map(item => ({
          drug_id: item.drug_id,
          dosage: item.dosage,
          frequency: item.frequency,
          duration_days: item.duration_days,
          quantity: item.quantity,
          instructions: item.instructions
        }))
      });
      alert('Prescription created successfully!');
      router.back();
    } catch (error) {
      alert('Failed to create prescription');
    } finally {
      setIsFinishing(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0D1B3A', '#1a2a4e']} style={styles.headerGradient}>
        <SafeAreaView edges={['top']}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>New Prescription</Text>
            <View style={{ width: 40 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {!patientId && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Select Patient</Text>
            <View style={styles.searchContainer}>
              <Ionicons name="person-search" size={20} color="#64748B" />
              <TextInput 
                style={styles.searchInput} 
                placeholder="Name, email or phone..." 
                value={selectedPatient ? selectedPatient.full_name : patientQuery}
                onChangeText={(text) => {
                  setPatientQuery(text);
                  if (selectedPatient) setSelectedPatient(null);
                }}
              />
              {isSearchingPatient && <ActivityIndicator size="small" color="#4A90E2" />}
            </View>
            
            {patientResults.length > 0 && !selectedPatient && (
              <View style={styles.suggestionsContainer}>
                {patientResults.map((p) => (
                  <TouchableOpacity 
                    key={p.id} 
                    style={styles.suggestionRow}
                    onPress={() => {
                      setSelectedPatient(p);
                      setPatientResults([]);
                    }}
                  >
                    <View style={styles.suggestionIcon}>
                      <Text style={styles.avatarInitial}>{p.full_name.charAt(0)}</Text>
                    </View>
                    <View>
                      <Text style={styles.suggestionMain}>{p.full_name}</Text>
                      <Text style={styles.suggestionSub}>{p.phone_number}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.cardHeader}>Medication Details</Text>
          
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Drug Name</Text>
            <View style={styles.searchContainer}>
              <Ionicons name="medical" size={20} color="#64748B" />
              <TextInput 
                style={styles.searchInput} 
                placeholder="Search medication..." 
                value={selectedDrug ? selectedDrug.name : drugQuery}
                onChangeText={(text) => {
                  setDrugQuery(text);
                  if (selectedDrug) setSelectedDrug(null);
                }}
              />
              {isSearching && <ActivityIndicator size="small" color="#4A90E2" />}
            </View>
            
            {searchResults.length > 0 && !selectedDrug && (
              <View style={styles.suggestionsContainer}>
                {searchResults.map((d) => (
                  <TouchableOpacity 
                    key={d.id} 
                    style={styles.suggestionRow}
                    onPress={() => {
                      setSelectedDrug(d);
                      setSearchResults([]);
                    }}
                  >
                    <Ionicons name="beaker-outline" size={20} color="#4A90E2" />
                    <View style={{ marginLeft: 12 }}>
                      <Text style={styles.suggestionMain}>{d.name}</Text>
                      <Text style={styles.suggestionSub}>{d.brand}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Dosage</Text>
              <TextInput style={styles.modernInput} placeholder="e.g. 500mg" value={dosage} onChangeText={setDosage} />
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Frequency</Text>
              <TextInput style={styles.modernInput} placeholder="e.g. 3x daily" value={frequency} onChangeText={setFrequency} />
            </View>
          </View>

          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Duration (Days)</Text>
              <TextInput style={styles.modernInput} placeholder="7" value={duration} onChangeText={setDuration} keyboardType="numeric" />
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.fieldLabel}>Total Qty</Text>
              <TextInput style={styles.modernInput} placeholder="21" value={quantity} onChangeText={setQuantity} keyboardType="numeric" />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Special Instructions</Text>
            <TextInput style={styles.modernInput} placeholder="Take after meals" value={instructions} onChangeText={setInstructions} />
          </View>

          <TouchableOpacity 
            style={[styles.addBtn, !selectedDrug && styles.addBtnDisabled]} 
            onPress={addItem}
            disabled={!selectedDrug}
          >
            <Ionicons name="add-circle" size={22} color="#fff" />
            <Text style={styles.addBtnText}>Add Medication</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.itemsSection}>
          <Text style={styles.itemsTitle}>Current Prescription List</Text>
          {items.length === 0 ? (
            <View style={styles.emptyItems}>
              <Ionicons name="clipboard-outline" size={40} color="#CBD5E1" />
              <Text style={styles.emptyItemsText}>No medications added yet</Text>
            </View>
          ) : (
            items.map((item, index) => (
              <View key={index} style={styles.itemBox}>
                <View style={styles.itemMain}>
                  <Text style={styles.itemDrugName}>{item.drug.name}</Text>
                  <Text style={styles.itemDetails}>
                    {item.dosage} • {item.frequency} • {item.duration_days} Days
                  </Text>
                  {item.instructions ? (
                    <Text style={styles.itemNote}>Note: {item.instructions}</Text>
                  ) : null}
                </View>
                <TouchableOpacity onPress={() => setItems(items.filter((_, i) => i !== index))} style={styles.removeBtn}>
                  <Ionicons name="close-circle" size={24} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity 
          style={[styles.finishBtn, (items.length === 0 || isFinishing) && styles.finishBtnDisabled]} 
          onPress={handleFinish}
          disabled={items.length === 0 || isFinishing}
        >
          {isFinishing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.finishBtnText}>Issue Prescription</Text>
              <Ionicons name="checkmark-circle" size={20} color="#fff" style={{ marginLeft: 8 }} />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  headerGradient: { paddingBottom: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 10 },
  headerBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255, 255, 255, 0.15)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
  content: { padding: 16 },
  section: { marginBottom: 20 },
  sectionLabel: { fontSize: 13, fontWeight: '800', color: '#64748B', marginBottom: 8, textTransform: 'uppercase' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 14, height: 54, borderWidth: 1, borderColor: '#E2E8F0', gap: 12 },
  searchInput: { flex: 1, fontSize: 15, color: '#1E293B' },
  suggestionsContainer: { backgroundColor: '#fff', borderRadius: 16, marginTop: 8, elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  suggestionRow: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  suggestionIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#E0E7FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarInitial: { color: '#4338CA', fontWeight: 'bold' },
  suggestionMain: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  suggestionSub: { fontSize: 12, color: '#64748B' },
  card: { backgroundColor: '#fff', borderRadius: 24, padding: 20, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 15, marginBottom: 24 },
  cardHeader: { fontSize: 17, fontWeight: '800', color: '#1E293B', marginBottom: 20 },
  fieldGroup: { marginBottom: 16 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: '#64748B', marginBottom: 6 },
  modernInput: { backgroundColor: '#F8FAFC', borderRadius: 14, padding: 14, fontSize: 15, color: '#1E293B', borderWidth: 1, borderColor: '#F1F5F9' },
  gridRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  gridCol: { flex: 1 },
  addBtn: { backgroundColor: '#0D1B3A', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 16, gap: 10, marginTop: 10 },
  addBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  addBtnDisabled: { opacity: 0.5 },
  itemsSection: { marginBottom: 100 },
  itemsTitle: { fontSize: 16, fontWeight: '800', color: '#1E293B', marginBottom: 12 },
  emptyItems: { alignItems: 'center', padding: 40, backgroundColor: '#F1F5F9', borderRadius: 20, borderStyle: 'dashed', borderWidth: 2, borderColor: '#CBD5E1' },
  emptyItemsText: { color: '#64748B', marginTop: 10, fontWeight: '600' },
  itemBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 18, padding: 16, marginBottom: 12, borderLeftWidth: 5, borderLeftColor: '#4A90E2' },
  itemMain: { flex: 1 },
  itemDrugName: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
  itemDetails: { fontSize: 13, color: '#64748B', marginTop: 2 },
  itemNote: { fontSize: 12, color: '#4A90E2', fontStyle: 'italic', marginTop: 4 },
  removeBtn: { padding: 4 },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: 'rgba(255,255,255,0.95)', borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  finishBtn: { backgroundColor: '#4A90E2', height: 60, borderRadius: 20, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', elevation: 4 },
  finishBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  finishBtnDisabled: { backgroundColor: '#CBD5E1' },
});
