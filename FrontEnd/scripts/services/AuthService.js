/**
 * AuthService — Serviço de autenticação.
 * Responsabilidade única: login e logout via API.
 */
class AuthService {
  #api     = ApiService.getInstance();
  #session = SessionManager.getInstance();

  async login(cpf, senha) {
    const rawCpf = Mask.rawCpf(cpf);

    if (!rawCpf || rawCpf.length !== 11) {
      throw new Error('CPF inválido.');
    }

    const data = await this.#api.post('/usuarios/login', { cpf: rawCpf, senha });

    // O Backend retorna { status: "OK", result: { id, nome, nivel, cpf, ... } }
    if (data.status === 'OK' && data.result) {
      this.#session.setUser(data.result);
      return data.result;
    }

    throw new Error(data.messages?.[0] || 'Credenciais inválidas.');
  }

  logout() {
    this.#session.logout();
  }
}
