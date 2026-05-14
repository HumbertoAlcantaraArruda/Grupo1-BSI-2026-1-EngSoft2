/**
 * VendasController — PDV redesenhado.
 *
 * Fluxo:
 *  1. Estado vazio → usuário clica "Adicionar Venda"
 *  2. Form expande (fullscreen dentro do main-content)
 *  3. Itens adicionados via Modal (#modal-item-venda)
 *  4. Guardião intercepta navegação enquanto venda está ativa
 *  5. Finalizar → POST /vendas → modal de sucesso
 *
 * DDL:  Venda(idVenda, dataHora, totBruto, credUtilizado, valorFinal,
 *              idUsuario→Paroquiano, idCaixa, idFormaPag)
 *       itemVenda(quantidade, valorUnitario, valorTotal, idVenda, idProd)
 */
class VendasController {
  #api;
  #session;

  // Estado da venda ativa
  #vendaAtiva     = false;
  #itens          = [];          // [{idProd, nomeProd, quantidade, valorUnitario, valorTotal}]
  #caixaAtual     = null;
  #clienteSaldo   = 0;

  // Guardião: href destino ao navegar
  #guardiaoHref   = null;

  // Catálogos (carregados una vez)
  #produtos       = [];
  #paroquianos    = [];
  #formasPagto    = [];

  constructor() {
    this.#api     = ApiService.getInstance();
    this.#session = SessionManager.getInstance();
  }

  async init() {
    if (!this.#session.hasRole('COLABORADOR')) {
      Toast.show('Acesso não autorizado.', 'error');
      setTimeout(() => window.location.replace('../dashboard.html'), 1500);
      return;
    }
    Mask.applyTo(document.getElementById('venda-credUtilizado'), 'currency');
    this.#bindEvents();
    await Promise.all([
      this.#loadCaixaAtual(),
      this.#loadCatalogos(),
    ]);
    this.#atualizarClock();
  }

