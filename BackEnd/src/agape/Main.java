package agape;

import com.sun.net.httpserver.HttpServer;

import agape.control.CUsuario;

//import com.sun.net.httpserver.HttpExchange;

//import java.io.OutputStream;
import java.net.InetSocketAddress;

public class Main {

    public static void main(String[] args) throws Exception {

        HttpServer server = HttpServer.create(new InetSocketAddress(8080), 0);

        // == Rotas ==

        // Usuários
        server.createContext("/login", CUsuario.getInstancia());
        server.createContext("/cadastrar", CUsuario.getInstancia());

        //Produtos
        //...

        server.setExecutor(null);
        server.start();

        System.out.println("Servidor rodando em http://localhost:8080");
    }
}