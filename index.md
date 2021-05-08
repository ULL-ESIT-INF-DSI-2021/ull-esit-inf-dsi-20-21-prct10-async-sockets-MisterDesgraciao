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

El fichero Cliente es la parte que he asignado para crear/actualizar los comandos usando `yargs`. Como en el guión de la práctica nos indica que la aplicación debe funcionar ejecutando los comandos en el Cliente pero almacenando la información (las notas) en el Servidor, apenas he tocado la estructura de los mismos.

También comentar que, según estas directrices y mi planteamiento, el resultado de todo este código consiste en enviar los datos necesarios del comando al Servidor y esperar respuesta. Esto se traduce a que el código dentro del *handler* de cada comando es muy parecido al del resto de comandos; solo cambia un par de cosas.

Como ejemplo, solo pondré dos comandos, pues el resto siguen la misma dinámica y explicar todos me parece relleno.

Primero tenemos el comando `add`, el cual recibe como argumentos: el usuario, título, cuerpo y color de la **Nota** a añadir. Lo primero que hace es comprobar que todos estos datos son de tipo *string*, y que el `color` de la **Nota** sea uno de los almacenados en el type `Colores`.

Si todo esto se cumple, entonces se crea un objeto `ResquestType` con todos esos parámetros, se transformará a formato `JSON` para poder enviarlo, se conectará a través de un *Socket* al puerto 60300 para enviarlo al **Servidor**.

Como hemos creado un objeto `EventEmitter` llamado `cliente`, podemos hacer que espere una respuesta (en forma de datos) por ese mismo puerto. Esto lo realizamos llamando a la función `cliente.on('data', () => {})`, que se ejecutará cuando reciba la respuesta del **Servidor** e imprimirá si se realizó correctamente el comando o si falló.

```typescript
import * as net from 'net';
import * as yargs from 'yargs';
import {RequestType} from './tipos';

yargs.command({
  command: 'add',
  describe: 'Añadir una Nota nueva',
  builder: {
    usuario: {
      describe: 'Usuario',
      demandOption: true,
      type: 'string',
    },
    titulo: {
      describe: 'Título de la nota',
      demandOption: true,
      type: 'string',
    },
    cuerpo: {
      describe: 'Cuerpo de la nota',
      demandOption: true,
      type: 'string',
    },
    color: {
      describe: 'Color de la nota',
      demandOption: true,
      type: 'string',
    },
  },
  handler(argv) {
    if (typeof argv.usuario === 'string' &&
        typeof argv.titulo === 'string' &&
        typeof argv.cuerpo === 'string' &&
        typeof argv.color === 'string') {
      if (argv.color === 'Rojo' ||
          argv.color === 'Verde' ||
          argv.color === 'Azul' ||
          argv.color === 'Amarillo') {
        const datosNota: RequestType = {type: 'add', user: argv.usuario, title: argv.titulo, body: argv.cuerpo, color: argv.color};
        const client = net.connect({port: 60300});
        const notaJSON = JSON.stringify(datosNota);
        client.write(notaJSON);

        client.on('data', (datos) => {
          const mensaje = JSON.parse(datos.toString());
          if (mensaje.success) {
            console.log(('Nota añadida exitosamente.'));
          } else {
            console.log(('El título de la nota ya existe.'));
          }
          client.destroy();
        });
      } else {
        console.log(('Color no soportado.'));
      }
    } else {
      console.log(('Falta algún dato al comando.'));
    }
  },
});
```

El otro comando que quiero comentar para mostrar la poca diferencia entre los mismo es el comando `list`.

Este comando lista todos los títulos de todas las Notas del usuario que especifiquemos. Es por esto que el único parámetro requerido es el de `usuario`.

El código es prácticamente igual al del comando `add`: comprueba que el nombre de usuario es un *string*, crea el objeto `ResquestType` y lo envía al Servidor.

Espera a recibir la respuesta, y la diferencia llega cuando recibe la información del Servidor en la variable `mensaje`. Si el comando se ejecutó correctamente, entonces `mensaje` contiene todos los objetos de clase `Nota` pertenecientes al usuario especificado. Es de esta manera que, usando un bucle `forEach()`, imprimimos el `título` de todas esas Notas recogidas.

Al igual que el resto de comando, si algún punto de este código falla, se le informa al usuario por terminal del fallo concreto. Si el fallo ocurre en el otro lado de la conexión (el servidor), entonces solo se devuelve que no se consiguió el comando. 

Mi planteamiento es que el Cliente no tiene por qué enterarse del fallo concreto ocurrido en el Servidor.

```typescript
yargs.command({
  command: 'list',
  describe: 'Listar todos los títulos de todas las notas.',
  builder: {
    usuario: {
      describe: 'Nombre de usuario',
      demandOption: true,
      type: 'string',
    },
  },
  handler(argv) {
    if (typeof argv.usuario === 'string') {
      const datosNota: RequestType = {type: 'list', user: argv.usuario};
      const client = net.connect({port: 60300});
      const notaJSON = JSON.stringify(datosNota);
      client.write(notaJSON);

      client.on('data', (datos) => {
        const mensaje = JSON.parse(datos.toString());
        if (mensaje.success) {
          console.log('Los títulos de las Notas son:');
          mensaje.notes.forEach((notaIndividual) => {
            console.log(notaIndividual.titulo);
          });
        } else {
          console.log(('El usuario no tiene notas.'));
        }
        client.destroy();
      });
    } else {
      console.log('Error. El formato del nombre de usuario no es de tipo string.');
    }
  },
});
```

Por último, los *tests* realizados sobre este fichero han sido los siguientes: 

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

