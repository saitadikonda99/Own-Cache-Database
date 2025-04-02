# Own-Cache-Database

A simple, lightweight in-memory cache database inspired by Redis. This project supports basic key-value operations using a custom RESP (Redis Serialization Protocol) parser and a TCP server for client communication.

## Features

- Supports basic commands: `PING`, `SET`, `GET`, `DEL`
- RESP protocol-based communication
- Data persistence using JSON file storage
- TCP server for handling client connections
- Auto-save mechanism to periodically store data on disk
- Docker support for easy deployment

## Installation

1. Clone the repository:
   ```sh
   git clone https://github.com/saitadikonda99/Own-Cache-Database.git
   cd Own-Cache-Database
   ```

2. Install dependencies:
   ```sh
   npm install
   ```

## Usage

### Start the Server

Run the following command to start the cache database server:
```sh
node src/server.js
```
The server listens on `0.0.0.0:8000` by default.

### Environment Variables
You can configure the server host and port using environment variables:
```sh
export HOST=127.0.0.1
export PORT=6379
node src/server.js
```

### Commands Supported

| Command       | Description                         | Example                 |
|--------------|---------------------------------|-------------------------|
| `PING`       | Check if the server is alive    | `PING` → `PONG`        |
| `SET key val` | Store a key-value pair         | `SET name Alice` → `OK` |
| `GET key`     | Retrieve the value of a key    | `GET name` → `Alice`   |
| `DEL key`     | Delete a key from the store    | `DEL name` → `OK`      |

### Testing with `netcat`
You can use `netcat` to test commands:
```sh
echo -e "*2\r\n$4\r\nPING\r\n" | nc localhost 8000
```

## Running with Docker

1. Build the Docker image:
   ```sh
   docker build -t own-cache-db .
   ```

2. Run the container:
   ```sh
   docker run -p 8000:8000 own-cache-db
   ```

3. Alternatively, use `docker-compose`:
   ```sh
   docker compose up -d
   ```

4. Attach to the client:
   ```sh
   docker attach cache-client
   ```
   Once attached, you can start executing commands like `PING`, `SET`, `GET`, and `DEL` directly.

## Project Structure

```
Own-Cache-Database/
├── docker-compose.yml   # Docker Compose configuration (remove `version` field if present)
├── Dockerfile           # Dockerfile for containerization
├── LICENSE              # License information
├── package-lock.json    # Dependency lock file
├── package.json         # Project dependencies
├── README.md            # Project documentation
└── src
    ├── client
    │   └── client.js     # Client implementation
    ├── lib
    │   ├── display
    │   │   └── responseFormatter.js  # Response formatting logic
    │   ├── parser
    │   │   ├── commandParser.js      # Command parsing logic
    │   │   └── respParser.js         # RESP protocol parser
    │   └── storage                   # Future storage handling
    └── server.js           # TCP server implementation
```

## Contributing
Contributions are welcome! Feel free to fork the repository and submit a pull request.

## License
This project is licensed under the MIT License.

