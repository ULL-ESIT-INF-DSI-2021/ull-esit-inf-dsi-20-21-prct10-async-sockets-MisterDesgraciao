/* eslint-disable max-len */
import * as net from 'net';
import * as yargs from 'yargs';
import {RequestType} from './tipos';

/**
 * Comando 'add' que permite a un usuario añadir una nueva Nota.
 * Requiere obligatoriamente los parámetros de: 'usuario', 'titulo',
 * 'cuerpo' y 'color'.
 *
 * Primero comprueba que esos 4 argumentos son de tipo string.
 * Después comprueba que el color es uno de los
 * 4 soportados (rojo, azul, verde y amarillo).
 *
 * Crea una petición de tipo `RequestType` que envía con los datos recibidos
 * por terminal al Servidor. Este formato permite al Servidor saber qué comando
 * desea ejecutar el cliente y lo datos que son necesarios para llevarlo a cabo.
 *
 * El cliente también va a esperar una respuesta en forma de un dato `ResponseType`,
 * que principalmente sirve para saber si el comando fue ejecutado correctamente,
 * además de indicar para qué comando y si hay algún objeto Nota que imprimir.
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

/**
 * Comando 'modify' que permite al usuario modificar una Nota.
 *
 * Como parámetro obligatorio debe recibir el título de la Nota,
 * para saber qué nota es, y además puede recibir el nuevo cuerpo y/o
 * color de la Nota.
 *
 * Crea una petición de tipo `RequestType` que envía con los datos recibidos
 * por terminal al Servidor. Este formato permite al Servidor saber qué comando
 * desea ejecutar el cliente y lo datos que son necesarios para llevarlo a cabo.
 *
 * El cliente también va a esperar una respuesta en forma de un dato `ResponseType`,
 * que principalmente sirve para saber si el comando fue ejecutado correctamente,
 * además de indicar para qué comando y si hay algún objeto Nota que imprimir.
 */
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

/**
 * Comando 'delete' que permite al usuario eliminar una Nota.
 *
 * Como parámetro obligatorio solo recibe el usuario y título,
 * para saber que nota exacta eliminar (puede haber notas de diferentes
 * usuarios con el mismo título).
 *
 * Crea una petición de tipo `RequestType` que envía con los datos recibidos
 * por terminal al Servidor. Este formato permite al Servidor saber qué comando
 * desea ejecutar el cliente y lo datos que son necesarios para llevarlo a cabo.
 *
 * El cliente también va a esperar una respuesta en forma de un dato `ResponseType`,
 * que principalmente sirve para saber si el comando fue ejecutado correctamente,
 * además de indicar para qué comando y si hay algún objeto Nota que imprimir.
 */
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

/**
 * Comando 'list' que muestra todos los Títulos de todas las Notas del Cliente.
 *
 * Como única parámetro debe recibir el nombre de usuario, para saber las notas
 * de quién leer.
 *
 * Crea una petición de tipo `RequestType` que envía con los datos recibidos
 * por terminal al Servidor. Este formato permite al Servidor saber qué comando
 * desea ejecutar el cliente y lo datos que son necesarios para llevarlo a cabo.
 *
 * El cliente también va a esperar una respuesta en forma de un dato `ResponseType`,
 * que principalmente sirve para saber si el comando fue ejecutado correctamente,
 * además de indicar para qué comando y si hay algún objeto Nota que imprimir.
 */
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

/**
 * Comando 'read' que permite leer el contenido de una Nota con el color
 * especificado.
 *
 * Como únicos parámetro debe recibir el usuario y título de la nota, para localizarla.
 *
 * Crea una petición de tipo `RequestType` que envía con los datos recibidos
 * por terminal al Servidor. Este formato permite al Servidor saber qué comando
 * desea ejecutar el cliente y lo datos que son necesarios para llevarlo a cabo.
 *
 * El cliente también va a esperar una respuesta en forma de un dato `ResponseType`,
 * que principalmente sirve para saber si el comando fue ejecutado correctamente,
 * además de indicar para qué comando y si hay algún objeto Nota que imprimir.
 */
yargs.command({
  command: 'read',
  describe: 'Leer una nota en concreto.',
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
    if (typeof argv.usuario === 'string' && typeof argv.titulo === 'string') {
      const datosNota: RequestType = {type: 'read', user: argv.usuario, title: argv.titulo};
      const client = net.connect({port: 60300});
      const notaJSON = JSON.stringify(datosNota);
      client.write(notaJSON);

      client.on('data', (datos) => {
        const mensaje = JSON.parse(datos.toString());
        if (mensaje.success) {
          mensaje.notes.forEach((notaIndividual) => {
            console.log(notaIndividual.titulo);
            console.log(notaIndividual.cuerpo);
          });
        } else {
          console.log(('No se ha encontrado la nota a leer.'));
        }
        client.destroy();
      });
    } else {
      console.log('Error. El formato del nombre de usuario/titulo no es de tipo string.');
    }
  },
}).parse();
