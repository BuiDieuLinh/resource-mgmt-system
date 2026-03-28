export const leaveRequestKeys = {
  all: ['leave-requests'] as const,
  list: (p: any) => [...leaveRequestKeys.all, p] as const,
};

export const holidayKeys = {
  all: ['holidays'] as const,
  list: (p: any) => [...holidayKeys.all, p] as const,
};
