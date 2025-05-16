const client = require('prom-client');
const express = require('express');
const net = require('net');
const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config();
const { encodeRESP, parseRESP } = require('./lib/parser/respParser');
const commandHandlers = require('./command/commandHandlers');
const { store, ttl } = require('./lib/storage/store');

const DEFAULT_HOST = '0.0.0.0';
const DEFAULT_PORT = 6379;

const host = process.env.HOST || DEFAULT_HOST;
const port = process.env.PORT || DEFAULT_PORT;

const DB_FILE = 'db.json';

// --- Prometheus Setup ---
const metricsApp = express();
const register = new client.Registry();
client.collectDefaultMetrics({ register });

// Define custom metrics:
const activeConnections = new client.Gauge({
  name: 'tcp_active_connections',
  help: 'Number of active TCP connections',
});
const commandsProcessed = new client.Counter({
  name: 'tcp_commands_processed_total',
  help: 'Total number of TCP commands processed',
});

register.registerMetric(activeConnections);
register.registerMetric(commandsProcessed);

// Expose /metrics endpoint
metricsApp.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

metricsApp.listen(9000, () => {
  console.log('Prometheus metrics exposed on port 9000');
});

// --- Disk persistence ---
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
}

// Enable auto-save every 5 minutes (300000 ms)
setInterval(saveToDisk, 300000);

// --- TCP Server ---
const server = net.createServer((socket) => {
  console.log('Hey, someone connected!');
  
  activeConnections.inc(); // Increase active connections metric
  
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
    activeConnections.dec(); // Decrease active connections metric
  });

  socket.on('error', (error) => {
    console.error('Error: ', error);
    activeConnections.dec(); // Also decrease on error to avoid metric leak
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
    commandsProcessed.inc(); // Increase processed commands counter
    handler(socket, args);
  } else {
    socket.write(encodeRESP({ type: 'error', value: 'Unknown command' }));
  }
}

loadFromDisk();

server.listen(port, host, () => {
  console.log(`Server listening on ${host}:${port}`);
});
