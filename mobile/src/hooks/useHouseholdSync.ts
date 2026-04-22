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
        socket.send('join', id);
        joinedRooms.current.add(id);
      }
    });

    joinedRooms.current.forEach((id) => {
      if (!currentIds.has(id)) {
        socket.send('leave', id);
        joinedRooms.current.delete(id);
      }
    });

    function onUpdate({ householdId }: { householdId: string }) {
      queryClient.invalidateQueries({ queryKey: ['households'] });
      queryClient.invalidateQueries({ queryKey: ['fridge', householdId] });
      queryClient.invalidateQueries({ queryKey: ['shopping', householdId] });
      queryClient.invalidateQueries({ queryKey: ['storages', householdId] });
    }

    socket.on('household:updated', onUpdate);
    return () => { socket.off('household:updated', onUpdate); };
  }, [households, queryClient]);
}
