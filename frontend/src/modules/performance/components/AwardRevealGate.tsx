import { useState, useEffect } from 'react';
import { useGetPendingReveal, useMarkRevealed } from '../api';
import { AwardRevealPage } from './AwardRevealPage';
import type { IAward } from '../types';

/**
 * Mounted in Layout — automatically shows Award Reveal on the announce date
 * if the employee hasn't seen it yet. Shows only once per day.
 */
export function AwardRevealGate() {
  const { data: pending = [] } = useGetPendingReveal();
  const markRevealed = useMarkRevealed();
  const [awards, setAwards] = useState<IAward[]>([]);

  useEffect(() => {
    if (pending.length > 0) setAwards(pending);
  }, [pending.length]);

  if (!awards.length) return null;

  const handleClose = async () => {
    await Promise.all(awards.map((a) => markRevealed.mutateAsync(a.id)));
    setAwards([]);
  };

  return <AwardRevealPage awards={awards} onClose={handleClose} />;
}
