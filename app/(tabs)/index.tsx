import { StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, ScrollView, TextInput, Modal, Alert } from 'react-native';
import { getAuth } from 'firebase/auth';
import { router } from 'expo-router';
import { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { getFirestore, doc, getDoc, updateDoc, setDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
  const { user, loading } = useAuth();
  const [currentBalance, setCurrentBalance] = useState<number>(0);
  const [addAmount, setAddAmount] = useState('');
  const [showAddBalanceModal, setShowAddBalanceModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [upcomingTransactions, setUpcomingTransactions] = useState<Transaction[]>([]);
  const [todayTransactions, setTodayTransactions] = useState<Transaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  
  useEffect(() => {
    if (!user && !loading) {
      // If not loading and no user, redirect to login
      router.replace('/login');
    } else if (user) {
      // Load user's data from Firestore
      fetchUserBalance();
      fetchTransactions();
      fetchUpcomingTransactions();
    }
  }, [user, loading]);
  
  // Fetch regular transactions from Firestore
  const fetchTransactions = async () => {
    if (!user) return;
    
    setLoadingTransactions(true);
    try {
      const db = getFirestore();
      const transactionsRef = collection(db, 'transactions');
      const q = query(
        transactionsRef,
        where('userId', '==', user.uid),
        orderBy('date', 'desc'),
        limit(10)
      );
      
      const querySnapshot = await getDocs(q);
      const fetchedTransactions: Transaction[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        fetchedTransactions.push({
          id: doc.id,
          title: data.title || '',
          amount: data.amount || 0,
          date: data.date ? new Date(data.date.toDate()).toLocaleDateString() : '',
          type: data.amount >= 0 ? 'income' : 'expense',
          category: data.category || '',
          description: data.description || '',
          isPaid: data.isPaid || false
        });
      });
      
      setTransactions(fetchedTransactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      Alert.alert('Error', 'Could not load your transactions');
    } finally {
      setLoadingTransactions(false);
    }
  };
  
  // Check if a date is today
  const isToday = (dateString: string) => {
    const today = new Date();
    const transactionDate = new Date(dateString);
    
    return transactionDate.getDate() === today.getDate() &&
      transactionDate.getMonth() === today.getMonth() &&
      transactionDate.getFullYear() === today.getFullYear();
  };

  // Fetch upcoming transactions from Firestore
  const fetchUpcomingTransactions = async () => {
    if (!user) return;
    
    try {
      console.log('Fetching upcoming transactions for user:', user.uid);
      setLoadingTransactions(true);
      
      const db = getFirestore();
      const upcomingRef = collection(db, 'upcomingTransactions');
      const q = query(
        upcomingRef,
        where('userId', '==', user.uid),
        where('isPaid', '==', false)
        // Note: Temporarily removing orderBy as it might be causing issues
        // if date field isn't a proper Firestore timestamp
      );
      
      const querySnapshot = await getDocs(q);
      console.log('Upcoming transactions found:', querySnapshot.size);
      
      const fetchedUpcoming: Transaction[] = [];
      const todayItems: Transaction[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log('Upcoming transaction data:', data);
        
        // Handle different possible date formats
        let formattedDate = '';
        let dateObj: Date | null = null;
        
        if (data.date) {
          // Handle Firestore Timestamp
          if (data.date.toDate) {
            dateObj = data.date.toDate();
            formattedDate = dateObj?.toLocaleDateString() || '';
          } 
          // Handle string date
          else if (typeof data.date === 'string') {
            dateObj = new Date(data.date);
            formattedDate = dateObj?.toLocaleDateString() || '';
          }
          // Handle timestamp number
          else if (typeof data.date === 'number') {
            dateObj = new Date(data.date);
            formattedDate = dateObj?.toLocaleDateString() || '';
          }
        }
        
        const transaction = {
          id: doc.id,
          title: data.title || '',
          amount: data.amount || 0,
          date: formattedDate,
          type: 'upcoming',
          category: data.category || '',
          description: data.description || '',
          isPaid: data.isPaid || false
        };
        
        fetchedUpcoming.push(transaction);
        
        // Check if this transaction is due today
        if (dateObj && isToday(formattedDate)) {
          todayItems.push(transaction);
        }
      });
      
      console.log('Processed upcoming transactions:', fetchedUpcoming.length);
      console.log('Today\'s transactions:', todayItems.length);
      
      setUpcomingTransactions(fetchedUpcoming);
      setTodayTransactions(todayItems);
    } catch (error) {
      console.error('Error fetching upcoming transactions:', error);
      Alert.alert('Error', 'Could not load your upcoming transactions');
    } finally {
      setLoadingTransactions(false);
    }
  };
  
  // Fetch user balance from Firestore
  const fetchUserBalance = async () => {
    if (!user) return;
    
    try {
      const db = getFirestore();
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        // User document exists, get the balance
        const userData = userDoc.data();
        setCurrentBalance(userData.balance || 0);
      } else {
        // Create user document if it doesn't exist
        await setDoc(userRef, {
          username: user.email?.split('@')[0] || 'User',
          email: user.email,
          balance: 0,
          userId: user.uid,
          createdAt: new Date()
        });
        setCurrentBalance(0);
      }
    } catch (error) {
      console.error('Error fetching user balance:', error);
      Alert.alert('Error', 'Could not load your balance information');
    }
  };
  

  // Handle adding balance
  const handleAddBalance = async () => {
    // Validate input
    if (!addAmount || isNaN(Number(addAmount)) || Number(addAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    
    if (!user) {
      Alert.alert('Error', 'You must be logged in to add balance');
      return;
    }
    
    setIsUpdating(true);
    
    try {
      const amountToAdd = Number(addAmount);
      const db = getFirestore();
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      let updatedBalance = amountToAdd;
      
      if (userDoc.exists()) {
        // Update existing user doc
        const userData = userDoc.data();
        updatedBalance = (userData.balance || 0) + amountToAdd;
        
        await updateDoc(userRef, {
          balance: updatedBalance
        });
      } else {
        // Create new user doc
        await setDoc(userRef, {
          username: user.email?.split('@')[0] || 'User',
          email: user.email,
          balance: amountToAdd,
          userId: user.uid,
          createdAt: new Date()
        });
      }
      
      // Update local state
      setCurrentBalance(updatedBalance);
      setAddAmount('');
      setShowAddBalanceModal(false);
      Alert.alert('Success', `$${amountToAdd.toFixed(2)} has been added to your balance`);
      
    } catch (error) {
      console.error('Error updating balance:', error);
      Alert.alert('Error', 'Failed to update your balance');
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Transaction type definition
  type Transaction = {
    id: string;
    title: string;
    amount: number;
    date: string;
    type: string;
    category: string;
    description: string;
    isPaid: boolean;
  };
  
  const renderTransactionItem = ({ item }: { item: Transaction }) => {
    // Determine if this is an upcoming transaction with isPaid status
    const isUpcoming = item.type === 'upcoming';
    
    // Function to show payment modal for upcoming transactions
    const handlePaymentClick = () => {
      // Only show payment modal for upcoming and unpaid transactions
      if (item.type === 'upcoming' && !item.isPaid) {
        setSelectedTransaction(item);
        setShowPaymentModal(true);
      }
    };
    
    return (
      <View style={[styles.transactionItem, 
        item.amount < 0 ? styles.expenseItem : styles.incomeItem]}>
        {/* Left side - Title and Category */}
        <View style={styles.transactionInfo}>
          <Text style={styles.transactionTitle}>{item.title}</Text>
          {item.category && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{item.category}</Text>
            </View>
          )}
        </View>
        
        {/* Middle - Date */}
        <Text style={styles.transactionDate}>{item.date}</Text>
        
        {/* Right side - Amount and Paid/Unpaid button */}
        <View style={styles.transactionRight}>
          <Text style={[styles.transactionAmount, 
            item.amount < 0 ? styles.expenseText : styles.incomeText]}>
            {item.amount < 0 ? '-$' : '$'}{Math.abs(item.amount).toFixed(2)}
          </Text>
          
          <TouchableOpacity 
            style={[styles.statusButton, item.isPaid ? styles.paidButton : styles.unpaidButton]}
            onPress={handlePaymentClick}
            disabled={item.isPaid}
          >
            <Text style={styles.statusButtonText}>
              {item.isPaid ? 'Paid' : 'Unpaid'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading || !user) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Loading...</Text>
      </SafeAreaView>
    );
  }
  
  // Function to handle payment of an upcoming transaction
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
      const upcomingTransactionRef = doc(db, 'upcomingTransactions', selectedTransaction.id);
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
      setUpcomingTransactions(prev => 
        prev.map(t => 
          t.id === selectedTransaction.id ? {...t, isPaid: true} : t
        )
      );
      
      // 5. Refresh transactions list to show the new transaction
      fetchTransactions();
      
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
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header with user info */}
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <Text style={styles.welcomeText}>Hello,</Text>
            <Text style={styles.userName}>{user?.email?.split('@')[0] || 'User'}</Text>
          </View>

        
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Link href="../notifications" asChild>
              <TouchableOpacity style={{ marginRight: 16 }}>
                <View>
                  <Ionicons 
                    name="notifications-outline" 
                    size={28} 
                    color={todayTransactions.length > 0 ? "#e74c3c" : "#444"} 
                  />
                  {todayTransactions.length > 0 && (
                    <View style={styles.notificationBadge}>
                      <Text style={styles.notificationBadgeText}>
                        {todayTransactions.length}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            </Link>
          <Link href="/settings" asChild>
            <TouchableOpacity style={styles.profileButton}>
              <View style={styles.profileIcon}>
                <Text style={styles.profileInitial}>
                  {user?.email ? user.email[0].toUpperCase() : 'U'}
                </Text>
              </View>
            </TouchableOpacity>
          </Link>
        </View>
        </View>
        
        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <Text style={styles.balanceLabel}>Available Balance</Text>
          </View>
          <Text style={styles.balanceAmount}>${currentBalance.toFixed(2)}</Text>
          <View style={styles.balanceDetails}>
          
            <View style={styles.detailDivider}></View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Expenses</Text>
              <Text style={styles.expenseValue}>-$2,269.75</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.addFundsButton}
            onPress={() => setShowAddBalanceModal(true)}
          >
            <Text style={styles.addFundsButtonText}>Add Balance</Text>
          </TouchableOpacity>
          
          {/* Add Balance Modal */}
          <Modal
            visible={showAddBalanceModal}
            transparent={true}
            animationType="slide"
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Add Balance</Text>
                <Text style={styles.modalDescription}>Enter the amount you want to add to your balance</Text>
                
                <View style={styles.amountInputContainer}>
                  <Text style={styles.currencySymbol}>$</Text>
                  <TextInput
                    style={styles.amountInput}
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                    value={addAmount}
                    onChangeText={setAddAmount}
                  />
                </View>
                
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => {
                      setShowAddBalanceModal(false);
                      setAddAmount('');
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.modalButton, styles.addButton]}
                    onPress={handleAddBalance}
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.addButtonText}>Add</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </View>
                {/* Recent Transactions */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Transactions</Text>
              <TouchableOpacity onPress={() => router.push('/transactionList')}>
                <Text style={styles.seeAllText}>See all</Text>
              </TouchableOpacity>
            </View>
            
            {loadingTransactions ? (
              <ActivityIndicator size="large" color="#2ecc71" style={{marginVertical: 20}} />
            ) : transactions.length === 0 ? (
              <Text style={styles.emptyText}>No recent transactions found</Text>
            ) : (
              transactions.map((item) => renderTransactionItem({ item }))
            )}
          </View>
          
          {/* Upcoming Transactions */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Upcoming</Text>
              <TouchableOpacity onPress={() => router.push('/upcomingTransactionList')}>
                <Text style={styles.seeAllText}>See all</Text>
              </TouchableOpacity>
            </View>
            
            {loadingTransactions ? (
              <ActivityIndicator size="large" color="#2ecc71" style={{marginVertical: 20}} />
            ) : upcomingTransactions.length === 0 ? (
              <Text style={styles.emptyText}>No upcoming transactions found</Text>
            ) : (
              upcomingTransactions.map((item) => renderTransactionItem({ item }))
            )}
          </View>
      </ScrollView>
      
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
              <View style={styles.transactionDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Title:</Text>
                  <Text style={styles.detailValue}>{selectedTransaction.title}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Category:</Text>
                  <Text style={styles.detailValue}>{selectedTransaction.category}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Date:</Text>
                  <Text style={styles.detailValue}>{selectedTransaction.date}</Text>
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
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  userInfo: {
    flexDirection: 'column',
  },
  welcomeText: {
    fontSize: 16,
    color: '#666',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  profileButton: {
    height: 40,
    width: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIcon: {
    height: 40,
    width: 40,
    borderRadius: 20,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitial: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  balanceCard: {
    backgroundColor: '#2ecc71',
    borderRadius: 12,
    margin: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  balanceHeader: {
    marginBottom: 10,
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
  },
  balanceAmount: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  balanceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginBottom: 5,
  },
  incomeValue: {
    color: '#2ecc71',
    fontSize: 16,
    fontWeight: 'bold',
  },
  expenseValue: {
    color: '#e74c3c',
    fontSize: 16,
    fontWeight: 'bold',
  },
  detailDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 15,
  },
  addFundsButton: {
    backgroundColor: '#2980b9',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
  },
  addFundsButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionContainer: {
    padding: 20,
    paddingTop: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  seeAllText: {
    color: '#3498db',
    fontSize: 14,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  incomeItem: {
    borderLeftWidth: 3,
    borderLeftColor: '#2ecc71',
    paddingLeft: 10,
  },
  expenseItem: {
    borderLeftWidth: 3,
    borderLeftColor: '#e74c3c',
    paddingLeft: 10,
  },
  transactionInfo: {
    flex: 2,
    flexDirection: 'column',
    justifyContent: 'center',
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
    color: '#333',
  },
  transactionDate: {
    fontSize: 12,
    color: '#999',
    flex: 1,
    textAlign: 'center',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  incomeText: {
    color: '#2ecc71',
  },
  expenseText: {
    color: '#e74c3c',
  },
  paidItem: {
    opacity: 0.7,
    backgroundColor: '#f8f8f8',
  },
  statusButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginTop: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paidButton: {
    backgroundColor: '#2ecc71',
  },
  unpaidButton: {
    backgroundColor: '#e74c3c',
  },
  statusButtonText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  transactionRight: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  descriptionText: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  categoryBadge: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  categoryText: {
    fontSize: 10,
    color: '#666',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    width: '85%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  paymentModalContent: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  modalDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    padding: 20,
  },
  transactionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingBottom: 10,
    width: '80%',
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
    paddingHorizontal: 10,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#666',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    backgroundColor: '#2ecc71',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  transactionDetails: {
    width: '100%',
    marginVertical: 15,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '400',
    flex: 2,
    textAlign: 'right',
  },
  amountText: {
    fontWeight: '700',
    color: '#e74c3c',
  },
  balanceInfo: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    width: '100%',
  },
  currentBalanceText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
  },
  remainingBalanceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  payButton: {
    backgroundColor: '#3498db',
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
  notificationBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#e74c3c',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  notificationBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
