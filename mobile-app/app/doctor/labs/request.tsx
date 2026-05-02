import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { api } from '../../../services/api';

export default function RequestLabTest() {
  const router = useRouter();
  const { consultationId, patientId } = useLocalSearchParams<{ consultationId: string, patientId: string }>();
  
  const [testQuery, setTestQuery] = useState('');
  const [selectedTests, setSelectedTests] = useState<any[]>([]);
  const [instructions, setInstructions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Common lab tests for quick selection
  const commonTests = [
    { id: '1', name: 'Full Blood Count (FBC)', category: 'Hematology' },
    { id: '2', name: 'Malaria Parasite (MP)', category: 'Parasitology' },
    { id: '3', name: 'Urinalysis', category: 'Clinical Chemistry' },
    { id: '4', name: 'Lipid Profile', category: 'Biochemistry' },
    { id: '5', name: 'Liver Function Test (LFT)', category: 'Biochemistry' },
    { id: '6', name: 'Kidney Function Test (KFT)', category: 'Biochemistry' },
    { id: '7', name: 'Fasting Blood Sugar (FBS)', category: 'Endocrinology' },
    { id: '8', name: 'Widal Test', category: 'Serology' },
  ];

  const toggleTest = (test: any) => {
    if (selectedTests.find(t => t.id === test.id)) {
      setSelectedTests(selectedTests.filter(t => t.id !== test.id));
    } else {
      setSelectedTests([...selectedTests, test]);
    }
  };

  const handleRequest = async () => {
    if (selectedTests.length === 0) {
      alert('Please select at least one test');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const response = await api.requestLabTest({
        consultation_id: consultationId,
        patient_id: patientId || '',
        tests: selectedTests.map(t => ({ id: t.id, name: t.name })),
        instructions,
      });

      if (response.error) {
        alert(response.error);
      } else {
        alert('Lab test request sent successfully!');
        router.back();
      }
    } catch (error) {
      alert('Failed to send lab test request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.title}>Request Lab Test</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Common Lab Tests</Text>
          <View style={styles.testGrid}>
            {commonTests.map((test) => {
              const isSelected = selectedTests.find(t => t.id === test.id);
              return (
                <TouchableOpacity 
                  key={test.id} 
                  style={[styles.testTag, isSelected && styles.testTagSelected]}
                  onPress={() => toggleTest(test)}
                >
                  <Text style={[styles.testTagText, isSelected && styles.testTagTextSelected]}>
                    {test.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Other Test</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Type test name if not listed above..." 
            value={testQuery}
            onChangeText={setTestQuery}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Clinical Instructions</Text>
          <TextInput 
            style={styles.textArea} 
            placeholder="Reason for test, specific parameters to check..." 
            multiline
            numberOfLines={4}
            value={instructions}
            onChangeText={setInstructions}
          />
        </View>

        {selectedTests.length > 0 && (
          <View style={styles.selectedSection}>
            <Text style={styles.sectionTitle}>Selected Tests ({selectedTests.length})</Text>
            {selectedTests.map((test) => (
              <View key={test.id} style={styles.selectedItem}>
                <Text style={styles.selectedItemText}>{test.name}</Text>
                <TouchableOpacity onPress={() => toggleTest(test)}>
                  <Ionicons name="close-circle" size={20} color="#ff3b30" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.submitButton, (selectedTests.length === 0 || isSubmitting) && styles.submitButtonDisabled]} 
          onPress={handleRequest}
          disabled={selectedTests.length === 0 || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Send Lab Request</Text>
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  testGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  testTag: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f1f3f5',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  testTagSelected: {
    backgroundColor: '#4a90e2',
    borderColor: '#4a90e2',
  },
  testTagText: {
    fontSize: 13,
    color: '#495057',
    fontWeight: '600',
  },
  testTagTextSelected: {
    color: '#fff',
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
  },
  textArea: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    height: 100,
    textAlignVertical: 'top',
  },
  selectedSection: {
    backgroundColor: '#f0f7ff',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#d0e3ff',
    marginTop: 10,
  },
  selectedItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(74, 144, 226, 0.2)',
  },
  selectedItemText: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  submitButton: {
    backgroundColor: '#4a90e2',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
