import {
  describe,
  it,
  expect,
} from '@jest/globals';

describe('Configuración de Jest', () => {
  it('debería ejecutar una prueba correctamente', () => {
    const result = 2 + 2;

    expect(result).toBe(4);
  });
});