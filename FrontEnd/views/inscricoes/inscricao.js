/* inscricao.js — View do RF_F3: Realizar Inscrição
 *
 * Responsabilidade: orquestra a UI em 3 passos, delegando toda a lógica
 * de negócio ao InscricaoController (GRASP Controller).
 * Não contém regras de domínio — estas estão no Controller/Model/Backend.
 */

(function ($) {

    if (!window.AGAPE.Utils.Auth.getInstance().requireLogin()) return;

    // GRASP Controller — instância única que conhece o domínio de inscrição
    var ctrl      = window.AGAPE.Controllers.InscricaoController.getInstance();
    var mascaras  = window.AGAPE.Utils.Mascaras.getInstance();
    var validador = window.AGAPE.Utils.Validador.getInstance();

    // ── Estado da View ────────────────────────────────────────────────────

    var _idParoquiano = null;  // ID confirmado após verificação de CPF
    var _idEvento     = null;  // ID do evento selecionado
    var _eventoCache  = {};    // mapa idEvento → objeto evento (para exibir detalhes)

    // ── Inicialização ─────────────────────────────────────────────────────

    function inicializar() {
        window.AGAPE.Utils.Sidebar.inicializar();
        mascaras.aplicar('#input-cpf', 'cpf');
        _inicializarSelect2();
        _carregarCategorias();
        _bindEventos();
    }

    // ── Select2 — seleção avançada de evento (RF_F3 UX) ──────────────────

    function _inicializarSelect2() {
        var opcoesComuns = {
            allowClear: true,
            language: {
                noResults: function () { return 'Nenhum resultado encontrado.'; },
                searching: function () { return 'Buscando...'; }
            }
        };

        $('#sel-categoria').select2($.extend({
            placeholder: 'Selecione uma categoria...'
        }, opcoesComuns));

        $('#sel-evento').select2($.extend({
            placeholder: 'Selecione o evento...'
        }, opcoesComuns));
    }

    // ── Passo 2: Carregar categorias ──────────────────────────────────────

    async function _carregarCategorias() {
        var resultado = await ctrl.carregarCategorias();
        if (resultado.status !== 'ok' || !Array.isArray(resultado.dados)) return;

        var $sel = $('#sel-categoria');
        resultado.dados
            .filter(function (c) { return c.ativo !== false && c.ativo !== 0; })
            .forEach(function (c) {
                $sel.append('<option value="' + c.idCatEvento + '">' + _esc(c.nome) + '</option>');
            });
        $sel.trigger('change'); // notifica Select2 das novas opções
    }

    // ── Binding dos eventos DOM ───────────────────────────────────────────

    function _bindEventos() {

        // Máscara de CPF e submit por Enter
        $('#input-cpf').on('keydown', function (e) {
            if (e.key === 'Enter') $('#btn-verificar').trigger('click');
        });

        // ── Passo 1: Verificar CPF ────────────────────────────────────────
        $('#btn-verificar').on('click', async function () {
            var cpf = $('#input-cpf').val();
            _setLoading($(this), true);

            var resultado = await ctrl.verificarCpf(cpf);
            _setLoading($(this), false);

            if (resultado.status !== 'ok') {
                // Fluxo 2.1 — paroquiano não encontrado
                _esconderParoquiano();
                _desativarStep(2);
                _desativarStep(3);
                validador.mostrarAlerta(resultado.erro || 'Paroquiano não encontrado.', 'erro');
                return;
            }

            var p = resultado.dados;
            _idParoquiano = p.idUsuario;

            // Exibe confirmação do paroquiano
            $('#paroquiano-nome').text(p.nome);
            $('#paroquiano-email').text(p.email ? '(' + p.email + ')' : '');
            $('#paroquiano-card').removeClass('d-none');

            // Habilita passo 2
            _ativarStep(2);
            _desativarStep(3);
            $('#card-evento-detalhes').addClass('d-none');
            $('#btn-confirmar').prop('disabled', true);
            _idEvento = null;
        });

        // ── Passo 2a: Categoria selecionada → carrega eventos ─────────────
        $('#sel-categoria').on('change', async function () {
            var idCat = $(this).val();

            // Reseta Select2 de evento
            $('#sel-evento').empty().append('<option value="">Carregando eventos...</option>').trigger('change');
            _idEvento = null;
            _desativarStep(3);
            $('#card-evento-detalhes').addClass('d-none');
            $('#btn-confirmar').prop('disabled', true);

            if (!idCat) {
                $('#sel-evento').empty()
                    .append('<option value="">Selecione primeiro uma categoria...</option>')
                    .trigger('change');
                return;
            }

            var resultado = await ctrl.carregarEventosPorCategoria(idCat);
            $('#sel-evento').empty();

            if (resultado.status !== 'ok' || !Array.isArray(resultado.dados) || resultado.dados.length === 0) {
                // Fluxo 4.1 — nenhum evento ativo na categoria
                $('#sel-evento').append('<option value="">Nenhum evento ativo nesta categoria</option>')
                    .trigger('change');
                validador.mostrarAlerta('Nenhum evento ativo encontrado para esta categoria.', 'erro');
                return;
            }

            $('#sel-evento').append('<option value="">Selecione o evento...</option>');
            resultado.dados.forEach(function (ev) {
                _eventoCache[ev.idEvento] = ev;

                // Fora do prazo de inscrição → opção desabilitada (espelha a regra do backend)
                var foraPrazo = _prazoEncerrado(ev) || _prazoNaoAberto(ev);
                var sufixo;
                if (_prazoEncerrado(ev)) {
                    sufixo = ' [Inscrições encerradas]';
                } else if (_prazoNaoAberto(ev)) {
                    sufixo = ' [Inscrições ainda não abertas]';
                } else {
                    var vagas = ev.vagasDisp != null ? ev.vagasDisp : '?';
                    sufixo = ev.vagasDisp === 0 ? ' [Lista de espera]' : ' [' + vagas + ' vaga(s)]';
                }

                $('#sel-evento').append(
                    '<option value="' + ev.idEvento + '"' + (foraPrazo ? ' disabled' : '') + '>' +
                    _esc(ev.nome) + sufixo + '</option>'
                );
            });
            $('#sel-evento').trigger('change');
        });

        // ── Passo 2b: Evento selecionado → exibe detalhes ─────────────────
        $('#sel-evento').on('change', function () {
            var idEv = $(this).val();
            _idEvento = idEv || null;

            if (!idEv) {
                _desativarStep(3);
                $('#card-evento-detalhes').addClass('d-none');
                $('#btn-confirmar').prop('disabled', true);
                return;
            }

            var ev = _eventoCache[idEv];
            if (!ev) return;

            // Guarda de prazo — bloqueia confirmação fora do período de inscrição
            if (_prazoEncerrado(ev) || _prazoNaoAberto(ev)) {
                _idEvento = null;
                _desativarStep(3);
                $('#card-evento-detalhes').addClass('d-none');
                $('#btn-confirmar').prop('disabled', true);
                validador.mostrarAlerta(
                    _prazoEncerrado(ev)
                        ? 'O prazo de inscrição para este evento já foi encerrado.'
                        : 'As inscrições para este evento ainda não foram abertas.',
                    'erro');
                return;
            }

            // Imagem do evento (fallback para imagem padrão se não existir)
            var imgSrc = ev.imagemEvento
                ? '../../assets/img/' + ev.imagemEvento
                : '../../assets/img/evento_sem_imagem.png';
            $('#det-imagem')
                .attr('src', imgSrc)
                .off('error')
                .on('error', function () {
                    $(this).attr('src', '../../assets/img/evento_sem_imagem.png');
                });

            // Preenche detalhes do evento (Fluxo 6.1 — verifica vagas em tempo real)
            $('#det-nome').text(ev.nome);
            $('#det-data').text(_formatarData(ev.dataEvento));
            $('#det-inicio').text(_formatarData(ev.dataInicio));
            $('#det-fim').text(_formatarData(ev.dataFim));

            var vagas    = ev.vagasDisp != null ? ev.vagasDisp : '?';
            var total    = ev.totVagas  != null ? ev.totVagas  : '?';
            var semVagas = ev.vagasDisp === 0;

            var $badgeVagas = $('#det-vagas');
            $badgeVagas
                .text(vagas + ' / ' + total)
                .removeClass('badge-vagas-ok badge-vagas-zero')
                .addClass(semVagas ? 'badge-vagas-zero' : 'badge-vagas-ok');

            if (ev.valorInscricao != null) {
                $('#det-valor').text('R$ ' + _moeda(ev.valorInscricao));
            } else {
                $('#det-valor').html('<span class="text-success">Gratuito</span>');
            }

            // Mostra aviso de lista de espera se sem vagas (Fluxo 6.1)
            $('#aviso-espera').toggleClass('d-none', !semVagas);

            $('#card-evento-detalhes').removeClass('d-none');
            _ativarStep(3);
            $('#btn-confirmar').prop('disabled', false);
        });

        // ── Passo 3: Confirmar inscrição ──────────────────────────────────
        $('#btn-confirmar').on('click', async function () {
            if (!_idParoquiano || !_idEvento) return;

            _setLoading($(this), true);
            var resultado = await ctrl.confirmar(_idParoquiano, _idEvento);
            _setLoading($(this), false);

            if (resultado.status === 'ok') {
                var dados = resultado.dados;
                var msg   = dados && dados.listaEspera
                    ? 'Paroquiano adicionado à lista de espera (posição ' + (dados.posicaoEspera || '?') + ').'
                    : 'Inscrição realizada com sucesso!';

                validador.mostrarAlerta(msg, 'sucesso');
                _reiniciar(); // Fluxo 8.1 — retorna ao estado inicial para nova inscrição
            } else {
                validador.mostrarAlerta(resultado.erro || 'Erro ao realizar inscrição.', 'erro');
            }
        });

        // ── Recomeçar ─────────────────────────────────────────────────────
        $('#btn-reiniciar').on('click', _reiniciar);
    }

    // ── Funções de controle de passo ──────────────────────────────────────

    function _ativarStep(n)    { $('#step' + n).removeClass('disabled'); }
    function _desativarStep(n) { $('#step' + n).addClass('disabled'); }

    function _esconderParoquiano() {
        $('#paroquiano-card').addClass('d-none');
        _idParoquiano = null;
    }

    function _reiniciar() {
        _idParoquiano = null;
        _idEvento     = null;
        _eventoCache  = {};

        $('#input-cpf').val('');
        _esconderParoquiano();

        $('#sel-categoria').val('').trigger('change');
        $('#sel-evento').empty()
            .append('<option value="">Selecione primeiro uma categoria...</option>')
            .trigger('change');

        $('#card-evento-detalhes').addClass('d-none');
        $('#aviso-espera').addClass('d-none');
        $('#btn-confirmar').prop('disabled', true);

        _desativarStep(2);
        _desativarStep(3);
    }

    // ── Utilitários ───────────────────────────────────────────────────────

    function _setLoading($btn, loading) {
        if (loading) {
            $btn.prop('disabled', true)
                .data('txt-orig', $btn.html())
                .html('<span class="spinner-border spinner-border-sm me-1"></span>Aguarde...');
        } else {
            $btn.prop('disabled', false).html($btn.data('txt-orig') || $btn.html());
        }
    }

    function _esc(texto) {
        return $('<div>').text(texto == null ? '' : String(texto)).html();
    }

    function _moeda(valor) {
        return parseFloat(valor || 0).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }

    function _formatarData(iso) {
        if (!iso) return '—';
        var d = new Date(iso.replace('T', ' ').replace(/-/g, '/'));
        if (isNaN(d)) return iso;
        var pad = function (n) { return String(n).padStart(2, '0'); };
        return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear() +
               ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
    }

    function _parseData(iso) {
        if (!iso) return null;
        var d = new Date(iso.replace('T', ' ').replace(/-/g, '/'));
        return isNaN(d) ? null : d;
    }

    // Prazo de inscrição encerrado (NOW > dataFim) — espelha Evento.validarDisponibilidade()
    function _prazoEncerrado(ev) {
        var fim = _parseData(ev && ev.dataFim);
        return fim != null && new Date() > fim;
    }

    // Prazo de inscrição ainda não aberto (NOW < dataInicio)
    function _prazoNaoAberto(ev) {
        var inicio = _parseData(ev && ev.dataInicio);
        return inicio != null && new Date() < inicio;
    }

    $(inicializar);

}(jQuery));
