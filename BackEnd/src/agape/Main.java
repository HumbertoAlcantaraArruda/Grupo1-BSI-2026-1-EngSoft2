package agape;

import com.sun.net.httpserver.HttpServer;

import agape.control.CCategoriaEvento;
import agape.control.CCategoriaProduto;
import agape.control.CCompra;
import agape.control.CFornecedor;
import agape.control.CFormaPagamento;
import agape.control.CInscricao;
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
        server.createContext("/trocarSenha", CUsuario.getInstancia());

        // Rotas operacionais — ADM e COLAB
        server.createContext("/parametrizacao",    new AuthFilter(CParametrizacao.getInstancia(),   "ADM", "COLAB"));
        server.createContext("/formaPagamento",    new AuthFilter(CFormaPagamento.getInstancia(),   "ADM", "COLAB"));
        server.createContext("/categoriaProduto",  new AuthFilter(CCategoriaProduto.getInstancia(), "ADM", "COLAB"));
        server.createContext("/produto",           new AuthFilter(CProduto.getInstancia(),          "ADM", "COLAB"));
        server.createContext("/categoriaEvento",   new AuthFilter(CCategoriaEvento.getInstancia(),  "ADM", "COLAB"));
        server.createContext("/fornecedor",        new AuthFilter(CFornecedor.getInstancia(),       "ADM", "COLAB"));
        server.createContext("/comprar",           new AuthFilter(CCompra.getInstancia(),           "ADM", "COLAB"));
        server.createContext("/cancelarInscricao", new AuthFilter(CInscricao.getInstancia(),        "ADM", "COLAB"));

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
