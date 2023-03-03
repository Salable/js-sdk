const errorPrefix = 'SalableJS:';

export function MissingPropertyError(name = ''): never {
  throw new Error(`${errorPrefix} Missing property: '${name}'`);
}
