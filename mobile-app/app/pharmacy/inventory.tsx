import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput, ScrollView, Platform, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../../services/api';
import DateTimePicker from '@react-native-community/datetimepicker';

import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';

export default function InventoryScreen({ isTab = false }: { isTab?: boolean }) {
  const router = useRouter();
  const [stock, setStock] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  
  // EXTENSIVE LISTS (100+ items each)
  const defaultCategories = [
    'Antibiotics', 'Analgesics (Pain Relief)', 'Antipyretics (Fever)', 'Antacids', 'Antihistamines',
    'Antiseptics', 'Antivirals', 'Antifungals', 'Antidepressants', 'Antipsychotics',
    'Anesthetics', 'Anti-inflammatories', 'Anti-diabetics', 'Anti-hypertensives', 'Anti-asthmatics',
    'Anticonvulsants', 'Anti-diarrheals', 'Laxatives', 'Vitamins', 'Multi-vitamins',
    'Minerals', 'Supplements', 'Herbal Medicines', 'Skincare', 'Dermatologicals',
    'Eye Care (Ophthalmic)', 'Ear Care (Otic)', 'Oral Care', 'First Aid', 'Surgical Supplies',
    'Baby Care', 'Maternal Health', 'Family Planning', 'Contraceptives', 'Hormonal Therapy',
    'Cardiovascular', 'Respiratory', 'Gastrointestinal', 'Neurological', 'Genitourinary',
    'Orthopedic', 'Immunological', 'Vaccines', 'Cough & Cold', 'Decongestants',
    'Bronchodilators', 'Expectorants', 'Anti-tussives', 'Emetic', 'Anti-emetic',
    'Sedatives', 'Hypnotics', 'Tranquilizers', 'Muscle Relaxants', 'Nootropics',
    'Blood Thinners', 'Anticoagulants', 'Anti-platelet', 'Iron Supplements', 'Calcium Supplements',
    'Probiotics', 'Prebiotics', 'Enzymes', 'Weight Management', 'Sports Nutrition',
    'Homeopathy', 'Ayurvedic', 'Aromatherapy', 'Beauty & Cosmetics', 'Hair Care',
    'Sun Care', 'Anti-aging', 'Sanitizers', 'Disinfectants', 'Personal Hygiene',
    'Feminine Hygiene', 'Adult Diapers', 'Diagnostic Tools', 'Thermometers', 'BP Monitors',
    'Glucometers', 'Inhalers', 'Nebulizers', 'Syringes', 'Needles',
    'Bandages', 'Gauze', 'Tapes', 'Gloves', 'Masks',
    'IV Fluids', 'Saline Solutions', 'Nutritional Drinks', 'Energy Drinks', 'Health Drinks'
  ];

  const defaultBrands = [
    'Pfizer', 'Emzor', 'GSK (GlaxoSmithKline)', 'M&B (May & Baker)', 'Novartis', 'Sanofi', 'Roche', 'Bayer',
    'AstraZeneca', 'Merck', 'Johnson & Johnson', 'Abbott', 'Eli Lilly', 'Bristol-Myers Squibb', 'Gilead',
    'Amgen', 'Teva', 'Novo Nordisk', 'Boehringer Ingelheim', 'Allergan', 'Mylan', 'Sun Pharma', 'Lupin',
    'Cipla', 'Dr. Reddys', 'Zydus Cadila', 'Aurobindo', 'Torrent', 'Glenmark', 'Intas', 'Biocon',
    'Swiss Pharma', 'Fidson', 'Juhel', 'Dana Pharma', 'Neimeth', 'Evans Medical', 'Bond Chemical', 'Pharma-Deko',
    'Vitabiotics', 'Nature Field', 'Mason Natural', 'Puritans Pride', 'Swanson', 'Now Foods', 'GNC',
    'Dettol', 'Savlon', 'Pears', 'Johnson', 'Huggies', 'Pampers', 'Cussons', 'Nivea', 'Dove',
    'Oral-B', 'Colgate', 'Sensodyne', 'Close-Up', 'Pepsodent', 'Listerine', 'Aquafresh', 'Macleans',
    'Panadol', 'Tylenol', 'Advil', 'Aspirin', 'Motrin', 'Aleve', 'Excedrin', 'Voltaren',
    'Amoxil', 'Augmentin', 'Zithromax', 'Cipro', 'Flagyl', 'Keflex', 'Bactrim', 'Septrin',
    'Glucophage', 'Januvia', 'Victoza', 'Humalog', 'Lantus', 'Jardiance', 'Forxiga', 'Amaryl',
    'Lipitor', 'Crestor', 'Zocor', 'Norvasc', 'Diovan', 'Entresto', 'Xarelto', 'Eliquis',
    'Ventolin', 'Seretide', 'Symbicort', 'Pulmicort', 'Singulair', 'Spiriva', 'Advair', 'Flovent',
    'General', 'Medicata Brand', 'Local Pharmacy Mix'
  ];

  const [categories, setCategories] = useState<string[]>(defaultCategories);
  const [brands, setBrands] = useState<string[]>(defaultBrands);
  const [isCategoryPickerVisible, setIsCategoryPickerVisible] = useState(false);
  const [isBrandPickerVisible, setIsBrandPickerVisible] = useState(false);

  // Form state
  const [manualDrugName, setManualDrugName] = useState('');
  const [manualCategory, setManualCategory] = useState('');
  const [manualBrand, setManualBrand] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [expiryDate, setExpiryDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      uploadImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string) => {
    setUploading(true);
    try {
      const data = new FormData();
      const filename = uri.split('/').pop() || 'image.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image`;

      // @ts-ignore
      data.append('file', { uri, name: filename, type });
      data.append('upload_preset', 'ml_default'); 
      data.append('api_key', '156352328942451');
      data.append('cloud_name', 'dtyxhp8uu');

      const response = await fetch('https://api.cloudinary.com/v1_1/dtyxhp8uu/image/upload', {
        method: 'POST',
        body: data,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'multipart/form-data',
        },
      });

      const result = await response.json();
      if (result.secure_url) {
        setSelectedImage(result.secure_url);
      } else {
        console.error('[Cloudinary Error Detail]', JSON.stringify(result, null, 2));
        throw new Error(result.error?.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload Error:', error);
      Alert.alert('Error', 'Failed to upload image to Cloudinary');
    } finally {
      setUploading(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData(true);
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const response = await api.getPharmacyStock();
      setStock(response.data || []);
      
      try {
        const catRes = await api.getCategories();
        const apiCategories = catRes.data?.categories;
        if (apiCategories && apiCategories.length > 0) {
          setCategories(prev => Array.from(new Set([...prev, ...apiCategories])));
        }
      } catch (e) {
        console.log("Using default extensive categories");
      }

      const stockBrands = (response.data || [])
        .map((s: any) => s.drug_brand)
        .filter(Boolean);
      
      if (stockBrands.length > 0) {
        setBrands(prev => Array.from(new Set([...prev, ...stockBrands as string[]])));
      }
      
    } catch (err: any) {
      console.error("Load error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSave = async () => {
    if (!manualDrugName) {
      Alert.alert("Error", "Please enter a medication name");
      return;
    }
    if (!price || !quantity) {
      Alert.alert("Error", "Please fill in price and quantity");
      return;
    }

    setSaving(true);
    try {
      let drugId = editingItem?.drug_id;

      if (!editingItem) {
        const drugPayload = {
          name: manualDrugName.trim(),
          brand_name: manualBrand?.trim() || 'General',
          category: manualCategory?.trim() || 'Medication',
          strengths: [],
          dosage_forms: [],
          description: 'Manually Added',
          image_url: selectedImage
        };
        console.log('[Create Drug Payload]', JSON.stringify(drugPayload, null, 2));

        const createRes = await api.createDrug(drugPayload);
        if (createRes.data?.id) {
          drugId = createRes.data.id;
        } else {
          throw new Error(createRes.error || 'Failed to create drug record');
        }
      }

      const data = {
        drug_id: drugId,
        price: parseInt(price),
        quantity: parseInt(quantity),
        is_available: isAvailable,
        expiry_date: expiryDate.toISOString().split('T')[0]
      };
      await api.updatePharmacyStock(data);
      setModalVisible(false);
      resetForm();
      loadData();
      Alert.alert("Success", "Inventory updated");
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to update inventory");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setEditingItem(null);
    setPrice('');
    setQuantity('');
    setExpiryDate(new Date());
    setIsAvailable(true);
    setManualDrugName('');
    setManualCategory('');
    setManualBrand('');
    setSelectedImage(null);
  };

  const openEdit = (item: any) => {
    setEditingItem(item);
    setManualDrugName(item.drug_name);
    setManualCategory(item.drug_category || '');
    setManualBrand(item.drug_brand || '');
    setPrice(item.price.toString());
    setQuantity(item.quantity.toString());
    setExpiryDate(item.expiry_date ? new Date(item.expiry_date) : new Date());
    setIsAvailable(item.is_available);
    setSelectedImage(item.drug_image_url || null);
    setModalVisible(true);
  };

  const renderStockItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.stockCard} onPress={() => openEdit(item)}>
      <View style={styles.cardInfo}>
        <View style={styles.drugIconBg}>
          {item.drug_image_url ? (
            <Image source={{ uri: item.drug_image_url }} style={{ width: 48, height: 48, borderRadius: 16 }} contentFit="cover" />
          ) : (
            <Ionicons name="medical" size={20} color="#4F46E5" />
          )}
        </View>
        <View style={styles.drugDetails}>
          <Text style={styles.drugName}>{item.drug_name}</Text>
          <Text style={styles.drugCategory}>{item.drug_category} • {item.drug_brand || 'General'}</Text>
        </View>
      </View>
      <View style={styles.cardMeta}>
        <Text style={styles.price}>₦{item.price.toLocaleString()}</Text>
        <Text style={styles.stockCount}>{item.quantity} units</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#0D1B3A', '#1E3A5F']} style={styles.headerGradient} />
      <View style={styles.header}>
        {!isTab && (
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        )}
        <Text style={styles.title}>Inventory</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => { resetForm(); setModalVisible(true); }}>
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.mainContent}>
        {loading ? <ActivityIndicator size="large" color="#0D1B3A" style={{ marginTop: 50 }} /> : (
          <FlatList
            data={stock}
            renderItem={renderStockItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          />
        )}
      </View>

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingItem ? 'Edit Item' : 'Add Item'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}><Ionicons name="close" size={28} color="#64748B" /></TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.imageUploadSection}>
                <TouchableOpacity style={styles.imageUploadBox} onPress={pickImage} disabled={uploading}>
                  {selectedImage ? (
                    <Image source={{ uri: selectedImage }} style={styles.uploadedImage} contentFit="cover" />
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <Ionicons name="camera" size={32} color="#94A3B8" />
                      <Text style={styles.imagePlaceholderText}>Add Photo</Text>
                    </View>
                  )}
                  {uploading && (
                    <View style={styles.uploadOverlay}>
                      <ActivityIndicator color="#FFF" />
                    </View>
                  )}
                </TouchableOpacity>
                {selectedImage && (
                  <TouchableOpacity style={styles.removeImageBtn} onPress={() => setSelectedImage(null)}>
                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                    <Text style={styles.removeImageText}>Remove</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Medication Name</Text>
                <TextInput style={styles.textInput} placeholder="e.g. Paracetamol" value={manualDrugName} onChangeText={setManualDrugName} />
              </View>

              <View style={styles.row}>
                <TouchableOpacity style={[styles.inputGroup, { flex: 1 }]} onPress={() => setIsCategoryPickerVisible(true)}>
                  <Text style={styles.inputLabel}>Category</Text>
                  <View style={styles.selectorTrigger}>
                    <Text style={manualCategory ? styles.selectorText : styles.selectorPlaceholder}>{manualCategory || 'Select'}</Text>
                    <Ionicons name="chevron-down" size={18} color="#64748B" />
                  </View>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.inputGroup, { flex: 1 }]} onPress={() => setIsBrandPickerVisible(true)}>
                  <Text style={styles.inputLabel}>Brand</Text>
                  <View style={styles.selectorTrigger}>
                    <Text style={manualBrand ? styles.selectorText : styles.selectorPlaceholder}>{manualBrand || 'Select'}</Text>
                    <Ionicons name="chevron-down" size={18} color="#64748B" />
                  </View>
                </TouchableOpacity>
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Price (₦)</Text>
                  <TextInput style={styles.textInput} placeholder="0" keyboardType="numeric" value={price} onChangeText={setPrice} />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Quantity</Text>
                  <TextInput style={styles.textInput} placeholder="0" keyboardType="numeric" value={quantity} onChangeText={setQuantity} />
                </View>
              </View>

              <TouchableOpacity style={styles.inputGroup} onPress={() => setShowDatePicker(true)}>
                <Text style={styles.inputLabel}>Expiry Date</Text>
                <View style={styles.selectorTrigger}>
                  <Text style={styles.selectorText}>{expiryDate.toLocaleDateString()}</Text>
                  <Ionicons name="calendar-outline" size={18} color="#64748B" />
                </View>
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={expiryDate}
                  mode="date"
                  onChange={(e, date) => { setShowDatePicker(false); if (date) setExpiryDate(date); }}
                  minimumDate={new Date()}
                />
              )}
            </ScrollView>

            <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveButtonText}>{editingItem ? 'Update Item' : 'Add to Inventory'}</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <CategoryPickerModal 
        visible={isCategoryPickerVisible} 
        categories={categories} 
        onSelect={setManualCategory} 
        onClose={() => setIsCategoryPickerVisible(false)} 
      />
      <BrandPickerModal 
        visible={isBrandPickerVisible} 
        brands={brands} 
        onSelect={setManualBrand} 
        onClose={() => setIsBrandPickerVisible(false)} 
      />
    </SafeAreaView>
  );
}

