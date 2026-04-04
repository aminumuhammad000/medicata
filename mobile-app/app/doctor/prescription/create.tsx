import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function CreatePrescription() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [drug, setDrug] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('');
  const [duration, setDuration] = useState('');

  const addItem = () => {
    if (!drug || !dosage) return;
    setItems([...items, { drug, dosage, frequency, duration }]);
    setDrug('');
    setDosage('');
    setFrequency('');
    setDuration('');
  };

  const handleFinish = () => {
    router.back(); // Go back to consultation desk
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
            <Text style={styles.label}>Drug Name</Text>
            <TextInput 
              style={styles.input} 
              placeholder="e.g. Amoxicillin" 
              value={drug}
              onChangeText={setDrug}
            />
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
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Duration (days)</Text>
            <TextInput 
              style={styles.input} 
              placeholder="7" 
              value={duration}
              onChangeText={setDuration}
              keyboardType="numeric"
            />
          </View>
          <TouchableOpacity style={styles.addButton} onPress={addItem}>
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.addButtonText}>Add to List</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.listSection}>
          <Text style={styles.sectionTitle}>Prescription Items</Text>
          {items.length === 0 ? (
            <Text style={styles.emptyText}>No items added yet</Text>
          ) : (
            items.map((item, index) => (
              <View key={index} style={styles.itemCard}>
                <View>
                  <Text style={styles.itemDrug}>{item.drug}</Text>
                  <Text style={styles.itemMeta}>{item.dosage} • {item.frequency} for {item.duration} days</Text>
                </View>
                <TouchableOpacity onPress={() => setItems(items.filter((_, i) => i !== index))}>
                  <Ionicons name="trash" size={20} color="#f44336" />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.finishButton, items.length === 0 && styles.finishButtonDisabled]} 
          onPress={handleFinish}
          disabled={items.length === 0}
        >
          <Text style={styles.finishButtonText}>Finalize Prescription</Text>
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
});
