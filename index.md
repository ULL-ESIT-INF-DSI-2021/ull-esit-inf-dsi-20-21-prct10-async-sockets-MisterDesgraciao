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

Este fichero **servidor.ts** es el lugar a donde he trasladado todo el código referente a operar con las Notas en formato JSON. He adaptado la idea y planteamiento de cada uno de los comandos, pues había que cambiar todas las funciones de `fs` a su versión asíncrona, la cual funciona diferente.

El propósito de este código es de ser una función principal donde llegan los diferentes datos de los clientes, y en función de qué comando quieren realizar, llamar a la función correspondiente.

Así pues, a pesar de que esta parte del código está al final del fichero, es la que primero voy a comentar para establecer un orden más lógico al informe.

Lo primero que ocurre al ejecutar este código fuente es que se crear un objeto servidor con `net.createServer()`. Este servidor es un objeto de clase `Socket`, y que debemos indicar con la función `server.listen()` en qué puerto escuchar para poder funcionar.

Si nos adentramos en la función en sí, la variable `connection` es la que apunta a este puerto. Para poder recoger los datos que envían los clientes, usamos `connection.on()` e indicamos `data` como valor a tener en cuenta. 

En esta parte es en la que reconvertimos los datos de formato JSON a un objeto `RequestType` y `Nota` (incompleto la mayoría de veces). De esta manera, podemos averiguar qué comando realizar y qué datos otorgar al comando.

Usamos un `switch` para esta tarea y llamamos al método que se corresponda al comando, pasando también la conexión con el cliente (`connection`) y los datos de la `Nota`.

```typescript
const server = net.createServer((connection) => {
  console.log('A client has connected.');
  connection.on('data', (datos) => {
    console.log('Recibimos datos.');
    const datosCliente = JSON.parse(datos.toString());
    console.log(`${datos}`);
    const objetoNota = new Nota(datosCliente.user, datosCliente.title, datosCliente.body, datosCliente.color);
    switch (datosCliente.type) {
      case 'add':
        addFile(objetoNota, connection);
        break;
      case 'modify':
        modifyFile(objetoNota, connection);
        break;
      case 'delete':
        deleteFile(objetoNota, connection);
        break;
      case 'list':
        listFiles(objetoNota, connection);
        break;
      case 'read':
        readFile(objetoNota, connection);
        break;
      default:
        console.log('Opción no soportada.');
        break;
    }
  });

  connection.on('close', () => {
    console.log('A client has disconnected');
  });
});

server.listen(60300, () => {
  console.log('Waiting for clients to connect.');
});
```

La primera función que nos encontramos en el fichero es `checkUsersFolder()`, la cual es una función modular que comprueba si existe la carpeta **./users** en el directorio donde nos encontramos, y en caso de que no, la crea.

Solo la uso para el comando `add`, de manera que tengo el código un poco más ordenado.

```typescript
function checkUsersFolder() {
  fs.access(`./users`, fs.constants.F_OK, (err) => {
    if (err) {
      console.log('No existe la carpeta users.');
      console.log('Creando la carpeta users.');
      fs.mkdir(`./users`, () => {});
    }
  });
}
```

Esta función llamada `checkPrivateFolder()` recibe un objeto de clase `Nota` para comprobar si dentro de la carpeta **./users** existe la carpeta asociada al nombre de usuario de esa nota. Si no existe la carpeta, la crea.

También se usa únicamente para el comando `add`.

```typescript
function checkPrivateFolder(objetoNota) {
  fs.access(`./users/${objetoNota.usuario}`, fs.constants.F_OK, (err) => {
    if (err) {
      console.log(`No existe la carpeta ${objetoNota.usuario}.`);
      console.log(`Creando la carpeta ${objetoNota.usuario}.`);
      fs.mkdir(`./users/${objetoNota.usuario}`, () => {});
    }
  });
}
```

Función para realizar el comando `add` sobre la carpeta de Notas. Debe recibir el objeto `Nota` para poder escribirlo y la conexión con el socket `connection` para poder cerrarla, ya sea porque falla en algún punto o porque se ha realizado exitosamente el comando.

Lo primero que hacemos es comprobar que la carpeta **./users** existe y también la carpeta de usuario dentro de ./users. Para ellos llamamos a las dos funciones anteriores.

Lo siguiente que hacemos es intentar acceder, dentro de la carpeta de usuario, a un fichero que tenga el mismo título que la `Nota`. De esta manera comprobamos si ya existe un fichero JSON con el mismo nombre. En caso de **no** exista la nota (falle el `fs.access()`), se crea el fichero JSON con los datos del objeto y se envía por el socket una `respuesta` de tipo `ResponseType` que indica que el comando ha sido realizado con éxito. En caso de que no falle, es decir, tiene éxito en leer el fichero, se envía una `respuesta` con `success: false`. 

