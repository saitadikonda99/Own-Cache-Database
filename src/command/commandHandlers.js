const { encodeRESP } = require("../lib/parser/respParser");
const { store, ttl } = require('../lib/storage/store');

const commandHandlers = {
    
    // Server Commands
    PING: (socket) => {
        socket.write(encodeRESP('PONG'));
    },

    // Key Commands
    DEL: (socket, args) => {
        const key = args[0];
        if (key in store) {
            delete store[key];
            if (key in ttl) {
                delete ttl[key];
            }
            socket.write(encodeRESP('(integer) 1'));
        } else {
            socket.write(encodeRESP('(integer) 0'));
        }
    },

    EXISTS: (socket, args) => {
        const key = args[0];
        socket.write(encodeRESP(key in store ? 1 : 0));
    },

    EXPIRE: (socket, args) => {
        const key = args[0];
        const ttlValue = parseInt(args[1]);
        if (key in store) {
            ttl[key] = Date.now() + ttlValue * 1000;
            socket.write(encodeRESP(1));
        } else {
            socket.write(encodeRESP(0));
        }
    },

    KEYS: (socket, args) => {
        const pattern = args[0];
        if (!pattern) {
            return socket.write(encodeRESP({ type: 'error', value: 'ERR wrong number of arguments for \'KEYS\' command' }));
        }
    
        let matchedKeys;
    
        if (pattern === '*') {
            matchedKeys = Object.keys(store);
        } else {
            // Basic pattern matching: treating * as wildcard
            const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
            matchedKeys = Object.keys(store).filter(key => regex.test(key));
        }
    
        if (matchedKeys.length === 0) {
            return socket.write(encodeRESP([]));
        }
    
        socket.write(encodeRESP(matchedKeys));
    },
    
    TTL: (socket, args) => {
        const key = args[0];
        
        if (!(key in store)) {
            socket.write(encodeRESP(-2)); // Key does not exist
            return;
        }
        
        if (key in ttl) {
            const remainingTTL = ttl[key] - Date.now();
            socket.write(encodeRESP(parseInt(Math.floor(remainingTTL / 1000))));
        }
        else {
            socket.write(encodeRESP(-1)); // Key exists but has no associated expiry
        }
    },

    TYPE: (socket, args) => {
        const key = args[0];

        if (key in store) {
            const type = typeof store[key];
            socket.write(encodeRESP(type));
        }
        else {
            socket.write(encodeRESP('none'));
        }
    },

    PERSIST: (socket, args) => {
        const key = args[0];
        if (key in store) {
            delete ttl[key];
            socket.write(encodeRESP(1));
        } else {
            socket.write(encodeRESP(0));
        }
    },

    // String Commands
    SET: (socket, args) => {
        const [key, value, option, expiry] = args;
    
        if (!key || !value) {
            return socket.write(encodeRESP({ type: 'error', value: 'ERR wrong number of arguments for \'SET\' command' }));
        }
    
        if (option) {
            if (option.toUpperCase() !== 'EX') {
                const curr = encodeRESP({ type: 'error', value: 'ERR syntax error: only EX option is supported' })
                console.log(curr);
                return socket.write(curr);
            }
    
            const seconds = parseInt(expiry);
            if (isNaN(seconds) || seconds <= 0) {
                return socket.write(encodeRESP({ type: 'error', value: 'ERR invalid expire time in SET' }));
            }
    
            ttl[key] = Date.now() + seconds * 1000;
        }
    
        store[key] = value;
        socket.write(encodeRESP({ type: 'simple', value: 'OK' }));
    },

    GET: (socket, args) => {
        const key = args[0];
        const value = store[key];
        socket.write(encodeRESP(value === undefined ? "(nil)" : value));
    },

    APPEND: (socket, args) => {
        const key = args[0];
        const value = args[1];

        if (!key || !value) {
            return socket.write(encodeRESP({ type: 'error', value: 'ERR wrong number of arguments for \'APPEND\' command' }));
        }

        const currentValue = store[key] || '';
        store[key] = currentValue + value;
        socket.write(encodeRESP(store[key].length));
    },

    INCR: (socket, args) => {
        const key = args[0];

        if (!key) {
            return socket.write(encodeRESP({ type: 'error', value: 'ERR wrong number of arguments for \'INCR\' command' }));
        }

        if (key in store) {
            const currentValue = parseInt(store[key]);
            if (isNaN(currentValue)) {
                return socket.write(encodeRESP({ type: 'error', value: 'ERR value is not an integer or out of range' }));
            }
            store[key] = currentValue + 1;
        }
        else {
            store[key] = 1;
        }

        socket.write(encodeRESP(store[key]));
    },

    DECR: (socket, args) => {
        const key = args[0];

        if (!key) {
            return socket.write(encodeRESP({ type: 'error', value: 'ERR wrong number of arguments for \'DECR\' command' }));
        }

        if (key in store) {
            const currentValue = parseInt(store[key]);
            if (isNaN(currentValue)) {
                return socket.write(encodeRESP({ type: 'error', value: 'ERR value is not an integer or out of range' }));
            }
            store[key] = currentValue - 1;
        }
        else {
            store[key] = 0;
        }
        socket.write(encodeRESP(store[key]));
    },
}



module.exports = commandHandlers;