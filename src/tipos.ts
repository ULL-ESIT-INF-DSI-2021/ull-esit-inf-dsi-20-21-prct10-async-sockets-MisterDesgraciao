import {Colores} from './nota';
import {Nota} from './nota';

/**
 * Type que envía el Cliente al Servidor para indicar qué comando quiere
 * ejecutar y los datos necesarios para poder llevarlo a cabo.
 */
export type RequestType = {
  type: 'add' | 'modify' | 'delete' | 'read' | 'list';
  user: string;
  title?: string;
  body?: string;
  color?: Colores;
}

/**
 * Type de respuesta que envía el Servidor al Cliente para indicar qué comando
 * ha intentado realizar, si lo ha conseguido o no, y un array de objetos de
 * clase Nota para mostrar por la terminal del cliente.
 */
export type ResponseType = {
  type: 'add' | 'modify' | 'delete' | 'read' | 'list';
  success: boolean;
  notes?: Nota[];
}
