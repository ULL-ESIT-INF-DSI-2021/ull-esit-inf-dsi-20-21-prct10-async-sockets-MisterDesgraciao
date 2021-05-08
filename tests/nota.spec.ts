import 'mocha';
import {expect} from 'chai';
import {Nota} from '../src/nota';

describe('Comprobaciones de la clase Nota.', () =>{
  const nuevaNota = new Nota(
      'oscarpozo', 'buenos dias', 'hoy desayuno un bocadillo', 'Amarillo');
  it('El objeto inicializado existe', () => {
    expect(nuevaNota).to.exist;
  });
  it('Crear un nuevo objeto no es nulo.', () => {
    expect(new Nota(
        'oscarpozo', 'buenos dias', 'hoy desayuno un bocadillo',
        'Amarillo')).not.null;
  });
  it('Comprobar getters de la clase Nota', () => {
    expect(nuevaNota.getUsuario()).to.eql('oscarpozo');
    expect(nuevaNota.getTitulo()).to.eql('buenos dias');
    expect(nuevaNota.getCuerpo()).to.eql('hoy desayuno un bocadillo');
    expect(nuevaNota.getColor()).to.eql('Amarillo');
  });
  it('Comprobar que los setters funcionan bien', () => {
    nuevaNota.setColor('Verde');
    expect(nuevaNota.getColor()).to.eql('Verde');
    nuevaNota.setCuerpo('Hoy se desayuna fruta');
    expect(nuevaNota.getCuerpo()).to.eql('Hoy se desayuna fruta');
  });
});
