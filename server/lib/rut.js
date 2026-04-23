export function normalizeRut(input) {
  return String(input || '')
    .replace(/\./g, '')
    .replace(/-/g, '')
    .trim()
    .toUpperCase();
}

export function isValidRut(rawRut) {
  const rut = normalizeRut(rawRut);
  if (!/^\d{7,8}[\dK]$/.test(rut)) return false;

  const body = rut.slice(0, -1);
  const dv = rut.at(-1);

  let sum = 0;
  let multiplier = 2;

  for (let i = body.length - 1; i >= 0; i -= 1) {
    sum += Number(body[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const calc = 11 - (sum % 11);
  const expected = calc === 11 ? '0' : calc === 10 ? 'K' : String(calc);

  return dv === expected;
}
