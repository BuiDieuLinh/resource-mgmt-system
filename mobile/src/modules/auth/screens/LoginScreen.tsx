import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../hooks/useAuth';
import { useForm } from '../../../hooks/useForm';
import { validateEmail, validatePassword } from '../../../utils';
import { Button, Input } from '../../../components/ui';
import { colors, gradients, spacing, radius, shadow } from '../../../theme';

interface LoginFormData {
  email: string;
  password: string;
}

interface LoginScreenProps {
  navigation: any;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const { login: authLogin } = useAuth();

  const logoAnim = useRef(new Animated.Value(0)).current;
  const formAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(logoAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(formAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const logoStyle = {
    opacity: logoAnim,
    transform: [
      { translateY: logoAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) },
    ],
  };

  const formStyle = {
    opacity: formAnim,
    transform: [{ translateY: formAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }],
  };

  const { values, isLoading, handleChange, handleSubmit } = useForm<LoginFormData>(
    { email: '', password: '' },
    async (formData) => {
      if (!validateEmail(formData.email)) {
        Alert.alert('Invalid Email', 'Please enter a valid email address');
        return;
      }
      if (!validatePassword(formData.password)) {
        Alert.alert('Invalid Password', 'Password must be at least 6 characters');
        return;
      }
      const success = await authLogin(formData.email, formData.password);
      if (!success) {
        Alert.alert('Login Failed', 'Invalid email or password. Please try again.');
      }
      // Navigation will happen automatically when isLoggedIn changes
    },
  );

  return (
    <LinearGradient
      colors={['#1A0F3C', '#2D1B69', '#4C3B8F']}
      style={styles.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Logo */}
            <Animated.View style={[styles.logoSection, logoStyle]}>
              <View style={styles.logoContainer}>
                <Ionicons name="grid" size={40} color={colors.white} />
              </View>
              <Text style={styles.appName}>RMS Core</Text>
              <Text style={styles.tagline}>Resource Management System</Text>
            </Animated.View>

            {/* Form */}
            <Animated.View style={[styles.formCard, formStyle]}>
              <Text style={styles.welcomeText}>Welcome back</Text>
              <Text style={styles.subText}>Sign in to your account</Text>

              <View style={styles.form}>
                <Input
                  label="Email"
                  placeholder="Enter your email"
                  value={values.email}
                  onChangeText={(t) => handleChange('email', t)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  leftIcon="mail-outline"
                  editable={!isLoading}
                />
                <Input
                  label="Password"
                  placeholder="Enter your password"
                  value={values.password}
                  onChangeText={(t) => handleChange('password', t)}
                  isPassword
                  leftIcon="lock-closed-outline"
                  editable={!isLoading}
                />
                <Button
                  title={isLoading ? 'Signing in...' : 'Sign In'}
                  onPress={handleSubmit}
                  loading={isLoading}
                  disabled={isLoading}
                  fullWidth
                  size="lg"
                  style={styles.loginBtn}
                />
              </View>

              <View style={styles.footer}>
                <Ionicons name="shield-checkmark-outline" size={14} color={colors.gray400} />
                <Text style={styles.footerText}>Secured with end-to-end encryption</Text>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xxl,
  },
  logoSection: { alignItems: 'center', marginBottom: spacing.xxl },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  appName: { fontSize: 32, fontWeight: '800', color: colors.white, letterSpacing: -0.5 },
  tagline: { fontSize: 14, color: 'rgba(255,255,255,0.6)', marginTop: 4, letterSpacing: 0.5 },
  formCard: {
    backgroundColor: colors.white,
    borderRadius: 28,
    padding: spacing.xl,
    ...shadow.lg,
  },
  welcomeText: { fontSize: 26, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
  subText: { fontSize: 15, color: colors.textSecondary, marginBottom: spacing.xl },
  form: { gap: 4 },
  loginBtn: { marginTop: spacing.sm },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.lg,
  },
  footerText: { fontSize: 12, color: colors.gray400 },
});
