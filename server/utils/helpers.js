const fs = require('fs');
const path = require('path');

const getDataFilePath = (filename) => path.join(__dirname, '..', 'data', filename);

const readJSON = (filename, defaultVal = []) => {
    try {
        const filePath = getDataFilePath(filename);
        if (fs.existsSync(filePath)) {
            return JSON.parse(fs.readFileSync(filePath, 'utf8'));
        }
    } catch (err) {
        console.error(`Error reading ${filename}:`, err);
    }
    return defaultVal;
};

const writeJSON = (filename, data) => {
    try {
        const filePath = getDataFilePath(filename);
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        return true;
    } catch (err) {
        console.error(`Error writing ${filename}:`, err);
        return false;
    }
};

const calculateTotalViews = (articles) => {
    return articles.reduce((sum, a) => sum + (parseInt(a.views) || 0), 0) + 1200;
};

module.exports = { readJSON, writeJSON, getDataFilePath, calculateTotalViews };
