/**
 * Custom hook for managing TaskPacket state
 *
 * Provides centralized state management and update functions for TaskPacket forms,
 * eliminating duplicate code across playground and actions components.
 */

import { useState, useCallback } from 'react';
import { TaskPacket, INITIAL_TASK_PACKET, hasTaskPacketData } from '@/types';

export function useTaskPacket(initialValue: TaskPacket = INITIAL_TASK_PACKET) {
  const [taskPacket, setTaskPacket] = useState<TaskPacket>(initialValue);

  const updateClientField = useCallback(
    (field: keyof TaskPacket['client_or_prospect'], value: string) => {
      setTaskPacket((prev) => ({
        ...prev,
        client_or_prospect: { ...prev.client_or_prospect, [field]: value },
      }));
    },
    []
  );

  const updateConstraintsField = useCallback(
    (field: keyof TaskPacket['constraints'], value: string) => {
      setTaskPacket((prev) => ({
        ...prev,
        constraints: { ...prev.constraints, [field]: value },
      }));
    },
    []
  );

  const updateArtifactsField = useCallback(
    (field: keyof TaskPacket['artifacts'], value: string) => {
      setTaskPacket((prev) => ({
        ...prev,
        artifacts: { ...prev.artifacts, [field]: value },
      }));
    },
    []
  );

  const updateLane = useCallback((lane: TaskPacket['lane']) => {
    setTaskPacket((prev) => ({ ...prev, lane }));
  }, []);

  const reset = useCallback(() => {
    setTaskPacket(INITIAL_TASK_PACKET);
  }, []);

  const hasData = useCallback(() => {
    return hasTaskPacketData(taskPacket);
  }, [taskPacket]);

  return {
    taskPacket,
    updateClientField,
    updateConstraintsField,
    updateArtifactsField,
    updateLane,
    reset,
    hasData,
    setTaskPacket,
  };
}
