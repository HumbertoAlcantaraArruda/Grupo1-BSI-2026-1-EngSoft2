/* Inscricao — entidade frontend (GRASP Information Expert) */

window.AGAPE = window.AGAPE || {};
window.AGAPE.Models = window.AGAPE.Models || {};

window.AGAPE.Models.Inscricao = (function () {

    function Inscricao(dados) {
        dados = dados || {};
        this._idUsuario = dados.idUsuario || null; // idUsuario do Paroquiano
        this._idEvento  = dados.idEvento  || null;
    }

    // GRASP Information Expert — a entidade valida seus próprios dados
    Inscricao.prototype.validar = function () {
        var erros = [];
        if (!this._idUsuario) erros.push('Paroquiano é obrigatório.');
        if (!this._idEvento)  erros.push('Evento é obrigatório.');
        return erros;
    };

    Inscricao.prototype.paraJson = function () {
        return { idUsuario: this._idUsuario, idEvento: this._idEvento };
    };

    return Inscricao;

})();