```typescript
function addFile(objetoNota: Nota, connection) {
  checkUsersFolder();
  checkPrivateFolder(objetoNota);
  let respuesta: ResponseType;
  fs.access(`./users/${objetoNota.usuario}/${objetoNota.titulo}.json`, fs.constants.F_OK, (err) => {
    if (err) {
      // Transformamos los datos a formato JSON.
      const datos = JSON.stringify(objetoNota);
      fs.writeFile(`./users/${objetoNota.usuario}/${objetoNota.titulo}.json`, datos, 'utf8', (err) => {
        if (err) {
          console.log('Error inesperado al crear el fichero.');
        }
      });
      console.log('Añadimos la Nota.');
      respuesta = {type: 'add', success: true};
      const respuestaJSON = JSON.stringify(respuesta);
      connection.write(respuestaJSON);
    } else {
      console.log('ERROR. El título ya existe.');
      respuesta = {type: 'add', success: false};
      const respuestaJSON = JSON.stringify(respuesta);
      connection.write(respuestaJSON);
    }
  });
}
```

La función `modifyFile()` recibe los nuevos datos de la `Nota` a modificar, además de la conexión con el socket.

Lo primero que hace es crear un **temporizador** de 5 segundos. Si el resto del código tarda más de ese tiempo en enviar una `respuesta` al Cliente, entonces se comunicará al mismo que el comando ha fallado y cerrar la conexión. Mi lógica detrás de esto es que necesito una manera de enviar un respuesta fallida cuando el comando **no encuentre el fichero a modificar o falle en algún punto**. 

Su único incoveniente es que, para cantidades grandes de ficheros, puede tardar más de 5 segundos en encontrarlo, a pesar de que exista. Para solucionar eso, habría que ampliar el tiempo o cambiar el temporizador por otra alternativa más robusta.

Continuando con el resto del código, es muy simple, comprueba que existe **./users** (si no existe, no lo crea), comprueba que existe la carpeta personal del usuario (si no existe, no la crea), y por cada uno de los ficheros dentro de la carpeta privada, compara el título con el de la `Nota` a modificar. Si en algún punto falla, devuelve el mensaje negativo y cierra la línea.

Si lo encuentra, lo que hace es borrar el fichero para poder crear después uno con el mismo título pero con los datos (ya sea el cuerpo del mensaje o el color de la nota), actualizados. En tal caso, termina enviando un mensaje positivo al cliente.

```typescript
function modifyFile(objetoNota: Nota, connection) {
  let respuesta: ResponseType;
  const timer = setTimeout(() => {
    respuesta = {type: 'modify', success: false};
    const respuestaJSON = JSON.stringify(respuesta);
    connection.write(respuestaJSON);
    connection.end();
  }, 5000);
  fs.readdir(`./users`, (err, carpetaUsuario) => {
    if (err) {
      respuesta = {type: 'modify', success: false};
      const respuestaJSON = JSON.stringify(respuesta);
      connection.write(respuestaJSON);
      connection.end();
    } else {
      fs.readdir(`./users/${carpetaUsuario}`, (err, ficherosJSON) => {
        if (err) {
          respuesta = {type: 'modify', success: false};
          const respuestaJSON = JSON.stringify(respuesta);
          connection.write(respuestaJSON);
          connection.end();
        } else {
          ficherosJSON.forEach((elemento) => {
            if (elemento === `${objetoNota.getTitulo()}.json`) {
              fs.rm(`./users/${carpetaUsuario}/${elemento}`, (err) => {
                if (err) {
                  console.log('Error inesperado al borrar la carpeta.');
                } else {
                  const datos = JSON.stringify(objetoNota);
                  fs.writeFile(`./users/${objetoNota.usuario}/${objetoNota.titulo}.json`, datos, 'utf8', (err) => {
                    if (err) {
                      console.log('Error inesperado al crear el fichero.');
                    }
                    respuesta = {type: 'modify', success: true};
                    const respuestaJSON = JSON.stringify(respuesta);
                    clearTimeout(timer);
                    connection.write(respuestaJSON);
                  });
                }
              });
            }
          });
        }
      });
    }
  });
}
```

Para borrar un fichero tenemos la función `deleteFile()`. Recibe, como todas, un objeto `Nota` con la información necesaria y la conexión del socket.

También crear un termporizador por si no se encuentra el fichero a eliminar.

Su código es prácticamente igual a la función de `modify`: comprueba la existencia de la carpeta **./users** y la carpeta personal del usuario dentro de ella. Después pasa a leer todos los ficheros dentro de esa carpeta hasta encontrar el deseado. Una vez confirmado que es el que buscamos, lo borramos y devolvemos un mensaje a través del Socket confirmando que así ha sido.

