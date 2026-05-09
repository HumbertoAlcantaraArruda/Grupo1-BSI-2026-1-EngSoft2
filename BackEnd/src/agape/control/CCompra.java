package agape.control;

import java.io.IOException;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpExchange;
import java.time.LocalDateTime;

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

    // --- MÉTODOS DE APOIO ---
    private void enviarResposta(HttpExchange exchange, ResponseObject response) throws IOException {
        String json = response.toJson();
        byte[] bytes = json.getBytes("UTF-8");

        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
        exchange.sendResponseHeaders(response.getCode(), bytes.length);
        exchange.getResponseBody().write(bytes);
        exchange.close();
    }

    private String extrairParam(String body, String chave) {
        for (String par : body.split("&")) {
            String[] kv = par.split("=");
            if (kv[0].equals(chave))
                return kv.length > 1 ? kv[1] : "";
        }
        return "";
    }

    // --- GERENCIADOR DE ROTAS ---
    @Override
    public void handle(HttpExchange exchange) throws IOException {
        String method = exchange.getRequestMethod();
        String path = exchange.getRequestURI().getPath();

        if (method.equalsIgnoreCase("POST") && path.equals("/comprar")) {
            
            try {
                String body = new String(exchange.getRequestBody().readAllBytes());

                // Extraindo os dados principais (Convertendo de String para Inteiro/Float onde necessário)
                // Usando try-catch para evitar que a aplicação quebre se enviarem texto no lugar de número
                int idFornecedor = Integer.parseInt(extrairParam(body, "idFornecedor"));
                int idUsuario = Integer.parseInt(extrairParam(body, "idUsuario"));
                float valorTotal = Float.parseFloat(extrairParam(body, "valorTotal"));
                
                // Extraindo a lista de produtos. No corpo da requisição eles viriam separados por vírgula, ex: idProduto=1,2,3
                String[] idsProdutosStr = extrairParam(body, "idProdutos").split(",");
                String[] quantidadesStr = extrairParam(body, "quantidades").split(",");
                String[] valoresUnitariosStr = extrairParam(body, "valoresUnitarios").split(",");

                // Convertendo as listas de String para as listas de números que a função principal espera
                int[] idsProdutos = new int[idsProdutosStr.length];
                int[] quantidades = new int[quantidadesStr.length];
                float[] valoresUnitarios = new float[valoresUnitariosStr.length];

                for (int i = 0; i < idsProdutosStr.length; i++) {
                    idsProdutos[i] = Integer.parseInt(idsProdutosStr[i]);
                    quantidades[i] = Integer.parseInt(quantidadesStr[i]);
                    valoresUnitarios[i] = Float.parseFloat(valoresUnitariosStr[i]);
                }

                // Finalmente, chamando a sua função principal!
                ResponseObject response = efetuarCompraDeProdutos(idFornecedor, idUsuario, valorTotal, idsProdutos, quantidades, valoresUnitarios);
                
                enviarResposta(exchange, response);

            } catch (Exception e) {
                // Se der erro na conversão (ex: mandaram letra em vez de número), enviamos um erro.
                ResponseObject errorResponse = new ResponseObject();
                errorResponse.setStatus(ResponseObject.STATUS_FAIL);
                errorResponse.setCode(ResponseObject.CODE_FAILED);
                errorResponse.addMessage("Erro nos dados enviados. Verifique se estão no formato correto.");
                enviarResposta(exchange, errorResponse);
            }
            
        } else {
            String response = "Endpoint não encontrado";
            exchange.sendResponseHeaders(404, response.length());
            exchange.getResponseBody().write(response.getBytes());
            exchange.close();
        }
    }

    // =========================================================
    //  SUA FUNÇÃO PRINCIPAL: EFETUAR COMPRA DE PRODUTOS
    // =========================================================
    public ResponseObject efetuarCompraDeProdutos(int idFornecedor, int idUsuario, float valorTotal, int[] idsProdutos, int[] quantidades, float[] valoresUnitarios) {
        
        ResponseObject response = new ResponseObject();

        try {
            // 1. Cria o objeto "Compra" geral
            Compra compra = new Compra();
            compra.setDataHora(LocalDateTime.now());
            compra.setValorTotal(valorTotal);
            compra.setIdFornecedor(idFornecedor);
            compra.setIdUsuario(idUsuario);

            // 2. Salva a compra no banco e pega o ID que foi gerado
            int idDaCompraGerada = compraDAO.inserir(compra);

            // 3. Loop para salvar cada item da compra e atualizar o estoque
            for (int i = 0; i < idsProdutos.length; i++) {
                
                int idProduto = idsProdutos[i];
                int quantidade = quantidades[i];
                float valorUnitario = valoresUnitarios[i];

                // a) Cria o objeto ItemCompra
                ItemCompra item = new ItemCompra();
                item.setIdCompra(idDaCompraGerada);
                item.setIdProd(idProduto);
                item.setQuantidade(quantidade);
                item.setValorUnitario(valorUnitario);

                // b) Salva o ItemCompra no banco (usando o DAO do item)
                itemCompraDAO.inserir(item);

                // c) CHAMA A SUA FUNÇÃO OCULTA: Atualizar Estoque
                produtoDAO.atualizarEstoque(idProduto, quantidade);
            }

            response.setStatus(ResponseObject.STATUS_OK);
            response.setCode(ResponseObject.CODE_OK);
            response.addMessage("Compra de produtos efetuada com sucesso!");
            
        } catch (Exception e) {
            response.setStatus(ResponseObject.STATUS_FAIL);
            response.setCode(ResponseObject.CODE_FAILED);
            response.addMessage("Erro ao efetuar compra de produtos: " + e.getMessage());
            e.printStackTrace();
        }

        return response;
    }
}
