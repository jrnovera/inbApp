import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, router } from 'expo-router';
import { createUserWithEmailAndPassword, Auth as FirebaseAuth } from 'firebase/auth';
import { auth } from '@/firebaseConfig';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async () => {
    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password should be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      if (userCredential) {
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      console.log('Signup error:', error);
      setError(error.message || 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.title}>Create Account</Text>
        
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        
        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
        />
        
        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={true}
          style={styles.input}
        />
        
        <TextInput
          placeholder="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={true}
          style={styles.input}
        />
        
        {loading ? (
          <ActivityIndicator size="large" color="#0000ff" style={styles.loading} />
        ) : (
          <View style={styles.buttonContainer}>
            <TouchableOpacity onPress={handleSignup} style={styles.button}>
              <Text style={styles.buttonText}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        )}
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Link href="/login" asChild>
            <TouchableOpacity>
              <Text style={styles.linkText}>Sign In</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center'
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginVertical: 8,
    paddingHorizontal: 12,
    fontSize: 16
  },
  buttonContainer: {
    marginTop: 20
  },
  button: {
    backgroundColor: '#2ecc71',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center'
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold'
  },
  loading: {
    marginTop: 20
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20
  },
  footerText: {
    color: '#666',
    fontSize: 14
  },
  linkText: {
    color: '#3498db',
    fontSize: 14,
    fontWeight: 'bold'
  },
  errorText: {
    color: '#e74c3c',
    marginBottom: 10,
    textAlign: 'center'
  }
});