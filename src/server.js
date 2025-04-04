/*
    - The server listens on a TCP port for incoming connections.
*/

const net = require('net');
const fs = require('fs');
const { encodeRESP, parseRESP } = require('./lib/parser/respParser');
const commandHandlers = require('./command/commandHandlers');
const { store, ttl } = require('./lib/storage/store');

const DEFAULT_HOST = '0.0.0.0'
const DEFAULT_PORT = 8000

const host = process.env.HOST || DEFAULT_HOST
const port = process.env.PORT || DEFAULT_PORT

const DB_FILE = 'db.json';

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
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify({ store }, null, 2));
        console.log('Data saved to disk.');
    } catch (err) {
        console.error('Error saving database:', err);
    }
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
        return;
    }

    const cmd = command[0].toUpperCase();
    const args = command.slice(1); 

    console.log(`Command: ${cmd}, Args:`, args);

    const handler = commandHandlers[cmd];

    if (handler) {
        handler(socket, args);
    } else {
        socket.write(encodeRESP({ type: 'error', value: 'Unknown command' }));
    }
}

loadFromDisk();

server.listen(port, host, () => {
    console.log(`Server listening on ${host}:${port}`); 
});