function CategoryPickerModal({ visible, categories, onSelect, onClose }: any) {
  const [search, setSearch] = useState('');
  const filteredItems = categories.filter((i: string) => i.toLowerCase().includes(search.toLowerCase()));

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.selectorOverlay}>
        <View style={styles.selectorContent}>
          <View style={styles.selectorHeader}>
            <View>
              <Text style={styles.selectorTitle}>Category</Text>
              <Text style={styles.selectorSubtitle}>{categories.length} options available</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.selectorCloseBtn}>
              <Ionicons name="close" size={28} color="#64748B" />
            </TouchableOpacity>
          </View>

          <View style={styles.searchBarContainer}>
            <Ionicons name="search" size={20} color="#94A3B8" />
            <TextInput 
              style={styles.searchBarInput} 
              placeholder="Search category..." 
              value={search} 
              onChangeText={setSearch} 
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={20} color="#CBD5E1" />
              </TouchableOpacity>
            )}
          </View>

          <FlatList
            data={filteredItems}
            keyExtractor={(item, index) => `cat-${item}-${index}`}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.selectorItem} 
                onPress={() => {
                  onSelect(item);
                  setSearch('');
                  onClose();
                }}
              >
                <Text style={styles.selectorItemText}>{item}</Text>
                <Ionicons name="chevron-forward" size={18} color="#E2E8F0" />
              </TouchableOpacity>
            )}
            contentContainerStyle={{ flexGrow: 1 }}
            showsVerticalScrollIndicator={true}
          />
        </View>
      </View>
    </Modal>
  );
}

