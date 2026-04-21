import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, FlatList, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { api } from '../../../services/api';

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

  const searchDrugs = async (name: string) => {
    setIsSearching(true);
    try {
      const res = await api.searchDrugs(name);
      if (res.data) {
        setSearchResults(res.data);
      }
    } catch (error) {
      console.error('Drug search failed:', error);
    } finally {
      setIsSearching(false);
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
    if (!patientId) return;
    setIsFinishing(true);
    try {
      await api.createPrescription({
        consultation_id: consultationId || undefined,
        patient_id: patientId,
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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.title}>New Prescription</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.formCard}>
          <Text style={styles.cardTitle}>Add Medication</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Search Drug</Text>
            <View style={styles.searchRow}>
              <TextInput 
                style={[styles.input, { flex: 1 }]} 
                placeholder="e.g. Amoxicillin" 
                value={selectedDrug ? selectedDrug.name : drugQuery}
                onChangeText={(text) => {
                  setDrugQuery(text);
                  if (selectedDrug) setSelectedDrug(null);
                }}
              />
              {isSearching && <ActivityIndicator style={{ marginLeft: -40 }} color="#4a90e2" />}
            </View>
            
            {searchResults.length > 0 && !selectedDrug && (
              <View style={styles.suggestions}>
                {searchResults.map((d) => (
                  <TouchableOpacity 
                    key={d.id} 
                    style={styles.suggestionItem}
                    onPress={() => {
                      setSelectedDrug(d);
                      setSearchResults([]);
                    }}
                  >
                    <Text style={styles.suggestionText}>{d.name}</Text>
                    <Text style={styles.suggestionMeta}>{d.brand} • {d.strength}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Dosage</Text>
              <TextInput 
                style={styles.input} 
                placeholder="500mg" 
                value={dosage}
                onChangeText={setDosage}
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
              <Text style={styles.label}>Frequency</Text>
              <TextInput 
                style={styles.input} 
                placeholder="3x daily" 
                value={frequency}
                onChangeText={setFrequency}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Duration (days)</Text>
              <TextInput 
                style={styles.input} 
                placeholder="7" 
                value={duration}
                onChangeText={setDuration}
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
              <Text style={styles.label}>Quantity</Text>
              <TextInput 
                style={styles.input} 
                placeholder="21" 
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Instructions (Optional)</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Take after meals" 
              value={instructions}
              onChangeText={setInstructions}
            />
          </View>

          <TouchableOpacity 
            style={[styles.addButton, !selectedDrug && styles.addButtonDisabled]} 
            onPress={addItem}
            disabled={!selectedDrug}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.addButtonText}>Add to List</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.listSection}>
          <Text style={styles.sectionTitle}>Prescription Items</Text>
          {items.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="medical-outline" size={48} color="#ddd" />
              <Text style={styles.emptyText}>No medications added</Text>
            </View>
          ) : (
            items.map((item, index) => (
              <View key={index} style={styles.itemCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemDrug}>{item.drug.name}</Text>
                  <Text style={styles.itemMeta}>{item.dosage} • {item.frequency} for {item.duration_days} days</Text>
                  {item.instructions ? (
                    <Text style={styles.itemInst}>Note: {item.instructions}</Text>
                  ) : null}
                </View>
                <TouchableOpacity onPress={() => setItems(items.filter((_, i) => i !== index))}>
                  <Ionicons name="trash-outline" size={20} color="#ff3b30" />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.finishButton, (items.length === 0 || isFinishing) && styles.finishButtonDisabled]} 
          onPress={handleFinish}
          disabled={items.length === 0 || isFinishing}
        >
          {isFinishing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.finishButtonText}>Finalize & Send Prescription</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  content: {
    padding: 20,
  },
  formCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 32,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
  },
  row: {
    flexDirection: 'row',
  },
  addButton: {
    backgroundColor: '#4a90e2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  listSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  emptyText: {
    color: '#bbb',
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
  },
  itemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 12,
  },
  itemDrug: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  itemMeta: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  finishButton: {
    backgroundColor: '#4a90e2',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  finishButtonDisabled: {
    backgroundColor: '#ccc',
  },
  finishButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  suggestions: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#eee',
    maxHeight: 200,
    ...(Platform.select({
      web: {
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }
    }) as any),
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  suggestionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  suggestionMeta: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  addButtonDisabled: {
    backgroundColor: '#ccc',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  itemInst: {
    fontSize: 12,
    color: '#4a90e2',
    marginTop: 4,
    fontStyle: 'italic',
  },
});
