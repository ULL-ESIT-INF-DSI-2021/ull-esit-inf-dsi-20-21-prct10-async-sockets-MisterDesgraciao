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
              // Espera unos segundos a que termine readFile()
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

  connection.on('end', () => {});

  connection.on('close', () => {
    console.log('A client has disconnected');
  });
});

server.listen(60300, () => {
  console.log('Waiting for clients to connect.');
});

