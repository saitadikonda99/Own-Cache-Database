/*
    - The server listens on a TCP port for incoming connections.
*/

const net = require('net');
const fs = require('fs');
const { encodeRESP, parseRESP } = require('./lib/parser/respParser');

const DEFAULT_HOST = '0.0.0.0'
const DEFAULT_PORT = 8000

const host = process.env.HOST || DEFAULT_HOST
const port = process.env.PORT || DEFAULT_PORT

const DB_FILE = 'db.json';

const store = {};

const loadFromDisk = () => {
    if (fs.existsSync(DB_FILE)) {
        try {
          const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
          Object.assign(store, data.store);
          console.log('Data loaded from disk.');
        } catch (err) {
          console.error('Error loading database:', err);
        }
    }
}

const saveToDisk = () => {
    const data = JSON.stringify({ store });
    fs.writeFile(DB_FILE, data, (err) => {
        if (err) {
            console.error('Error saving to disk:', err);
        } else {
            console.log('Data saved to disk.');
        }
    });
};


// Enable auto-save every 10 seconds
setInterval(saveToDisk, 300000);

const server = net.createServer((socket) => {

    console.log('Hey, someone connected!');

    let buffer = Buffer.alloc(0);

    socket.on('data', (data) => {

        buffer = Buffer.concat([buffer, data]);

        const [command, newOffset] = parseRESP(buffer);

        if (command === null) return;

        buffer = buffer.subarray(newOffset);
    
        handleCommand(socket, command);
    });

    socket.on('end', () => {
        console.log('Client disconnected');
    });

    socket.on('error', (error) => {
        console.error('Error: ', error);
    });
});

const handleCommand = (socket, command) => {

    if (!Array.isArray(command) || command.length === 0) {
        socket.write(encodeRESP({ type: 'error', value: 'Invalid command' }));
    }

    const cmd = command[0].toUpperCase();
    const key = command[1];
    const value = command[2];

    console.log('Command:', cmd);
    switch (cmd) {
        case 'PING':
            socket.write(encodeRESP({ type: 'simple', value: 'PONG' }));
            break;

        case 'SET':
            if (!key || !value) {
                socket.write(encodeRESP({ type: 'error', value: 'Usage: SET key value' }));
            } 
            else {
                store[key] = value;
                saveToDisk();
                socket.write(encodeRESP({ type: 'simple', value: 'OK' }));
            }
            break;

        case 'GET':
            if (!key) {
                socket.write(encodeRESP({ type: 'error', value: 'Usage: GET key' }));
            } 
            else {
                const result = store[key];
                if (result === undefined) {
                    socket.write(encodeRESP({ type: 'simple', value: '(nil)' }));
                } else {
                    socket.write(encodeRESP({ type: 'simple', value: result }));
                }
            }
            break;
        case 'DEL':
            if (!key) {
                socket.write(encodeRESP({ type: 'error', value: 'Usage: DEL key' }));
            } 
            else {
                delete store[key];
                saveToDisk();
                socket.write(encodeRESP({ type: 'simple', value: 'OK' }));
            }
            break

        default:
            socket.write(encodeRESP({ type: 'error', value: 'Unknown command' }));
    }
}

loadFromDisk();

server.listen(port, host, () => {
    console.log(`Server listening on ${host}:${port}`); 
});