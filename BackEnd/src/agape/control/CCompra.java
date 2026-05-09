package agape.control;

import java.io.IOException;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpExchange;
import java.time.LocalDateTime;
import java.sql.Connection;
import java.sql.SQLException;

import agape.dao.CompraDAO;
import agape.dao.ItemCompraDAO;
import agape.dao.ProdutoDAO;
import agape.model.Compra;
import agape.model.ItemCompra;
import agape.util.ResponseObject;

public class CCompra implements HttpHandler {

    private static CCompra instancia;
    private CompraDAO compraDAO;
    private ItemCompraDAO itemCompraDAO;
    private ProdutoDAO produtoDAO;

    private CCompra() {
        compraDAO = new CompraDAO();
        itemCompraDAO = new ItemCompraDAO();
        produtoDAO = new ProdutoDAO();
    }

    public static CCompra getInstancia() {
        if (instancia == null) {
            instancia = new CCompra();
        }
        return instancia;
    }

    private void enviarResposta(HttpExchange exchange, ResponseObject response) throws IOException {
        String json = response.toJson();
        byte[] bytes = json.getBytes("UTF-8");
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
        exchange.sendResponseHeaders(response.getCode(), bytes.length);
        exchange.getResponseBody().write(bytes);
        exchange.close();
    }

    private String extrairParam(HttpExchange exchange, String chave) {
        String query = exchange.getRequestURI().getQuery();
        String body = "";
        try {
            if (exchange.getRequestMethod().equalsIgnoreCase("POST")) {
                body = new String(exchange.getRequestBody().readAllBytes());
            }
        } catch (Exception e) {}

        String fullStr = (query != null ? query : "") + "&" + body;

        try {
            for (String par : fullStr.split("&")) {
                String[] kv = par.split("=");
                if (kv[0].equals(chave)) {
                    String valor = kv.length > 1 ? kv[1] : "";
                    return java.net.URLDecoder.decode(valor, "UTF-8");
                }
            }
        } catch (Exception e) {}
        return "";
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        // CORREÇÃO: Envolvendo tudo em try-catch para evitar ERR_EMPTY_RESPONSE
        try {
            String path = exchange.getRequestURI().getPath();

            if (path.equals("/comprar")) {
                int idFornecedor = Integer.parseInt(extrairParam(exchange, "idFornecedor"));
                int idUsuario = Integer.parseInt(extrairParam(exchange, "idUsuario"));
                float valorTotal = Float.parseFloat(extrairParam(exchange, "valorTotal"));
                
                String[] idsProdutosStr = extrairParam(exchange, "idProdutos").split(",");
                String[] quantidadesStr = extrairParam(exchange, "quantidades").split(",");
                String[] valoresUnitariosStr = extrairParam(exchange, "valoresUnitarios").split(",");

                int[] idsProdutos = new int[idsProdutosStr.length];
                int[] quantidades = new int[quantidadesStr.length];
                float[] valoresUnitarios = new float[valoresUnitariosStr.length];

                for (int i = 0; i < idsProdutosStr.length; i++) {
                    idsProdutos[i] = Integer.parseInt(idsProdutosStr[i]);
                    quantidades[i] = Integer.parseInt(quantidadesStr[i]);
                    valoresUnitarios[i] = Float.parseFloat(valoresUnitariosStr[i]);
                }

                ResponseObject response = efetuarCompraDeProdutos(idFornecedor, idUsuario, valorTotal, idsProdutos, quantidades, valoresUnitarios);
                enviarResposta(exchange, response);
            }
        } catch (Exception e) {
            ResponseObject errorResponse = new ResponseObject();
            errorResponse.setStatus(ResponseObject.STATUS_FAIL);
            errorResponse.setCode(ResponseObject.CODE_ERROR);
            errorResponse.addMessage("Erro: " + e.getMessage());
            try {
                enviarResposta(exchange, errorResponse);
            } catch (IOException ioe) {}
        }
    }

    public ResponseObject efetuarCompraDeProdutos(int idFornecedor, int idUsuario, float valorTotal, int[] idsProdutos, int[] quantidades, float[] valoresUnitarios) {
        ResponseObject response = new ResponseObject();
        Connection conn = null;
        try {
            conn = ConexaoBD.getInstance().getConexao();
            conn.setAutoCommit(false);
            Compra compra = new Compra();
            compra.setDataHora(LocalDateTime.now());
            compra.setValorTotal(valorTotal);
            compra.setIdFornecedor(idFornecedor);
            compra.setIdUsuario(idUsuario);

            int idDaCompraGerada = compraDAO.inserir(conn, compra);
            for (int i = 0; i < idsProdutos.length; i++) {
                ItemCompra item = new ItemCompra();
                item.setIdCompra(idDaCompraGerada);
                item.setIdProd(idsProdutos[i]);
                item.setQuantidade(quantidades[i]);
                item.setValorUnitario(valoresUnitarios[i]);
                itemCompraDAO.inserir(conn, item);
                produtoDAO.atualizarEstoque(conn, idsProdutos[i], quantidades[i]);
            }
            conn.commit();
            response.setStatus(ResponseObject.STATUS_OK);
            response.setCode(ResponseObject.CODE_OK);
            response.addMessage("Compra efetuada com sucesso!");
        } catch (Exception e) {
            try { if (conn != null) conn.rollback(); } catch (SQLException se) {}
            response.setStatus(ResponseObject.STATUS_FAIL);
            response.setCode(ResponseObject.CODE_ERROR);
            response.addMessage("Erro: " + e.getMessage());
        } finally {
            try { if (conn != null) conn.setAutoCommit(true); } catch (SQLException se) {}
        }
        return response;
    }
}
