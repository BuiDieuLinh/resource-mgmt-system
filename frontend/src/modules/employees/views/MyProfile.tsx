import { useEffect } from 'react';
import { Center, Loader } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { useGetEmployeeByUserId } from '../api/get-employee-by-user';
import ErrorState from '@/components/ErrorState/ErrorState';
import { employeeProfileUrl } from '@/routes/url';

export default function MyProfile() {
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = useGetEmployeeByUserId();

  const employeeId = data?.data?.id;

  useEffect(() => {
    if (employeeId) {
      navigate(employeeProfileUrl.replace(':id', employeeId), { replace: true });
    }
  }, [employeeId]);

  if (isLoading)
    return (
      <Center h={400}>
        <Loader />
      </Center>
    );

  if (error) return <ErrorState message={error.message} onRetry={refetch} />;
  if (!employeeId) return <ErrorState message="Employee profile not found" onRetry={refetch} />;

  return null;
}
