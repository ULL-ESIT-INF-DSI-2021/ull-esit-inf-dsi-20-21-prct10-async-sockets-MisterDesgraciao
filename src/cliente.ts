/* eslint-disable max-len */
import * as net from 'net';
// import {Nota} from './nota';
// import * as chalk from 'chalk';
// import * as fs from 'fs';
import * as yargs from 'yargs';
import {RequestType} from './tipos';
// import {ResponseType} from './tipos';
// import {Colores} from './nota';

// console.log(.green('Comienza la ejecución!'));
/**
 * Comando 'add' que permite a un usuario añadir una nueva Nota.
 * Requiere obligatoriamente los parámetros de: 'usuario', 'titulo',
 * 'cuerpo' y 'color'.
 *
 * Primero comprueba que esos 4 argumentos son de tipo string.
 * Después comprueba que el color es uno de los
 * 4 soportados (rojo, azul, verde y amarillo).
 *
 * Si la carpeta 'users' no existe, la crea en el punto actual.
 * Si la carpeta del 'usuario' no existe dentro de 'users',
 * también la crea.
 *
 * A continuación, comprueba que ningún otro archivo tenga el mismo Titulo.
 * Si hay alguno que sí, comunica el error.
 * En caso contrario, crea el fichero JSON con los datos otorgados.
 */
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
          // console.log(`Recibimos: ${datos}`);
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

yargs.command({
  command: 'modify',
  describe: 'Modificar una nota existente.',
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
      demandOption: false,
      type: 'string',
    },
    color: {
      describe: 'Color de la nota',
      demandOption: true,
      type: 'string',
    },
  },
  handler(argv) {
    console.log('PRUEBA');
    if (typeof argv.titulo === 'string' &&
        typeof argv.usuario === 'string' &&
        typeof argv.cuerpo === 'string' &&
        typeof argv.color === 'string') {
      if (argv.color === 'Rojo' ||
          argv.color === 'Verde' ||
          argv.color === 'Azul' ||
          argv.color === 'Amarillo') {
        // enviamos datos por el socket
        const datosNota: RequestType = {type: 'modify', user: argv.usuario, title: argv.titulo, body: argv.cuerpo, color: argv.color};
        const client = net.connect({port: 60300});
        const notaJSON = JSON.stringify(datosNota);
        client.write(notaJSON);

        client.on('data', (datos) => {
          const mensaje = JSON.parse(datos.toString());
          // console.log(`Recibimos: ${datos}`);
          if (mensaje.success) {
            console.log(('Nota modificada exitosamente.'));
          } else {
            console.log(('La nota no existe/no se encontró.'));
          }
          client.destroy();
        });
      } else {
        console.log(('Error. El color de la nota no está soportado.'));
      }
    } else {
      console.log(('ERROR. Debe introducir un título, un nuevo cuerpo y/o un nuevo color'));
    }
  },
});

yargs.command({
  command: 'delete',
  describe: 'Eliminar una nota existente.',
  builder: {
    usuario: {
      describe: 'Nombre de usuario',
      demandOption: true,
      type: 'string',
    },
    titulo: {
      describe: 'Título de la nota',
      demandOption: true,
      type: 'string',
    },
  },
  handler(argv) {
    if (typeof argv.titulo === 'string' &&
        typeof argv.usuario === 'string') {
      // enviamos datos por el socket
      const datosNota: RequestType = {type: 'delete', user: argv.usuario, title: argv.titulo};
      const client = net.connect({port: 60300});
      const notaJSON = JSON.stringify(datosNota);
      client.write(notaJSON);

      client.on('data', (datos) => {
        const mensaje = JSON.parse(datos.toString());
        // console.log(`Recibimos: ${datos}`);
        if (mensaje.success) {
          console.log(('Nota eliminada exitosamente.'));
        } else {
          console.log(('La nota no existe/no se encontró.'));
        }
        client.destroy();
      });
    } else {
      console.log(('No es el formato esperado de Titulo'));
    }
  },
});

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
        // console.log(`Recibimos: ${datos}`);
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
      console.log('Error. El formato del nombre de usuario es de tipo string.');
    }
  },
}).parse();