Si en algún punto de la función falla algo o se tarda mucho, se envía un mensaje negativo al cliente y se cierra la conexión.

```typescript
function deleteFile(objetoNota: Nota, connection) {
  let respuesta: ResponseType;
  const timer = setTimeout(() => {
    respuesta = {type: 'delete', success: false};
    const respuestaJSON = JSON.stringify(respuesta);
    connection.write(respuestaJSON);
    connection.end();
  }, 3000);
  fs.readdir(`./users`, (err, carpetaUsuario) => {
    if (err) {
      respuesta = {type: 'delete', success: false};
      const respuestaJSON = JSON.stringify(respuesta);
      connection.write(respuestaJSON);
      connection.end();
    } else {
      fs.readdir(`./users/${carpetaUsuario}`, (err, ficherosJSON) => {
        if (err) {
          respuesta = {type: 'delete', success: false};
          const respuestaJSON = JSON.stringify(respuesta);
          connection.write(respuestaJSON);
          connection.end();
        } else {
          ficherosJSON.forEach((elemento) => {
            if (elemento === `${objetoNota.getTitulo()}.json`) {
              fs.rm(`./users/${carpetaUsuario}/${elemento}`, (err) => {
                if (err) {
                  console.log('Error inesperado al borrar la carpeta.');
                } else {
                  respuesta = {type: 'delete', success: true};
                  const respuestaJSON = JSON.stringify(respuesta);
                  clearTimeout(timer);
                  connection.write(respuestaJSON);
                }
              });
            }
          });
        }
      });
    }
  });
}
```

Para poder listar todas las Notas de un usuario tenemos la función `listFiles()`. 

El temporizador es por si el usuario no tiene `Notas` y el resto del código termina sin enviar nada.

Para comenzar hace lo esperado: comprobar la existencia de **./users** y la carpeta personal. Dentro de la segunda va comprobando los diferentes ficheros JSON, los cuales va leyendo y transformando a objetos de clase `Nota` para poder añadirlos a un array. Una vez ha leído todos, son enviamos al cliente a través del Socket junto a una positiva del mensaje.

Para poder realizar esta lectura y transferencia de Notas, necesito un poco de secuencialidad, es decir, que el Socket espere a que `fs.readFile()` termine, pues solo entonces el array contendrá las Notas. Para hacer esto, he vuelto a hacer uso de un **temporizador**. En este caso, he creado un temporizador de 2 segundos, tiempo suficiente para almacenar las Notas en el array, y después enviar el `ResponseType` con toda la información hacia el cliente.

```typescript
function listFiles(objetoNota: Nota, connection) {
  let respuesta: ResponseType;
  const timer = setTimeout(() => {
    respuesta = {type: 'list', success: false};
    const respuestaJSON = JSON.stringify(respuesta);
    connection.write(respuestaJSON);
    connection.end();
  }, 6000);
  fs.readdir(`./users`, (err, carpetaUsuario) => {
    if (err) {
      respuesta = {type: 'list', success: false};
      const respuestaJSON = JSON.stringify(respuesta);
      connection.write(respuestaJSON);
      connection.end();
    } else {
      carpetaUsuario.forEach((carpetaPersonal) => {
        if (carpetaPersonal === objetoNota.getUsuario()) {
          fs.readdir(`./users/${carpetaUsuario}`, (err, ficherosJSON) => {
            if (err) {
              respuesta = {type: 'list', success: false};
              const respuestaJSON = JSON.stringify(respuesta);
              connection.write(respuestaJSON);
              connection.end();
            } else {
              const filesArray: Nota[] = [];
              ficherosJSON.forEach((fichero) => {
                fs.readFile(`./users/${carpetaUsuario}/${fichero}`, (err, data) => {
                  if (err) {
                    console.log('Error inesperado al leer el fichero.');
                  } else {
                    const notaLeida: Nota = JSON.parse(data.toString());
                    filesArray.push(notaLeida);
                  }
                });
              });
              // Espera dos segundos a que termine readFile()
              setTimeout(() => {
                respuesta = {type: 'list', success: true, notes: filesArray};
                const respuestaJSON = JSON.stringify(respuesta);
                clearTimeout(timer);
                connection.write(respuestaJSON);
              }, 2000);
            }
          });
        }
      });
    }
  });
}
```

Por último, tenemos el comando `read` que invoca a esta función `readFile()`.

Para notificar al cliente que no se encontró la Nota a leer, usamos otro temporizador de 5 segundos, que devuelve una respuesta negativa en caso de que se tarde esa cantidad de tiempo.

