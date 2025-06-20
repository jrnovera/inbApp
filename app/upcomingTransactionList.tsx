import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, SafeAreaView, TouchableOpacity, Modal, Alert } from 'react-native';
import { getFirestore, collection, query, where, getDocs, doc, updateDoc, setDoc } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { router } from 'expo-router';

interface upcomingTransaction {
    id: string;
    title: string;
    amount: number;
    date: Date;
    category?: string;
    description?: string;
    type?: string;
    isPaid?: boolean;
  }

  const UpcomingTransactionListScreen = () => {
    const { user } = useAuth();
    const [transactions, setTransactions] = useState<upcomingTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentBalance, setCurrentBalance] = useState<number>(0);
    const [selectedTransaction, setSelectedTransaction] = useState<upcomingTransaction | null>(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  
    useEffect(() => {
        if (user) {
          fetchUpcomingTransactions();
          fetchUserBalance();
        }
      }, [user]);
      
  // Fetch user balance from Firestore
  const fetchUserBalance = async () => {
    if (!user) return;
    
    try {
      const db = getFirestore();
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        setCurrentBalance(userData.balance || 0);
      } else {
        // If user document doesn't exist, create it with default balance
        await setDoc(userRef, { balance: 0 });
        setCurrentBalance(0);
      }
    } catch (error) {
      console.error('Error fetching user balance:', error);
      Alert.alert('Error', 'Could not load your balance');
    }
  };
    
      const fetchUpcomingTransactions = async () => {
        // Fix for TypeScript error: early return if user is null
        if (!user) {
          setLoading(false);
          return; // Exit the function if user is null
        }
        
   setLoading(true);
       try {
         const db = getFirestore();
         // Fetch all transactions from the transaction collection
         const transactionRef = collection(db, 'upcomingTransactions');
         const q = query(transactionRef, where('userId', '==', user.uid));
         const transactionSnap = await getDocs(q);
         
         const allTransactions: upcomingTransaction[] = [];
         
         transactionSnap.forEach(docSnap => {
           const d = docSnap.data();
           allTransactions.push({
             id: docSnap.id,
             title: d.title,
             amount: d.amount,
             date: d.date.toDate ? d.date.toDate() : new Date(d.date),
             category: d.category,
             description: d.description,
             type: d.type || 'transaction'
           });
         });
         
         // Sort transactions by date (newest first)
         const sorted = allTransactions.sort((a, b) => b.date.getTime() - a.date.getTime());
         setTransactions(sorted);
       } catch (error) {
         console.error('Error loading transactions:', error);
       } finally {
         setLoading(false);
       }
     };     

     const formatDate = (date: Date) =>
        date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    
    const renderTransaction = (t: upcomingTransaction) => (
        <View key={t.id} style={styles.transactionItem}>
          <View style={styles.transactionHeader}>
            <Text style={styles.transactionTitle}>{t.title}</Text>
            <Text style={[styles.transactionAmount, t.amount < 0 ? styles.expenseText : styles.incomeText]}>
              {t.amount < 0 ? '-' : ''}${Math.abs(t.amount).toFixed(2)}
            </Text>
          </View>
          <View style={styles.transactionDetails}>
            <Text style={styles.categoryText}>{t.category ? t.category.charAt(0).toUpperCase() + t.category.slice(1) : ''}</Text>
            <Text style={styles.dateText}>{formatDate(t.date)}</Text>
          </View>
          {t.description ? <Text style={styles.descriptionText}>{t.description}</Text> : null}
        </View>
      );
      
      return (
          <SafeAreaView style={styles.container}>
            <Text style={styles.header}>All Upcoming Transactions</Text>
            {loading ? (
              <ActivityIndicator size="large" color="#2ecc71" style={{ marginTop: 40 }} />
            ) : transactions.length === 0 ? (
              <Text style={styles.emptyText}>No upcoming transactions found.</Text>
            ) : (
              <ScrollView contentContainerStyle={{ padding: 16 }}>
                {transactions.map(renderTransaction)}
              </ScrollView>
            )}
          </SafeAreaView>
        );
      };

      export default UpcomingTransactionListScreen;

      const styles = StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: '#f5f5f5',
        },
        header: {
          fontSize: 22,
          fontWeight: 'bold',
          color: '#333',
          textAlign: 'center',
          marginTop: 20,
          marginBottom: 10,
        },
        transactionItem: {
          backgroundColor: '#fff',
          borderRadius: 10,
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
          marginBottom: 6,
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
        incomeText: {
          color: '#2ecc71',
        },
        expenseText: {
          color: '#e74c3c',
        },
        transactionDetails: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: 4,
        },
        categoryText: {
          fontSize: 13,
          color: '#666',
        },
        dateText: {
          fontSize: 13,
          color: '#999',
        },
        descriptionText: {
          fontSize: 14,
          color: '#666',
          marginTop: 6,
        },
        emptyText: {
          textAlign: 'center',
          color: '#999',
          marginTop: 40,
          fontSize: 16,
        },
      });
      