/* eslint-disable valid-jsdoc */
/* eslint-disable require-jsdoc */
export type Colores = 'Rojo' | 'Verde' | 'Azul' | 'Amarillo';

/**
 * Clase Nota. Sirve de molde para los objetos Nota.
 * En un principio pensaba que habría que usar clases, pero al final
 * apenas las he necesitado. Igualmente conservo el código por si puede
 * ser útil para más adelante.
 */
export class Nota {
  usuario: string;
  titulo: string;
  cuerpo: string;
  color: Colores;
  /**
   * Constructor de la clase.
   * @param user Nombre de usuario del dueño de la nota.
   * @param title Titulo de la nota.
   * @param body Cuerpo (contenido) de la nota.
   * @param color Color de la nota.
   */
  constructor(user: string, title: string, body: string, color: Colores) {
    this.usuario = user;
    this.titulo = title;
    this.cuerpo = body;
    this.color = color;
  }

  /**
   * Función que devuelve el nombre de usuario.
   * @returns Nombre de usuario.
   */
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

  /**
   * Función para cambiar el contenido de cuerpo
   * @param nuevoCuerpo Nuevo valor de cuerpo.
   */
  setCuerpo(nuevoCuerpo: string) {
    this.cuerpo = nuevoCuerpo;
  }

  /**
   * Función para cambiar el color de la Nota.
   * @param nuevoColor Nuevo color.
   */
  setColor(nuevoColor: Colores) {
    this.color = nuevoColor;
  }
}
