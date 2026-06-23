import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import socket from '../services/socket';
import { Household } from '../types';

export function useHouseholdSync(households: Household[] | undefined) {
  const queryClient = useQueryClient();
  const joinedRooms = useRef<Set<string>>(new Set());

  useEffect(() => {
    socket.connect();
  }, []);

  useEffect(() => {
    if (!households) return;

    const currentIds = new Set(households.map((h) => h.id));

    currentIds.forEach((id) => {
      if (!joinedRooms.current.has(id)) {
        socket.join(id);
        joinedRooms.current.add(id);
      }
    });

    joinedRooms.current.forEach((id) => {
      if (!currentIds.has(id)) {
        socket.leave(id);
        joinedRooms.current.delete(id);
      }
    });

    function onUpdate({ householdId }: { householdId: string }) {
      queryClient.invalidateQueries({ queryKey: ['households'] });
      queryClient.invalidateQueries({ queryKey: ['fridge', householdId] });
      queryClient.invalidateQueries({ queryKey: ['fridge-item', householdId] });
      queryClient.invalidateQueries({ queryKey: ['fridge-activity', householdId] });
      queryClient.invalidateQueries({ queryKey: ['fridge-categories', householdId] });
      queryClient.invalidateQueries({ queryKey: ['shopping-lists', householdId] });
      queryClient.invalidateQueries({ queryKey: ['shopping-list-items', householdId] });
      queryClient.invalidateQueries({ queryKey: ['shopping-activity', householdId] });
      queryClient.invalidateQueries({ queryKey: ['storages', householdId] });
      queryClient.invalidateQueries({ queryKey: ['categories', householdId] });
      queryClient.invalidateQueries({ queryKey: ['house-tasks', householdId] });
      queryClient.invalidateQueries({ queryKey: ['house-task-activity', householdId] });
      queryClient.invalidateQueries({ queryKey: ['task-categories', householdId] });

      queryClient.refetchQueries({ queryKey: ['fridge-activity', householdId], type: 'active' });
      queryClient.refetchQueries({ queryKey: ['shopping-activity', householdId], type: 'active' });
      queryClient.refetchQueries({ queryKey: ['fridge', householdId], type: 'active' });
      queryClient.refetchQueries({ queryKey: ['shopping-lists', householdId], type: 'active' });
      queryClient.refetchQueries({ queryKey: ['shopping-list-items', householdId], type: 'active' });
      queryClient.refetchQueries({ queryKey: ['house-tasks', householdId], type: 'active' });
    }

    socket.on('household:updated', onUpdate);
    return () => { socket.off('household:updated', onUpdate); };
  }, [households, queryClient]);
}
