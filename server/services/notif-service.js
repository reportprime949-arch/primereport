const { readJSON, writeJSON } = require("../utils/helpers");
const path = require("path");

class NotifService {
    constructor() {
        this.notifs = readJSON("notifications.json", []) || [];
    }

    getNotifs() {
        return this.notifs.sort((a, b) => new Date(b.time) - new Date(a.time));
    }

    addNotif(title, message, type = "info") {
        const newNotif = {
            id: Date.now(),
            title,
            message,
            type,
            time: new Date().toISOString(),
            read: false
        };
        this.notifs.unshift(newNotif);
        this.persist();
        return newNotif;
    }

    markAsRead(id) {
        const n = this.notifs.find(x => x.id == id);
        if (n) {
            n.read = true;
            this.persist();
        }
    }

    markAllAsRead() {
        this.notifs.forEach(n => n.read = true);
        this.persist();
    }

    persist() {
        // Limit to last 50 notifications
        if (this.notifs.length > 50) this.notifs = this.notifs.slice(0, 50);
        writeJSON("notifications.json", this.notifs);
    }
}

module.exports = new NotifService();
