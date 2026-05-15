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

    /* ---- Método auxiliar: traduz código HTTP em mensagem amigável -- */
    var _MENSAGENS_HTTP = {
        400: 'Os dados enviados são inválidos. Verifique as informações e tente novamente.',
        401: 'Acesso não autorizado. Faça login novamente para continuar.',
        403: 'Você não tem permissão para realizar esta ação.',
        404: 'O registro solicitado não foi encontrado.',
        405: 'Esta operação não é permitida no momento.',
        408: 'A requisição demorou muito. Verifique sua conexão e tente novamente.',
        409: 'Já existe um registro com essas informações. Verifique os dados e tente novamente.',
        422: 'Não foi possível processar as informações. Verifique os campos e tente novamente.',
        429: 'Muitas requisições em pouco tempo. Aguarde um momento e tente novamente.',
        500: 'Ocorreu um problema no servidor. Tente novamente em instantes.',
        502: 'O servidor está temporariamente indisponível. Tente novamente em breve.',
        503: 'O serviço está em manutenção. Tente novamente em breve.',
        504: 'O servidor demorou muito para responder. Tente novamente.'
    };

    HttpClient.prototype._mensagemAmigavel = function (codigo) {
        return _MENSAGENS_HTTP[codigo] ||
               'Não foi possível concluir a operação. Tente novamente.';
    };

    HttpClient.prototype._erroConexao = function () {
        return 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.';
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
                    erro: this._mensagemAmigavel(resposta.status)
                };
            }

            var dados = await this._parsearResposta(resposta);
            return { status: 'ok', dados: this._extrairDados(dados) };

        } catch (erro) {
            return { status: 'error', erro: this._erroConexao() };
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
                    erro: this._mensagemAmigavel(resposta.status)
                };
            }

            var dados = await this._parsearResposta(resposta);
            return { status: 'ok', dados: this._extrairDados(dados) };

        } catch (erro) {
            return { status: 'error', erro: this._erroConexao() };
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
                    erro: this._mensagemAmigavel(resposta.status)
                };
            }

            var dados = await this._parsearResposta(resposta);
            return { status: 'ok', dados: this._extrairDados(dados) };

        } catch (erro) {
            return { status: 'error', erro: this._erroConexao() };
        }
    };

    /* ---- POST com corpo JSON (usado no upload de logos) ------------- */
    HttpClient.prototype.postJson = async function (endpoint, corpo) {
        try {
            var resposta = await fetch(BASE_URL + endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json; charset=UTF-8' },
                body: JSON.stringify(corpo)
            });

            if (!resposta.ok) {
                return {
                    status: 'error',
                    erro: this._mensagemAmigavel(resposta.status)
                };
            }

            var dados = await this._parsearResposta(resposta);
            return { status: 'ok', dados: this._extrairDados(dados) };

        } catch (erro) {
            return { status: 'error', erro: this._erroConexao() };
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
                    erro: this._mensagemAmigavel(resposta.status)
                };
            }

            var dados = await this._parsearResposta(resposta);
            return { status: 'ok', dados: this._extrairDados(dados) };

        } catch (erro) {
            return { status: 'error', erro: this._erroConexao() };
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
