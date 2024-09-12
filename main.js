const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Create the SQLite database and table
const dbPath = path.join(__dirname, 'properties.db');
console.log('Database path:', dbPath); // 디버깅: 데이터베이스 경로 확인

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('DB 연결 오류:', err.message);
    } else {
        console.log('DB 연결 성공');
    }
});

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS properties (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lat REAL,
        lng REAL,
        deposit TEXT,
        rent TEXT,
        maintenance TEXT,
        etc TEXT
    )`, (err) => {
        if (err) {
            console.error('테이블 생성 오류:', err.message);
        } else {
            console.log('테이블 생성 완료');
        }
    });
});

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1200,
        height: 900,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        }
    });

    mainWindow.loadFile('index.html');

    // IPC handlers
    ipcMain.on('save-info', (event, info) => {
        const { lat, lng, deposit, rent, maintenance, etc } = info;
        db.run(`INSERT INTO properties (lat, lng, deposit, rent, maintenance, etc) VALUES (?, ?, ?, ?, ?, ?)`, [lat, lng, deposit, rent, maintenance, etc], function(err) {
            if (err) {
                console.error('정보 저장 오류:', err.message);
            } else {
                event.sender.send('info-saved');
            }
        });
    });

    ipcMain.handle('load-info', async () => {
        return new Promise((resolve, reject) => {
            db.all('SELECT * FROM properties', [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    });
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
