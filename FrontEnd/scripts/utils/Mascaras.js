/**
 * Mascaras — Singleton utilitário de formatação e validação de campos.
 *
 * Padrões aplicados:
 *   SOLID / SRP → única responsabilidade: formatar e validar máscaras de input.
 *   SOLID / OCP → novas máscaras são adicionadas via Mascaras.registrar()
 *                 sem alterar código existente (mapa de estratégias).
 *   GOF  / Singleton → instância única.
 *   GRASP / Information Expert → Mascaras conhece as regras de cada formato
 *                                e valida o que ela própria formata.
 *
 * Uso básico:
 *   const m = Mascaras.getInstance();
 *   m.aplicarA(document.getElementById('cpf'), 'cpf');
 *   m.validarCpf('123.456.789-09');  // → false
 *
 * Adicionando nova máscara (OCP — sem modificar este arquivo):
 *   Mascaras.registrar('placa', v => v.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,7));
 *   Mascaras.getInstance().formatar('placa', 'ABC1234');
 */
class Mascaras {
  /* ── Singleton ──────────────────────────────────────────────── */
  static #instancia = null;

  /* ── OCP: mapa de estratégias de formatação ─────────────────
     Adicione novos tipos aqui OU via Mascaras.registrar() externo.
     Não modifique as entradas existentes para adicionar novos.       */
  static #estrategias = {

    cpf: v =>
      v.replace(/\D/g, '')
       .replace(/(\d{3})(\d)/,       '$1.$2')
       .replace(/(\d{3})(\d)/,       '$1.$2')
       .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
       .slice(0, 14),

    cnpj: v =>
      v.replace(/\D/g, '')
       .replace(/(\d{2})(\d)/,       '$1.$2')
       .replace(/(\d{3})(\d)/,       '$1.$2')
       .replace(/(\d{3})(\d)/,       '$1/$2')
       .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
       .slice(0, 18),

    telefone: v =>
      v.replace(/\D/g, '')
       .replace(/(\d{2})(\d)/,       '($1) $2')
       .replace(/(\d{5})(\d{1,4})$/, '$1-$2')
       .slice(0, 15),

    cep: v =>
      v.replace(/\D/g, '')
       .replace(/(\d{5})(\d{1,3})$/, '$1-$2')
       .slice(0, 9),

    data: v =>
      v.replace(/\D/g, '')
       .replace(/(\d{2})(\d)/, '$1/$2')
       .replace(/(\d{2})(\d)/, '$1/$2')
       .slice(0, 10),

    moeda: v => {
      const centavos = parseInt(String(v).replace(/\D/g, '')) || 0;
      return (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    },
  };

  constructor() {
    if (Mascaras.#instancia) return Mascaras.#instancia;
    Mascaras.#instancia = this;
  }

  static getInstance() {
    if (!Mascaras.#instancia) new Mascaras();
    return Mascaras.#instancia;
  }

  /* ── OCP: extensão sem modificação ─────────────────────────── */

  /**
   * Registra ou substitui uma estratégia de formatação.
   * Chame no escopo global antes de usar a máscara:
   *   Mascaras.registrar('placa', v => ...);
   *
   * @param {string}   tipo - nome da máscara (ex: 'placa')
   * @param {Function} fn   - (valorBruto: string) => stringFormatada
   */
  static registrar(tipo, fn) {
    Mascaras.#estrategias[tipo] = fn;
  }

  /* ── API pública ──────────────────────────────────────────── */

  /**
   * Formata um valor pelo tipo de máscara registrado.
   * @param {string} tipo
   * @param {string} valor
   * @returns {string}
   */
  formatar(tipo, valor) {
    const fn = Mascaras.#estrategias[tipo];
    if (!fn) throw new Error(`Máscara não registrada: "${tipo}"`);
    return fn(String(valor ?? ''));
  }

  /**
   * Aplica máscara em tempo real a um elemento <input>.
   * Equivalente ao Mask.applyTo() para retrocompatibilidade de padrão.
   *
   * @param {HTMLInputElement} elemento
   * @param {string}           tipo
   */
  aplicarA(elemento, tipo) {
    if (!elemento || !Mascaras.#estrategias[tipo]) return;
    const self = this;
    elemento.addEventListener('input', function () {
      const pos = this.selectionStart;
      this.value = self.formatar(tipo, this.value);
      try { this.setSelectionRange(pos, pos); } catch { /* inputs numéricos não suportam */ }
    });
  }

  /* ── Atalhos para tipos frequentes ─────────────────────────── */
  cpf(v)      { return this.formatar('cpf',      v); }
  cnpj(v)     { return this.formatar('cnpj',     v); }
  telefone(v) { return this.formatar('telefone', v); }
  cep(v)      { return this.formatar('cep',      v); }
  data(v)     { return this.formatar('data',     v); }
  moeda(v)    { return this.formatar('moeda',    v); }

  /** Remove todos os caracteres não-numéricos. */
  somenteNumeros(v) { return String(v ?? '').replace(/\D/g, ''); }

  /* ── Information Expert: validações ────────────────────────── */

  /**
   * Valida CPF pelo algoritmo oficial da Receita Federal.
   * (Mascaras sabe validar CPF porque é ela quem o formata.)
   * @param {string} v - CPF formatado ou apenas dígitos
   * @returns {boolean}
   */
  validarCpf(v) {
    const cpf = this.somenteNumeros(v);
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
    let soma = 0;
    for (let i = 0; i < 9; i++) soma += +cpf[i] * (10 - i);
    let r = (soma * 10) % 11;
    if (r === 10 || r === 11) r = 0;
    if (r !== +cpf[9]) return false;
    soma = 0;
    for (let i = 0; i < 10; i++) soma += +cpf[i] * (11 - i);
    r = (soma * 10) % 11;
    if (r === 10 || r === 11) r = 0;
    return r === +cpf[10];
  }

  /**
   * Valida CNPJ pelo algoritmo oficial.
   * @param {string} v - CNPJ formatado ou apenas dígitos
   * @returns {boolean}
   */
  validarCnpj(v) {
    const cnpj = this.somenteNumeros(v);
    if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;

    const calcDigito = (tamanho) => {
      let soma = 0;
      let pos  = tamanho - 7;
      for (let i = tamanho; i >= 1; i--) {
        soma += +cnpj[tamanho - i] * pos--;
        if (pos < 2) pos = 9;
      }
      const r = soma % 11;
      return r < 2 ? 0 : 11 - r;
    };

    return calcDigito(12) === +cnpj[12] && calcDigito(13) === +cnpj[13];
  }

  /**
   * Verifica se a data no formato DD/MM/AAAA é uma data real e não está no futuro.
   * @param {string}  v
   * @param {boolean} [aceitaFuturo=true]
   * @returns {boolean}
   */
  validarData(v, aceitaFuturo = true) {
    const partes = String(v).split('/');
    if (partes.length !== 3) return false;
    const [dia, mes, ano] = partes.map(Number);
    const d = new Date(ano, mes - 1, dia);
    const valida = d.getFullYear() === ano && d.getMonth() === mes - 1 && d.getDate() === dia;
    if (!valida) return false;
    if (!aceitaFuturo && d > new Date()) return false;
    return true;
  }
}
