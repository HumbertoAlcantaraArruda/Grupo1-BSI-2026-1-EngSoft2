package agape.control;

import java.io.IOException;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpExchange;
import java.time.LocalDateTime;
import java.sql.Connection;
import java.sql.SQLException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;

import agape.model.Compra;
import agape.model.ItemCompra;
import agape.util.ResponseObject;
import agape.util.TradutorErro;

public class CCompra implements HttpHandler {

    private static CCompra instancia;

    private CCompra() {
    }

    public static CCompra getInstancia() {
        if (instancia == null) {
            instancia = new CCompra();
        }
        return instancia;
    }

    private void enviarResposta(HttpExchange exchange, ResponseObject response) throws IOException {
        String json = response.toJson();
        byte[] bytes = json.getBytes(StandardCharsets.UTF_8);

        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type");

        exchange.sendResponseHeaders(response.getCode(), bytes.length);
        exchange.getResponseBody().write(bytes);
        exchange.close();
    }

    private String extrairParam(HttpExchange exchange, String body, String chave) {
        String query = exchange.getRequestURI().getQuery();
        String fullStr = (query != null ? query : "") + "&" + (body != null ? body : "");

        for (String par : fullStr.split("&")) {
            String[] kv = par.split("=");
            if (kv.length > 0 && kv[0].equals(chave)) {
                try {
                    String valor = kv.length > 1 ? kv[1] : "";
                    return URLDecoder.decode(valor, StandardCharsets.UTF_8.toString());
                } catch (Exception e) { return ""; }
            }
        }
        return "";
    }

    private float parseSafeFloat(String val) {
        if (val == null || val.trim().isEmpty()) return 0;
        try {
            return Float.parseFloat(val.trim().replace(",", "."));
        } catch (Exception e) { return 0; }
    }

    private int parseSafeInt(String val) {
        if (val == null || val.trim().isEmpty()) return 0;
        try {
            return Integer.parseInt(val.trim());
        } catch (Exception e) { return 0; }
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        String method = exchange.getRequestMethod();

        if (method.equalsIgnoreCase("OPTIONS")) {
            enviarResposta(exchange, new ResponseObject());
            return;
        }

        try {
            if (method.equalsIgnoreCase("POST")) {
                Connection conn = ConexaoBD.getInstance().getConexao();
                String body = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);

                int idFornecedor = parseSafeInt(extrairParam(exchange, body, "idFornecedor"));
                int idUsuario = parseSafeInt(extrairParam(exchange, body, "idUsuario"));
                float valorTotal = parseSafeFloat(extrairParam(exchange, body, "valorTotal"));

                String[] idsProdutosStr = extrairParam(exchange, body, "idProdutos").split(",");
                String[] quantidadesStr = extrairParam(exchange, body, "quantidades").split(",");
                String[] valoresUnitariosStr = extrairParam(exchange, body, "valoresUnitarios").split(",");

                int n = idsProdutosStr.length;
                int[] idsProdutos = new int[n];
                int[] quantidades = new int[n];
                float[] valoresUnitarios = new float[n];

                for (int i = 0; i < n; i++) {
                    idsProdutos[i] = parseSafeInt(idsProdutosStr[i]);
                    quantidades[i] = parseSafeInt(quantidadesStr[i]);
                    valoresUnitarios[i] = parseSafeFloat(valoresUnitariosStr[i]);
                }

                ResponseObject response = efetuarCompraDeProdutos(conn, idFornecedor, idUsuario, valorTotal, idsProdutos, quantidades, valoresUnitarios);
                enviarResposta(exchange, response);
            }
        } catch (Exception e) {
            ResponseObject error = new ResponseObject();
            error.setStatus(ResponseObject.STATUS_FAIL);
            error.setCode(ResponseObject.CODE_ERROR);
            error.addMessage(TradutorErro.traduzir(e));
            enviarResposta(exchange, error);
        }
    }

    public ResponseObject efetuarCompraDeProdutos(Connection conn, int idFornecedor, int idUsuario, float valorTotal, int[] idsProdutos, int[] quantidades, float[] valoresUnitarios) {
        ResponseObject response = new ResponseObject();
        try {
            conn.setAutoCommit(false);

            Compra compra = new Compra();
            compra.setDataHora(LocalDateTime.now());
            compra.setValorTotal(valorTotal);
            compra.setIdFornecedor(idFornecedor);
            compra.setIdUsuario(idUsuario);

            int idCompra = compra.inserir(conn);

            for (int i = 0; i < idsProdutos.length; i++) {
                if (idsProdutos[i] > 0) {
                    ItemCompra item = new ItemCompra();
                    item.setIdCompra(idCompra);
                    item.setIdProd(idsProdutos[i]);
                    item.setQuantidade(quantidades[i]);
                    item.setValorUnitario(valoresUnitarios[i]);
                    item.inserir(conn);
                }
            }

            conn.commit();
            response.setStatus(ResponseObject.STATUS_OK);
            response.setCode(ResponseObject.CODE_OK);
            response.addMessage("Compra efetuada com sucesso!");
        } catch (Exception e) {
            try { if (conn != null) conn.rollback(); } catch (SQLException se) {}
            response.setStatus(ResponseObject.STATUS_FAIL);
            response.setCode(ResponseObject.CODE_ERROR);
            response.addMessage(TradutorErro.traduzir(e));
        } finally {
            try { if (conn != null) conn.setAutoCommit(true); } catch (SQLException se) {}
        }
        return response;
    }
}

