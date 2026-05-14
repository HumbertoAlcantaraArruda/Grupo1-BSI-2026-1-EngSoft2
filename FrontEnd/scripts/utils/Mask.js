/**
 * Mask — Utilitários de máscara e validação de inputs.
 * Uso: Mask.applyTo(inputElement, 'cpf')
 */
const Mask = {
  cpf(v) {
    return v.replace(/\D/g, '')
      .replace(/(\d{3})(\d)/,     '$1.$2')
      .replace(/(\d{3})(\d)/,     '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
      .slice(0, 14);
  },

  phone(v) {
    return v.replace(/\D/g, '')
      .replace(/(\d{2})(\d)/,   '($1) $2')
      .replace(/(\d{5})(\d{1,4})$/, '$1-$2')
      .slice(0, 15);
  },

  date(v) {
    return v.replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '$1/$2')
      .replace(/(\d{2})(\d)/, '$1/$2')
      .slice(0, 10);
  },

  currency(v) {
    const cents = parseInt(String(v).replace(/\D/g, '')) || 0;
    return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  },

  // Aplica máscara em tempo real a um <input>
  applyTo(el, type) {
    if (!el || !this[type]) return;
    el.addEventListener('input', function () {
      const start = this.selectionStart;
      this.value  = Mask[type](this.value);
      try { this.setSelectionRange(start, start); } catch { /* inputs numéricos */ }
    });
  },

  // Remove formatação
  rawCpf(v)   { return v.replace(/\D/g, ''); },
  rawPhone(v) { return v.replace(/\D/g, ''); },

  // Valida CPF (algoritmo oficial)
  validateCpf(cpf) {
    const v = Mask.rawCpf(cpf);
    if (v.length !== 11 || /^(\d)\1{10}$/.test(v)) return false;
    let sum = 0;
    for (let i = 0; i < 9; i++) sum += +v[i] * (10 - i);
    let r = (sum * 10) % 11;
    if (r === 10 || r === 11) r = 0;
    if (r !== +v[9]) return false;
    sum = 0;
    for (let i = 0; i < 10; i++) sum += +v[i] * (11 - i);
    r = (sum * 10) % 11;
    if (r === 10 || r === 11) r = 0;
    return r === +v[10];
  },
};
