import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getFirestore, collection, query, where, getDocs, orderBy, doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { useAuth } from '@/context/AuthContext';

// Transaction interface
interface Transaction {
  id?: string;
  title: string;
  amount: number;
  date: Date;
  category: string;
  description: string;
  userId: string;
  createdAt?: any;
  isPaid: boolean;
}

// Categories for display
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

const NotificationsScreen = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [todayTransactions, setTodayTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [currentBalance, setCurrentBalance] = useState<number>(0);

  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Calculate days until transaction is due
  const getDaysUntil = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const transactionDate = new Date(date);
    transactionDate.setHours(0, 0, 0, 0);
    
    const diffTime = transactionDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };
  
  // Check if a date is today
  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  // Get urgency level based on days until due
  const getUrgencyLevel = (daysUntil: number) => {
    if (daysUntil <= 3) return 'high';
    if (daysUntil <= 7) return 'medium';
    return 'low';
  };

  // Load upcoming transactions
  const loadTransactions = async () => {
    if (!user) return;
    
    setLoading(true);
    const db = getFirestore();
    const transactionsRef = collection(db, 'upcomingTransactions');
    const q = query(
      transactionsRef, 
      where('userId', '==', user.uid),
      where('isPaid', '==', false)
    );
    
    try {
      const querySnapshot = await getDocs(q);
      const transactionsList: Transaction[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        transactionsList.push({
          id: doc.id,
          title: data.title,
          amount: data.amount,
          date: data.date.toDate(),
          category: data.category,
          description: data.description,
          userId: data.userId,
          createdAt: data.createdAt,
          isPaid: data.isPaid || false
        });
      });

      // Sort by date (closest due date first)
      transactionsList.sort((a, b) => a.date.getTime() - b.date.getTime());
      setTransactions(transactionsList);
      
      // Filter transactions that are due today
      const todayItems = transactionsList.filter(transaction => isToday(transaction.date));
      setTodayTransactions(todayItems);
    } catch (error) {
      console.error('Error loading transactions:', error);
      Alert.alert(
        'Error', 
        'Failed to load notifications',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    loadTransactions();
  };

  // Fetch user's balance
  const fetchUserBalance = async () => {
    if (!user) return;
    
    try {
      const db = getFirestore();
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setCurrentBalance(userData.balance || 0);
      } else {
        // Create user document if it doesn't exist
        await setDoc(userRef, {
          email: user.email,
          balance: 0,
          createdAt: new Date()
        });
        setCurrentBalance(0);
      }
    } catch (error) {
      console.error('Error fetching user balance:', error);
    }
  };

  // Load transactions on mount
  useEffect(() => {
    if (user) {
      loadTransactions();
      fetchUserBalance();
    }
  }, [user]);

  // Handle payment of an upcoming transaction
  const handlePayTransaction = async () => {
    if (!selectedTransaction || !user) return;
    
    // Ensure the user has enough balance
    if (currentBalance < Math.abs(selectedTransaction.amount)) {
      Alert.alert('Insufficient Balance', 'You do not have enough funds to pay this transaction.');
      return;
    }
    
    setIsProcessingPayment(true);
    
    try {
      const db = getFirestore();
      const currentDate = new Date();
      
      // 1. Update the upcoming transaction to mark it as paid
      const upcomingTransactionRef = doc(db, 'upcomingTransactions', selectedTransaction.id!);
      await updateDoc(upcomingTransactionRef, {
        isPaid: true,
        paidDate: currentDate
      });
      
      // 2. Create a new transaction record in the transactions collection
      const transactionsRef = collection(db, 'transactions');
      await setDoc(doc(transactionsRef), {
        userId: user.uid,
        title: selectedTransaction.title,
        amount: -Math.abs(selectedTransaction.amount), // Ensure it's negative for expenses
        date: currentDate,
        category: selectedTransaction.category,
        description: `Payment for: ${selectedTransaction.description || selectedTransaction.title}`,
        isPaid: true, // Always true since it's a completed payment
        relatedUpcomingTransactionId: selectedTransaction.id, // Reference to the original upcoming transaction
        createdAt: currentDate
      });
      
      // 3. Update user's balance by deducting the transaction amount
      const userRef = doc(db, 'users', user.uid);
      const newBalance = currentBalance - Math.abs(selectedTransaction.amount);
      await updateDoc(userRef, {
        balance: newBalance
      });
      
      // 4. Update local state
      setCurrentBalance(newBalance);
      
      // 5. Update transactions lists
      // Remove the paid transaction from the lists
      setTransactions(prev => prev.filter(t => t.id !== selectedTransaction.id));
      setTodayTransactions(prev => prev.filter(t => t.id !== selectedTransaction.id));
      
      // 6. Close modal and clear selected transaction
      setShowPaymentModal(false);
      setSelectedTransaction(null);
      
      // Show success message
      Alert.alert('Payment Successful', 'The transaction has been recorded and marked as paid.');
      
    } catch (error) {
      console.error('Error processing payment:', error);
      Alert.alert('Error', 'Failed to process payment. Please try again.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Handle transaction item press
  const handleTransactionPress = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowPaymentModal(true);
  };

  // Render transaction item
  const renderTransactionItem = ({ item, isHighlighted = false }: { item: Transaction, isHighlighted?: boolean }) => {
    const daysUntil = getDaysUntil(item.date);
    const urgency = getUrgencyLevel(daysUntil);
    const isTodayTransaction = isToday(item.date);
    
    let urgencyColor = '#2ecc71'; // Green for low urgency
    let urgencyText = 'Upcoming';
    
    if (isTodayTransaction) {
      urgencyColor = '#e74c3c'; // Red for today
      urgencyText = 'Due Today';
    } else if (urgency === 'medium') {
      urgencyColor = '#f39c12'; // Orange for medium urgency
      urgencyText = 'Due Soon';
    } else if (urgency === 'high') {
      urgencyColor = '#e74c3c'; // Red for high urgency
      urgencyText = 'Urgent';
    }

    return (
      <TouchableOpacity 
        style={[styles.transactionItem, isHighlighted && styles.highlightedItem]}
        onPress={() => handleTransactionPress(item)}
      >
        <View style={styles.transactionHeader}>
          <View style={styles.titleContainer}>
            <Text style={styles.transactionTitle}>{item.title}</Text>
            <View style={[styles.urgencyBadge, { backgroundColor: urgencyColor }]}>
              <Text style={styles.urgencyText}>{urgencyText}</Text>
            </View>
          </View>
          <Text style={styles.transactionAmount}>
            ${Math.abs(item.amount).toFixed(2)}
          </Text>
        </View>
        
        <View style={styles.transactionDetails}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>
              {CATEGORIES.find(cat => cat.value === item.category)?.label || '✨ Other'}
            </Text>
          </View>
          <View style={styles.dateContainer}>
            <Ionicons name="calendar-outline" size={14} color="#666" />
            <Text style={styles.dateText}>{formatDate(item.date)}</Text>
            <Text style={[styles.daysText, { color: urgencyColor }]}>
              {daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `${daysUntil} days`}
            </Text>
          </View>
        </View>
        
        {item.description ? (
          <Text style={styles.descriptionText}>{item.description}</Text>
        ) : null}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {todayTransactions.length > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>{todayTransactions.length}</Text>
            </View>
          )}
        </View>
        <Text style={styles.headerSubtitle}>
          {todayTransactions.length > 0 
            ? `${todayTransactions.length} transaction${todayTransactions.length !== 1 ? 's' : ''} due today` 
            : 'Upcoming Transactions'}
        </Text>
      </View>
      
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      ) : transactions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-off-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No upcoming transactions</Text>
          <Text style={styles.emptySubtext}>When you add upcoming transactions, they will appear here</Text>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          {todayTransactions.length > 0 && (
            <View style={styles.todaySection}>
              <View style={styles.todaySectionHeader}>
                <Ionicons name="alert-circle" size={20} color="#e74c3c" />
                <Text style={styles.todaySectionTitle}>Due Today</Text>
              </View>
              {todayTransactions.map((item) => renderTransactionItem({ item, isHighlighted: true }))}
            </View>
          )}
          <FlatList
            data={todayTransactions.length > 0 
              ? transactions.filter(t => !isToday(t.date)) 
              : transactions}
            renderItem={({ item }) => renderTransactionItem({ item, isHighlighted: false })}
            keyExtractor={(item) => item.id || Math.random().toString()}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            ListHeaderComponent={
              <View style={styles.listHeader}>
                <Text style={styles.listHeaderText}>
                  {todayTransactions.length > 0 
                    ? 'Other upcoming transactions' 
                    : `You have ${transactions.length} upcoming transaction${transactions.length !== 1 ? 's' : ''}`}
                </Text>
              </View>
            }
          />
        </View>
      )}
      
      {/* Payment Modal */}
      <Modal
        visible={showPaymentModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.paymentModalContent}>
            <Text style={styles.modalTitle}>Transaction Details</Text>
            
            {selectedTransaction && (
              <View style={styles.modalTransactionDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Title:</Text>
                  <Text style={styles.detailValue}>{selectedTransaction.title}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Category:</Text>
                  <Text style={styles.detailValue}>
                    {CATEGORIES.find(cat => cat.value === selectedTransaction.category)?.label || '✨ Other'}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Date:</Text>
                  <Text style={styles.detailValue}>{formatDate(selectedTransaction.date)}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Amount:</Text>
                  <Text style={[styles.detailValue, styles.amountText]}>
                    ${Math.abs(selectedTransaction.amount).toFixed(2)}
                  </Text>
                </View>
                
                {selectedTransaction.description && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Description:</Text>
                    <Text style={styles.detailValue}>{selectedTransaction.description}</Text>
                  </View>
                )}
                
                <View style={styles.balanceInfo}>
                  <Text style={styles.currentBalanceText}>Current Balance: ${currentBalance.toFixed(2)}</Text>
                  <Text style={styles.remainingBalanceText}>
                    Remaining After Payment: ${(currentBalance - Math.abs(selectedTransaction.amount)).toFixed(2)}
                  </Text>
                </View>
              </View>
            )}
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setShowPaymentModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.payButton, 
                  (isProcessingPayment || !selectedTransaction || 
                   currentBalance < Math.abs(selectedTransaction?.amount || 0)) && 
                   styles.disabledButton
                ]} 
                onPress={handlePayTransaction}
                disabled={isProcessingPayment || !selectedTransaction || 
                         currentBalance < Math.abs(selectedTransaction?.amount || 0)}
              >
                {isProcessingPayment ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.payButtonText}>Pay Now</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default NotificationsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  notificationBadge: {
    backgroundColor: '#e74c3c',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
    minWidth: 24,
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  todaySection: {
    margin: 16,
    marginBottom: 0,
  },
  todaySectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  todaySectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginLeft: 8,
  },
  highlightedItem: {
    borderLeftWidth: 4,
    borderLeftColor: '#e74c3c',
    backgroundColor: '#fff9f9',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  listContainer: {
    padding: 16,
  },
  listHeader: {
    marginBottom: 12,
  },
  listHeaderText: {
    fontSize: 16,
    color: '#666',
  },
  transactionItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  urgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  urgencyText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  transactionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
    backgroundColor: '#f0f0f0',
  },
  categoryText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 14,
    color: '#666',
  },
  daysText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  descriptionText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  paymentModalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 500,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalTransactionDetails: {
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  detailLabel: {
    width: 100,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  detailValue: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  amountText: {
    fontWeight: 'bold',
    color: '#e74c3c',
  },
  balanceInfo: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  currentBalanceText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  remainingBalanceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2ecc71',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f1f2f6',
    marginRight: 10,
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  payButton: {
    backgroundColor: '#2ecc71',
    marginLeft: 10,
  },
  payButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#ccc',
    opacity: 0.7,
  },
});