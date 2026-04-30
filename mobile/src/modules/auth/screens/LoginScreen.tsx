import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, Card, Title, Paragraph } from 'react-native-paper';
import { useForm } from '../../../hooks';
import { validateEmail, validatePassword } from '../../../utils';
import { Loading } from '../../../components';
import { useAuth } from '../../../hooks';

interface LoginFormData {
  email: string;
  password: string;
}

interface LoginScreenProps {
  navigation: any;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const { login: authLogin, isLoading: authLoading } = useAuth();

  const { values, isLoading, handleChange, handleSubmit } = useForm<LoginFormData>(
    { email: '', password: '' },
    async (formData) => {
      if (!validateEmail(formData.email)) {
        Alert.alert('Error', 'Please enter a valid email');
        return;
      }

      if (!validatePassword(formData.password)) {
        Alert.alert('Error', 'Password must be at least 6 characters');
        return;
      }

      try {
        const success = await authLogin(formData.email, formData.password);
        if (success) {
          navigation.replace('Home');
        } else {
          Alert.alert('Login Failed', 'Invalid email or password');
        }
      } catch (error: any) {
        Alert.alert('Error', error.message || 'An error occurred during login');
      }
    },
  );

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.title}>Resource Management</Title>
          <Paragraph style={styles.subtitle}>Login to your account</Paragraph>

          <TextInput
            label="Email"
            value={values.email}
            onChangeText={(text) => handleChange('email', text)}
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
            editable={!isLoading}
          />

          <TextInput
            label="Password"
            value={values.password}
            onChangeText={(text) => handleChange('password', text)}
            secureTextEntry
            style={styles.input}
            editable={!isLoading}
          />

          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={isLoading}
            disabled={isLoading}
            style={styles.button}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </Button>
        </Card.Content>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  card: {
    elevation: 4,
  },
  title: {
    textAlign: 'center',
    fontSize: 24,
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 16,
  },
});