function BrandPickerModal({ visible, brands, onSelect, onClose }: any) {
  const [search, setSearch] = useState('');
  const filteredItems = brands.filter((i: string) => i.toLowerCase().includes(search.toLowerCase()));

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.selectorOverlay}>
        <View style={styles.selectorContent}>
          <View style={styles.selectorHeader}>
            <View>
              <Text style={styles.selectorTitle}>Brand</Text>
              <Text style={styles.selectorSubtitle}>{brands.length} options available</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.selectorCloseBtn}>
              <Ionicons name="close" size={28} color="#64748B" />
            </TouchableOpacity>
          </View>

          <View style={styles.searchBarContainer}>
            <Ionicons name="search" size={20} color="#94A3B8" />
            <TextInput 
              style={styles.searchBarInput} 
              placeholder="Search brand..." 
              value={search} 
              onChangeText={setSearch} 
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={20} color="#CBD5E1" />
              </TouchableOpacity>
            )}
          </View>

          <FlatList
            data={filteredItems}
            keyExtractor={(item, index) => `brand-${item}-${index}`}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.selectorItem} 
                onPress={() => {
                  onSelect(item);
                  setSearch('');
                  onClose();
                }}
              >
                <Text style={styles.selectorItemText}>{item}</Text>
                <Ionicons name="chevron-forward" size={18} color="#E2E8F0" />
              </TouchableOpacity>
            )}
            contentContainerStyle={{ flexGrow: 1 }}
            showsVerticalScrollIndicator={true}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  headerGradient: { position: 'absolute', left: 0, right: 0, top: 0, height: 160 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingTop: Platform.OS === 'ios' ? 10 : 24 },
  title: { fontSize: 22, fontWeight: '900', color: '#FFF', letterSpacing: -0.5 },
  addButton: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  backButton: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  mainContent: { flex: 1, backgroundColor: '#F8FAFC', borderTopLeftRadius: 32, borderTopRightRadius: 32, marginTop: -10, padding: 24 },
  listContent: { paddingBottom: 40 },
  stockCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 16, marginBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10 },
  cardInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  drugIconBg: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  drugDetails: { flex: 1, gap: 2 },
  drugName: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  drugCategory: { fontSize: 13, color: '#64748B', fontWeight: '500' },
  cardMeta: { alignItems: 'flex-end', gap: 2 },
  price: { fontSize: 17, fontWeight: '900', color: '#0D1B3A' },
  stockCount: { fontSize: 12, color: '#4F46E5', fontWeight: '700', backgroundColor: '#EEF2FF', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, maxHeight: '95%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 },
  modalTitle: { fontSize: 22, fontWeight: '900', color: '#0F172A' },
  modalScroll: { paddingBottom: 32 },
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 14, fontWeight: '800', color: '#475569', marginBottom: 10, marginLeft: 4 },
  textInput: { backgroundColor: '#F8FAFC', borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 16, padding: 14, fontSize: 16, fontWeight: '600', color: '#0F172A' },
  row: { flexDirection: 'row', gap: 16 },
  selectorTrigger: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFC', borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 16, padding: 14 },
  selectorText: { fontSize: 16, color: '#0F172A', fontWeight: '600' },
  selectorPlaceholder: { fontSize: 16, color: '#94A3B8', fontWeight: '500' },
  saveButton: { backgroundColor: '#0D1B3A', height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginTop: 10, shadowColor: '#0D1B3A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
  saveButtonText: { color: '#FFF', fontSize: 17, fontWeight: '900' },
  selectorOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'flex-end' },
  selectorContent: { backgroundColor: '#FFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, width: '100%', maxHeight: '85%', overflow: 'hidden' },
  selectorHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  selectorTitle: { fontSize: 20, fontWeight: '900', color: '#0F172A' },
  selectorSubtitle: { fontSize: 12, color: '#94A3B8', fontWeight: '600', marginTop: 2 },
  selectorCloseBtn: { padding: 4 },
  searchBarContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', margin: 16, paddingHorizontal: 16, borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  searchBarInput: { flex: 1, paddingVertical: 12, marginLeft: 10, fontSize: 15, fontWeight: '600', color: '#0F172A' },
  selectorItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  selectorItemText: { fontSize: 16, color: '#334155', fontWeight: '600' },
  imageUploadSection: { alignItems: 'center', marginBottom: 24, marginTop: 8 },
  imageUploadBox: { width: 120, height: 120, borderRadius: 24, backgroundColor: '#F8FAFC', borderWidth: 2, borderColor: '#E2E8F0', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  imagePlaceholder: { alignItems: 'center', gap: 4 },
  imagePlaceholderText: { fontSize: 13, color: '#94A3B8', fontWeight: '700' },
  uploadedImage: { width: '100%', height: '100%' },
  uploadOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  removeImageBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  removeImageText: { fontSize: 14, color: '#EF4444', fontWeight: '700' },
});