Para poder leer la nota primero tiene que encontrarla. Comprueba que dentro de **./users** existe la carpeta personal del usuario y dentro de esta segunda, existe el fichero JSON a leer. Una vez lo encuentra, invoca el método `fs.readFile()` para obtener todos los datos de la nota. Transforma estos datos a un objeto `Nota`, lo añade a un array y este array se incluye también en el `ResponseType` que se envia en este momento por el socket.

De esta manera, el cliente recibe su objeto `Nota` completo.

```typescript
function readFile(objetoNota: Nota, connection) {
  let respuesta: ResponseType;
  const timer = setTimeout(() => {
    respuesta = {type: 'read', success: false};
    const respuestaJSON = JSON.stringify(respuesta);
    connection.write(respuestaJSON);
    connection.end();
  }, 5000);
  fs.readdir(`./users`, (err, carpetaUsuario) => {
    if (err) {
      respuesta = {type: 'read', success: false};
      const respuestaJSON = JSON.stringify(respuesta);
      connection.write(respuestaJSON);
      connection.end();
    } else {
      carpetaUsuario.forEach((carpetaPersonal) => {
        if (carpetaPersonal === objetoNota.getUsuario()) {
          fs.readdir(`./users/${carpetaUsuario}`, (err, ficherosJSON) => {
            if (err) {
              respuesta = {type: 'read', success: false};
              const respuestaJSON = JSON.stringify(respuesta);
              connection.write(respuestaJSON);
              connection.end();
            } else {
              const filesArray: Nota[] = [];
              ficherosJSON.forEach((fichero) => {
                if (fichero === `${objetoNota.getTitulo()}.json`) {
                  fs.readFile(`./users/${carpetaUsuario}/${fichero}`, (err, data) => {
                    if (err) {
                      console.log('Error inesperado al leer el fichero.');
                    } else {
                      const notaLeida: Nota = JSON.parse(data.toString());
                      filesArray.push(notaLeida);
                      respuesta = {type: 'read', success: true, notes: filesArray};
                      const respuestaJSON = JSON.stringify(respuesta);
                      clearTimeout(timer);
                      connection.write(respuestaJSON);
                    }
                  });
                }
              });
            }
          });
        }
      });
    }
  });
}
```

Por último, comentar que no he realizado ningún *test* sobre este fichero...

#### Dificultades

Las principales dificultades que me han aparecido a lo largo de este proyecto han sido:
- Crear el esquema de cliente - servidor. A pesar de que ha sido mucho más fácil y sencillo de lo que esperaba en un momento, sí que ha supuesto una nueva manera de plantear este ejercicio.
- Cambiar todas las funciones síncronas por sus versiones asíncronas. Ya que esta práctica está basada directamente en la número 8, lo que estaba reutilizando de allí eran todo métodos síncronos. Como en la práctica 9 ya hemos aprendido a operar con los métodos asíncronos, creí necesario el deshacerme de todo y volver a hacer lo mismo pero desde una implementación asíncrona. 
- El uso de Sockets. Al principio me costó un poco el hacer funcionar el socket. Sin embargo, probando con el ejemplo dado en clase/en los apuntes, entendí lo sencillo que era y conseguí hacerlo funcionar a mi conveniencia.
- **No he conseguido usar chalk**. Imagino se habrá notado, pero en la ejecución del cliente ningún código tiene ningún color. Esto se debe a que durante las ejecuciones, si había cualquier cosa del módulo **chalk** declarada, saltaba un error. 
- - No he logrado hacer que no falle. Creo que el error proviene de un fallo que cometí al intentar instalar el paquete **chalk**. Lo he intentado instalar varias veces usando diferentes sentencias y creo que de ahí proviene el error: reconoce *chalk* como herramienta pero no sus opciones de color o inverso. 
- - - En cualquier caso, mi decisión final ha sido no usar el paquete para poder tener no perder tiempo en él y poder realizar ejecuciones del programa.

#### Conclusión

Con esta práctica he aprendido a usar *sockets* de manera básica en Typescript. Al final, no ha resultado complicado porque su cometido es enviar la información de una máquina a otra, lo cual puede adquirir la complejidad que uno quiera para su programa.

También he podido revisar una práctica anterior y actualizarla a una versión más realista de la misma. Siempre es gratificante mirar al pasado y darte cuenta de que ahora trabajas un poquito mejor.

El cambiar los métodos síncronos por sus versiones asíncronas también es algo que he reforzado, después de la primera toma de contacto con la práctica 9.

Como conclusión, esta es una práctica para comprobar que uno ha aprendido a programar con una ejecución asíncrona del programa y no secuencial, además de primera toma de contacto con los sockets.
