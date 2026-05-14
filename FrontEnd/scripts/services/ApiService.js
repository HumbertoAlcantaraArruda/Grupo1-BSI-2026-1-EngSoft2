/**
 * ApiService — Singleton (Information Expert + Singleton)
 *
 * Cliente HTTP centralizado. Toda comunicação com o Backend
 * passa por aqui para garantir tratamento uniforme de erros,
 * headers e base URL.
 *
 * NOTA: O Backend (porta 8080) deve permitir CORS para a
 * origem do Frontend (localhost:80 no WAMP).
 */
class ApiService {
  static #instance = null;
  #baseUrl         = 'http://localhost:8080';

  constructor() {
    if (ApiService.#instance) return ApiService.#instance;
    ApiService.#instance = this;
  }

  static getInstance() {
    if (!ApiService.#instance) new ApiService();
    return ApiService.#instance;
  }

  async #request(method, endpoint, body = null) {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json; charset=UTF-8' },
    };
    if (body !== null) options.body = JSON.stringify(body);

    let response;
    try {
      response = await fetch(`${this.#baseUrl}${endpoint}`, options);
    } catch (networkErr) {
      throw new Error('Sem conexão com o servidor. Verifique se o Backend está ativo.');
    }

    const data = await response.json().catch(() => ({ message: response.statusText }));

    if (!response.ok) {
      const err = new Error(data.messages?.[0] || data.message || 'Erro na requisição.');
      err.status = response.status;
      err.data   = data;
      throw err;
    }
    return data;
  }

  get(endpoint)          { return this.#request('GET',    endpoint); }
  post(endpoint, body)   { return this.#request('POST',   endpoint, body); }
  put(endpoint, body)    { return this.#request('PUT',    endpoint, body); }
  delete(endpoint)       { return this.#request('DELETE', endpoint); }

  // Envia body como application/x-www-form-urlencoded (necessário para o backend Java)
  postForm(endpoint, data) { return this.#requestForm('POST', endpoint, data); }
  putForm(endpoint, data)  { return this.#requestForm('PUT',  endpoint, data); }

  async #requestForm(method, endpoint, data) {
    const body = Object.entries(data)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v ?? '')}`)
      .join('&');
    const options = {
      method,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
      body,
    };
    let response;
    try {
      response = await fetch(`${this.#baseUrl}${endpoint}`, options);
    } catch {
      throw new Error('Sem conexão com o servidor. Verifique se o Backend está ativo.');
    }
    const responseData = await response.json().catch(() => ({ message: response.statusText }));
    if (!response.ok) {
      const err = new Error(responseData.messages?.[0] || responseData.message || 'Erro na requisição.');
      err.status = response.status;
      err.data   = responseData;
      throw err;
    }
    return responseData;
  }
}
