import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { router } from 'expo-router';

const AddTransactionScreen = () => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('general');
  const [date, setDate] = useState(new Date());
  const [description, setDescription] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [transactionType, setTransactionType] = useState('expense');

  // Categories for transactions
  const categories = [
    'general',
    'food',
    'shopping',
    'entertainment',
    'transportation',
    'utilities',
    'healthcare',
    'education',
    'housing',
    'income',
    'other'
  ];

  // Date picker state for calendar
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  // Custom date picker handlers
  const showDatePickerModal = () => {
    setShowDatePicker(true);
  };

  const hideDatePickerModal = () => {
    setShowDatePicker(false);
  };
  
  const handleDateChange = (newDate: Date) => {
    setDate(newDate);
  };

  const handleDateConfirm = () => {
    hideDatePickerModal();
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Calendar navigation functions
  const goToPreviousMonth = () => {
    const prevMonth = new Date(currentMonth);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    setCurrentMonth(prevMonth);
  };

  const goToNextMonth = () => {
    const nextMonth = new Date(currentMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    setCurrentMonth(nextMonth);
  };
  
  // Get days in month and first day of month
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  // Month names for header display
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const saveTransaction = async () => {
    // Validate input
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title for the transaction');
      return;
    }

    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in to add a transaction');
      return;
    }

    setLoading(true);

    try {
      // Apply negative sign for expenses
      const finalAmount = transactionType === 'expense' ? -Math.abs(amountValue) : Math.abs(amountValue);
      
      const db = getFirestore();
      await addDoc(collection(db, 'transactions'), {
        title: title.trim(),
        amount: finalAmount,
        category,
        date,
        description: description.trim(),
        userId: user.uid,
        createdAt: serverTimestamp(),
        isPaid: false
      });

      Alert.alert(
        'Success',
        'Transaction added successfully',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Error adding transaction:', error);
      Alert.alert('Error', 'Failed to add transaction. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.header}>Add New Transaction</Text>
        
        {/* Transaction Type */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Transaction Type</Text>
          <View style={styles.segmentedControl}>
            <TouchableOpacity 
              style={[styles.segmentButton, transactionType === 'expense' && styles.activeSegment]}
              onPress={() => setTransactionType('expense')}
            >
              <Text style={[styles.segmentText, transactionType === 'expense' && styles.activeSegmentText]}>Expense</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.segmentButton, transactionType === 'income' && styles.activeSegment]}
              onPress={() => setTransactionType('income')}
            >
              <Text style={[styles.segmentText, transactionType === 'income' && styles.activeSegmentText]}>Income</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Title */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Enter transaction title"
            placeholderTextColor="#999"
          />
        </View>
        
        {/* Amount */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Amount</Text>
          <View style={styles.amountInputContainer}>
            <Text style={styles.currencySymbol}>$</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              placeholderTextColor="#999"
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        {/* Category */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Category</Text>
          <View style={styles.categoriesContainer}>
            {categories.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryButton,
                  category === cat && styles.selectedCategoryButton
                ]}
                onPress={() => setCategory(cat)}
              >
                <Text style={[
                  styles.categoryButtonText,
                  category === cat && styles.selectedCategoryText
                ]}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Date */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Date</Text>
          <TouchableOpacity 
            style={styles.dateButton}
            onPress={showDatePickerModal}
          >
            <Text style={styles.dateText}>{formatDate(date)}</Text>
          </TouchableOpacity>
          
          {/* Calendar Date Picker Modal */}
          <Modal
            visible={showDatePicker}
            transparent={true}
            animationType="slide"
            onRequestClose={hideDatePickerModal}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.datePickerContainer}>
                <View style={styles.datePickerHeader}>
                  <Text style={styles.datePickerTitle}>Select Date</Text>
                  <TouchableOpacity onPress={hideDatePickerModal}>
                    <Text style={styles.closeButton}>Close</Text>
                  </TouchableOpacity>
                </View>
                
                {/* Calendar View */}
                <View style={styles.calendarContainer}>
                  {/* Month/Year Navigation */}
                  <View style={styles.calendarHeader}>
                    <TouchableOpacity onPress={goToPreviousMonth} style={styles.calendarNavButton}>
                      <Text style={styles.calendarNavButtonText}>{'<'}</Text>
                    </TouchableOpacity>
                    
                    <Text style={styles.calendarMonthYearText}>
                      {`${monthNames[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`}
                    </Text>
                    
                    <TouchableOpacity onPress={goToNextMonth} style={styles.calendarNavButton}>
                      <Text style={styles.calendarNavButtonText}>{'>'}</Text>
                    </TouchableOpacity>
                  </View>
                  
                  {/* Day Names */}
                  <View style={styles.daysOfWeek}>
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                      <Text key={index} style={styles.dayOfWeekText}>{day}</Text>
                    ))}
                  </View>
                  
                  {/* Calendar Grid */}
                  <View style={styles.calendarDaysContainer}>
                    {/* Empty cells for days before the first day of month */}
                    {Array.from({ length: getFirstDayOfMonth(currentMonth.getFullYear(), currentMonth.getMonth()) }).map((_, index) => (
                      <View key={`empty-${index}`} style={styles.calendarDay} />
                    ))}
                    
                    {/* Actual days */}
                    {Array.from({ length: getDaysInMonth(currentMonth.getFullYear(), currentMonth.getMonth()) }).map((_, index) => {
                      const dayNumber = index + 1;
                      const currentDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), dayNumber);
                      const isSelected = 
                        date.getDate() === dayNumber && 
                        date.getMonth() === currentMonth.getMonth() && 
                        date.getFullYear() === currentMonth.getFullYear();
                      const isToday = 
                        new Date().getDate() === dayNumber && 
                        new Date().getMonth() === currentMonth.getMonth() && 
                        new Date().getFullYear() === currentMonth.getFullYear();
                        
                      return (
                        <TouchableOpacity 
                          key={`day-${dayNumber}`}
                          style={[
                            styles.calendarDay,
                            isSelected && styles.selectedCalendarDay,
                            isToday && styles.todayCalendarDay
                          ]}
                          onPress={() => handleDateChange(currentDate)}
                        >
                          <Text 
                            style={[
                              styles.calendarDayText,
                              isSelected && styles.selectedCalendarDayText,
                              isToday && styles.todayCalendarDayText
                            ]}
                          >
                            {dayNumber}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
                
                {/* Confirm Button */}
                <TouchableOpacity 
                  style={styles.confirmDateButton}
                  onPress={handleDateConfirm}
                >
                  <Text style={styles.confirmDateButtonText}>Confirm Selection</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </View>

        {/* Description */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Description (optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Enter transaction details"
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Save Button */}
        <TouchableOpacity 
          style={styles.saveButton} 
          onPress={saveTransaction}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save Transaction</Text>
          )}
        </TouchableOpacity>

        {/* Cancel Button */}
        <TouchableOpacity 
          style={styles.cancelButton} 
          onPress={() => router.back()}
          disabled={loading}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f9fc',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 24,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    overflow: 'hidden',
  },
  currencySymbol: {
    paddingLeft: 12,
    paddingRight: 4,
    fontSize: 18,
    color: '#333',
    fontWeight: '500',
  },
  amountInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  categoryButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    margin: 5,
  },
  selectedCategoryButton: {
    backgroundColor: '#2ecc71',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#555',
  },
  selectedCategoryText: {
    color: '#fff',
    fontWeight: '600',
  },
  dateButton: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  datePickerContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    maxHeight: '80%',
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 12,
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    color: '#2ecc71',
    fontSize: 16,
    fontWeight: '500',
  },
  // Calendar styles
  calendarContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calendarNavButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarNavButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  calendarMonthYearText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  daysOfWeek: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dayOfWeekText: {
    width: 40,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  calendarDaysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  calendarDay: {
    width: '14.28%', // 100% ÷ 7 days = 14.28% width per day
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  calendarDayText: {
    fontSize: 16,
    color: '#333',
  },
  selectedCalendarDay: {
    backgroundColor: '#2ecc71',
    borderRadius: 20,
  },
  selectedCalendarDayText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  todayCalendarDay: {
    borderWidth: 1,
    borderColor: '#2ecc71',
    borderRadius: 20,
  },
  todayCalendarDayText: {
    color: '#2ecc71',
    fontWeight: 'bold',
  },
  confirmDateButton: {
    backgroundColor: '#2ecc71',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  confirmDateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Original styles
  datePickerScrollView: {
    maxHeight: 300,
  },
  dateOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedDateOption: {
    backgroundColor: '#f9fff9',
  },
  dateOptionText: {
    fontSize: 16,
    color: '#333',
  },
  selectedDateOptionText: {
    color: '#2ecc71',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#2ecc71',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelButtonText: {
    color: '#777',
    fontSize: 16,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#eee',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 8,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  activeSegment: {
    backgroundColor: '#2ecc71',
  },
  segmentText: {
    fontSize: 16,
    color: '#555',
    fontWeight: '500',
  },
  activeSegmentText: {
    color: '#fff',
  },
});

export default AddTransactionScreen;