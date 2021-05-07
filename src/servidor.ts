/* eslint-disable require-jsdoc */
/* eslint-disable max-len */
import * as net from 'net';
import * as fs from 'fs';
import {Nota} from './nota';
import {ResponseType} from './tipos';

function checkUsersFolder() {
  fs.access(`./users`, fs.constants.F_OK, (err) => {
    if (err) {
      console.log('No existe la carpeta users.');
      console.log('Creando la carpeta users.');
      fs.mkdir(`./users`, () => {});
    }
  });
}

function checkPrivateFolder(objetoNota) {
  fs.access(`./users/${objetoNota.usuario}`, fs.constants.F_OK, (err) => {
    if (err) {
      console.log(`No existe la carpeta ${objetoNota.usuario}.`);
      console.log(`Creando la carpeta ${objetoNota.usuario}.`);
      fs.mkdir(`./users/${objetoNota.usuario}`, () => {});
    }
  });
}

const server = net.createServer((connection) => {
  console.log('A client has connected.');

  connection.on('data', (datos) => {
    console.log('Recibimos datos.');
    const datosCliente = JSON.parse(datos.toString());
    // console.log(`El server ha recibido: ${datosCliente}`);
    console.log(`${datos}`);
    const objetoNota = new Nota(datosCliente.user, datosCliente.title, datosCliente.body, datosCliente.color);
    let respuesta: ResponseType;
    switch (datosCliente.type) {
      case 'add':
        checkUsersFolder();
        checkPrivateFolder(objetoNota);
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
        break;
      case 'modify':
        checkUsersFolder();
        checkPrivateFolder(objetoNota);
        const timer = setTimeout(() => {
          respuesta = {type: 'modify', success: false};
          const respuestaJSON = JSON.stringify(respuesta);
          connection.write(respuestaJSON);
          connection.end();
        }, 5000);
        fs.readdir(`./users`, (err, carpetaUsuario) => {
          fs.readdir(`./users/${carpetaUsuario}`, (err, ficherosJSON) => {
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
          });
        });
        break;
      case 'delete':
        /**
         * const directorios = fs.readdirSync(`./users`);
      let carpetaUsuario;
      let datos;
      let objeto;
      let borrado: boolean = false;
      directorios.forEach((carpeta) => {
        carpetaUsuario = fs.readdirSync(`./users/${carpeta}`);
        carpetaUsuario.forEach((ficheroJSON) => {
          datos = fs.readFileSync(`./users/${carpeta}/${ficheroJSON}`);
          objeto = JSON.parse(datos.toString());
          if (objeto.titulo === argv.titulo) {
            fs.rmSync(`./users/${carpeta}/${ficheroJSON}`);
            console.log(chalk.green.inverse(
                `Eliminado el fichero ${ficheroJSON}`));
            borrado = true;
          }
        });
      });
      if (!borrado) {
        console.log(chalk.red.inverse(
            'ERROR. No existe el fichero que se desea borrar'));
      }
         */
        break;
      case 'list':
        console.log('Por implementar');
        /** */
        break;
      case 'read':
        console.log('Por implementar');
        /** */
        break;
      default:
        console.log('Opción no soportada.');
        break;
    }
  });

  connection.on('end', () => {
    // clearTimeout(timer);
  });

  connection.on('close', () => {
    console.log('A client has disconnected');
  });
});

server.listen(60300, () => {
  console.log('Waiting for clients to connect.');
});

