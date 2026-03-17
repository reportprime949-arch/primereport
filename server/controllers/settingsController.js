const { readJSON, writeJSON } = require("../utils/helpers");

exports.getSettings = (req, res) => {
    const type = req.params.type || "settings";
    res.json(readJSON(`${type}.json`, {}));
};

exports.saveSettings = (req, res) => {
    const type = req.params.type || "settings";
    writeJSON(`${type}.json`, req.body);
    res.json({ success: true });
};

exports.getAi = (req, res) => res.json(readJSON("ai-settings.json", {}));
exports.saveAi = (req, res) => {
    writeJSON("ai-settings.json", req.body);
    res.json({ success: true });
};
