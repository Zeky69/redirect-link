// Short, easy-to-read ID generator (no ambiguous chars)
function genId(len = 7) {
  const alphabet = 'abcdefghjkmnpqrstuvwxyz23456789';
  let out = '';
  for (let i = 0; i < len; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

module.exports = { genId };
