package agape;

import com.sun.net.httpserver.HttpServer;

import agape.control.CCategoriaEvento;
import agape.control.CControlarEventos;
import agape.control.CRealizarInscricao;
import agape.control.CEvento;
import agape.control.CEventoStatus;
import agape.control.CCategoriaProduto;
import agape.control.CCompra;
import agape.control.CFornecedor;
import agape.control.CFormaPagamento;
import agape.control.CParametrizacao;
import agape.control.CUsuario;
import agape.control.CProduto;
import agape.control.CVenda;
import agape.security.AuthFilter;

import java.net.InetSocketAddress;

public class Main {

    public static void main(String[] args) throws Exception {

        HttpServer server = HttpServer.create(new InetSocketAddress(8080), 0);

        // == Rotas ==

        // Públicas (acessadas sem token)
        server.createContext("/login",       CUsuario.getInstancia());


        // Rotas operacionais — ADM e COLAB
        server.createContext("/trocarSenha", new AuthFilter(CUsuario.getInstancia(), "ADM", "COLAB"));
        server.createContext("/parametrizacao",    new AuthFilter(CParametrizacao.getInstancia(),   "ADM", "COLAB"));
        server.createContext("/formaPagamento",    new AuthFilter(CFormaPagamento.getInstancia(),   "ADM", "COLAB"));
        server.createContext("/categoriaProduto",  new AuthFilter(CCategoriaProduto.getInstancia(), "ADM", "COLAB"));
        server.createContext("/produto",           new AuthFilter(CProduto.getInstancia(),          "ADM", "COLAB"));
        server.createContext("/categoriaEvento",   new AuthFilter(CCategoriaEvento.getInstancia(),  "ADM", "COLAB"));
        server.createContext("/eventoStatus",      new AuthFilter(CEventoStatus.getInstancia(),     "ADM", "COLAB"));
        server.createContext("/evento",            new AuthFilter(CEvento.getInstancia(),           "ADM", "COLAB"));
        // RF_F1 — Controlar Eventos (CRUD completo + abrir/fechar/lista de espera, com transações)
        server.createContext("/controlarEvento",  new AuthFilter(CControlarEventos.getInstancia(), "ADM", "COLAB"));
        // RF_F3 — Realizar Inscrição (GOF Facade + transação atômica)
        server.createContext("/realizarInscricao", new AuthFilter(CRealizarInscricao.getInstancia(), "ADM", "COLAB"));
        server.createContext("/fornecedor",        new AuthFilter(CFornecedor.getInstancia(),       "ADM", "COLAB"));
        server.createContext("/comprar",           new AuthFilter(CCompra.getInstancia(),           "ADM", "COLAB"));


        // Venda de produtos — ADM e COLAB
        server.createContext("/paroquiano", new AuthFilter(CVenda.getInstancia(), "ADM", "COLAB"));
        server.createContext("/venda",      new AuthFilter(CVenda.getInstancia(), "ADM", "COLAB"));

        // Gestão de usuários — ADM e COLAB (COLAB só consegue criar/alterar PAROQ; regra dentro do controller)
        server.createContext("/cadastrar", new AuthFilter(CUsuario.getInstancia(), "ADM", "COLAB"));
        server.createContext("/usuarios",  new AuthFilter(CUsuario.getInstancia(), "ADM", "COLAB"));
        server.createContext("/usuario",   new AuthFilter(CUsuario.getInstancia(), "ADM", "COLAB"));

        server.setExecutor(null);
        server.start();

        System.out.println("Servidor rodando em http://localhost:8080");
    }
}
