/**
 * RAILOPT AI — WebSocket Real-Time Operations Service
 * Manages authenticated WebSocket lifecycle, exponential backoff reconnection (1s -> 30s),
 * heartbeat ping-pong, and live operational event dispatching.
 */
import { useOperationsStore } from '../store/operationsStore'
import { useAuthStore } from '../store/authStore'
import type { OperationEvent } from '../types/websocket'

type EventCallback = (event: OperationEvent) => void

class WebSocketService {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectInterval = 30000 // 30 seconds
  private reconnectTimeoutId: any = null
  private pingIntervalId: any = null
  private listeners: Set<EventCallback> = new Set()
  private isIntentionallyClosed = false

  public connect(): void {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return
    }

    this.isIntentionallyClosed = false
    const token = useAuthStore.getState().accessToken

    if (!token) {
      useOperationsStore.getState().setConnectionStatus('DISCONNECTED')
      return
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.hostname === 'localhost' ? '127.0.0.1:8000' : window.location.host
    const wsUrl = `${protocol}//${host}/ws/operations?token=${encodeURIComponent(token)}`

    try {
      useOperationsStore.getState().setConnectionStatus(
        this.reconnectAttempts > 0 ? 'RECONNECTING' : 'DISCONNECTED'
      )
      this.ws = new WebSocket(wsUrl)

      this.ws.onopen = () => {
        this.reconnectAttempts = 0
        useOperationsStore.getState().setConnectionStatus('CONNECTED')
        this.startHeartbeat()
      }

      this.ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data)
          if (payload.type === 'pong') return

          const opEvent = payload as OperationEvent
          useOperationsStore.getState().addEvent(opEvent)

          // If event has an associated notification, add to store
          if (opEvent.data?.notification_id) {
            useOperationsStore.getState().addNotification({
              id: opEvent.data.notification_id,
              user_id: '',
              severity: opEvent.severity,
              title: opEvent.data.title || opEvent.message,
              message: opEvent.message,
              entity_type: opEvent.data.entity_type,
              entity_id: opEvent.data.entity_id,
              is_read: false,
              created_at: opEvent.timestamp
            })
          }

          // Notify registered callbacks
          this.listeners.forEach((callback) => {
            try {
              callback(opEvent)
            } catch (err) {
              console.error('Error in WebSocket listener callback:', err)
            }
          })
        } catch (err) {
          console.error('Failed to parse WebSocket event message:', err)
        }
      }

      this.ws.onclose = () => {
        this.stopHeartbeat()
        if (!this.isIntentionallyClosed) {
          useOperationsStore.getState().setConnectionStatus('RECONNECTING')
          this.scheduleReconnect()
        } else {
          useOperationsStore.getState().setConnectionStatus('DISCONNECTED')
        }
      }

      this.ws.onerror = (err) => {
        console.warn('WebSocket encountered error:', err)
      }
    } catch (err) {
      console.error('Failed to instantiate WebSocket connection:', err)
      this.scheduleReconnect()
    }
  }

  public disconnect(): void {
    this.isIntentionallyClosed = true
    this.stopHeartbeat()
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId)
      this.reconnectTimeoutId = null
    }
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    useOperationsStore.getState().setConnectionStatus('DISCONNECTED')
  }

  public subscribe(callback: EventCallback): () => void {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  public send(payload: Record<string, any>): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload))
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat()
    this.pingIntervalId = setInterval(() => {
      this.send({ type: 'ping', timestamp: Date.now() })
    }, 20000)
  }

  private stopHeartbeat(): void {
    if (this.pingIntervalId) {
      clearInterval(this.pingIntervalId)
      this.pingIntervalId = null
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimeoutId) return

    // Exponential backoff: 1s, 2s, 4s, 8s, 16s, max 30s
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), this.maxReconnectInterval)
    this.reconnectAttempts++

    this.reconnectTimeoutId = setTimeout(() => {
      this.reconnectTimeoutId = null
      this.connect()
    }, delay)
  }
}

export const webSocketService = new WebSocketService()
