import {Colores} from './nota';
import {Nota} from './nota';

export type RequestType = {
  type: 'add' | 'update' | 'remove' | 'read' | 'list';
  user: string;
  title?: string;
  body?: string;
  color?: Colores;
}

export type ResponseType = {
  type: 'add' | 'update' | 'remove' | 'read' | 'list';
  success: boolean;
  notes?: Nota[];
}