  // ── Eventos ───────────────────────────────────────────────
  #bindEvents() {
    // Iniciar venda
    $('#btn-iniciar-venda').on('click', () => this.#iniciarVenda());

    // Modal de item
    $('#btn-add-item-venda').on('click',       () => this.#abrirModalItem());
    $('#btn-confirmar-item-venda').on('click', () => this.#confirmarItem());

    // Produto selecionado no modal → preenche preço
    $('#item-idProd').on('change', () => this.#onProdutoSelecionado());
    $('#item-quantidade').on('input', () => this.#recalcItemTotal());

    // Crédito
    $('#venda-credUtilizado').on('input', () => this.#recalcSummary());

    // Cliente selecionado → mostra saldo
    $('#venda-idUsuario').on('change', () => this.#onClienteSelecionado());

    // Finalizar / cancelar
    $('#btn-finalizar-venda').on('click',       () => this.#abrirConfirmacao());
    $('#btn-confirmar-finalizar').on('click',   () => this.#finalizarVenda());
    $('#btn-cancelar-venda').on('click',        () => {
      new bootstrap.Modal(document.getElementById('modal-cancelar-venda')).show();
    });
    $('#btn-confirmar-cancelar').on('click',    () => {
      bootstrap.Modal.getInstance(document.getElementById('modal-cancelar-venda'))?.hide();
      this.#cancelarVenda();
    });

    // Sucesso → nova venda
    $('#btn-nova-venda-apos-sucesso').on('click', () => {
      bootstrap.Modal.getInstance(document.getElementById('modal-venda-sucesso'))?.hide();
      this.#cancelarVenda();
    });

    // Guardião
    $('#btn-guardiao-sair').on('click', () => {
      bootstrap.Modal.getInstance(document.getElementById('modal-guardiao'))?.hide();
      this.#desativarGuardiao();
      if (this.#guardiaoHref) window.location.href = this.#guardiaoHref;
    });
  }

  // ── Estado da view ────────────────────────────────────────
  #mostrarVazio() {
    $('#estado-vazio').removeClass('d-none');
    $('#estado-venda').addClass('d-none');
    $('#badge-ativa').addClass('d-none');
  }

  #mostrarForm() {
    $('#estado-vazio').addClass('d-none');
    $('#estado-venda').removeClass('d-none');
    $('#badge-ativa').removeClass('d-none');
  }

  // ── Catálogos ─────────────────────────────────────────────
  async #loadCatalogos() {
    try {
      const [prods, pars, fps] = await Promise.all([
        this.#api.get('/produtos?status=true&size=500'),
        this.#api.get('/usuarios?nivel=PAROQUIANO&status=true&size=500'),
        this.#api.get('/formas-pagamento?ativo=true&size=100'),
      ]);

      this.#produtos     = prods.content    ?? (Array.isArray(prods)   ? prods   : []);
      this.#paroquianos  = pars.content     ?? (Array.isArray(pars)    ? pars    : []);
      this.#formasPagto  = fps.content      ?? (Array.isArray(fps)     ? fps     : []);

      this.#popularSelects();
    } catch (err) {
      Toast.show(err.message || 'Erro ao carregar catálogos.', 'error');
    }
  }

  #popularSelects() {
    // Select2: Paroquiano
    const selCliente = $('#venda-idUsuario');
    selCliente.empty().append('<option value="">Selecione o cliente...</option>');
    this.#paroquianos.forEach(p => {
      selCliente.append(
        `<option value="${p.idUsuario ?? p.id}" data-saldo="${p.saldoCredito ?? 0}">${p.nome}</option>`
      );
    });
    selCliente.select2({
      theme: 'default',
      width: '100%',
      placeholder: 'Selecione o cliente...',
      allowClear: true,
    });

    // Select2: Forma de Pagamento
    const selFP = $('#venda-idFormaPag');
    selFP.empty().append('<option value="">Selecione...</option>');
    this.#formasPagto.forEach(f => {
      selFP.append(`<option value="${f.idFormaPag ?? f.id}">${f.descricao ?? f.nome}</option>`);
    });
    selFP.select2({ theme: 'default', width: '100%', placeholder: 'Selecione...' });

    // Select2: Produto (no modal)
    const selProd = $('#item-idProd');
    selProd.empty().append('<option value="">Selecione um produto...</option>');
    this.#produtos.forEach(p => {
      const label = `${p.nome} — ${this.#brl(p.valorUni ?? 0)} (estq: ${p.qtdAtual ?? 0})`;
      selProd.append(`<option value="${p.idProd ?? p.id}" data-valor="${p.valorUni ?? 0}" data-estoque="${p.qtdAtual ?? 0}">${label}</option>`);
    });
    selProd.select2({
      theme: 'default',
      width: '100%',
      dropdownParent: $('#modal-item-venda'),
      placeholder: 'Selecione um produto...',
    });
  }

  // ── Caixa ─────────────────────────────────────────────────
  async #loadCaixaAtual() {
    try {
      this.#caixaAtual = await this.#api.get('/caixa/sessao-atual');
      $('#venda-caixa-info').val(
        `#${this.#caixaAtual.id ?? this.#caixaAtual.idCaixa} — Aberto ${new Date(this.#caixaAtual.dataHoraAbertura ?? this.#caixaAtual.dataAbertura).toLocaleTimeString('pt-BR')}`
      );
      $('#venda-idCaixa').val(this.#caixaAtual.id ?? this.#caixaAtual.idCaixa);
    } catch {
      $('#venda-caixa-info').val('Nenhum caixa aberto').addClass('text-danger');
    }
  }

  // ── Clock ─────────────────────────────────────────────────
  #atualizarClock() {
    const update = () => {
      $('#venda-dataHora').val(
        new Date().toLocaleString('pt-BR', {
          day:'2-digit', month:'2-digit', year:'numeric',
          hour:'2-digit', minute:'2-digit',
        })
      );
    };
    update();
    setInterval(update, 60000);
  }

  // ── Iniciar Venda ─────────────────────────────────────────
  #iniciarVenda() {
    if (!this.#caixaAtual) {
      Toast.show('Não há caixa aberto. Abra o caixa antes de registrar vendas.', 'warning');
      return;
    }
    this.#vendaAtiva = true;
    this.#itens = [];
    this.#clienteSaldo = 0;
    this.#mostrarForm();
    this.#renderItens();
    this.#recalcSummary();
    this.#ativarGuardiao();
  }

  // ── Cancelar Venda ────────────────────────────────────────
  #cancelarVenda() {
    this.#vendaAtiva = false;
    this.#itens = [];
    this.#desativarGuardiao();
    this.#mostrarVazio();

    // Reset selects
    $('#venda-idUsuario').val(null).trigger('change');
    $('#venda-idFormaPag').val(null).trigger('change');
    $('#venda-credUtilizado').val('0,00');
    $('#cliente-credito-info').addClass('d-none');
  }

  // ── Cliente ───────────────────────────────────────────────
  #onClienteSelecionado() {
    const id = $('#venda-idUsuario').val();
    if (!id) {
      $('#cliente-credito-info').addClass('d-none');
      this.#clienteSaldo = 0;
      $('#credito-max-info').text('');
      return;
    }
    const opt = $('#venda-idUsuario option:selected');
    this.#clienteSaldo = parseFloat(opt.data('saldo') ?? 0);
    $('#credito-disponivel').text(this.#brl(this.#clienteSaldo));
    $('#cliente-credito-info').removeClass('d-none');
    $('#credito-max-info').text(`Máximo disponível: ${this.#brl(this.#clienteSaldo)}`);
  }

  // ── Modal Item ────────────────────────────────────────────
  #abrirModalItem() {
    const form = document.getElementById('form-item-venda');
    form.reset(); form.classList.remove('was-validated');
    $('#item-idProd').val(null).trigger('change');
    $('#item-valorUnitario').val('');
    $('#item-valorTotal').val('');
    $('#item-estoque-info').text('');
    $('#item-quantidade').val(1);
    new bootstrap.Modal(document.getElementById('modal-item-venda')).show();
  }

  #onProdutoSelecionado() {
    const opt = $('#item-idProd option:selected');
    const valor   = parseFloat(opt.data('valor')   ?? 0);
    const estoque = parseInt(opt.data('estoque')    ?? 0);

    $('#item-valorUnitario').val(valor > 0 ? this.#brl(valor).replace('R$ ','').trim() : '');
    $('#item-quantidade').attr('max', estoque);
    $('#item-estoque-info').text(estoque > 0 ? `Estoque disponível: ${estoque}` : 'Sem estoque');
    this.#recalcItemTotal();
  }

  #recalcItemTotal() {
    const opt = $('#item-idProd option:selected');
    const valor = parseFloat(opt.data('valor') ?? 0);
    const qtd   = parseInt($('#item-quantidade').val()) || 0;
    $('#item-valorTotal').val(qtd > 0 && valor > 0
      ? (qtd * valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
      : ''
    );
  }

  #confirmarItem() {
    const form = document.getElementById('form-item-venda');
    form.classList.add('was-validated');

    const idProd = $('#item-idProd').val();
    if (!idProd) { Toast.show('Selecione um produto.', 'warning'); return; }

    const opt     = $('#item-idProd option:selected');
    const valor   = parseFloat(opt.data('valor') ?? 0);
    const estoque = parseInt(opt.data('estoque')  ?? 0);
    const qtd     = parseInt($('#item-quantidade').val()) || 0;
    const nomeProd = opt.text().split(' — ')[0];

    if (qtd < 1 || !Number.isInteger(qtd)) {
      Toast.show('Quantidade deve ser um inteiro positivo.', 'warning'); return;
    }
    if (qtd > estoque) {
      Toast.show(`Estoque insuficiente. Disponível: ${estoque}.`, 'warning'); return;
    }

    // Verifica se produto já está no carrinho → incrementa
    const existente = this.#itens.find(i => String(i.idProd) === String(idProd));
    if (existente) {
      if (existente.quantidade + qtd > estoque) {
        Toast.show(`Limite de estoque atingido (${estoque} unidades).`, 'warning'); return;
      }
      existente.quantidade += qtd;
      existente.valorTotal   = existente.quantidade * existente.valorUnitario;
    } else {
      this.#itens.push({
        idProd:         idProd,
        nomeProd:       nomeProd,
        quantidade:     qtd,
        valorUnitario:  valor,
        valorTotal:     qtd * valor,
      });
    }

    bootstrap.Modal.getInstance(document.getElementById('modal-item-venda'))?.hide();
    this.#renderItens();
    this.#recalcSummary();
    Toast.show(`${nomeProd} adicionado.`, 'success');
  }

  // ── Render Itens ──────────────────────────────────────────
  #renderItens() {
    const tbody = $('#tbody-itens-venda');
    tbody.empty();

    if (!this.#itens.length) {
      tbody.html(`<tr id="row-sem-itens-venda">
        <td colspan="5" class="text-center py-4 text-muted">
          <i class="bi bi-inbox me-1"></i>Nenhum item adicionado.
        </td>
      </tr>`);
      return;
    }

    this.#itens.forEach((item, idx) => {
      tbody.append(`
        <tr>
          <td class="fw-medium">${this.#esc(item.nomeProd)}</td>
          <td class="text-center">${item.quantidade}</td>
          <td class="text-end">${this.#brl(item.valorUnitario)}</td>
          <td class="text-end fw-semibold">${this.#brl(item.valorTotal)}</td>
          <td class="text-center">
            <button class="btn btn-link text-danger p-0 btn-remover-item"
              data-idx="${idx}" style="font-size:16px;" title="Remover">
              <i class="bi bi-x-circle"></i>
            </button>
          </td>
        </tr>
      `);
    });

    $('.btn-remover-item').on('click', e => {
      const idx = +$(e.currentTarget).data('idx');
      this.#itens.splice(idx, 1);
      this.#renderItens();
      this.#recalcSummary();
    });
  }

  // ── Recalc Summary ────────────────────────────────────────
  #recalcSummary() {
    const totBruto     = this.#itens.reduce((s, i) => s + i.valorTotal, 0);
    const credRaw      = $('#venda-credUtilizado').val();
    let   credUtilizado = this.#parseBrl(credRaw);

    // Valida crédito
    if (credUtilizado > this.#clienteSaldo) {
      credUtilizado = this.#clienteSaldo;
      $('#venda-credUtilizado').val(
        credUtilizado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
      );
    }
    if (credUtilizado > totBruto) {
      credUtilizado = totBruto;
      $('#venda-credUtilizado').val(
        credUtilizado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
      );
    }

    const valorFinal = Math.max(0, totBruto - credUtilizado);
    const qtdTotal   = this.#itens.reduce((s, i) => s + i.quantidade, 0);

    $('#summary-qtd').text(qtdTotal);
    $('#summary-totBruto').text(this.#brl(totBruto));
    $('#summary-valorFinal').text(this.#brl(valorFinal));

    const podeFinzalizar = this.#itens.length > 0
      && !!$('#venda-idUsuario').val()
      && !!$('#venda-idFormaPag').val()
      && !!$('#venda-idCaixa').val();
    $('#btn-finalizar-venda').prop('disabled', !podeFinzalizar);
  }

  // ── Confirmação ───────────────────────────────────────────
  #abrirConfirmacao() {
    const totBruto    = this.#itens.reduce((s, i) => s + i.valorTotal, 0);
    const cred        = this.#parseBrl($('#venda-credUtilizado').val());
    const valorFinal  = Math.max(0, totBruto - cred);
    const cliente     = $('#venda-idUsuario option:selected').text();
    const formaPgto   = $('#venda-idFormaPag option:selected').text();

    const itensHtml = this.#itens.map(i => `
      <tr>
        <td>${this.#esc(i.nomeProd)}</td>
        <td class="text-center">${i.quantidade}</td>
        <td class="text-end">${this.#brl(i.valorTotal)}</td>
      </tr>
    `).join('');

    $('#modal-venda-resumo-final').html(`
      <div class="mb-3">
        <div><strong>Cliente:</strong> ${this.#esc(cliente)}</div>
        <div><strong>Pagamento:</strong> ${this.#esc(formaPgto)}</div>
      </div>
      <div class="table-responsive">
        <table class="table table-sm mb-2">
          <thead><tr><th>Produto</th><th class="text-center">Qtd</th><th class="text-end">Total</th></tr></thead>
          <tbody>${itensHtml}</tbody>
        </table>
      </div>
      <hr class="my-2">
      <div class="d-flex justify-content-between"><span class="text-muted">Total Bruto</span><span>${this.#brl(totBruto)}</span></div>
      ${cred > 0 ? `<div class="d-flex justify-content-between text-success"><span>Crédito</span><span>− ${this.#brl(cred)}</span></div>` : ''}
      <div class="d-flex justify-content-between fw-bold fs-5 mt-1">
        <span>Valor Final</span>
        <span style="color:var(--color-primary)">${this.#brl(valorFinal)}</span>
      </div>
    `);

    new bootstrap.Modal(document.getElementById('modal-confirmar-venda')).show();
  }

  // ── Finalizar Venda ───────────────────────────────────────
  async #finalizarVenda() {
    const totBruto   = this.#itens.reduce((s, i) => s + i.valorTotal, 0);
    const cred       = this.#parseBrl($('#venda-credUtilizado').val());
    const valorFinal = Math.max(0, totBruto - cred);

    const payload = {
      dataHora:       new Date().toISOString(),
      totBruto,
      credUtilizado:  cred,
      valorFinal,
      idUsuario:      parseInt($('#venda-idUsuario').val()),
      idCaixa:        parseInt($('#venda-idCaixa').val()),
      idFormaPag:     parseInt($('#venda-idFormaPag').val()),
      itens: this.#itens.map(i => ({
        idProd:        parseInt(i.idProd),
        quantidade:    i.quantidade,
        valorUnitario: i.valorUnitario,
        valorTotal:    i.valorTotal,
      })),
    };

    const btn = $('#btn-confirmar-finalizar');
    btn.prop('disabled', true).html('<div class="spinner-border spinner-border-sm me-1"></div>');
    try {
      await this.#api.post('/vendas', payload);
      bootstrap.Modal.getInstance(document.getElementById('modal-confirmar-venda'))?.hide();
      $('#sucesso-info').text(`Venda de ${this.#brl(valorFinal)} registrada com sucesso.`);
      new bootstrap.Modal(document.getElementById('modal-venda-sucesso')).show();
      this.#vendaAtiva = false;
      this.#desativarGuardiao();
    } catch (err) {
      Toast.show(err.message || 'Erro ao registrar venda.', 'error');
    } finally {
      btn.prop('disabled', false).html('<i class="bi bi-check-circle me-1"></i> Confirmar e Registrar');
    }
  }

  // ── Guardião de Navegação ─────────────────────────────────
  #ativarGuardiao() {
    window.__agape = window.__agape || {};
    window.__agape.vendaAtiva = true;

    $(document).on('click.guardiao', '#sidebar a', e => {
      if (!this.#vendaAtiva || !this.#itens.length) return;
      e.preventDefault();
      e.stopPropagation();
      this.#guardiaoHref = e.currentTarget.href;
      new bootstrap.Modal(document.getElementById('modal-guardiao')).show();
    });
  }

  #desativarGuardiao() {
    window.__agape = window.__agape || {};
    window.__agape.vendaAtiva = false;
    $(document).off('click.guardiao');
    this.#guardiaoHref = null;
  }

  // ── Helpers ───────────────────────────────────────────────
  #brl(v) {
    return Number(v ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
  #parseBrl(v) {
    if (!v) return 0;
    return parseFloat(String(v).replace(/[^\d,]/g, '').replace(',', '.')) || 0;
  }
  #esc(v) {
    return String(v ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
}
