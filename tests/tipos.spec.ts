/* eslint-disable max-len */
import 'mocha';
import {expect} from 'chai';
import {ResponseType} from '../src/tipos';
import {RequestType} from '../src/tipos';
import {Nota} from '../src/nota';

describe('Comprobaciones ResponseType', () => {
  const notaRoja = new Nota('oscar', 'Nota roja', 'Esta nota es roja', 'Rojo');
  const respuesta: ResponseType = {type: 'delete', success: true, notes: [notaRoja]};
  it('El objeto inicializado existe.', () => {
    expect(respuesta).to.exist;
  });
  it('Comprobamos los datos del type', () => {
    expect(respuesta.type).to.eql('delete');
    expect(respuesta.success).to.eql(true);
    expect(respuesta.notes).to.eql([notaRoja]);
  });
});

describe('Comprobaciones RequestType', () => {
  const peticion: RequestType = {type: 'add', user: 'oscar', title: 'comidas favoritas', body: 'lentejas, curry y pizza', color: 'Azul'};
  it('El objeto inicializado existe.', () => {
    expect(peticion).to.exist;
  });
  it('Comprobamos los datos del type', () => {
    expect(peticion.type).to.eql('add');
    expect(peticion.user).to.eql('oscar');
    expect(peticion.title).to.eql('comidas favoritas');
    expect(peticion.body).to.eql('lentejas, curry y pizza');
    expect(peticion.color).to.eql('Azul');
  });
});
