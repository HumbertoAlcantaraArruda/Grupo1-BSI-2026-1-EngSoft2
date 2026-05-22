/* eventosDisponiveis.js — Listagem de eventos disponíveis para inscrição (PAROQ) */

(function ($) {

    var auth      = window.AGAPE.Utils.Auth.getInstance();
    var validador = window.AGAPE.Utils.Validador.getInstance();
    var service   = window.AGAPE.Services.EventosDisponiveisService.getInstance();

    if (!auth.requireLogin()) return;

    var $grade          = $('#grade-eventos');
    var modalCancelarObj = new bootstrap.Modal($('#modal-cancelar')[0]);
    var _idEventoParaCancelar = null;
    var _nomeEventoParaCancelar = null;

    // ── Inicialização ─────────────────────────────────────────────────────

    function inicializar() {
        window.AGAPE.Utils.Sidebar.inicializar();
        _carregarEventos();
        $('#btn-atualizar').on('click', _carregarEventos);
        $('#btn-confirmar-cancelar').on('click', _confirmarCancelamento);
    }

    // ── Listagem ──────────────────────────────────────────────────────────

    async function _carregarEventos() {
        _renderizarSkeletons();
        var resultado = await service.listar();

        if (resultado.status !== 'ok') {
            _renderizarErro(resultado.erro || 'Erro ao carregar eventos.');
            return;
        }

        var lista = Array.isArray(resultado.dados) ? resultado.dados : [];
        if (lista.length === 0) {
            _renderizarVazio();
            return;
        }

        _renderizarCards(lista);
    }

    // ── Renderização ──────────────────────────────────────────────────────

    function _renderizarSkeletons() {
        var html = '';
        for (var i = 0; i < 3; i++) {
            html += '<div class="col"><div class="spinner-card"></div></div>';
        }
        $grade.html(html);
    }

    function _renderizarErro(msg) {
        $grade.html(
            '<div class="col-12"><div class="estado-vazio">' +
            '<i class="bi bi-exclamation-triangle text-danger"></i>' +
            '<p class="text-danger">' + _esc(msg) + '</p>' +
            '</div></div>'
        );
    }

    function _renderizarVazio() {
        $grade.html(
            '<div class="col-12"><div class="estado-vazio">' +
            '<i class="bi bi-calendar-x"></i>' +
            '<h5>Nenhum evento disponível</h5>' +
            '<p class="small">Não há eventos com inscrições abertas no momento.</p>' +
            '</div></div>'
        );
    }

    function _renderizarCards(lista) {
        var html = lista.map(function (ev) { return _buildCard(ev); }).join('');
        $grade.html(html);
    }

    function _buildCard(ev) {
        var imgSrc = ev.imagemEvento
            ? '../../assets/img/' + ev.imagemEvento
            : '../../assets/img/evento_sem_imagem.png';

        var valor = ev.valorInscricao != null
            ? 'R$ ' + _moeda(ev.valorInscricao)
            : '<span class="text-success fw-semibold">Gratuito</span>';

        var semVagas = ev.vagasDisp === 0;

        var btnHtml;
        if (ev.inscritoAtual) {
            btnHtml =
                '<button class="btn btn-outline-danger btn-sm w-100 btn-cancelar-inscricao" ' +
                '  data-id="' + ev.idEvento + '" ' +
                '  data-nome="' + _esc(ev.nome) + '">' +
                '  <i class="bi bi-x-circle me-1"></i>Cancelar Inscrição' +
                '</button>';
        } else if (semVagas) {
            btnHtml =
                '<button class="btn btn-warning btn-sm w-100 btn-inscrever" ' +
                '  data-id="' + ev.idEvento + '">' +
                '  <i class="bi bi-person-plus me-1"></i>Entrar na Lista de Espera' +
                '</button>';
        } else {
            btnHtml =
                '<button class="btn btn-primary btn-sm w-100 btn-inscrever" ' +
                '  data-id="' + ev.idEvento + '">' +
                '  <i class="bi bi-person-check me-1"></i>Cadastrar-se' +
                '</button>';
        }

        return (
            '<div class="col">' +
            '<div class="card evento-card">' +
            '  <img class="card-img-top" ' +
            '       src="' + imgSrc + '" ' +
            '       alt="' + _esc(ev.nome) + '" ' +
            '       onerror="this.src=\'../../assets/img/evento_sem_imagem.png\'">' +
            '  <div class="card-body">' +
            '    <div class="d-flex align-items-start justify-content-between mb-2">' +
            '      <h6 class="card-title mb-0">' + _esc(ev.nome) + '</h6>' +
            '    </div>' +
            '    <span class="categoria-tag mb-2 d-inline-block">' + _esc(ev.nomeCatEvento || '—') + '</span>' +
            '    <div class="meta-item"><i class="bi bi-calendar-event"></i>' + _formatarData(ev.dataEvento) + '</div>' +
            '    <div class="meta-item"><i class="bi bi-clock"></i>' +
            '      Inscrições: ' + _formatarData(ev.dataInicio) + ' até ' + _formatarData(ev.dataFim) +
            '    </div>' +
            '    <div class="meta-item"><i class="bi bi-cash"></i>' + valor + '</div>' +
            '  </div>' +
            '  <div class="card-footer">' +
            '    <div class="d-flex align-items-center justify-content-between mb-2">' +
            '      <span class="inscritos-badge">' +
            '        <i class="bi bi-people-fill"></i>' + ev.qtdInscritos + ' inscrito(s)' +
            '      </span>' +
            (semVagas && !ev.inscritoAtual
                ? '<span class="badge bg-warning text-dark">Lista de espera</span>'
                : '<span class="text-muted small">' +
                  (ev.vagasDisp != null ? ev.vagasDisp + ' vaga(s)' : '') + '</span>') +
            '    </div>' +
            '    ' + btnHtml +
            '  </div>' +
            '</div>' +
            '</div>'
        );
    }

    // ── Ações nos cards (delegação por eventos) ───────────────────────────

    $grade.on('click', '.btn-inscrever', async function () {
        var $btn    = $(this);
        var idEvento = $btn.data('id');

        _setLoading($btn, true);
        var resultado = await service.inscrever(idEvento);
        _setLoading($btn, false);

        if (resultado.status === 'ok') {
            var dados = resultado.dados;
            var msg = dados && dados.listaEspera
                ? 'Você entrou na lista de espera (posição ' + (dados.posicaoEspera || '?') + ').'
                : 'Inscrição realizada com sucesso!';
            validador.mostrarAlerta(msg, 'sucesso');
            _carregarEventos();
        } else {
            validador.mostrarAlerta(resultado.erro || 'Erro ao realizar inscrição.', 'erro');
        }
    });

    $grade.on('click', '.btn-cancelar-inscricao', function () {
        _idEventoParaCancelar   = $(this).data('id');
        _nomeEventoParaCancelar = $(this).data('nome');
        $('#cancelar-nome-evento').text(_nomeEventoParaCancelar);
        modalCancelarObj.show();
    });

    async function _confirmarCancelamento() {
        if (!_idEventoParaCancelar) return;

        var $btn = $('#btn-confirmar-cancelar');
        _setLoading($btn, true);
        var resultado = await service.cancelar(_idEventoParaCancelar);
        _setLoading($btn, false);

        modalCancelarObj.hide();
        _idEventoParaCancelar = null;

        if (resultado.status === 'ok') {
            validador.mostrarAlerta('Inscrição cancelada com sucesso.', 'sucesso');
            _carregarEventos();
        } else {
            validador.mostrarAlerta(resultado.erro || 'Erro ao cancelar inscrição.', 'erro');
        }
    }

    // ── Utilitários ───────────────────────────────────────────────────────

    function _setLoading($btn, loading) {
        if (loading) {
            $btn.prop('disabled', true)
                .data('orig', $btn.html())
                .html('<span class="spinner-border spinner-border-sm"></span>');
        } else {
            $btn.prop('disabled', false).html($btn.data('orig') || $btn.html());
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

    $(inicializar);

}(jQuery));
