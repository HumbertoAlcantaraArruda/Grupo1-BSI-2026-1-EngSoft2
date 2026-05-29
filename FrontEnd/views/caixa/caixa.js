/* caixa.js — View: vincula eventos ao DOM (jQuery 4.0.0) e delega ao CaixaController */

(function () {

    var auth = window.AGAPE.Utils.Auth.getInstance();
    if (!auth.requireLogin()) return;

    var usuarioLogado = auth.getUsuario();
    if (!usuarioLogado ||
        (usuarioLogado.nivel !== 'ADM' && usuarioLogado.nivel !== 'COLAB')) {
        window.location.replace('./index.html');
        return;
    }

    var ctrl      = window.AGAPE.Controllers.CaixaController.getInstance();
    var validador = window.AGAPE.Utils.Validador.getInstance();
    var mascaras  = window.AGAPE.Utils.Mascaras.getInstance();

    $(function () {

        // ── Elementos ───────────────────────────────────────────────────────────

        var $estadoCarregando = $('#estado-carregando');
        var $estadoFechado    = $('#estado-fechado');
        var $estadoAberto     = $('#estado-aberto');

        var $infoAbertura     = $('#info-abertura');
        var $infoValorInicial = $('#info-valor-inicial');
        var $infoSaldoAtual   = $('#info-saldo-atual');

        var $btnAbrirCaixa    = $('#btn-abrir-caixa');
        var $btnSuprimento    = $('#btn-suprimento');
        var $btnSangria       = $('#btn-sangria');
        var $btnFecharCaixa   = $('#btn-fechar-caixa');

        // Modais
        var $modalAbrirEl  = $('#modal-abrir');
        var $modalMovEl    = $('#modal-movimentacao');
        var $modalFecharEl = $('#modal-fechar');
        var $modalResumoEl = $('#modal-resumo');

        var modalAbrirObj  = new bootstrap.Modal($modalAbrirEl[0]);
        var modalMovObj    = new bootstrap.Modal($modalMovEl[0]);
        var modalFecharObj = new bootstrap.Modal($modalFecharEl[0]);
        var modalResumoObj = new bootstrap.Modal($modalResumoEl[0]);

        // Formulário Abrir
        var $formAbrir         = $('#form-abrir');
        var $inputValorInicial = $('#valor-inicial');
        var $btnConfirmarAbrir = $('#btn-confirmar-abrir');

        // Formulário Movimentação
        var $formMov         = $('#form-movimentacao');
        var $inputMovTipo    = $('#mov-tipo');
        var $inputMovBadge   = $('#mov-badge');
        var $inputMovValor   = $('#mov-valor');
        var $inputMovMotivo  = $('#mov-motivo');
        var $btnConfirmarMov = $('#btn-confirmar-movimentacao');

        // Confirmar fechar
        var $btnConfirmarFechar = $('#btn-confirmar-fechar');

        // Resumo fechamento
        var $resumoConteudo = $('#resumo-conteudo');

        // ── Inicialização ───────────────────────────────────────────────────────

        async function inicializar() {
            $(document.body).css('display', '');
            try {
                window.AGAPE.Utils.Sidebar.inicializar();
                mascaras.aplicar('#valor-inicial', 'monetario');
                mascaras.aplicar('#mov-valor',     'monetario');
                await _atualizarPainel();
            } catch (e) {
                console.error('[Caixa] Erro na inicialização:', e);
                _mostrarEstado('fechado');
            }
        }

        // ── Painel de estado ──────────────────────────────────────────────────────

        async function _atualizarPainel() {
            _mostrarEstado('carregando');
            var resultado = await ctrl.consultarAberto();
            if (resultado.status === 'ok' && resultado.dados) {
                _preencherInfoCaixa(resultado.dados);
                _mostrarEstado('aberto');
            } else {
                _mostrarEstado('fechado');
            }
        }

        function _mostrarEstado(estado) {
            $estadoCarregando.toggle(estado === 'carregando');
            $estadoFechado.toggle(estado === 'fechado');
            $estadoAberto.toggle(estado === 'aberto');
        }

        function _preencherInfoCaixa(caixa) {
            $infoAbertura.text(_formatarDataHora(caixa.dataHoraAbertura));
            $infoValorInicial.text('R$ ' + _moeda(caixa.valorInicial));
            $infoSaldoAtual.text('R$ ' + _moeda(caixa.valorFinal));
        }

        // ── RF_F4 – Abrir Caixa ───────────────────────────────────────────────────

        $btnAbrirCaixa.on('click', function () {
            validador.resetar($formAbrir[0]);
            $inputValorInicial.val('');
            modalAbrirObj.show();
            setTimeout(function () { $inputValorInicial.trigger('focus'); }, 400);
        });

        $btnConfirmarAbrir.on('click', async function () {
            if (!validador.validarFormulario($formAbrir[0])) return;

            var valorStr = mascaras.monetarioParaNumero($inputValorInicial.val());
            if (isNaN(valorStr) || valorStr < 0) {
                validador.destacarCampo($inputValorInicial[0], false,
                    'Informe um valor inicial válido (≥ 0).');
                return;
            }

            _bloquearBtn($btnConfirmarAbrir, true);
            var resultado = await ctrl.abrir(valorStr);
            _bloquearBtn($btnConfirmarAbrir, false);

            if (resultado.status === 'ok') {
                modalAbrirObj.hide();
                validador.mostrarAlerta('Caixa aberto com sucesso!', 'sucesso');
                await _atualizarPainel();
            } else {
                validador.mostrarAlerta(resultado.erro || 'Erro ao abrir caixa.', 'erro');
            }
        });

        // ── RF_F5 – Suprimento / Sangria ──────────────────────────────────────────

        $btnSuprimento.on('click', function () {
            _abrirModalMovimentacao('SUPRIMENTO');
        });

        $btnSangria.on('click', function () {
            _abrirModalMovimentacao('SANGRIA');
        });

        function _abrirModalMovimentacao(tipo) {
            validador.resetar($formMov[0]);
            $inputMovTipo.val(tipo);
            $inputMovValor.val('');
            $inputMovMotivo.val('');

            if (tipo === 'SUPRIMENTO') {
                $('#modal-mov-titulo').text('Suprimento de Caixa');
                $inputMovBadge.html(
                    '<span class="badge bg-primary fs-6 py-2 px-3">' +
                    '<i class="bi bi-plus-circle me-1"></i>Entrada de Dinheiro</span>');
                $btnConfirmarMov.attr('class', 'btn btn-primary');
            } else {
                $('#modal-mov-titulo').text('Sangria de Caixa');
                $inputMovBadge.html(
                    '<span class="badge bg-warning text-dark fs-6 py-2 px-3">' +
                    '<i class="bi bi-dash-circle me-1"></i>Retirada de Dinheiro</span>');
                $btnConfirmarMov.attr('class', 'btn btn-warning');
            }

            modalMovObj.show();
            setTimeout(function () { $inputMovValor.trigger('focus'); }, 400);
        }

        $btnConfirmarMov.on('click', async function () {
            if (!validador.validarFormulario($formMov[0])) return;

            var tipo   = $inputMovTipo.val();
            var valor  = mascaras.monetarioParaNumero($inputMovValor.val());
            var motivo = $inputMovMotivo.val().trim();

            if (isNaN(valor) || valor <= 0) {
                validador.destacarCampo($inputMovValor[0], false, 'Informe um valor maior que zero.');
                return;
            }

            _bloquearBtn($btnConfirmarMov, true);
            var resultado = await ctrl.atualizar(tipo, valor, motivo);
            _bloquearBtn($btnConfirmarMov, false);

            if (resultado.status === 'ok') {
                modalMovObj.hide();
                var tipoLabel = tipo === 'SUPRIMENTO' ? 'Suprimento' : 'Sangria';
                validador.mostrarAlerta(tipoLabel + ' registrado com sucesso!', 'sucesso');
                await _atualizarPainel();
            } else {
                validador.mostrarAlerta(resultado.erro || 'Erro ao registrar movimentação.', 'erro');
            }
        });

        // ── RF_F6 – Fechar Caixa ──────────────────────────────────────────────────

        $btnFecharCaixa.on('click', function () {
            modalFecharObj.show();
        });

        $btnConfirmarFechar.on('click', async function () {
            _bloquearBtn($btnConfirmarFechar, true);
            var resultado = await ctrl.fechar();
            _bloquearBtn($btnConfirmarFechar, false);

            modalFecharObj.hide();

            if (resultado.status === 'ok') {
                _mostrarResumoFechamento(resultado.dados);
                await _atualizarPainel();
            } else {
                validador.mostrarAlerta(resultado.erro || 'Erro ao fechar caixa.', 'erro');
            }
        });

        function _mostrarResumoFechamento(dados) {
            if (!dados) {
                validador.mostrarAlerta('Caixa fechado com sucesso!', 'sucesso');
                return;
            }

            var movs         = Array.isArray(dados.movimentacoes)     ? dados.movimentacoes     : [];
            var vendasFormas = Array.isArray(dados.vendasPorFormaPag) ? dados.vendasPorFormaPag : [];

            // ── Linhas de movimentações manuais ───────────────────────────────────
            var linhasMovs = movs.length === 0
                ? '<tr><td colspan="3" class="text-center text-muted fst-italic">Nenhuma movimentação manual registrada.</td></tr>'
                : movs.map(function (m) {
                    var sinal = m.valor >= 0 ? '+' : '';
                    var cor   = m.valor >= 0 ? 'text-success' : 'text-danger';
                    return '<tr>' +
                        '<td>' + _formatarDataHora(m.dataHora) + '</td>' +
                        '<td>' + _escapar(m.motivo || '—') + '</td>' +
                        '<td class="text-end ' + cor + '">' + sinal + 'R$ ' + _moeda(Math.abs(m.valor)) + '</td>' +
                        '</tr>';
                }).join('');

            // ── Linhas de vendas por forma de pagamento ───────────────────────────
            var linhasVendas = vendasFormas.length === 0
                ? '<tr><td colspan="2" class="text-center text-muted fst-italic">Nenhuma venda registrada neste caixa.</td></tr>'
                : vendasFormas.map(function (v) {
                    return '<tr>' +
                        '<td>' + _escapar(v.formaPag || '—') + '</td>' +
                        '<td class="text-end text-success fw-bold">R$ ' + _moeda(v.total) + '</td>' +
                        '</tr>';
                }).join('');

            // ── Monta o HTML do resumo ────────────────────────────────────────────
            $resumoConteudo.html(

                // Cards de totais — linha 1: Valor Inicial, Suprimentos, Sangrias, Saldo Final
                '<div class="row g-3 mb-3">' +

                '<div class="col-6 col-md-3">' +
                '<div class="card border-0 bg-light h-100"><div class="card-body text-center">' +
                '<p class="text-muted small mb-1">Valor Inicial</p>' +
                '<p class="fw-bold mb-0">R$ ' + _moeda(dados.valorInicial) + '</p>' +
                '</div></div></div>' +

                '<div class="col-6 col-md-3">' +
                '<div class="card border-0 bg-light h-100"><div class="card-body text-center">' +
                '<p class="text-muted small mb-1">Suprimentos</p>' +
                '<p class="fw-bold mb-0 text-success">+ R$ ' + _moeda(dados.totalSuprimentos) + '</p>' +
                '</div></div></div>' +

                '<div class="col-6 col-md-3">' +
                '<div class="card border-0 bg-light h-100"><div class="card-body text-center">' +
                '<p class="text-muted small mb-1">Sangrias</p>' +
                '<p class="fw-bold mb-0 text-danger">- R$ ' + _moeda(dados.totalSangrias) + '</p>' +
                '</div></div></div>' +

                '<div class="col-6 col-md-3">' +
                '<div class="card border-success border h-100"><div class="card-body text-center">' +
                '<p class="text-muted small mb-1">Saldo Final</p>' +
                '<p class="fw-bold fs-5 mb-0 text-success">R$ ' + _moeda(dados.saldoFinal) + '</p>' +
                '</div></div></div>' +

                '</div>' +

                // Card de total de vendas — destaque
                '<div class="card border-0 mb-3" style="background:#f0faf0">' +
                '<div class="card-body d-flex justify-content-between align-items-center py-2 px-3">' +
                '<span class="fw-semibold"><i class="bi bi-bag-check me-2 text-success"></i>Total de Vendas no Período</span>' +
                '<span class="fw-bold fs-5 text-success">R$ ' + _moeda(dados.totalVendas) + '</span>' +
                '</div></div>' +

                // Tabela de vendas por forma de pagamento
                '<h6 class="mb-2"><i class="bi bi-credit-card me-1"></i>Vendas por forma de pagamento</h6>' +
                '<div class="table-responsive mb-3">' +
                '<table class="table table-sm table-hover mb-0">' +
                '<thead><tr>' +
                '<th>Forma de Pagamento</th><th class="text-end">Total Recebido</th>' +
                '</tr></thead>' +
                '<tbody>' + linhasVendas + '</tbody>' +
                '</table></div>' +

                // Tabela de movimentações manuais
                '<h6 class="mb-2"><i class="bi bi-list-ul me-1"></i>Movimentações manuais</h6>' +
                '<div class="table-responsive">' +
                '<table class="table table-sm table-hover mb-0">' +
                '<thead><tr>' +
                '<th>Data / Hora</th><th>Motivo</th><th class="text-end">Valor</th>' +
                '</tr></thead>' +
                '<tbody>' + linhasMovs + '</tbody>' +
                '</table></div>');

            modalResumoObj.show();
        }

        // ── Auxiliares ────────────────────────────────────────────────────────────

        function _moeda(valor) {
            if (valor === null || valor === undefined) return '0,00';
            return parseFloat(valor).toFixed(2).replace('.', ',')
                .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        }

        function _formatarDataHora(str) {
            if (!str) return '—';
            var s = String(str).replace('T', ' ').substring(0, 16);
            var partes = s.split(' ');
            if (partes.length !== 2) return s;
            var data = partes[0].split('-').reverse().join('/');
            return data + ' ' + partes[1];
        }

        function _escapar(texto) {
            if (texto === null || texto === undefined) return '';
            return String(texto)
                .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
        }

        function _bloquearBtn($btn, bloquear) {
            $btn.prop('disabled', bloquear);
            if (bloquear) {
                $btn.data('textoOriginal', $btn.html());
                $btn.html('<span class="spinner-border spinner-border-sm me-1"></span>Aguarde...');
            } else {
                $btn.html($btn.data('textoOriginal') || $btn.html());
            }
        }

        // ── Limpa campos ao fechar modais ─────────────────────────────────────────

        $modalAbrirEl.on('hidden.bs.modal', function () {
            validador.resetar($formAbrir[0]);
        });

        $modalMovEl.on('hidden.bs.modal', function () {
            validador.resetar($formMov[0]);
        });

        // ── Ponto de entrada ──────────────────────────────────────────────────────

        inicializar();

    });

})();
