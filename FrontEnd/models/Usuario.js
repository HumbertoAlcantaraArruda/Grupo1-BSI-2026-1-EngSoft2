/* Usuario — entidade com validações e serialização para o backend */

window.AGAPE = window.AGAPE || {};
window.AGAPE.Models = window.AGAPE.Models || {};

window.AGAPE.Models.Usuario = (function () {

    function Usuario(dados) {
        dados = dados || {};
        this._idUsuario = dados.idUsuario || null;
        this._nome      = dados.nome      || '';
        this._cpf       = dados.cpf       || '';
        this._email     = dados.email     || '';
        this._senha     = dados.senha     || '';
        this._nivel     = dados.nivel     || '';
        this._status    = dados.status !== undefined ? dados.status : 1;
    }

    Usuario.prototype.getIdUsuario = function () { return this._idUsuario; };
    Usuario.prototype.getNome      = function () { return this._nome;      };
    Usuario.prototype.getCpf       = function () { return this._cpf;       };
    Usuario.prototype.getEmail     = function () { return this._email;     };
    Usuario.prototype.getNivel     = function () { return this._nivel;     };
    Usuario.prototype.getStatus    = function () { return this._status;    };

    Usuario.prototype.setIdUsuario = function (v) { this._idUsuario = v; };
    Usuario.prototype.setNome      = function (v) { this._nome      = v; };
    Usuario.prototype.setCpf       = function (v) { this._cpf       = v; };
    Usuario.prototype.setEmail     = function (v) { this._email     = v; };
    Usuario.prototype.setNivel     = function (v) { this._nivel     = v; };
    Usuario.prototype.setStatus    = function (v) { this._status    = v; };

    Usuario.prototype.validarNome  = function () {
        return typeof this._nome === 'string' && this._nome.trim().length >= 2;
    };
    Usuario.prototype.validarCpf   = function () {
        return /^\d{11}$/.test(this._cpf.replace(/\D/g, ''));
    };
    Usuario.prototype.validarEmail = function () {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this._email.trim());
    };
    Usuario.prototype.validarNivel = function () {
        return ['ADM', 'COLAB', 'PAROQ'].indexOf(this._nivel) !== -1;
    };
    Usuario.prototype.validarSenha = function () {
        return typeof this._senha === 'string' && this._senha.length >= 6;
    };

    Usuario.prototype.validar = function (novoCadastro) {
        var erros = [];
        if (!this.validarNome())  erros.push('Nome deve ter pelo menos 2 caracteres.');
        if (!this.validarCpf())   erros.push('CPF inválido.');
        if (!this.validarEmail()) erros.push('E-mail inválido.');
        if (!this.validarNivel()) erros.push('Nível é obrigatório.');
        if (novoCadastro && !this.validarSenha()) erros.push('Senha deve ter pelo menos 6 caracteres.');
        return erros;
    };

    Usuario.prototype.paraFormData = function (novoCadastro) {
        var dados = {
            nome:  this._nome.trim(),
            cpf:   this._cpf.replace(/\D/g, ''),
            email: this._email.trim(),
            nivel: this._nivel
        };
        if (novoCadastro) {
            dados.senha = this._senha;
        } else {
            dados.id = this._idUsuario;
        }
        return dados;
    };

    return Usuario;

})();
