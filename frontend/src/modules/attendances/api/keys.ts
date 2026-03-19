export const attendancesKeys = {
  all: ['attendances'] as const,
  lists: () => [...attendancesKeys.all, 'list'] as const,
  list: (params: { month?: number; year?: number }) =>
    [...attendancesKeys.lists(), params] as const,
  summaries: (params: { month?: number; year?: number }) =>
    [...attendancesKeys.all, 'summary', params] as const,
};
