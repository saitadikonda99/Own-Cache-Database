const net = require('net');
const { encodeRESP, parseRESP } = require('../lib/parser/respParser');
const displayResponse = require('../lib/display/responseFormatter');
const parseCommand = require('../lib/parser/commandParser');
const readline = require('readline');

const DEFAULT_PORT = 6379;
const DEFAULT_HOST = 'cache-server'; 

const client = new net.Socket();
let buffer = Buffer.alloc(0);

const port = process.env.PORT || DEFAULT_PORT;
const host = process.env.HOST || DEFAULT_HOST;

let rl = null;

// Connect to the server
client.connect(port, host, () => {
    console.log('Connected to server on port:', port);
    startREPL();
});

client.on('data', (data) => {
    buffer = Buffer.concat([buffer, data]);

    const [response, newOffset] = parseRESP(buffer);

    if (response === null) return;
    buffer = buffer.subarray(newOffset);
    displayResponse(response);
    rl.prompt();
});

client.on('close', () => {
    console.log('Connection closed');
    process.exit(0);
});

client.on('error', (err) => {
    if (err.code === 'ECONNREFUSED') {
        console.error('\nError: Could not connect to server at', host + ':' + port);
        console.error('Please make sure the server is running and try again.');
    } else {
        console.error('Connection error:', err);
    }
    process.exit(1);
});

const startREPL = () => {
    rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: `Own-Cache-Database:${port}> `
    });

    rl.prompt();

    rl.on('line', (line) => {
        const command = line.trim();
        if (command.toLowerCase() === 'exit') {
            client.destroy();
            rl.close();
            return;
        }

        if (command.toLowerCase() === 'clear') {
            process.stdout.write('\u001B[2J\u001B[0;0f');
            rl.prompt();
            return;
        }

        if (command === '' || command === '\n' || command.length === 0) {
            rl.prompt();
            return;
        }

        const args = parseCommand(command);
        const data = encodeRESP(args);

        client.write(data);
    });
}