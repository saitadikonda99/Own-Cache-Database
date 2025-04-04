/*
    - detail about RESP: https://redis.io/docs/latest/develop/reference/protocol-spec
    - RESP is a protocol that is used to communicate with Redis server

    | RESP data type      | Minimal protocol version | Category   | First byte |
    |---------------------|--------------------------|------------|------------|
    | Simple strings      | RESP2                    | Simple     | +          |
    | Simple Errors       | RESP2                    | Simple     | -          |
    | Integers            | RESP2                    | Simple     | :          |
    | Bulk strings        | RESP2                    | Aggregate  | $          |
    | Arrays              | RESP2                    | Aggregate  | *          |
    | Nulls               | RESP3                    | Simple     | _          |
    | Booleans            | RESP3                    | Simple     | #          |
    | Doubles             | RESP3                    | Simple     | ,          |
    | Big numbers         | RESP3                    | Simple     | (          |
    | Bulk errors         | RESP3                    | Aggregate  | !          |
    | Verbatim strings    | RESP3                    | Aggregate  | =          |
    | Maps                | RESP3                    | Aggregate  | %          |
    | Attributes          | RESP3                    | Aggregate  | `          |
    | Sets                | RESP3                    | Aggregate  | ~          |
    | Pushes              | RESP3                    | Aggregate  | >          |
    
*/
const RESP_SIMPLE_STRING = '+';
const RESP_ERROR = '-';
const RESP_INTEGER = ':';
const RESP_BULK_STRING = '$';
const RESP_ARRAY = '*';


const encodeRESP = (data) => {

    if (data === null) {
        return '$-1\r\n';
    }

    if (typeof data === 'string') {
        return `$${data.length}\r\n${data}\r\n`;
    }

    if (typeof data === 'number') {
        return `:${data}\r\n`;
    }

    if (Array.isArray(data)) {

        if (data.length === 0) {
            return '*0\r\n';
        }

        let result = `*${data.length}\r\n`;

        for (let item of data) {
            result += encodeRESP(item);
        }
        return result;
    }

    if (typeof data === 'object' && data.type === 'simple' && typeof data.value === 'string') {
        return `+${data.value}\r\n`;
    }

    if (typeof data === 'object' && data.type === 'error' && typeof data.value === 'string') {
        return `-${data.value}\r\n`;
    }

    const str = String(data);
    return `$${Buffer.byteLength(str)}\r\n${str}\r\n`;
}

const parseRESP = (buffer, offset = 0) => {

    if (offset >= buffer.length) {
        return [null, offset];
    }

    const type = String.fromCharCode(buffer[offset]);
    offset++;

    switch (type) {
        case RESP_SIMPLE_STRING: {
            const endIndex = buffer.indexOf('\r\n', offset);

            if (endIndex === -1) {
                return [null, offset - 1];
            }
            const value = buffer.toString('utf8', offset, endIndex);
            return [value, endIndex + 2];
        }

        case RESP_ERROR: {
            const endIndex = buffer.indexOf('\r\n', offset);

            if (endIndex === -1) {
                return [null, offset - 1];
            }
            const value = buffer.toString('utf8', offset, endIndex);
            console.error('Error: --->', value);
            return [{ type: 'error', value }, endIndex + 2];
        }

        case RESP_INTEGER: {
            const endIndex = buffer.indexOf('\r\n', offset);

            if (endIndex === -1) {
                return [null, offset - 1];
            }
            const value = parseInt(buffer.toString('utf8', offset, endIndex));
            return [value, endIndex + 2];
        }

        case RESP_BULK_STRING: {
            const endIndex = buffer.indexOf('\r\n', offset);

            if (endIndex === -1) {
                return [null, offset - 1];
            }

            const length = parseInt(buffer.toString('utf8', offset, endIndex));
            const start = endIndex + 2;
            const end = start + length;

            if (end > buffer.length) {
                return [null, offset - 1];
            }

            const value = buffer.toString('utf8', start, end);
            return [value, end + 2];
        }

        case RESP_ARRAY: {
            const endIndex = buffer.indexOf('\r\n', offset);

            if (endIndex === -1) {
                return [null, offset - 1];
            }

            const length = parseInt(buffer.toString('utf8', offset, endIndex));
            offset = endIndex + 2;

            const result = [];
            for (let i = 0; i < length; i++) {
                const [value, newOffset] = parseRESP(buffer, offset);
                if (value === null) {
                    return [null, offset - 1];
                }
                result.push(value);
                offset = newOffset;
            }

            return [result, offset];
        }
    }
    return [null, offset];
}

module.exports = {
    encodeRESP,
    parseRESP
}