package agape;

import com.sun.net.httpserver.HttpServer;

import agape.control.CCategoriaEvento;
import agape.control.CCategoriaProduto;
import agape.control.CCompra;
import agape.control.CInscricao;
import agape.control.CParametrizacao;
import agape.control.CUsuario;
import agape.control.CProduto;

//import com.sun.net.httpserver.HttpExchange;

//import java.io.OutputStream;
import java.net.InetSocketAddress;

public class Main {

    public static void main(String[] args) throws Exception {

        HttpServer server = HttpServer.create(new InetSocketAddress(8080), 0);

        // == Rotas ==

        // Parametrização
        //server.createContext("/parametrizacao", CParametrizacao.getInstancia());

        // Produtos
        server.createContext("/produto", CProduto.getInstancia());

        // Categorias de Evento
        server.createContext("/categoriaEvento", CCategoriaEvento.getInstancia());


        // ===== ROTAS AINDA NÃO CONFIGURADAS =====
        // Usuários
        //server.createContext("/login",    CUsuario.getInstancia());
        //server.createContext("/cadastrar", CUsuario.getInstancia());
        //server.createContext("/usuarios",  CUsuario.getInstancia());
        //server.createContext("/usuario",   CUsuario.getInstancia());
        //Compras de Produtos
        //server.createContext("/comprar", CCompra.getInstancia());
        // Inscrições
        //server.createContext("/cancelarInscricao", CInscricao.getInstancia());
        // Categorias de Produto
        //server.createContext("/categoriaProduto", CCategoriaProduto.getInstancia());



        server.setExecutor(null);
        server.start();

        System.out.println("Servidor rodando em http://localhost:8080");
    }
}
