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

    KEYS: () => {

    },

    TTL: (socket, args) => {
        const key = args[0];

        if (key in ttl) {
            const remainingTTL = ttl[key] - Date.now();
            socket.write(encodeRESP(parseInt(Math.floor(remainingTTL / 1000))));
        }
        else {
            socket.write(encodeRESP('(integer) -1'));
        }
    },

    TYPE: () => {

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
        socket.write(encodeRESP(value === undefined ? null : value));
    },

    APPEND: () => {

    },

    INCR: () => {

    },

    DECR: () => {

    },
}



module.exports = commandHandlers;