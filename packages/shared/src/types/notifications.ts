export type NotificationType =
  | 'NEW_LOAD'        // new load arrived, status=PENDING
  | 'NEEDS_REVIEW'    // load.needs_review = true
  | 'DRIVER_NO_REPLY' // driver hasn't replied in 30min

export interface AppNotification {
  id: string
  type: NotificationType
  message: string
  loadId?: string
  driverId?: string
  timestamp: Date
  persistent: boolean // true = stays until backend resolves the condition
}
