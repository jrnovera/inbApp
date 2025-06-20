import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';

// Simple Calendar component implementation
interface CalendarProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  isVisible: boolean;
  onClose: () => void;
  minDate?: Date;
}

const Calendar = ({ selectedDate, onDateChange, isVisible, onClose, minDate }: CalendarProps) => {
  const [localDate, setLocalDate] = useState(selectedDate);
  const year = localDate.getFullYear();
  const month = localDate.getMonth();
  
  // Generate days for the current month
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getMonthFirstDay = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getMonthFirstDay(year, month);
  
  const handleConfirm = () => {
    onDateChange(localDate);
    onClose();
  };

  const isPastMinDate = (date: Date) => {
    if (!minDate) return true;
    return date >= minDate;
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="slide"
    >
      <View style={calendarStyles.modalContainer}>
        <View style={calendarStyles.calendarContainer}>
          <View style={calendarStyles.header}>
            <Text style={calendarStyles.monthYear}>{monthNames[month]} {year}</Text>
            <View style={calendarStyles.navigation}>
              <TouchableOpacity onPress={() => setLocalDate(new Date(year, month - 1, 1))}>
                <Ionicons name="chevron-back" size={24} color="#333" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setLocalDate(new Date(year, month + 1, 1))}>
                <Ionicons name="chevron-forward" size={24} color="#333" />
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={calendarStyles.daysContainer}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
              <Text key={index} style={calendarStyles.dayName}>{day}</Text>
            ))}
            
            {/* Empty spaces for days before the 1st of the month */}
            {Array.from({ length: firstDay }).map((_, index) => (
              <View key={`empty-${index}`} style={calendarStyles.dayCell} />
            ))}
            
            {/* Actual days */}
            {Array.from({ length: daysInMonth }).map((_, index) => {
              const day = index + 1;
              const currentDate = new Date(year, month, day);
              const isSelected = day === localDate.getDate() && 
                                month === localDate.getMonth() && 
                                year === localDate.getFullYear();
              const isValid = isPastMinDate(currentDate);
              
              return (
                <TouchableOpacity 
                  key={`day-${day}`}
                  style={[
                    calendarStyles.dayCell,
                    isSelected && calendarStyles.selectedDay,
                    !isValid && calendarStyles.disabledDay
                  ]}
                  disabled={!isValid}
                  onPress={() => setLocalDate(new Date(year, month, day))}
                >
                  <Text 
                    style={[
                      calendarStyles.dayText,
                      isSelected && calendarStyles.selectedDayText,
                      !isValid && calendarStyles.disabledDayText
                    ]}
                  >
                    {day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          
          <View style={calendarStyles.footer}>
            <TouchableOpacity 
              style={calendarStyles.cancelButton} 
              onPress={onClose}
            >
              <Text style={calendarStyles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={calendarStyles.confirmButton} 
              onPress={handleConfirm}
            >
              <Text style={calendarStyles.buttonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Simple Dropdown component implementation
interface DropdownItem {
  label: string;
  value: string;
}

interface DropdownProps {
  items: DropdownItem[];
  selectedValue: string;
  onValueChange: (value: string) => void;
  placeholder: string;
}

const Dropdown = ({ items, selectedValue, onValueChange, placeholder }: DropdownProps) => {
  const [modalVisible, setModalVisible] = useState(false);
  
  const selectedItem = items.find(item => item.value === selectedValue);
  
  return (
    <View>
      <TouchableOpacity 
        style={dropdownStyles.selector} 
        onPress={() => setModalVisible(true)}
      >
        <Text style={selectedValue ? dropdownStyles.selectedText : dropdownStyles.placeholderText}>
          {selectedItem ? selectedItem.label : placeholder}
        </Text>
        <Ionicons name="chevron-down" size={20} color="#666" />
      </TouchableOpacity>
      
      <Modal
        transparent={true}
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity 
          style={dropdownStyles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setModalVisible(false)}
        >
          <View style={dropdownStyles.modalContent}>
            <View style={dropdownStyles.header}>
              <Text style={dropdownStyles.headerTitle}>{placeholder}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={items.filter(item => item.value !== '')} // Skip the placeholder item
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    dropdownStyles.item,
                    selectedValue === item.value && dropdownStyles.selectedItem
                  ]}
                  onPress={() => {
                    onValueChange(item.value);
                    setModalVisible(false);
                  }}
                >
                  <Text style={dropdownStyles.itemText}>{item.label}</Text>
                  {selectedValue === item.value && (
                    <Ionicons name="checkmark" size={20} color="#3498db" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

// Calendar component styles
const calendarStyles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  calendarContainer: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  monthYear: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  navigation: {
    flexDirection: 'row',
    gap: 10,
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  dayName: {
    width: '14.28%',
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: 'bold',
    color: '#666',
  },
  dayCell: {
    width: '14.28%',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  dayText: {
    fontSize: 16,
    color: '#333',
  },
  selectedDay: {
    backgroundColor: '#3498db',
    borderRadius: 20,
  },
  selectedDayText: {
    color: 'white',
    fontWeight: 'bold',
  },
  disabledDay: {
    opacity: 0.4,
  },
  disabledDayText: {
    color: '#999',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
    gap: 10,
  },
  cancelButton: {
    padding: 10,
    borderRadius: 5,
    backgroundColor: '#e0e0e0',
  },
  confirmButton: {
    padding: 10,
    borderRadius: 5,
    backgroundColor: '#3498db',
  },
  buttonText: {
    color: '#333',
    fontWeight: 'bold',
  },
});

// Dropdown component styles
const dropdownStyles = StyleSheet.create({
  selector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 12,
    backgroundColor: '#fff',
  },
  placeholderText: {
    color: '#999',
  },
  selectedText: {
    color: '#333',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    maxHeight: '70%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  item: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedItem: {
    backgroundColor: '#f0f8ff',
  },
  itemText: {
    fontSize: 16,
    color: '#333',
  },
});

// Transaction categories
const CATEGORIES = [
  { label: 'Select a category', value: '' },
  { label: '🏠 Housing', value: 'housing' },
  { label: '🍔 Food', value: 'food' },
  { label: '🚗 Transportation', value: 'transportation' },
  { label: '💊 Healthcare', value: 'healthcare' },
  { label: '🎓 Education', value: 'education' },
  { label: '💼 Income', value: 'income' },
  { label: '💸 Bills', value: 'bills' },
  { label: '🛒 Shopping', value: 'shopping' },
  { label: '💰 Investment', value: 'investment' },
  { label: '🎭 Entertainment', value: 'entertainment' },
  { label: '✨ Other', value: 'other' },
];

interface Transaction {
  id?: string;
  title: string;
  amount: number;
  date: Date;
  category: string;
  description: string;
  userId: string;
  createdAt?: any;
}

const UpcomingTransactionScreen = () => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date());
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  
  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Handle date change
  const onDateChange = (selectedDate: Date) => {
    setDate(selectedDate);
  };

  // Load recent upcoming transactions
  const loadTransactions = async () => {
    if (!user) return;
    
    const db = getFirestore();
    const transactionsRef = collection(db, 'upcomingTransactions');
    const q = query(transactionsRef, where('userId', '==', user.uid));
    
    try {
      const querySnapshot = await getDocs(q);
      const transactions: Transaction[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        transactions.push({
          id: doc.id,
          title: data.title,
          amount: data.amount,
          date: data.date.toDate(),
          category: data.category,
          description: data.description,
          userId: data.userId,
          createdAt: data.createdAt
        });
      });

      // Sort by date
      transactions.sort((a, b) => a.date.getTime() - b.date.getTime());
      setRecentTransactions(transactions);
    } catch (error) {
      console.error('Error loading transactions:', error);
      Alert.alert(
        'Error', 
        'Failed to load transactions',
        [{ text: 'OK' }]
      );
    }
  };

  // Save transaction to Firebase
  const saveTransaction = async () => {
    // Validate inputs
    if (!title.trim()) {
      Alert.alert(
        'Error', 
        'Please enter a title',
        [{ text: 'OK' }]
      );
      return;
    }
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      Alert.alert(
        'Error', 
        'Please enter a valid amount',
        [{ text: 'OK' }]
      );
      return;
    }
    if (!category) {
      Alert.alert(
        'Error', 
        'Please select a category',
        [{ text: 'OK' }]
      );
      return;
    }
    if (!user) {
      Alert.alert(
        'Error', 
        'You must be logged in to add transactions',
        [{ text: 'OK' }]
      );
      return;
    }

    setIsLoading(true);

    try {
      const db = getFirestore();
      const transactionData = {
        title,
        amount: Number(amount),
        date,
        category,
        description: description.trim(),
        userId: user.uid,
        createdAt: serverTimestamp(),
        isPaid: false
      };

      // Add document to Firestore
      await addDoc(collection(db, 'upcomingTransactions'), transactionData);

      // Reset form
      setTitle('');
      setAmount('');
      setDate(new Date());
      setDescription('');
      setCategory('');
      
      // Use the full Alert API with buttons array
      Alert.alert(
        'Success', 
        'Transaction added successfully',
        [{ text: 'OK' }]
      );
      
      // Reload transactions
      loadTransactions();
    } catch (error) {
      console.error('Error saving transaction:', error);
      Alert.alert(
        'Error', 
        'Failed to save transaction',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Load transactions on mount
  useEffect(() => {
    loadTransactions();
  }, [user]);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Create Upcoming Transaction</Text>
          </View>
          
          <View style={styles.formCard}>
            {/* Title Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Title</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter transaction title"
                value={title}
                onChangeText={setTitle}
              />
            </View>
            
            {/* Category Dropdown */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Category</Text>
              <Dropdown
                items={CATEGORIES}
                selectedValue={category}
                onValueChange={(value: string) => setCategory(value)}
                placeholder="Select a category"
              />
            </View>
            
            {/* Amount Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Amount ($)</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={setAmount}
              />
            </View>
            
            {/* Date Picker */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Date</Text>
              <TouchableOpacity 
                style={styles.datePickerButton}
                onPress={() => setShowCalendar(true)}
              >
                <Text style={styles.dateText}>{formatDate(date)}</Text>
                <Ionicons name="calendar-outline" size={20} color="#666" />
              </TouchableOpacity>
              <Calendar
                selectedDate={date}
                onDateChange={onDateChange}
                isVisible={showCalendar}
                onClose={() => setShowCalendar(false)}
                minDate={new Date()}
              />
            </View>
            
            {/* Description Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Description (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Add notes about this transaction"
                multiline
                numberOfLines={3}
                value={description}
                onChangeText={setDescription}
              />
            </View>
            
            {/* Save Button */}
            <TouchableOpacity 
              style={styles.saveButton}
              onPress={saveTransaction}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.saveButtonText}>Add Transaction</Text>
              )}
            </TouchableOpacity>
          </View>
          
          {/* Recent Transactions List */}
          <View style={styles.recentSection}>
            <Text style={styles.sectionTitle}>Recent Upcoming Transactions</Text>
            {recentTransactions.length === 0 ? (
              <Text style={styles.emptyText}>No upcoming transactions found</Text>
            ) : (
              recentTransactions.map((transaction, index) => (
                <View key={transaction.id || index} style={styles.transactionItem}>
                  <View style={styles.transactionHeader}>
                    <Text style={styles.transactionTitle}>{transaction.title}</Text>
                    <Text style={[styles.transactionAmount, 
                      transaction.category === 'income' ? styles.incomeText : styles.expenseText]}>
                      ${Math.abs(transaction.amount).toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.transactionDetails}>
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryText}>
                        {CATEGORIES.find(cat => cat.value === transaction.category)?.label || 'Other'}
                      </Text>
                    </View>
                    <Text style={styles.dateText}>{formatDate(transaction.date)}</Text>
                  </View>
                  {transaction.description ? (
                    <Text style={styles.descriptionText}>{transaction.description}</Text>
                  ) : null}
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default UpcomingTransactionScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  // Dropdown styles handled in the Dropdown component

  datePickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#2ecc71',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  recentSection: {
    margin: 16,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    padding: 20,
  },
  transactionItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  transactionDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryBadge: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  categoryText: {
    fontSize: 12,
    color: '#666',
  },
  descriptionText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  incomeText: {
    color: '#2ecc71',
  },
  expenseText: {
    color: '#e74c3c',
  },
});