import { useEffect, useRef, useCallback } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySocket = any;

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

type DocumentEventData = {
  document: any;
  changes?: string[];
  updatedBy?: string;
  timestamp?: string;
};

type DocumentDeletedData = { documentId: string };

type SocketEventHandlers = {
  onDocumentCreated?: (data: DocumentEventData) => void;
  onDocumentUpdated?: (data: DocumentEventData) => void;
  onDocumentDeleted?: (data: DocumentDeletedData) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
};

export function useSocket(
  userId?: string,
  office?: string,
  role?: string,
  handlers?: SocketEventHandlers
) {
  const socketRef = useRef<AnySocket | null>(null);
  const handlersRef = useRef(handlers);

  // Keep handlers ref up to date
  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  useEffect(() => {
    // Dynamic import socket.io-client
    let socket: AnySocket | null = null;
    let isActive = true;

    const initSocket = async () => {
      try {
        const { io } = await import('socket.io-client');
        if (!isActive) return;

        // Create socket connection
        socket = io(SOCKET_URL, {
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
        });

        socketRef.current = socket;

        // Connection events
        socket.on('connect', () => {
          console.log('Socket connected:', socket?.id);
          
          // Join rooms based on user info
          if (office) {
            socket?.emit('join-office', office);
          }
          if (role) {
            socket?.emit('join-role', role);
          }
          if (userId) {
            socket?.emit('join-user', userId);
          }
          
          handlersRef.current?.onConnect?.();
        });

        socket.on('disconnect', (reason: string) => {
          console.log('Socket disconnected:', reason);
          handlersRef.current?.onDisconnect?.();
        });

        socket.on('connect_error', (error: Error) => {
          console.error('Socket connection error:', error);
        });

        // Document events
        socket.on('document:created', (data: DocumentEventData) => {
          console.log('Document created:', data.document?.trackingNo);
          handlersRef.current?.onDocumentCreated?.(data);
        });

        socket.on('document:updated', (data: DocumentEventData) => {
          console.log('Document updated:', data.document?.trackingNo);
          handlersRef.current?.onDocumentUpdated?.(data);
        });

        socket.on('document:deleted', (data: DocumentDeletedData) => {
          console.log('Document deleted:', data.documentId);
          handlersRef.current?.onDocumentDeleted?.(data);
        });
      } catch (error) {
        console.error('Failed to initialize socket:', error);
      }
    };

    void initSocket();

    // Cleanup on unmount
    return () => {
      isActive = false;
      if (socket) {
        socket.disconnect();
      }
      socketRef.current = null;
    };
  }, [userId, office, role]);

  // Method to manually emit events
  const emit = useCallback((event: string, data: any) => {
    socketRef.current?.emit(event, data);
  }, []);

  return {
    socket: socketRef.current,
    emit,
    isConnected: socketRef.current?.connected ?? false,
  };
}

// Hook specifically for document-related real-time updates
export function useDocumentSocket(
  userContext: { userId?: string; office?: string; role?: string; fullName?: string },
  onDocumentsChange?: (action: 'created' | 'updated' | 'deleted', data: DocumentEventData | DocumentDeletedData) => void
) {
  const handlers: SocketEventHandlers = {
    onDocumentCreated: (data) => onDocumentsChange?.('created', data),
    onDocumentUpdated: (data) => onDocumentsChange?.('updated', data),
    onDocumentDeleted: (data) => onDocumentsChange?.('deleted', data as DocumentDeletedData),
  };

  const { socket, isConnected } = useSocket(
    userContext.userId,
    userContext.office,
    userContext.role,
    handlers
  );

  return { socket, isConnected };
}
