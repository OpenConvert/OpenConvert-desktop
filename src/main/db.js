const sqlite3 = require('sqlite3').verbose();
const fs = require("node:fs");
const path = require('node:path');
function writeData(datatime, fileSize, filename, fileDir) {
    // Create data.db if it does not exist
    const dbPath = path.join(__dirname, 'data.db');
    if (!fs.existsSync(dbPath)) {
        fs.writeFileSync(dbPath, '');
    }
    const db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error('Error opening database:', err);
            return;
        }
        // Create table if it does not exist
        db.all(`CREATE TABLE IF NOT EXISTS temp (
            "file-id" INTEGER PRIMARY KEY AUTOINCREMENT,
            datatime TEXT NOT NULL,
            fileSize INTEGER NOT NULL,
            filename TEXT NOT NULL,
            fileDir TEXT NOT NULL
        );`, (err) => {
            if (err) {
                console.error('Error creating table:', err);
                db.close();
                return;
            }
            // Insert data into the table
            db.run(`INSERT INTO temp(datatime,fileSize,filename,fileDir) VALUES('${datatime}',${fileSize},'${filename}','${fileDir}')`)
        });
    });
}
function getSumOfData(callback) {
        const db = new sqlite3.Database('data.db', (err) => {
            if (err) {
                console.error('Error opening database:', err);
                callback(err,null);
                return;
            }
            db.all(`SELECT COUNT(*) AS count,SUM(temp.fileSize) AS total FROM temp`, (err, rows) => {
                if (err) {
                    console.error('Error querying database:', err);
                    callback(err,null);
                } else {
                callback(null,rows[0])
                }
                db.close();
            });
        });

}
module.exports = { writeData, getSumOfData };