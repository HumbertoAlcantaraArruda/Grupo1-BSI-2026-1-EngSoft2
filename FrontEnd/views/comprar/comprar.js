/* comprar.js — View: vincula eventos ao DOM e delega ao CompraController */

(function () {

    if (!window.AGAPE.Utils.Auth.getInstance().requireLogin()) return;

    // Controllers e Utilitários
    var ctrl      = window.AGAPE.Controllers.CompraController.getInstance();
    var mascaras  = window.AGAPE.Utils.Mascaras.getInstance();
    var validador = window.AGAPE.Utils.Validador.getInstance();

    // Elementos do DOM
    var selectFornecedor = document.getElementById('select-fornecedor');
    var inputNotaFiscal  = document.getElementById('input-nota-fiscal');
    var inputObs         = document.getElementById('input-obs');
    var selectProduto    = document.getElementById('select-produto');
    var itemEstoqueAtual = document.getElementById('item-estoque-atual');
    var itemQuantidade   = document.getElementById('item-quantidade');
    var itemValor        = document.getElementById('item-valor');
    var btnAdicionarItem = document.getElementById('btn-adicionar-item');
    var tabelaItensCorpo = document.getElementById('tabela-itens-corpo');
    
    var resumoTotalItens = document.getElementById('resumo-total-itens');
    var resumoTotalValor = document.getElementById('resumo-total-valor');
    
    var btnCancelar      = document.getElementById('btn-cancelar-compra');
    var btnFinalizar     = document.getElementById('btn-finalizar-compra');

    // Modais e elementos de confirmação
    var modalConfirmarLimparEl  = document.getElementById('modal-confirmar-limpar');
    var modalConfirmarLimpar    = new bootstrap.Modal(modalConfirmarLimparEl);
    var btnConfirmarLimparOk    = document.getElementById('btn-confirmar-limpar-ok');

    var modalConfirmarRemoverEl = document.getElementById('modal-confirmar-remover-item');
    var modalConfirmarRemover   = new bootstrap.Modal(modalConfirmarRemoverEl);
    var btnConfirmarRemoverOk   = document.getElementById('btn-confirmar-remover-item-ok');
    var removerItemNomeEl       = document.getElementById('remover-item-nome');

    var modalItemAtualizadoEl   = document.getElementById('modal-item-atualizado');
    var modalItemAtualizado     = new bootstrap.Modal(modalItemAtualizadoEl);
    var alertaProdutoNomeEl     = document.getElementById('alerta-produto-nome');
    var alertaProdutoQtdEl      = document.getElementById('alerta-produto-qtd');

    var indexParaRemover        = null;

    // Estado local da compra
    var itensCompra = []; // Array de { idProd: int, nome: string, quantidade: int, valorUnitario: float }

    // Inicialização da Página
    async function inicializar() {
        // Exibe o corpo após validação de login
        document.body.style.display = 'block';
        window.AGAPE.Utils.Sidebar.inicializar();
        
        // Aplica as máscaras
        mascaras.aplicar('#item-valor', 'monetario');

        // Carrega Fornecedores e Produtos
        await Promise.all([
            _carregarFornecedores(),
            _carregarProdutos()
        ]);
        
        _renderizarTabela();
    }

    // Carrega fornecedores no select
    async function _carregarFornecedores() {
        var resultado = await ctrl.carregarFornecedores();
        if (resultado.status !== 'ok' || !Array.isArray(resultado.dados)) {
            selectFornecedor.innerHTML = '<option value="">Erro ao carregar fornecedores</option>';
            return;
        }

        var opcoes = resultado.dados.map(function (f) {
            var label = _escapar(f.nome);
            if (f.cnpj) {
                label += ' (' + _escapar(f.cnpj) + ')';
            }
            return '<option value="' + f.idFornec + '">' + label + '</option>';
        }).join('');

        selectFornecedor.innerHTML = '<option value="">Selecione um fornecedor...</option>' + opcoes;
    }

    // Carrega produtos no select
    async function _carregarProdutos() {
        var resultado = await ctrl.carregarProdutos();
        if (resultado.status !== 'ok' || !Array.isArray(resultado.dados)) {
            selectProduto.innerHTML = '<option value="">Erro ao carregar produtos</option>';
            return;
        }

        var opcoes = resultado.dados.map(function (p) {
            return '<option value="' + p.idProd + '" data-nome="' + _escapar(p.nome) + '" data-valor="' + p.valorUni + '" data-estoque="' + p.qtdeAtual + '">' + _escapar(p.nome) + '</option>';
        }).join('');

        selectProduto.innerHTML = '<option value="">Selecione um produto...</option>' + opcoes;
    }

    // Evento: Produto selecionado no dropdown (sugere o último valor unitário)
    selectProduto.addEventListener('change', function () {
        var opcaoSel = selectProduto.options[selectProduto.selectedIndex];
        if (opcaoSel && opcaoSel.value) {
            var valorPadrao = opcaoSel.dataset.valor;
            mascaras.remover('#item-valor');
            itemValor.value = mascaras.numeroParaMonetario(parseFloat(valorPadrao));
            mascaras.aplicar('#item-valor', 'monetario');

            // Exibe o estoque atual do produto selecionado logo abaixo da busca
            itemEstoqueAtual.value = opcaoSel.dataset.estoque != null ? opcaoSel.dataset.estoque : '—';
        } else {
            itemValor.value = '';
            itemEstoqueAtual.value = '—';
        }
    });

    // Evento: Adicionar Item
    btnAdicionarItem.addEventListener('click', function () {
        var formItem = document.getElementById('form-item');
        if (!validador.validarFormulario(formItem)) return;

        var idProd = parseInt(selectProduto.value);
        var opcaoSel = selectProduto.options[selectProduto.selectedIndex];
        var nomeProd = opcaoSel.dataset.nome;
        var qtd = parseInt(itemQuantidade.value);
        var valor = mascaras.monetarioParaNumero(itemValor.value);

        if (isNaN(qtd) || qtd <= 0) {
            validador.mostrarAlerta('Quantidade inválida.', 'erro');
            return;
        }

        if (isNaN(valor) || valor <= 0) {
            validador.mostrarAlerta('Valor unitário deve ser maior que zero.', 'erro');
            return;
        }

        // Verifica se o produto já existe no carrinho
        var indexExistente = itensCompra.findIndex(function (item) { return item.idProd === idProd; });

        if (indexExistente !== -1) {
            itensCompra[indexExistente].quantidade += qtd;
            itensCompra[indexExistente].valorUnitario = valor; // atualiza para o valor mais recente
            
            // Exibe modal de aviso de item já existente
            alertaProdutoNomeEl.textContent = nomeProd;
            alertaProdutoQtdEl.textContent = itensCompra[indexExistente].quantidade;
            modalItemAtualizado.show();
        } else {
            itensCompra.push({
                idProd: idProd,
                nome: nomeProd,
                quantidade: qtd,
                valorUnitario: valor
            });
            validador.mostrarAlerta('Produto adicionado ao carrinho com sucesso.', 'sucesso');
        }

        // Reseta inputs de produto
        selectProduto.selectedIndex = 0;
        itemEstoqueAtual.value = '—';
        itemQuantidade.value = 1;
        itemValor.value = '';
        validador.resetar(formItem);

        _renderizarTabela();
    });

    // Renderiza itens na tabela de compra
    function _renderizarTabela() {
        if (itensCompra.length === 0) {
            tabelaItensCorpo.innerHTML = 
                '<tr>' +
                '<td colspan="5" class="item-tabela-vazio">' +
                '<i class="bi bi-cart3 fs-2 d-block mb-2 text-muted"></i>' +
                'Nenhum produto adicionado ainda.' +
                '</td>' +
                '</tr>';
            
            resumoTotalItens.textContent = '0';
            resumoTotalValor.textContent = '0,00';
            btnFinalizar.disabled = true;
            return;
        }

        var totalQtd = 0;
        var totalValor = 0;

        var html = itensCompra.map(function (item, index) {
            var subtotal = item.quantidade * item.valorUnitario;
            totalQtd += item.quantidade;
            totalValor += subtotal;

            return (
                '<tr>' +
                '<td>' + _escapar(item.nome) + '</td>' +
                '<td class="text-center">' + item.quantidade + '</td>' +
                '<td class="text-end">R$ ' + mascaras.numeroParaMonetario(item.valorUnitario) + '</td>' +
                '<td class="text-end fw-bold">R$ ' + mascaras.numeroParaMonetario(subtotal) + '</td>' +
                '<td class="text-center">' +
                '<button type="button" class="btn-acao btn-excluir btn-remover-item" data-index="' + index + '" title="Remover">' +
                '<i class="bi bi-trash"></i>' +
                '</button>' +
                '</td>' +
                '</tr>'
            );
        }).join('');

        tabelaItensCorpo.innerHTML = html;
        resumoTotalItens.textContent = totalQtd;
        resumoTotalValor.textContent = mascaras.numeroParaMonetario(totalValor);
        
        btnFinalizar.disabled = !selectFornecedor.value;

        // Binda botões de remover item
        document.querySelectorAll('.btn-remover-item').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var idx = parseInt(this.dataset.index);
                indexParaRemover = idx;
                
                var item = itensCompra[idx];
                removerItemNomeEl.textContent = item ? item.nome : '';
                
                modalConfirmarRemover.show();
            });
        });
    }

    // Se selecionar ou desmarcar fornecedor, atualiza estado de finalização
    selectFornecedor.addEventListener('change', function () {
        btnFinalizar.disabled = (!selectFornecedor.value || itensCompra.length === 0);
    });

    // Evento: Limpar Tudo
    btnCancelar.addEventListener('click', function () {
        if (itensCompra.length > 0) {
            modalConfirmarLimpar.show();
        } else {
            _limparTudo();
            validador.mostrarAlerta('Campos e carrinho limpos.', 'sucesso');
        }
    });

    btnConfirmarLimparOk.addEventListener('click', function () {
        modalConfirmarLimpar.hide();
        _limparTudo();
        validador.mostrarAlerta('Campos e carrinho limpos.', 'sucesso');
    });

    btnConfirmarRemoverOk.addEventListener('click', function () {
        if (indexParaRemover !== null && indexParaRemover !== undefined) {
            itensCompra.splice(indexParaRemover, 1);
            modalConfirmarRemover.hide();
            indexParaRemover = null;
            validador.mostrarAlerta('Produto removido do carrinho.', 'informacao');
            _renderizarTabela();
        }
    });

    function _limparTudo() {
        itensCompra = [];
        
        // Reseta selects e inputs
        selectFornecedor.selectedIndex = 0;
        inputNotaFiscal.value = '';
        inputObs.value = '';
        selectProduto.selectedIndex = 0;
        itemEstoqueAtual.value = '—';
        itemQuantidade.value = 1;
        
        // Reseta campo com máscara com segurança
        mascaras.remover('#item-valor');
        itemValor.value = '';
        mascaras.aplicar('#item-valor', 'monetario');
        
        // Reseta validações visuais dos formulários
        validador.resetar(document.getElementById('form-fornecedor'));
        validador.resetar(document.getElementById('form-item'));
        
        _renderizarTabela();
    }

    // Evento: Finalizar Compra
    btnFinalizar.addEventListener('click', async function () {
        if (!selectFornecedor.value) {
            validador.mostrarAlerta('Por favor, selecione o fornecedor.', 'erro');
            return;
        }

        if (itensCompra.length === 0) {
            validador.mostrarAlerta('Adicione pelo menos um produto.', 'erro');
            return;
        }

        var totalValor = itensCompra.reduce(function (acc, item) {
            return acc + (item.quantidade * item.valorUnitario);
        }, 0);

        var idProdutosArr = itensCompra.map(function (item) { return item.idProd; }).join(',');
        var quantidadesArr = itensCompra.map(function (item) { return item.quantidade; }).join(',');
        var valoresUnitariosArr = itensCompra.map(function (item) { return item.valorUnitario; }).join(',');

        var usuario = window.AGAPE.Utils.Auth.getInstance().getUsuario();
        var idUsuario = usuario ? usuario.idUsuario : 1; // Fallback adm

        var dados = {
            idFornecedor:     parseInt(selectFornecedor.value),
            idUsuario:        idUsuario,
            valorTotal:       totalValor,
            numNotaFiscal:    inputNotaFiscal.value.trim(),
            obs:              inputObs.value.trim(),
            idProdutos:       idProdutosArr,
            quantidades:      quantidadesArr,
            valoresUnitarios: valoresUnitariosArr
        };

        btnFinalizar.disabled = true;
        btnFinalizar.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>Processando...';

        var resultado = await ctrl.efetuarCompra(dados);

        btnFinalizar.innerHTML = '<i class="bi bi-check-circle me-1"></i>Finalizar Compra';
        btnFinalizar.disabled = false;

        if (resultado.status === 'ok') {
            validador.mostrarAlerta('Compra de produtos efetuada com sucesso! O estoque foi atualizado automaticamente.', 'sucesso');
            _limparTudo();
            // Recarrega dropdown de produtos com o saldo atualizado
            await _carregarProdutos();
        } else {
            validador.mostrarAlerta(resultado.erro || 'Falha ao registrar compra de produtos.', 'erro');
        }
    });

    // Escapa HTML
    function _escapar(texto) {
        if (texto === null || texto === undefined) return '';
        return String(texto)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    }

    document.addEventListener('DOMContentLoaded', inicializar);

})();