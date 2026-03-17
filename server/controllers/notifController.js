const notifService = require("../services/notif-service");

exports.list = (req, res) => {
    res.json(notifService.getNotifs());
};

exports.read = (req, res) => {
    notifService.markAsRead(req.params.id);
    res.json({ success: true });
};

exports.readAll = (req, res) => {
    notifService.markAllAsRead();
    res.json({ success: true });
};

exports.add = (req, res) => {
    const { title, message, type } = req.body;
    const notif = notifService.addNotif(title, message, type);
    res.json(notif);
};
