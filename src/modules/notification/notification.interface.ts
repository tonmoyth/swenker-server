export type NotificationStatus = "ACCEPT" | "REJECT";

export interface IUpdateNotificationStatus {
    status: NotificationStatus;
}
