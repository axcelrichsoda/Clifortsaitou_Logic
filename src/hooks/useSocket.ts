'use client';

import { useEffect, useState } from 'react';
import { getSocket, type AppSocket } from '@/lib/socketClient';

export function useSocket(): { socket: AppSocket; connected: boolean } {
  const socket = getSocket();
  const [connected, setConnected] = useState(socket.connected);

  useEffect(() => {
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    // The socket can finish connecting between the initial render and this effect running,
    // in which case the 'connect' event above is missed entirely — resync here to avoid
    // getting stuck showing "disconnected" forever.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setConnected(socket.connected);
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, [socket]);

  return { socket, connected };
}
