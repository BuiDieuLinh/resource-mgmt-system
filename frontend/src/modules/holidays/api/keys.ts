export const holidayKeys = {
  all: ['holidays'] as const,
  list: (p: any) => [...holidayKeys.all, p] as const,
};
