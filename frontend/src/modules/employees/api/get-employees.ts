import { URL_API_GET_EMPLOYEES } from "@/constant/config";
import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import type { IEmployee } from "../types";
import { apiClient } from "@/lib/api";

interface EmployeesResponse {
  data: IEmployee[];
  count: number;
  error: boolean;
  message: string;
  timestamp: string;
}

interface GetEmployeesParams {
  pageIndex?: number;
  pageSize?: number;
  search?: string;
  filter?: string;
  manager?: string;
}

const getEmployees = async (
  params: GetEmployeesParams,
): Promise<EmployeesResponse> => {
  const res = await apiClient.get(URL_API_GET_EMPLOYEES, {
    params,
  });
  return res.data.data;
};

export const useGetEmployees = (
  params: GetEmployeesParams,
  config?: Omit<
    UseQueryOptions<
      EmployeesResponse,
      Error,
      EmployeesResponse,
      [string, GetEmployeesParams]
    >,
    "queryKey" | "queryFn"
  >,
) => {
  return useQuery<
    EmployeesResponse,
    Error,
    EmployeesResponse,
    [string, GetEmployeesParams]
  >({
    queryKey: ["employees", params],
    queryFn: () => getEmployees(params),
    ...config,
  });
};
