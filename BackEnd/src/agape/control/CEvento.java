package agape.control;

import java.io.IOException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.sql.Connection;
import java.text.Normalizer;
import java.time.LocalDateTime;
import java.util.Base64;

import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpExchange;

import agape.model.Evento;
import agape.util.ResponseObject;

public class CEvento implements HttpHandler {

    private static CEvento instancia;

    private CEvento() {}

    public static CEvento getInstancia() {
        if (instancia == null) instancia = new CEvento();
        return instancia;
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        String method = exchange.getRequestMethod();
        String query  = exchange.getRequestURI().getQuery();

        try {
            Connection conn = ConexaoBD.getInstance().getConexao();
            String body = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);

            ResponseObject response = switch (method.toUpperCase()) {
                case "GET"     -> handleGet(conn, query);
                case "POST"    -> handlePost(conn, body);
                case "PUT"     -> handlePut(conn, body);
                case "DELETE"  -> handleDelete(conn, query);
                case "OPTIONS" -> handleOptions();
                default        -> naoEncontrado();
            };

            enviarResposta(exchange, response);

        } catch (Exception e) {
            ResponseObject erro = new ResponseObject();
            erro.setStatus(ResponseObject.STATUS_FAIL);
            erro.setCode(ResponseObject.CODE_ERROR);
            erro.addMessage("Erro inesperado: " + e.getMessage());
            enviarResposta(exchange, erro);
        }
    }

    // ── Handlers HTTP ──────────────────────────────────────────────────────

    private ResponseObject handleOptions() {
        ResponseObject r = new ResponseObject();
        r.setStatus(ResponseObject.STATUS_OK);
        r.setCode(ResponseObject.CODE_OK);
        return r;
    }

    private ResponseObject handleGet(Connection conn, String query) {
        String idParam     = param(query, "idEvento");
        String nomeParam   = param(query, "nome");
        String catParam    = param(query, "idCatEvento");
        String statusParam = param(query, "idEventoStatus");

        if (!idParam.isEmpty())
            return buscarPorId(conn, parseSafeInt(idParam));

        String  nome           = nomeParam.isEmpty()   ? null : nomeParam.trim();
        Integer idCatEvento    = catParam.isEmpty()    ? null : parseSafeInt(catParam);
        Integer idEventoStatus = statusParam.isEmpty() ? null : parseSafeInt(statusParam);

        return buscar(conn, nome, idCatEvento, idEventoStatus);
    }

    private ResponseObject handlePost(Connection conn, String body) {
        return inserir(conn, body);
    }

    private ResponseObject handlePut(Connection conn, String body) {
        return atualizar(conn, body);
    }

    private ResponseObject handleDelete(Connection conn, String query) {
        return excluir(conn, parseSafeInt(param(query, "idEvento")));
    }

    // ── Operações de negócio ───────────────────────────────────────────────

    public ResponseObject buscar(Connection conn, String nome, Integer idCatEvento, Integer idEventoStatus) {
        ResponseObject response = new ResponseObject();
        try {
            response.setStatus(ResponseObject.STATUS_OK);
            response.setCode(ResponseObject.CODE_OK);
            response.setResult(new Evento().buscar(conn, nome, idCatEvento, idEventoStatus));
        } catch (Exception e) {
            erroInterno(response, e);
        }
        return response;
    }

    public ResponseObject buscarPorId(Connection conn, int id) {
        ResponseObject response = new ResponseObject();
        try {
            Evento ev = new Evento().buscarPorId(conn, id);
            if (ev == null)
                return falha(response, ResponseObject.CODE_NOT_FOUND, "Evento não encontrado.");
            response.setStatus(ResponseObject.STATUS_OK);
            response.setCode(ResponseObject.CODE_OK);
            response.setResult(ev);
        } catch (Exception e) {
            erroInterno(response, e);
        }
        return response;
    }

    public ResponseObject inserir(Connection conn, String body) {
        ResponseObject response = new ResponseObject();
        try {
            String nome = json(body, "nome");
            if (vazio(nome))
                return falha(response, ResponseObject.CODE_BAD_REQUEST, "Nome é obrigatório.");

            String dataInicioStr = json(body, "dataInicio");
            String dataFimStr    = json(body, "dataFim");
            String totVagasStr   = json(body, "totVagas");

            if (vazio(dataInicioStr) || vazio(dataFimStr))
                return falha(response, ResponseObject.CODE_BAD_REQUEST, "Datas de início e fim são obrigatórias.");
            if (vazio(totVagasStr))
                return falha(response, ResponseObject.CODE_BAD_REQUEST, "Total de vagas é obrigatório.");

            Evento ev = new Evento();
            ev.setNome(nome.trim());
            ev.setIdUsuarioResponsavel(parseSafeInt(json(body, "idUsuarioResponsavel")));
            ev.setIdCatEvento(parseSafeInt(json(body, "idCatEvento")));
            ev.setDataInicio(parseDateTime(dataInicioStr));
            ev.setDataFim(parseDateTime(dataFimStr));
            ev.setTotVagas(parseSafeInt(totVagasStr));

            String vagasDispStr = json(body, "vagasDisp");
            ev.setVagasDisp(vagasDispStr.isEmpty() ? parseSafeInt(totVagasStr) : parseSafeInt(vagasDispStr));

            String idStatusStr = json(body, "idEventoStatus");
            ev.setIdEventoStatus(idStatusStr.isEmpty() ? 1 : parseSafeInt(idStatusStr));

            String dataEventoStr = json(body, "dataEvento");
            ev.setDataEvento(dataEventoStr.isEmpty() ? null : parseDateTime(dataEventoStr));

            String dataListaStr = json(body, "dataAberturaListaEspera");
            ev.setDataAberturaListaEspera(dataListaStr.isEmpty() ? null : parseDateTime(dataListaStr));

            String valorStr = json(body, "valorInscricao");
            ev.setValorInscricao(valorStr.isEmpty() ? null : parseSafeFloat(valorStr));

            // Imagem: salva arquivo e guarda só o nome no model
            String imagemNome = salvarImagem(body, "imagemBase64", "nomeImagemEvento");
            ev.setImagemEvento(imagemNome.isEmpty() ? null : imagemNome);

            ev.inserir(conn);

            response.setStatus(ResponseObject.STATUS_OK);
            response.setCode(ResponseObject.CODE_CREATED);
            response.addMessage("Evento cadastrado com sucesso.");
            response.setResult(ev);
        } catch (Exception e) {
            erroInterno(response, e);
        }
        return response;
    }

    public ResponseObject atualizar(Connection conn, String body) {
        ResponseObject response = new ResponseObject();
        try {
            int id = parseSafeInt(json(body, "idEvento"));
            Evento ev = new Evento().buscarPorId(conn, id);
            if (ev == null)
                return falha(response, ResponseObject.CODE_NOT_FOUND, "Evento não encontrado.");

            String nome = json(body, "nome");
            if (vazio(nome))
                return falha(response, ResponseObject.CODE_BAD_REQUEST, "Nome é obrigatório.");

            String dataInicioStr = json(body, "dataInicio");
            String dataFimStr    = json(body, "dataFim");
            String totVagasStr   = json(body, "totVagas");

            if (vazio(dataInicioStr) || vazio(dataFimStr))
                return falha(response, ResponseObject.CODE_BAD_REQUEST, "Datas de início e fim são obrigatórias.");
            if (vazio(totVagasStr))
                return falha(response, ResponseObject.CODE_BAD_REQUEST, "Total de vagas é obrigatório.");

            ev.setNome(nome.trim());
            ev.setIdUsuarioResponsavel(parseSafeInt(json(body, "idUsuarioResponsavel")));
            ev.setIdCatEvento(parseSafeInt(json(body, "idCatEvento")));
            ev.setDataInicio(parseDateTime(dataInicioStr));
            ev.setDataFim(parseDateTime(dataFimStr));
            ev.setTotVagas(parseSafeInt(totVagasStr));

            String vagasDispStr = json(body, "vagasDisp");
            ev.setVagasDisp(vagasDispStr.isEmpty() ? null : parseSafeInt(vagasDispStr));

            String idStatusStr = json(body, "idEventoStatus");
            ev.setIdEventoStatus(idStatusStr.isEmpty() ? null : parseSafeInt(idStatusStr));

            String dataEventoStr = json(body, "dataEvento");
            ev.setDataEvento(dataEventoStr.isEmpty() ? null : parseDateTime(dataEventoStr));

            String dataListaStr = json(body, "dataAberturaListaEspera");
            ev.setDataAberturaListaEspera(dataListaStr.isEmpty() ? null : parseDateTime(dataListaStr));

            String valorStr = json(body, "valorInscricao");
            ev.setValorInscricao(valorStr.isEmpty() ? null : parseSafeFloat(valorStr));

            // Nova imagem: substitui se enviada, mantém a atual se não
            String imagemNome = salvarImagem(body, "imagemBase64", "nomeImagemEvento");
            if (!imagemNome.isEmpty()) ev.setImagemEvento(imagemNome);

            ev.atualizar(conn);

            response.setStatus(ResponseObject.STATUS_OK);
            response.setCode(ResponseObject.CODE_OK);
            response.addMessage("Evento atualizado com sucesso.");
            response.setResult(ev);
        } catch (Exception e) {
            erroInterno(response, e);
        }
        return response;
    }

    public ResponseObject excluir(Connection conn, int id) {
        ResponseObject response = new ResponseObject();
        try {
            Evento ev = new Evento().buscarPorId(conn, id);
            if (ev == null)
                return falha(response, ResponseObject.CODE_NOT_FOUND, "Evento não encontrado.");
            ev.excluir(conn);
            response.setStatus(ResponseObject.STATUS_OK);
            response.setCode(ResponseObject.CODE_OK);
            response.addMessage("Evento excluído com sucesso.");
        } catch (Exception e) {
            erroInterno(response, e);
        }
        return response;
    }

    // ── Imagem ────────────────────────────────────────────────────────────

    /** Salva o arquivo Base64 em FrontEnd/assets/img e retorna o nome do arquivo, ou "" se não houver imagem. */
    private String salvarImagem(String body, String campoBase64, String campoNome) throws Exception {
        String base64 = json(body, campoBase64);
        if (base64.isEmpty()) return "";

        String dados = base64.contains(",") ? base64.split(",")[1] : base64;
        String nomeRaw = json(body, campoNome);
        String nomeArquivo = sanitizarNomeArquivo(nomeRaw.isEmpty() ? "imagem_evento.jpg" : nomeRaw);

        Path dir = resolverDirAssets();
        Files.createDirectories(dir);
        Files.write(dir.resolve(nomeArquivo), Base64.getDecoder().decode(dados));
        return nomeArquivo;
    }

    private Path resolverDirAssets() {
        Path base = Paths.get(System.getProperty("user.dir"));
        Path candidato = base.resolve("FrontEnd/assets/img").normalize();
        if (candidato.getParent().getParent().toFile().isDirectory()) return candidato;
        return base.resolve("../FrontEnd/assets/img").normalize();
    }

    private String sanitizarNomeArquivo(String nome) {
        if (nome == null || nome.trim().isEmpty()) return "arquivo";
        int pontoExt = nome.lastIndexOf('.');
        String base = pontoExt > 0 ? nome.substring(0, pontoExt) : nome;
        String ext  = pontoExt > 0 ? nome.substring(pontoExt)    : "";
        String semAcento = Normalizer.normalize(base, Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
        String sanitizado = semAcento
                .replaceAll("[^a-zA-Z0-9._-]", "_")
                .replaceAll("_+", "_")
                .replaceAll("^_|_$", "")
                .toLowerCase();
        if (sanitizado.isEmpty()) sanitizado = "arquivo";
        String extLimpa = ext.replaceAll("[^a-zA-Z0-9.]", "").toLowerCase();
        return sanitizado + extLimpa;
    }

    // ── Utilitários ───────────────────────────────────────────────────────

    /** Extrai valor de campo de JSON simples (sem parser). Não funciona para valores aninhados. */
    private String json(String body, String campo) {
        if (body == null || body.isEmpty()) return "";
        String chave = "\"" + campo + "\":";
        int inicio = body.indexOf(chave);
        if (inicio < 0) return "";
        inicio += chave.length();
        // Pula espaços
        while (inicio < body.length() && body.charAt(inicio) == ' ') inicio++;
        if (inicio >= body.length()) return "";

        if (body.charAt(inicio) == '"') {
            // Valor string
            inicio++;
            int fim = body.indexOf('"', inicio);
            return fim < 0 ? "" : body.substring(inicio, fim);
        } else {
            // Valor numérico / boolean / null — lê até , ou }
            int fim = inicio;
            while (fim < body.length() && body.charAt(fim) != ',' && body.charAt(fim) != '}') fim++;
            String val = body.substring(inicio, fim).trim();
            return val.equals("null") ? "" : val;
        }
    }

    private String param(String source, String key) {
        if (source == null || source.isEmpty()) return "";
        for (String par : source.split("&")) {
            String[] kv = par.split("=", 2);
            if (kv[0].equals(key)) {
                try { return URLDecoder.decode(kv.length > 1 ? kv[1] : "", StandardCharsets.UTF_8.toString()); }
                catch (Exception e) { return ""; }
            }
        }
        return "";
    }

    private LocalDateTime parseDateTime(String s) {
        if (s == null || s.trim().isEmpty()) return null;
        // Aceita "2024-06-01T10:00" (sem segundos) e "2024-06-01T10:00:00"
        if (s.length() == 16) s = s + ":00";
        return LocalDateTime.parse(s);
    }

    private int parseSafeInt(String val) {
        try { return Integer.parseInt(val.trim()); } catch (Exception e) { return 0; }
    }

    private float parseSafeFloat(String val) {
        try { return Float.parseFloat(val.trim()); } catch (Exception e) { return 0f; }
    }

    private boolean vazio(String s) {
        return s == null || s.trim().isEmpty();
    }

    private void enviarResposta(HttpExchange exchange, ResponseObject response) throws IOException {
        String json  = response.toJson();
        byte[] bytes = json.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type, Authorization");
        exchange.sendResponseHeaders(response.getCode(), bytes.length);
        exchange.getResponseBody().write(bytes);
        exchange.close();
    }

    private ResponseObject falha(ResponseObject r, int code, String msg) {
        r.setStatus(ResponseObject.STATUS_FAIL);
        r.setCode(code);
        r.addMessage(msg);
        return r;
    }

    private void erroInterno(ResponseObject r, Exception e) {
        r.setStatus(ResponseObject.STATUS_FAIL);
        r.setCode(ResponseObject.CODE_ERROR);
        r.addMessage("Erro interno do servidor: " + (e != null ? e.getMessage() : ""));
    }

    private ResponseObject naoEncontrado() {
        ResponseObject r = new ResponseObject();
        r.setStatus(ResponseObject.STATUS_FAIL);
        r.setCode(ResponseObject.CODE_NOT_FOUND);
        r.addMessage("Endpoint não encontrado.");
        return r;
    }
}
