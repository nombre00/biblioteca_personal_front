/**
 * Réplica en TypeScript de app/shared/prompt_builder.py::construir_prompt_desde_configuracion.
 * Se usa SOLO para previsualizar el segmento editable (líneas + regla de
 * párrafos/spoilers) en el formulario de presets. El prompt completo real
 * (con los segmentos 1/4/5 específicos de cada tarea y datos reales de
 * autor/libro) solo se ve en el futuro panel de prueba (/probar).
 *
 * IMPORTANTE: si prompt_builder.py cambia, esta función debe actualizarse
 * a mano para que el preview no mienta sobre el resultado real.
 */
export function construirPreviewSegmentoEditable(
  lineas: string[],
  limiteParrafos: number,
  evitarSpoilers: boolean | null = null
): string {
  const partes: string[] = [];

  if (lineas.length > 0) {
    partes.push(lineas.join(' '));
  }

  const plural = limiteParrafos === 1 ? '' : 's';
  partes.push(`Extensión máxima: ${limiteParrafos} párrafo${plural}.`);

  if (evitarSpoilers) {
    partes.push(
      'Si la obra es de ficción (novela, cuento, teatro), no reveles el ' +
        'desenlace ni el final, ni anticipes cómo se resuelve el conflicto ' +
        'central. Si es una obra de no ficción (ensayo, filosofía, ' +
        'historia), describe el tema y el enfoque general sin listar todas ' +
        'sus conclusiones o argumentos punto por punto.'
    );
  }

  return partes.join(' ');
}