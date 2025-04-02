// This file is the entry point for the server

const net = require('net');
const { encodeRESP, parseRESP } = require('./resp-parser');

const DEFAULT_HOST = '127.0.0.1'
const DEFAULT_PORT = 8000

const host = process.env.HOST || DEFAULT_HOST
const port = process.env.PORT || DEFAULT_PORT

const store = {};

console.log(store);

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
                socket.write(encodeRESP({ type: 'simple', value: 'OK' }));
            }
            break;

        case 'GET':
            if (!key) {
                socket.write(encodeRESP({ type: 'error', value: 'Usage: GET key' }));
            } 
            else {
                const result = store[key] || null;
                socket.write(encodeRESP(result));
            }
            break;

        default:
            socket.write(encodeRESP({ type: 'error', value: 'Unknown command' }));
    }
}


server.listen(port, host, () => {
    console.log(`Server listening on ${host}:${port}`); 
});