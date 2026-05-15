/* =====================================================================
   HttpClient — Wrapper sobre fetch
   Padrão: Singleton (GOF)
   Responsabilidade: padronizar todas as chamadas HTTP (SRP)
   Controllers dependem desta abstração, não de fetch diretamente (DIP)
   ===================================================================== */

window.AGAPE = window.AGAPE || {};
window.AGAPE.Utils = window.AGAPE.Utils || {};

window.AGAPE.Utils.HttpClient = (function () {

    /* URL base da API REST */
    var BASE_URL = 'http://localhost:8080';

    var instancia = null;

    /* ---- Construtor ------------------------------------------------- */
    function HttpClient() {}

    /* ---- Método auxiliar: tenta parsear JSON, senão retorna texto -- */
    HttpClient.prototype._parsearResposta = async function (resposta) {
        var texto = await resposta.text();
        try {
            return JSON.parse(texto);
        } catch (_) {
            return texto;
        }
    };

    /* ---- Método auxiliar: extrai result do envelope do backend ----- */
    /* O backend sempre responde { status, code, messages, result }     */
    /* Retorna result quando existe, senão retorna o objeto inteiro     */
    HttpClient.prototype._extrairDados = function (dados) {
        if (dados && typeof dados === 'object' && dados.result !== undefined) {
            return dados.result;
        }
        return dados;
    };

    /* ---- Método auxiliar: monta URL com query string --------------- */
    HttpClient.prototype._montarUrl = function (endpoint, params) {
        var url = new URL(BASE_URL + endpoint);
        if (params && typeof params === 'object') {
            Object.keys(params).forEach(function (chave) {
                var valor = params[chave];
                if (valor !== null && valor !== undefined && valor !== '') {
                    url.searchParams.append(chave, valor);
                }
            });
        }
        return url.toString();
    };

    /* ---- GET -------------------------------------------------------- */
    HttpClient.prototype.get = async function (endpoint, params) {
        try {
            var url = this._montarUrl(endpoint, params);
            var resposta = await fetch(url);

            if (!resposta.ok) {
                return {
                    status: 'error',
                    erro: 'Erro HTTP ' + resposta.status + ': ' + resposta.statusText
                };
            }

            var dados = await this._parsearResposta(resposta);
            return { status: 'ok', dados: this._extrairDados(dados) };

        } catch (erro) {
            return { status: 'error', erro: 'Falha na conexão: ' + erro.message };
        }
    };

    /* ---- POST ------------------------------------------------------- */
    HttpClient.prototype.post = async function (endpoint, corpo) {
        try {
            var params = new URLSearchParams();
            Object.keys(corpo).forEach(function (chave) {
                if (corpo[chave] !== null && corpo[chave] !== undefined) {
                    params.append(chave, corpo[chave]);
                }
            });

            var resposta = await fetch(BASE_URL + endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: params.toString()
            });

            if (!resposta.ok) {
                return {
                    status: 'error',
                    erro: 'Erro HTTP ' + resposta.status + ': ' + resposta.statusText
                };
            }

            var dados = await this._parsearResposta(resposta);
            return { status: 'ok', dados: this._extrairDados(dados) };

        } catch (erro) {
            return { status: 'error', erro: 'Falha na conexão: ' + erro.message };
        }
    };

    /* ---- PUT -------------------------------------------------------- */
    HttpClient.prototype.put = async function (endpoint, corpo) {
        try {
            var params = new URLSearchParams();
            Object.keys(corpo).forEach(function (chave) {
                if (corpo[chave] !== null && corpo[chave] !== undefined) {
                    params.append(chave, corpo[chave]);
                }
            });

            var resposta = await fetch(BASE_URL + endpoint, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: params.toString()
            });

            if (!resposta.ok) {
                return {
                    status: 'error',
                    erro: 'Erro HTTP ' + resposta.status + ': ' + resposta.statusText
                };
            }

            var dados = await this._parsearResposta(resposta);
            return { status: 'ok', dados: this._extrairDados(dados) };

        } catch (erro) {
            return { status: 'error', erro: 'Falha na conexão: ' + erro.message };
        }
    };

    /* ---- DELETE ----------------------------------------------------- */
    HttpClient.prototype.delete = async function (endpoint, params) {
        try {
            var url = this._montarUrl(endpoint, params);

            var resposta = await fetch(url, { method: 'DELETE' });

            if (!resposta.ok) {
                return {
                    status: 'error',
                    erro: 'Erro HTTP ' + resposta.status + ': ' + resposta.statusText
                };
            }

            var dados = await this._parsearResposta(resposta);
            return { status: 'ok', dados: this._extrairDados(dados) };

        } catch (erro) {
            return { status: 'error', erro: 'Falha na conexão: ' + erro.message };
        }
    };

    /* ---- Interface Singleton --------------------------------------- */
    return {
        getInstance: function () {
            if (!instancia) {
                instancia = new HttpClient();
            }
            return instancia;
        }
    };

})();
