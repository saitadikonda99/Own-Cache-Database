/*
    - This function takes a command as a string and returns an array of strings.
*/

const parseCommand = (command) => {

    const result = []
    let current = ''
    let inQuote = false

    for (let k = 0; k < command.length; k++) {
        const char = command[k];

        if (char === '"' && (k == 0 || command[k - 1] != '\\')) {
            inQuote = !inQuote;
        }
        else if (char === ' ' && !inQuote) {
            result.push(current);
            current = '';
        }
        else {
            current += char;
        }
    }

    if (current) {
        result.push(current);
    }

    return result;
}

module.exports = parseCommand;