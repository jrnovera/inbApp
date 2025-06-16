import { StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, ScrollView } from 'react-native';
import { getAuth } from 'firebase/auth';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';

export default function HomeScreen() {
  const { user, loading } = useAuth();
  
  useEffect(() => {
    if (!user && !loading) {
      // If not loading and no user, redirect to login
      router.replace('/login');
    }
  }, [user, loading]);
  
  const handleSignOut = async () => {
    try {
      await getAuth().signOut();
      router.replace('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
  
  // Transaction type definition
  type Transaction = {
    id: string;
    title: string;
    amount: number;
    date: string;
    type: string;
  };

  // Sample transaction data
  const upcomingTransactions: Transaction[] = [
    { id: '1', title: 'Netflix Subscription', amount: -12.99, date: '2025-06-20', type: 'upcoming' },
    { id: '2', title: 'Salary Deposit', amount: 3500, date: '2025-06-25', type: 'upcoming' },
    { id: '3', title: 'Electricity Bill', amount: -85.20, date: '2025-06-22', type: 'upcoming' },
  ];
  
  const recentTransactions: Transaction[] = [
    { id: '4', title: 'Grocery Store', amount: -64.75, date: '2025-06-15', type: 'expense' },
    { id: '5', title: 'Transfer from John', amount: 250, date: '2025-06-14', type: 'income' },
    { id: '6', title: 'Restaurant', amount: -32.50, date: '2025-06-13', type: 'expense' },
    { id: '7', title: 'Amazon Purchase', amount: -49.99, date: '2025-06-10', type: 'expense' },
    { id: '8', title: 'Freelance Payment', amount: 400, date: '2025-06-08', type: 'income' },
  ];
  
  const renderTransactionItem = ({ item }: { item: Transaction }) => (
    <View style={[styles.transactionItem, 
      item.amount < 0 ? styles.expenseItem : styles.incomeItem]}>
      <View style={styles.transactionInfo}>
        <Text style={styles.transactionTitle}>{item.title}</Text>
        <Text style={styles.transactionDate}>{item.date}</Text>
      </View>
      <Text style={[styles.transactionAmount, 
        item.amount < 0 ? styles.expenseText : styles.incomeText]}>
        {item.amount < 0 ? '-$' : '$'}{Math.abs(item.amount).toFixed(2)}
      </Text>
    </View>
  );

  if (loading || !user) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Loading...</Text>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header with user info */}
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <Text style={styles.welcomeText}>Hello,</Text>
            <Text style={styles.userName}>{user?.email?.split('@')[0] || 'User'}</Text>
          </View>
          <TouchableOpacity onPress={handleSignOut} style={styles.profileButton}>
            <View style={styles.profileIcon}>
              <Text style={styles.profileInitial}>
                {user?.email ? user.email[0].toUpperCase() : 'U'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
        
        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <Text style={styles.balanceLabel}>Available Balance</Text>
          </View>
          <Text style={styles.balanceAmount}>$4,250.75</Text>
          <View style={styles.balanceDetails}>
          
            <View style={styles.detailDivider}></View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Expenses</Text>
              <Text style={styles.expenseValue}>-$2,269.75</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.addFundsButton}>
            <Text style={styles.addFundsButtonText}>Add Balance</Text>
          </TouchableOpacity>
        </View>
        
        {/* Upcoming Transactions */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Upcoming Transactions</Text>
          {upcomingTransactions.map((item) => renderTransactionItem({item}))}
        </View>
        
        {/* Recent Transactions */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          {recentTransactions.map((item) => renderTransactionItem({item}))}
        </View>
      </ScrollView>
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
    flex: 1,
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
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
