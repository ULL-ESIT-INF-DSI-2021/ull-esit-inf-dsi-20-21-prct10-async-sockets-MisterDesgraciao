import 'mocha';
import {expect} from 'chai';
import {EventEmitter} from 'events';
// import * as net from 'net';

describe('Comprobando funcionalidades del comando "add"', () => {
  it('Se envía el mensaje', () => {
    const socket = new EventEmitter();
    // const client = net.connect({port: 60300});
    expect('');

    socket.emit('data', '{"type": "add", "user": "oscar"}');
  });
  it('', () => {
    expect('');
  });
  it('', () => {
    expect('');
  });
});
