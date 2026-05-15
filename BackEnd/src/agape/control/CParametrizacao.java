package agape.control;

import java.io.IOException;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpExchange;
import java.sql.Connection;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Base64;
import java.text.Normalizer;

import agape.dao.ParametrizacaoDAO;
import agape.model.Parametrizacao;
import agape.util.ResponseObject;

public class CParametrizacao implements HttpHandler {

    private static CParametrizacao instancia;
    private ParametrizacaoDAO dao;

    private CParametrizacao() {
        dao = new ParametrizacaoDAO();
    }

    public static CParametrizacao getInstancia() {
        if (instancia == null) {
            instancia = new CParametrizacao();
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

    private static class LogoResultado {
        String logotipoGrande;
        String logotipoPequeno;

        LogoResultado(String grande, String pequeno) {
            this.logotipoGrande  = grande  != null ? grande  : "";
            this.logotipoPequeno = pequeno != null ? pequeno : "";
        }

        public String toJson() {
            return "{\"logotipoGrande\":\"" + logotipoGrande + "\"," +
                    "\"logotipoPequeno\":\"" + logotipoPequeno + "\"}";
        }
    }

    // Remove acentos e caracteres especiais do nome do arquivo
    // Ex.: "Logo São Paulo (2).png" → "logo_sao_paulo_2.png"
    private String sanitizarNomeArquivo(String nome) {
        if (nome == null || nome.trim().isEmpty()) return "arquivo";

        int pontoExt = nome.lastIndexOf('.');
        String base = pontoExt > 0 ? nome.substring(0, pontoExt) : nome;
        String ext  = pontoExt > 0 ? nome.substring(pontoExt)    : "";

        // Decomposição NFD: separa letras de seus diacríticos para poder removê-los
        String semAcento = Normalizer.normalize(base, Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "");

        String sanitizado = semAcento
                .replaceAll("[^a-zA-Z0-9._-]", "_")  // proibidos → _
                .replaceAll("_+", "_")                 // reduz sequências de _
                .replaceAll("^_|_$", "")               // remove _ nas bordas
                .toLowerCase();

        if (sanitizado.isEmpty()) sanitizado = "arquivo";

        String extLimpa = ext.replaceAll("[^a-zA-Z0-9.]", "").toLowerCase();
        return sanitizado + extLimpa;
    }

    // Localiza FrontEnd/assets/img independente de onde a JVM foi iniciada.
    // IntelliJ define user.dir como raiz do workspace; NetBeans define como pasta do módulo.
    private Path resolverDirAssets() {
        Path base = Paths.get(System.getProperty("user.dir"));

        // IntelliJ: user.dir = raiz do workspace
        Path candidato1 = base.resolve("FrontEnd/assets/img").normalize();
        if (candidato1.getParent().getParent().toFile().isDirectory()) {
            return candidato1;
        }

        // NetBeans / linha de comando: user.dir = pasta BackEnd
        return base.resolve("../FrontEnd/assets/img").normalize();
    }

    // Extrai valor de campo de JSON simples por busca textual (não usa parser)
    // Seguro para base64 e nomes de arquivo pois esses valores não contêm aspas
    private String extrairCampoJson(String json, String campo) {
        String chave = "\"" + campo + "\":\"";
        int inicio = json.indexOf(chave);
        if (inicio < 0) return "";
        inicio += chave.length();
        int fim = json.indexOf('"', inicio);
        return fim < 0 ? "" : json.substring(inicio, fim);
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

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        String method = exchange.getRequestMethod();

        if (method.equalsIgnoreCase("OPTIONS")) {
            ResponseObject opts = new ResponseObject();
            opts.setStatus(ResponseObject.STATUS_OK);
            opts.setCode(ResponseObject.CODE_OK);
            enviarResposta(exchange, opts);
            return;
        }

        String path = exchange.getRequestURI().getPath();

        try {
            Connection conn = ConexaoBD.getInstance().getConexao();

            if (method.equalsIgnoreCase("POST") && path.endsWith("/logo")) {
                String body = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);

                String logoBase64  = extrairCampoJson(body, "logoBase64");
                String logoHBase64 = extrairCampoJson(body, "logoHBase64");

                // Resolve o caminho independente de onde o JVM foi iniciado:
                // tenta user.dir/FrontEnd (raiz do workspace) e user.dir/../FrontEnd (pasta BackEnd)
                Path assetsDir = resolverDirAssets();
                Files.createDirectories(assetsDir);
                System.out.println("[Parametrizacao] Salvando logos em: " + assetsDir.toAbsolutePath());

                String nomeGrande  = null;
                String nomePequeno = null;

                if (!logoBase64.isEmpty()) {
                    String dadosB64 = logoBase64.contains(",") ? logoBase64.split(",")[1] : logoBase64;
                    String nomeRaw  = extrairCampoJson(body, "nomeLogoGrande");
                    nomeGrande = sanitizarNomeArquivo(nomeRaw.isEmpty() ? "logo_grande.png" : nomeRaw);
                    Files.write(assetsDir.resolve(nomeGrande), Base64.getDecoder().decode(dadosB64));
                    System.out.println("[Parametrizacao] Logo grande salvo: " + nomeGrande);
                }

                if (!logoHBase64.isEmpty()) {
                    String dadosB64 = logoHBase64.contains(",") ? logoHBase64.split(",")[1] : logoHBase64;
                    String nomeRaw  = extrairCampoJson(body, "nomeLogoPequeno");
                    nomePequeno = sanitizarNomeArquivo(nomeRaw.isEmpty() ? "logo_pequeno.png" : nomeRaw);
                    Files.write(assetsDir.resolve(nomePequeno), Base64.getDecoder().decode(dadosB64));
                    System.out.println("[Parametrizacao] Logo pequeno salvo: " + nomePequeno);
                }

                dao.atualizarLogos(conn, nomeGrande, nomePequeno);

                ResponseObject response = new ResponseObject();
                response.setStatus(ResponseObject.STATUS_OK);
                response.setCode(ResponseObject.CODE_OK);
                response.setResult(new LogoResultado(nomeGrande, nomePequeno));
                enviarResposta(exchange, response);
                return;
            }

            if (method.equalsIgnoreCase("GET")) {
                Parametrizacao p = dao.buscar(conn);
                ResponseObject response = new ResponseObject();
                response.setStatus(ResponseObject.STATUS_OK);
                response.setCode(ResponseObject.CODE_OK);
                response.setResult(p);
                enviarResposta(exchange, response);
            } else if (method.equalsIgnoreCase("POST")) {
                String body = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
                
                Parametrizacao p = new Parametrizacao();
                p.setCnpj(extrairParam(exchange, body, "cnpj"));
                p.setRazaoSocial(extrairParam(exchange, body, "razaoSocial"));
                p.setNomeFantasia(extrairParam(exchange, body, "nomeFantasia"));
                p.setLogradouro(extrairParam(exchange, body, "logradouro"));
                p.setBairro(extrairParam(exchange, body, "bairro"));
                p.setCidade(extrairParam(exchange, body, "cidade"));
                p.setUf(extrairParam(exchange, body, "uf"));
                p.setCep(extrairParam(exchange, body, "cep"));
                p.setComplemento(extrairParam(exchange, body, "complemento"));
                p.setEmail(extrairParam(exchange, body, "email"));
                p.setTelefone1(extrairParam(exchange, body, "telefone1"));
                p.setTelefone2(extrairParam(exchange, body, "telefone2"));
                p.setSite(extrairParam(exchange, body, "site"));
                p.setResponsavel(extrairParam(exchange, body, "responsavel"));
                p.setLogotipoPequeno(extrairParam(exchange, body, "logotipoPequeno"));
                p.setLogotipoGrande(extrairParam(exchange, body, "logotipoGrande"));
                p.setInscricaoEstadual(extrairParam(exchange, body, "inscricaoEstadual"));
                p.setInscricaoMunicipal(extrairParam(exchange, body, "inscricaoMunicipal"));
                p.setNumEndereco(extrairParam(exchange, body, "numEndereco"));
                p.setPais(extrairParam(exchange, body, "pais"));
                p.setMoedaPadrao(extrairParam(exchange, body, "moedaPadrao"));
                p.setFusoHorario(extrairParam(exchange, body, "fusoHorario"));
                p.setObs(extrairParam(exchange, body, "obs"));

                dao.salvar(conn, p);

                ResponseObject response = new ResponseObject();
                response.setStatus(ResponseObject.STATUS_OK);
                response.setCode(ResponseObject.CODE_OK);
                response.addMessage("Parâmetros salvos com sucesso!");
                enviarResposta(exchange, response);
            }
        } catch (Exception e) {
            ResponseObject error = new ResponseObject();
            error.setStatus(ResponseObject.STATUS_FAIL);
            error.setCode(ResponseObject.CODE_ERROR);
            error.addMessage("Erro: " + e.getMessage());
            enviarResposta(exchange, error);
        }
    }
}
