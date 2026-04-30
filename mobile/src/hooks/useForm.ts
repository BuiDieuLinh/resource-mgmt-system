import { useState, useCallback } from 'react';
import { Alert } from 'react-native';

export const useForm = <T>(initialValues: T, onSubmit: (values: T) => Promise<void>) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = useCallback(
    (field: keyof T, value: any) => {
      setValues((prev) => ({
        ...prev,
        [field]: value,
      }));
      // Clear error for this field when user starts typing
      if (errors[field as string]) {
        setErrors((prev) => ({
          ...prev,
          [field]: '',
        }));
      }
    },
    [errors],
  );

  const handleSubmit = useCallback(async () => {
    setIsLoading(true);
    try {
      await onSubmit(values);
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'An error occurred';
      Alert.alert('Error', message);
    } finally {
      setIsLoading(false);
    }
  }, [values, onSubmit]);

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
  }, [initialValues]);

  return {
    values,
    errors,
    isLoading,
    handleChange,
    handleSubmit,
    resetForm,
    setErrors,
  };
};
