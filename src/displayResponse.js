/*
    - This function is responsible for displaying the response from the server
*/

const displayResponse = (response) => {

    if (response === null) {
        console.log('(nil)');
        return;
    }

    if (typeof response === 'object' && response.type === 'error') {
        console.log(`(error) ${response.value}`);
        return;
    }

    if (typeof response === 'object' && response.type === 'simple') {
        console.log(response.value);
        return;
    }

    if (Array.isArray(response)) {
        response.forEach((item, index) => {
            console.log(`${index + 1}) ${item}`);
        });
        return;
    }

    console.log(response);
}

module.exports = displayResponse;