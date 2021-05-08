# Desarrollo de Sistemas Informáticos.
## Universidad de La Laguna. Tercer año.
### Práctica 10: Cliente y servidor para una aplicación de procesamiento de notas de texto

Realizado por: **Óscar Ignacio Pozo Fernández**
Correo: **alu0101036526@ull.edu.es**
Enunciados completos en [este link.](https://ull-esit-inf-dsi-2021.github.io/prct08-filesystem-notes-app/)

## Solución implementada

Como indica el enunciado: este ejercicio es una especie de ampliación del realizado para la Práctica 8. Los dos realizan las mismas funciones de una aplicación de notas de texto. Sin embargo, las diferencias más destacables de esta versión frente a la de la Práctica 8 son: implementación de la aplicación usando un modelo de **Cliente-Servidor** a través de *Sockets* y cambiar las funciones síncronas por sus versiones asíncronas.

De esta manera, podemos conseguir que dos usuarios puedan ejecutar la aplicación a la vez, pues los **Clientes** crearán las peticiones y el **Servidor** se encargará de ir realizándolas una por una.

Con esto expuesto, comentar mi planteamiento inicial: reutilizar la mayor cantidad de código posible. Como la idea es que la aplicación es la misma, todo la estructura de los comandos hechos con `yargs` es igual, y solo hay que cambiar el contenido del *handler*.

El nuevo contenido del *handler* se ve orientado a recoger los datos de los argumentos del comando y enviarlos a través de un puerto al Servidor. También estará esperando la respuesta del **Servidor** e imprimirá un mensaje en función de esa respuesta.

Todo el contenido que estaba en el *handler* y se encargaba de realizar los comandos, ahora se encuentra en el **Servidor**, que analiza qué comando se quiere realizar y actúa en consecuencia. Una vez ha conseguido o ha fallado en realizar esta tarea, devuelve al **Cliente** un mensaje con esta información.

#### Clase Nota

Así pues, la primera clase a reutilizar es la clase **Nota**. El código se mantiene intacto, ya tiene todo lo necesario para funcionar como un buen contenedor de información.

En cualquier caso, la clase  almacena el `Usuario` creador de la nota, el `Titulo` de la misma, el `Cuerpo` (o contenido) de la misma y el `Color` de la nota de entre los permitidos.

Tiene un *getter* para cada uno de los elementos y un *setter* para las dos variables que pueden ser modificadas. 

```typescript
export type Colores = 'Rojo' | 'Verde' | 'Azul' | 'Amarillo';
export class Nota {
  usuario: string;
  titulo: string;
  cuerpo: string;
  color: Colores;
  constructor(user: string, title: string, body: string, color: Colores) {
    this.usuario = user;
    this.titulo = title;
    this.cuerpo = body;
    this.color = color;
  }
  getUsuario(): string {
    return this.usuario;
  }
  getTitulo(): string {
    return this.titulo;
  }
  getCuerpo(): string {
    return this.cuerpo;
  }
  getColor(): Colores {
    return this.color;
  }
  setCuerpo(nuevoCuerpo: string) {
    this.cuerpo = nuevoCuerpo;
  }
  setColor(nuevoColor: Colores) {
    this.color = nuevoColor;
  }
}
```

Para comprobar su correcto funcionamiento, también he importado sus *tests* de la Práctica 8:

```typescript
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

```

#### Fichero Tipos

Este fichero **tipos.ts** es donde se almacenan las declaraciones de las dos estructuras de datos que se intercambian entre Cliente y Servidor. Este código ha sido extraído del guión de la Práctica.

`RequestType` es la estructura que almacena los datos del **Cliente** y que envía hacia el **Servidor**. Es por esto que tiene más (posibles) datos, ya que pueden ser necesarios en el servidor para encontrar y/o modificar una Nota.

`ResponseType` es la estructura que almacena la respuesta del **Servidor** al intentar ejecutar el comando del **Cliente**. Es un mensaje muy básico en la mayoría de los casos, pues indica qué comando se intentó y si se ejecutó correctamente o no. Para algunos casos también envía las Notas para que el **Cliente** pueda leer su información.

```typescript
import {Colores} from './nota';
import {Nota} from './nota';

export type RequestType = {
  type: 'add' | 'modify' | 'delete' | 'read' | 'list';
  user: string;
  title?: string;
  body?: string;
  color?: Colores;
}

export type ResponseType = {
  type: 'add' | 'modify' | 'delete' | 'read' | 'list';
  success: boolean;
  notes?: Nota[];
}
```

También he realizado unos *tests* muy básicos para comprobar que funcionan correctamente:

```typescript
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
```

#### Fichero Cliente


```typescript

```

```typescript

```

```typescript

```

#### Fichero Servidor

```typescript

```

```typescript

```

```typescript

```

```typescript

```

#### Dificultades


#### Conclusión

