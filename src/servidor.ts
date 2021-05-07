/* eslint-disable valid-jsdoc */
/* eslint-disable require-jsdoc */
/* eslint-disable max-len */
import * as net from 'net';
import * as fs from 'fs';
import {Nota} from './nota';
import {ResponseType} from './tipos';

/**
 * Función checkUsersFolder() que comprueba si existe la carpeta './users'
 * en el directorio raíz.
 * En caso de que no exista, la crea, pues es una carpeta clave.
 */
function checkUsersFolder() {
  fs.access(`./users`, fs.constants.F_OK, (err) => {
    if (err) {
      console.log('No existe la carpeta users.');
      console.log('Creando la carpeta users.');
      fs.mkdir(`./users`, () => {});
    }
  });
}

/**
 * Función checkPrivateFolder() que comprueba si existe la carpeta asociada
 * al nombre de usuario del cliente. En caso de que no, la crea, pues este método
 * solo se invoca (de momento), cuando se pretende crear un fichero. Mi decisión ante
 * la posibilidad de que se quiera crear un fichero, pero no existe la carpeta, es
 * crear también la carpeta para llevar a cabo la acción.
 *
 * @param objetoNota Objeto de clase Nota para obtener el título del fichero.
 */
function checkPrivateFolder(objetoNota) {
  fs.access(`./users/${objetoNota.usuario}`, fs.constants.F_OK, (err) => {
    if (err) {
      console.log(`No existe la carpeta ${objetoNota.usuario}.`);
      console.log(`Creando la carpeta ${objetoNota.usuario}.`);
      fs.mkdir(`./users/${objetoNota.usuario}`, () => {});
    }
  });
}

/**
 * Función addFile(), que recibe un objeto de clase Nota y de clase EventEmitter
 * para poder comprobar los datos del objeto Nota, y en consecuencia, que la variable
 * 'connection' devuelva a través del socket una información acorde.
 *
 * Primero comprueba si existen las carpetas './users' y la carpeta personal del cliente.
 * Después comprueba si la nota ya existe (hay alguna Nota con el mismo título).
 * Si no la hay, crea con `fs.writeFile()` el fichero.
 * Devuelve si lo consiguió o no con `connection.write()`.
 *
 * @param objetoNota Objeto de clase Nota
 * @param connection Objeto de clase EventEmitter
 */
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

/**
 * Función modifyFile() que modifica el cuerpo y/o el color de la Nota que se le indique.
 *
 * Primero crea un **timer**, pues la manera para devolver una respuesta negativa antes el
 * intento del cliente de modificar algo. Si pasan 5 segundos sin que el resto del código
 * envíe una respuesta al usuario, se ejecuta este código.
 *
 * Mientras tanto, se va buscando la Nota a modificar a través de `fs.readdir()` sobre las carpetas.
 * Una vez se encuentra el fichero con extensión JSON, lo que hace es borrarlo y después crear uno nuevo
 * con los que serían los valores modificados.
 *
 * Después de eso, devuelve que realizó el comando correctamente enviando el tipo `ResponseType`
 * a través `connection.write()`.
 *
 * @param objetoNota Objeto de clase Nota
 * @param connection Objeto de clase EventEmitter
 */
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

/**
 * Función deleteFile() que recibe el objeto Nota a borrar y lo elimina.
 *
 * Su funcionamiento es prácticamente idéntico a `modifyFile()`, primero crea un temporizador por
 * si no se llega a realizar ninguna coincidencia. Después busca el fichero JSON
 * en todas las carpetas de usuarios. Cuando lo encuentra, lo elimina y devuelve al cliente
 * un mensaje que lo confirma.
 *
 * @param objetoNota Objeto de clase Nota
 * @param connection Objeto de clase EventEmitter
 */
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

/**
 * Función listFiles() que recibe un objeto Nota para saber de qué usuario imprimir
 * las notas y la conexión para comunicarse con ese cliente.
 *
 * Primero se crea el temporizador, por si el usuario no tiene carpeta y/o notas.
 *
 * Lo que se hace es leer todas las carpetas dentro de './users' y buscar
 * la que corresponda al usuario. Una vez la encuentra, lee de ella todos los títulos
 * de todos los ficheros, además de su contenido, que transforma a clase Nota y las guarda en un array.
 *
 * Para evitar los problemas que conlleva el realizar estos métodos asíncronos de `fs`, lo que he
 * implementado es otro temporizador, que en este caso, espera 2 segundos a que el `forEach()` añada
 * al array todas las Notas. Es probable que si el usuario tiene muchas notas, 2 segundos no sean suficientes
 * como para añadirlas todas. Para ese caso habría que ampliar el margen de tiempo o cambiar la manera en que
 * se "espere" por el `forEach()`.
 *
 * @param objetoNota Objeto de clase Nota
 * @param connection Objeto de clase EventEmitter
 */
function listFiles(objetoNota: Nota, connection) {
  let respuesta: ResponseType;
  const timer = setTimeout(() => {
    respuesta = {type: 'list', success: false};
    const respuestaJSON = JSON.stringify(respuesta);
    connection.write(respuestaJSON);
    connection.end();
  }, 5000);
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

/**
 * Función readFile() que recibe el objeto Nota (incompleto) a leer y la conexión
 * con el cliente.
 *
 * Lo primero que hace es iniciar el temporizador, por si no logra encontrar la nota.
 *
 * Después busca en './users' la carpeta del usuario, y dentro de esta carpeta busca el
 * fichero JSON a leer. Una vez lo encuentra, llama a `fs.readFile()` y envía el objeto Nota
 * generado en el mensaje `ResponseType` a través de `connection.write()` con destino al cliente.
 *
 * @param objetoNota Objeto de clase Nota
 * @param connection Objeto de clase EventEmitter
 */
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

/**
 * Función principal, donde se crea la variable `server` y se establece la `connection`.
 *
 * Cuando recibe a través del Socket (connection) un dato, traduce esos datos a un objeto de
 * clase Nota incompleto (la mayoría de las veces). De esta conexión también recibe un `RequestType`, el cual
 * indica el `type`, que es el comando a ejecutar por el servidor.
 *
 * A través de un switch, llamamos a la función que realice el comando solicitado.
 */
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

/**
 * Código que indica a nuestro `server` en qué puerto escuchar.
 */
server.listen(60300, () => {
  console.log('Waiting for clients to connect.');
});

