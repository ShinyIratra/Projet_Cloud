class NotificationModel {
    constructor(id, UID, roadAlertId, oldStatus, newStatus, message, read, createdAt) {
        this.id = id;
        this.UID = UID;
        this.roadAlertId = roadAlertId;
        this.oldStatus = oldStatus;
        this.newStatus = newStatus;
        this.message = message;
        this.read = read || false;
        this.createdAt = createdAt || new Date().toISOString();
    }

    // Getters
    getId() { return this.id; }
    getUID() { return this.UID; }
    getRoadAlertId() { return this.roadAlertId; }
    getOldStatus() { return this.oldStatus; }
    getNewStatus() { return this.newStatus; }
    getMessage() { return this.message; }
    getRead() { return this.read; }
    getCreatedAt() { return this.createdAt; }

    // Setters
    setId(id) { this.id = id; }
    setRead(read) { this.read = read; }
}

export default NotificationModel;
