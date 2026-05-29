/**
 * VendaController — Facade frontend do caso de uso "Realizar Venda de Produtos".
 *
 * GOF Facade      — interface única para busca de paroquiano, produtos, itens,
 *                   crédito, pagamentos e finalização.
 * GOF Singleton   — uma única instância compartilhada durante a sessão.
 * Controller (GRASP) — coordena a view e os serviços sem conhecer HTML.
 * DIP (SOLID)     — depende de VendaService (abstração), não de fetch diretamente.
 */

window.AGAPE = window.AGAPE || {};
window.AGAPE.Controllers = window.AGAPE.Controllers || {};

window.AGAPE.Controllers.VendaController = (function () {

    var instancia = null;

    // ── Construtor ────────────────────────────────────────────────────────────

    function VendaController() {
        // DIP (SOLID) — Controller depende de abstração (Service), não de HTTP diretamente
        this._service        = window.AGAPE.Services.VendaService.getInstance();
        this._estado         = _estadoInicial();
        this._listaCache     = [];
        // id da venda em edição (null = venda nova). Quando definido, a finalização
        // envia estornarVendaId para o backend reverter a venda original atomicamente.
        this._editandoIdVenda = null;
    }

    // ── Estado inicial ────────────────────────────────────────────────────────

    /**
     * Information Expert (GRASP) — VendaController conhece a estrutura do estado
     * de uma venda em andamento; nenhuma outra classe precisa saber disso.
     */
    function _estadoInicial() {
        return {
            paroquiano:    null,   // { idUsuario, nome, cpf, saldoCredito }
            itens:         [],     // [{ idProd, nome, valorUni, qtd, totalItem }]
            totBruto:      0,
            credUtilizado: 0,
            totalFinal:    0,
            formasPag:     [],     // [{ idFormaPag, descricao, permiteParcelar }] — carregadas da API
            pagamentos:    [],     // [{ idFormaPag, descricao, valor, numeroParcelas }]
            totalPago:     0
        };
    }

    // ── Validação de Caixa ────────────────────────────────────────────────────

    /**
     * checkCaixaAberto — verifica se há caixa aberto antes de abrir o PDV.
     * Retorna { status, caixaAberto: bool }.
     */
    VendaController.prototype.checkCaixaAberto = async function () {
        var resultado = await this._service.checkCaixaAberto();
        return {
            status:       resultado.status,
            caixaAberto:  resultado.status === 'ok' && resultado.dados !== null,
            erro:         resultado.erro || null
        };
    };

    // ── Listagem ──────────────────────────────────────────────────────────────

    VendaController.prototype.listar = async function (filtros) {
        var resultado = await this._service.listar(filtros || {});
        if (resultado.status === 'ok' && Array.isArray(resultado.dados)) {
            this._listaCache = resultado.dados;
        }
        return resultado;
    };

    // ── Passo 2-3: Paroquiano ─────────────────────────────────────────────────

    /**
     * buscarParoquiano — Controller (GRASP): valida CPF e chama o serviço.
     * Retorna { status, dados } para a view reagir sem conhecer HTTP.
     */
    VendaController.prototype.buscarParoquiano = async function (cpf) {
        var digits = cpf.replace(/\D/g, '');
        if (digits.length !== 11) {
            return { status: 'error', erro: 'CPF deve ter 11 dígitos.' };
        }


        var resultado = await this._service.buscarParoquiano(digits);



        if (resultado.status === 'ok') {
            this._estado.paroquiano = resultado.dados;
        }
        return resultado;
    };

    // ── Passo 4-5: Produto ────────────────────────────────────────────────────

    VendaController.prototype.buscarProdutos = async function (nome) {
        if (!nome || nome.trim().length < 2) {
            return { status: 'error', erro: 'Informe ao menos 2 caracteres.' };
        }
        return await this._service.buscarProdutos(nome.trim());
    };

    // ── Passos 6-8: Item de Venda ─────────────────────────────────────────────

    /**
     * adicionarItem — Information Expert (GRASP): o Controller conhece os itens
     * e sabe calcular totalItem = valorUni × qtd.
     * RN07 — Não permite adicionar se qtd > estoque disponível.
     */
    VendaController.prototype.adicionarItem = function (produto, qtd) {
        qtd = parseInt(qtd, 10);
        if (isNaN(qtd) || qtd <= 0) {
            return { ok: false, erro: 'Quantidade inválida.' };
        }
        // RN07 — verificação de estoque (client-side; backend também valida)
        if (produto.qtdeAtual < qtd) {
            return {
                ok: false,
                erro: 'Estoque insuficiente para "' + produto.nome +
                      '". Disponível: ' + produto.qtdeAtual + '.'
            };
        }

        var e = this._estado;
        var existente = null;
        for (var i = 0; i < e.itens.length; i++) {
            if (e.itens[i].idProd === produto.idProd) { existente = e.itens[i]; break; }
        }

        if (existente) {
            var novaQtd = existente.qtd + qtd;
            if (produto.qtdeAtual < novaQtd) {
                return {
                    ok: false,
                    erro: 'Estoque insuficiente para "' + produto.nome +
                          '". Disponível: ' + produto.qtdeAtual + '.'
                };
            }
            existente.qtd       = novaQtd;
            // Information Expert — o próprio item calcula seu totalItem
            existente.totalItem = +(existente.valorUni * novaQtd).toFixed(2);
        } else {
            // Passo 8 — calcTotalItemVenda (Information Expert: produto × qtd)
            var totalItem = +(produto.valorUni * qtd).toFixed(2);
            e.itens.push({
                idProd:    produto.idProd,
                nome:      produto.nome,
                valorUni:  produto.valorUni,
                qtd:       qtd,
                totalItem: totalItem
            });
        }

        this._recalcularTotais();
        return { ok: true };
    };

    VendaController.prototype.removerItem = function (idProd) {
        this._estado.itens = this._estado.itens.filter(function (i) {
            return i.idProd !== idProd;
        });
        this._recalcularTotais();
    };

    // ── Passos 9-11: Crédito ──────────────────────────────────────────────────

    /**
     * aplicarCredito — RN05 (sem troco): crédito limitado ao saldo disponível
     * OU ao total da venda (o que for menor).
     * Information Expert (GRASP) — Controller conhece saldo e totBruto.
     */
    VendaController.prototype.aplicarCredito = function (valorCred) {
        valorCred = parseFloat(valorCred) || 0;
        var e = this._estado;

        if (valorCred < 0) {
            return { ok: false, erro: 'O crédito não pode ser negativo.' };
        }
        if (!e.paroquiano) {
            return { ok: false, erro: 'Nenhum paroquiano selecionado.' };
        }
        // RN05 — limite inferior entre saldo disponível e total bruto
        var limiteCredito = Math.min(
            parseFloat(e.paroquiano.saldoCredito) || 0,
            e.totBruto
        );
        if (valorCred > limiteCredito + 0.005) {
            return {
                ok: false,
                erro: 'Crédito máximo aplicável: R$ ' +
                      limiteCredito.toFixed(2).replace('.', ',') + '.'
            };
        }

        e.credUtilizado = +valorCred.toFixed(2);
        this._recalcularTotais();
        return { ok: true };
    };

    // ── Passo 15: Formas de Pagamento ─────────────────────────────────────────

    VendaController.prototype.listarFormasPag = async function () {
        var resultado = await this._service.listarFormasPag();
        if (resultado.status === 'ok' && Array.isArray(resultado.dados)) {
            this._estado.formasPag = resultado.dados.filter(function (f) {
                return f.ativo === 1 || f.ativo === true || f.ativo === '1';
            });
        }
        return resultado;
    };

    // ── Passos 12-13: Pagamentos ──────────────────────────────────────────────

    /**
     * adicionarPagamento — RN05 (sem troco): não permite valor > restante.
     * Registra numeroParcelas: 1 = à vista; >1 = parcelado (gera ContasReceber).
     *
     * Information Expert (GRASP) — Controller sabe calcular restante e totalPago.
     */
    VendaController.prototype.adicionarPagamento = function (idFormaPag, descricao, valor, numeroParcelas) {
        valor         = parseFloat(valor) || 0;
        numeroParcelas = parseInt(numeroParcelas, 10) || 1;
        if (numeroParcelas < 1) numeroParcelas = 1;

        var e        = this._estado;
        var restante = +(e.totalFinal - e.totalPago).toFixed(2);

        if (valor <= 0) {
            return { ok: false, erro: 'O valor deve ser maior que zero.' };
        }
        // RN05 — sem troco: não aceita valor acima do restante
        if (valor > restante + 0.005) {
            return {
                ok: false,
                erro: 'O valor (R$ ' + valor.toFixed(2) +
                      ') supera o restante a pagar (R$ ' + restante.toFixed(2) + ').'
            };
        }

        e.pagamentos.push({
            idFormaPag:     idFormaPag,
            descricao:      descricao,
            valor:          +valor.toFixed(2),
            numeroParcelas: numeroParcelas
        });
        e.totalPago = +(e.totalPago + valor).toFixed(2);
        return { ok: true, restante: +(e.totalFinal - e.totalPago).toFixed(2) };
    };

    VendaController.prototype.removerPagamento = function (indice) {
        var e = this._estado;
        if (indice < 0 || indice >= e.pagamentos.length) return;
        e.totalPago = +(e.totalPago - e.pagamentos[indice].valor).toFixed(2);
        if (e.totalPago < 0) e.totalPago = 0;
        e.pagamentos.splice(indice, 1);
    };

    // ── Passo 13: Finalizar ───────────────────────────────────────────────────

    /**
     * podeFinalizar — Pure Fabrication (GRASP): validação centralizada sem
     * conhecimento de UI; permite que qualquer botão consulte este estado.
     */
    VendaController.prototype.podeFinalizar = function () {
        var e = this._estado;
        return e.paroquiano !== null &&
               e.itens.length > 0 &&
               e.pagamentos.length > 0 &&
               Math.abs(e.totalFinal - e.totalPago) < 0.01;
    };

    /**
     * efetuarVenda — monta o payload e delega ao VendaService.
     * Inclui numeroParcelas por pagamento para o backend gerar ContasReceber.
     */
    VendaController.prototype.efetuarVenda = async function () {
        if (!this.podeFinalizar()) {
            return { status: 'error', erro: 'Venda incompleta. Verifique os dados antes de finalizar.' };
        }

        var e = this._estado;
        var dados = {
            idUsuario:        e.paroquiano.idUsuario,
            totBruto:         e.totBruto.toFixed(2),
            credUtilizado:    e.credUtilizado.toFixed(2),
            valorFinal:       e.totalFinal.toFixed(2),
            idsProdutos:      e.itens.map(function (i) { return i.idProd; }).join(','),
            quantidades:      e.itens.map(function (i) { return i.qtd; }).join(','),
            valoresUnitarios: e.itens.map(function (i) { return i.valorUni.toFixed(2); }).join(','),
            idFormasPag:      e.pagamentos.map(function (p) { return p.idFormaPag; }).join(','),
            valoresPag:       e.pagamentos.map(function (p) { return p.valor.toFixed(2); }).join(','),
            // RN02/RN03 — parcelas: 1=à vista, 2+=parcelado → gera ContasReceber no backend
            numeroParcelas:   e.pagamentos.map(function (p) { return p.numeroParcelas; }).join(',')
        };

        // Edição: informa ao backend qual venda estornar atomicamente antes de finalizar
        if (this._editandoIdVenda) {
            dados.estornarVendaId = this._editandoIdVenda;
        }

        return await this._service.efetuarVenda(dados);
    };

    // ── Exclusão e Edição (Estratégia de Estorno) ────────────────────────────

    /** Exclusão transacional — chama o backend que reverte estoque/caixa e apaga a venda. */
    VendaController.prototype.deletarVenda = async function (idVenda) {
        return await this._service.deletarVenda(idVenda);
    };

    /**
     * editarVenda — Estratégia de Estorno NÃO-DESTRUTIVA.
     *
     * Diferente de uma exclusão imediata, aqui APENAS carregamos os dados da
     * venda original (sem alterar o banco) e pré-populamos o PDV. O estorno real
     * (reverter estoque/caixa/crédito + apagar a venda original) só ocorre quando
     * o usuário confirmar a finalização — momento em que efetuarVenda() envia o
     * estornarVendaId. Assim, se o usuário desistir, a venda original permanece
     * intacta: nada é perdido.
     *
     * Retorna { ok, venda, paroquiano, itens, pagamentos } para a view preencher.
     */
    VendaController.prototype.editarVenda = async function (idVenda) {
        var resultado = await this._service.carregarEdicao(idVenda);
        if (resultado.status !== 'ok' || !resultado.dados) {
            return { ok: false, erro: resultado.erro || 'Erro ao carregar a venda.' };
        }

        var dados      = resultado.dados;
        var venda      = dados.venda;
        var paroquiano = dados.paroquiano;
        var itens      = Array.isArray(dados.itens) ? dados.itens : [];
        var pagamentos = Array.isArray(dados.pagamentos) ? dados.pagamentos : [];

        // Reseta o estado e pré-popula com os dados ORIGINAIS da venda
        this.resetar();
        var e = this._estado;

        e.paroquiano = paroquiano;

        itens.forEach(function (item) {
            e.itens.push({
                idProd:    item.idProd,
                nome:      item.nomeProduto || '—',
                valorUni:  item.valorUnitario,
                qtd:       item.quantidade,
                totalItem: item.valorTotal
            });
        });

        // Crédito utilizado na venda original (saldo do paroquiano já vem "restaurado")
        e.credUtilizado = +(venda.credUtilizado || 0).toFixed(2);

        // Recalcula totBruto/totalFinal a partir dos itens e do crédito
        this._recalcularTotais();

        // Pré-popula os pagamentos originais
        pagamentos.forEach(function (p) {
            e.pagamentos.push({
                idFormaPag:     p.idFormaPag,
                descricao:      p.descricao,
                valor:          +(p.valor || 0).toFixed(2),
                numeroParcelas: p.numeroParcelas || 1
            });
            e.totalPago = +(e.totalPago + (p.valor || 0)).toFixed(2);
        });

        // Marca que estamos editando — a finalização enviará estornarVendaId
        this._editandoIdVenda = idVenda;

        return { ok: true, venda: venda, paroquiano: paroquiano, itens: itens, pagamentos: pagamentos };
    };

    /** True se o PDV está em modo de edição (estorno pendente na finalização). */
    VendaController.prototype.estaEditando = function () {
        return this._editandoIdVenda !== null;
    };

    VendaController.prototype.getEditandoId = function () {
        return this._editandoIdVenda;
    };

    // ── Acesso ao estado ──────────────────────────────────────────────────────

    VendaController.prototype.getEstado   = function () { return this._estado; };
    VendaController.prototype.getRestante = function () {
        return Math.max(0, +(this._estado.totalFinal - this._estado.totalPago).toFixed(2));
    };
    VendaController.prototype.temItens    = function () {
        return this._estado.itens.length > 0;
    };

    VendaController.prototype.resetar = function () {
        var formasPag = this._estado.formasPag;
        this._estado = _estadoInicial();
        this._estado.formasPag = formasPag;
        this._editandoIdVenda = null;
    };

    // ── Utilitário interno ────────────────────────────────────────────────────

    /**
     * _recalcularTotais — Information Expert (GRASP): o Controller é o expert
     * em calcular totBruto e totalFinal a partir dos itens e crédito.
     */
    VendaController.prototype._recalcularTotais = function () {
        var e = this._estado;
        e.totBruto   = +e.itens.reduce(function (s, i) { return s + i.totalItem; }, 0).toFixed(2);
        e.totalFinal = +Math.max(0, e.totBruto - e.credUtilizado).toFixed(2);
    };

    // ── Singleton ─────────────────────────────────────────────────────────────

    return {
        getInstance: function () {
            if (!instancia) instancia = new VendaController();
            return instancia;
        }
    };

})();
