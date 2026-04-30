import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Title, Button } from 'react-native-paper';
import { useAuth } from '../../../hooks';

interface HomeScreenProps {
  navigation: any;
}

const menuItems = [
  { title: 'Employees', screen: 'Employees', icon: 'account-group' },
  { title: 'Attendances', screen: 'Attendances', icon: 'clock-outline' },
  { title: 'Leave Requests', screen: 'LeaveRequests', icon: 'calendar-blank-outline' },
];

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      navigation.replace('Login');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Title style={styles.welcomeTitle}>Welcome to Resource Management</Title>

        {menuItems.map((item, index) => (
          <Card key={index} style={styles.card} onPress={() => navigation.navigate(item.screen)}>
            <Card.Content>
              <Title>{item.title}</Title>
            </Card.Content>
          </Card>
        ))}

        <Button mode="outlined" onPress={handleLogout} style={styles.logoutButton}>
          Logout
        </Button>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 20,
  },
  welcomeTitle: {
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 24,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  logoutButton: {
    marginTop: 20,
  },
});
