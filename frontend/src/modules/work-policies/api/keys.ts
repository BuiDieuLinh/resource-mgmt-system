export const workPoliciesKeys = {
  all: ['work-policies'] as const,
  active: () => [...workPoliciesKeys.all, 'active'] as const,
};
