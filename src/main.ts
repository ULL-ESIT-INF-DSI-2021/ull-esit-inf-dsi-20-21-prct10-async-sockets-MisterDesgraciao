import * as chalk from 'chalk';
import * as fs from 'fs';
import * as yargs from 'yargs';
import * as net from 'net';

const server = net.createServer((connection) => {
  // The connection object is emitted when a new connection is made
  // It is the socket object
  console.log(connection);
});

server.listen(60300);
