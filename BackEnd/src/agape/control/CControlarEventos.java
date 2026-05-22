package agape.control;

import java.io.IOException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.sql.Connection;
import java.sql.SQLException;
import java.text.Normalizer;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;

import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpExchange;

import agape.model.Evento;
import agape.util.ResponseObject;

/**
 * CControlarEventos — Controller do caso de uso RF_F1: Controlar Eventos.
 *
 * GRASP: Controller — ponto de entrada que recebe a requisição HTTP e orquestra
 * o fluxo sem conter lógica de domínio. Toda validação está na entidade Evento
 * (Information Expert / SOLID SRP).
 *
 * GOF Singleton — instância única, registrada uma vez em Main.java e
 * compartilhada por toda a vida da aplicação.
 *
 * Tolerância a falhas: todas as operações de escrita ocorrem dentro de uma
 * transação explícita (setAutoCommit(false) → commit | rollback).
 */
public class CControlarEventos implements HttpHandler {

    // GOF Singleton
    private static CControlarEventos instancia;
    private CControlarEventos() {}
    public static CControlarEventos getInstancia() {
        if (instancia == null) instancia = new CControlarEventos();
        return instancia;
    }

    // ── Roteamento HTTP ────────────────────────────────────────────────────

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        String method = exchange.getRequestMethod().toUpperCase();
        String query  = exchange.getRequestURI().getQuery();

        try {
            Connection conn = ConexaoBD.getInstance().getConexao();
            String body = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);

            // GRASP: Controller — despacha para o método correto sem executar regras
            ResponseObject response = switch (method) {
                case "POST"    -> despacharPost(conn, body);
                case "PUT"     -> alterar(conn, body);
                case "DELETE"  -> excluir(conn, query);
                case "GET"     -> listar(conn, query);
                case "OPTIONS" -> ok();
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

    /**
     * POST: despacha com base no campo "acao" do corpo.
     * Fluxo 5.1: acao inválida → emite erro e encerra.
     */
    private ResponseObject despacharPost(Connection conn, String body) {
        String acao = json(body, "acao");
        return switch (acao) {
            case "criar"     -> criar(conn, body);
            case "abrir"     -> abrir(conn, body);
            case "finalizar" -> finalizar(conn, body);
            case "cancelar"  -> cancelar(conn, body);
            case "adiar"     -> adiar(conn, body);
            default -> {
                ResponseObject r = new ResponseObject();
                r.setStatus(ResponseObject.STATUS_FAIL);
                r.setCode(ResponseObject.CODE_BAD_REQUEST);
                // Fluxo 5.1 — funcionalidade inválida
                r.addMessage("Funcionalidade inválida: '" + acao + "'. " +
                    "Valores aceitos: criar, abrir, finalizar, cancelar, adiar.");
                yield r;
            }
        };
    }

    // ── Listar (leitura — sem transação) ──────────────────────────────────

    public ResponseObject listar(Connection conn, String query) {
        ResponseObject response = new ResponseObject();
        try {
            // Auto-finalização: eventos com dataEvento no passado viram Finalizado (4).
            // Executado a cada listagem; falha silenciosa para não impedir a leitura.
            try { new agape.dao.EventoDAO().finalizarEventosVencidos(conn); } catch (Exception ignored) {}

            String  nome           = param(query, "nome");
            String  catStr         = param(query, "idCatEvento");
            String  statusStr      = param(query, "idEventoStatus");
            Integer idCatEvento    = catStr.isEmpty()    ? null : parseSafeInt(catStr);
            Integer idEventoStatus = statusStr.isEmpty() ? null : parseSafeInt(statusStr);

            response.setStatus(ResponseObject.STATUS_OK);
            response.setCode(ResponseObject.CODE_OK);
            response.setResult(new Evento().buscar(conn, nome.isEmpty() ? null : nome, idCatEvento, idEventoStatus));
        } catch (Exception e) {
            erroInterno(response, e);
        }
        return response;
    }

    // ── Criar ─────────────────────────────────────────────────────────────

    /**
     * Cria um novo evento dentro de uma transação.
     * SOLID SRP: validação delegada ao model (Information Expert).
     * Tolerância a falhas: rollback em caso de falha no registro (Fluxo 7.2).
     */
    public ResponseObject criar(Connection conn, String body) {
        ResponseObject response = new ResponseObject();
        try {
            conn.setAutoCommit(false); // ── Início da transação ──

            Evento ev = construirEvento(body);

            // SOLID Information Expert: o model conhece suas regras de validação
            List<String> erros = ev.validarParaCriar(); // Fluxo 7.1
            if (!erros.isEmpty()) {
                conn.setAutoCommit(true);
                return falha(response, ResponseObject.CODE_BAD_REQUEST, String.join(" ", erros));
            }

            String imagemNome = salvarImagem(body);
            ev.setImagemEvento(imagemNome.isEmpty() ? null : imagemNome);

            ev.inserir(conn);

            conn.commit(); // ── Commit: operação persistida com sucesso ──
            response.setStatus(ResponseObject.STATUS_OK);
            response.setCode(ResponseObject.CODE_CREATED);
            response.addMessage("Evento criado com sucesso.");
            response.setResult(ev);

        } catch (Exception e) {
            rollback(conn); // Fluxo 7.2: falha → reverte estado
            erroInterno(response, e);
        } finally {
            restaurarAutoCommit(conn);
        }
        return response;
    }

    // ── Alterar ───────────────────────────────────────────────────────────

    public ResponseObject alterar(Connection conn, String body) {
        ResponseObject response = new ResponseObject();
        try {
            conn.setAutoCommit(false);

            int id = parseSafeInt(json(body, "idEvento"));
            // Fluxo 2.1: evento não encontrado → erro e encerra
            Evento ev = new Evento().buscarPorId(conn, id);
            if (ev == null) {
                conn.setAutoCommit(true);
                return falha(response, ResponseObject.CODE_NOT_FOUND, "Evento não encontrado.");
            }

            aplicarCampos(ev, body);

            List<String> erros = ev.validarParaCriar(); // Fluxo 7.1
            if (!erros.isEmpty()) {
                conn.setAutoCommit(true);
                return falha(response, ResponseObject.CODE_BAD_REQUEST, String.join(" ", erros));
            }

            String imagemNome = salvarImagem(body);
            if (!imagemNome.isEmpty()) ev.setImagemEvento(imagemNome);

            ev.atualizar(conn);

            conn.commit();
            response.setStatus(ResponseObject.STATUS_OK);
            response.setCode(ResponseObject.CODE_OK);
            response.addMessage("Evento alterado com sucesso.");
            response.setResult(ev);

        } catch (Exception e) {
            rollback(conn);
            erroInterno(response, e);
        } finally {
            restaurarAutoCommit(conn);
        }
        return response;
    }

    // ── Excluir ───────────────────────────────────────────────────────────

    public ResponseObject excluir(Connection conn, String query) {
        ResponseObject response = new ResponseObject();
        try {
            conn.setAutoCommit(false);

            int id = parseSafeInt(param(query, "idEvento"));
            Evento ev = new Evento().buscarPorId(conn, id);
            if (ev == null) {
                conn.setAutoCommit(true);
                return falha(response, ResponseObject.CODE_NOT_FOUND, "Evento não encontrado.");
            }

            ev.excluir(conn);

            conn.commit();
            response.setStatus(ResponseObject.STATUS_OK);
            response.setCode(ResponseObject.CODE_OK);
            response.addMessage("Evento excluído com sucesso.");

        } catch (Exception e) {
            rollback(conn);
            erroInterno(response, e);
        } finally {
            restaurarAutoCommit(conn);
        }
        return response;
    }

    // ── Abrir ─────────────────────────────────────────────────────────────

    /**
     * Abre o evento (idEventoStatus → 1 / Ativo).
     * - Cancelado (2): exige novaDataEvento (futura) no body.
     * - Finalizado (4): bloqueado.
     * - Adiado (3) / outros: abre direto sem nova data.
     */
    public ResponseObject abrir(Connection conn, String body) {
        ResponseObject response = new ResponseObject();
        try {
            conn.setAutoCommit(false);

            int id = parseSafeInt(json(body, "idEvento"));
            Evento ev = new Evento().buscarPorId(conn, id);
            if (ev == null) {
                conn.setAutoCommit(true);
                return falha(response, ResponseObject.CODE_NOT_FOUND, "Evento não encontrado.");
            }

            LocalDateTime novaData = null;

            if (ev.getIdEventoStatus() != null && ev.getIdEventoStatus() == 2) {
                // Cancelado → reabrir exige nova data
                String novaDataStr = json(body, "novaDataEvento");
                novaData = novaDataStr.isEmpty() ? null : parseDateTime(novaDataStr);
                List<String> erros = ev.validarParaReabrirCancelado(novaData);
                if (!erros.isEmpty()) {
                    conn.setAutoCommit(true);
                    return falha(response, ResponseObject.CODE_BAD_REQUEST, String.join(" ", erros));
                }
            } else {
                // Adiado, pendente ou outro → validação padrão (bloqueia Finalizado e já Ativo)
                List<String> erros = ev.validarParaAbrir();
                if (!erros.isEmpty()) {
                    conn.setAutoCommit(true);
                    return falha(response, ResponseObject.CODE_BAD_REQUEST, String.join(" ", erros));
                }
            }

            ev.abrir(conn, novaData);

            conn.commit();
            response.setStatus(ResponseObject.STATUS_OK);
            response.setCode(ResponseObject.CODE_OK);
            response.addMessage("Evento \"" + ev.getNome() + "\" aberto com sucesso.");

        } catch (Exception e) {
            rollback(conn);
            erroInterno(response, e);
        } finally {
            restaurarAutoCommit(conn);
        }
        return response;
    }

    // ── Finalizar ─────────────────────────────────────────────────────────

    public ResponseObject finalizar(Connection conn, String body) {
        ResponseObject response = new ResponseObject();
        try {
            conn.setAutoCommit(false);

            int id = parseSafeInt(json(body, "idEvento"));
            Evento ev = new Evento().buscarPorId(conn, id);
            if (ev == null) {
                conn.setAutoCommit(true);
                return falha(response, ResponseObject.CODE_NOT_FOUND, "Evento não encontrado.");
            }

            List<String> erros = ev.validarParaFinalizar(); // Fluxo 7.1
            if (!erros.isEmpty()) {
                conn.setAutoCommit(true);
                return falha(response, ResponseObject.CODE_BAD_REQUEST, String.join(" ", erros));
            }

            ev.finalizar(conn);

            conn.commit();
            response.setStatus(ResponseObject.STATUS_OK);
            response.setCode(ResponseObject.CODE_OK);
            response.addMessage("Evento \"" + ev.getNome() + "\" finalizado com sucesso.");

        } catch (Exception e) {
            rollback(conn);
            erroInterno(response, e);
        } finally {
            restaurarAutoCommit(conn);
        }
        return response;
    }

    // ── Cancelar ──────────────────────────────────────────────────────────

    public ResponseObject cancelar(Connection conn, String body) {
        ResponseObject response = new ResponseObject();
        try {
            conn.setAutoCommit(false);

            int id = parseSafeInt(json(body, "idEvento"));
            Evento ev = new Evento().buscarPorId(conn, id);
            if (ev == null) {
                conn.setAutoCommit(true);
                return falha(response, ResponseObject.CODE_NOT_FOUND, "Evento não encontrado.");
            }

            List<String> erros = ev.validarParaCancelar(); // Fluxo 7.1
            if (!erros.isEmpty()) {
                conn.setAutoCommit(true);
                return falha(response, ResponseObject.CODE_BAD_REQUEST, String.join(" ", erros));
            }

            ev.cancelar(conn);

            conn.commit();
            response.setStatus(ResponseObject.STATUS_OK);
            response.setCode(ResponseObject.CODE_OK);
            response.addMessage("Evento \"" + ev.getNome() + "\" cancelado com sucesso.");

        } catch (Exception e) {
            rollback(conn);
            erroInterno(response, e);
        } finally {
            restaurarAutoCommit(conn);
        }
        return response;
    }

    // ── Adiar ─────────────────────────────────────────────────────────────

    public ResponseObject adiar(Connection conn, String body) {
        ResponseObject response = new ResponseObject();
        try {
            conn.setAutoCommit(false);

            int id = parseSafeInt(json(body, "idEvento"));
            String novaDataStr = json(body, "novaDataEvento");

            if (novaDataStr.isEmpty()) {
                conn.setAutoCommit(true);
                return falha(response, ResponseObject.CODE_BAD_REQUEST,
                    "Nova data do evento é obrigatória para adiar.");
            }

            Evento ev = new Evento().buscarPorId(conn, id);
            if (ev == null) {
                conn.setAutoCommit(true);
                return falha(response, ResponseObject.CODE_NOT_FOUND, "Evento não encontrado.");
            }

            LocalDateTime novaData = parseDateTime(novaDataStr);

            List<String> erros = ev.validarParaAdiar(novaData); // Fluxo 7.1
            if (!erros.isEmpty()) {
                conn.setAutoCommit(true);
                return falha(response, ResponseObject.CODE_BAD_REQUEST, String.join(" ", erros));
            }

            ev.adiar(conn, novaData);

            conn.commit();
            response.setStatus(ResponseObject.STATUS_OK);
            response.setCode(ResponseObject.CODE_OK);
            response.addMessage("Evento \"" + ev.getNome() + "\" adiado com sucesso.");

        } catch (Exception e) {
            rollback(conn);
            erroInterno(response, e);
        } finally {
            restaurarAutoCommit(conn);
        }
        return response;
    }

    // ── Construção e mapeamento do body JSON ───────────────────────────────

    private Evento construirEvento(String body) {
        Evento ev = new Evento();
        aplicarCampos(ev, body);
        String vagasStr = json(body, "vagasDisp");
        if (vagasStr.isEmpty()) ev.setVagasDisp(ev.getTotVagas()); // padrão: tudo disponível
        return ev;
    }

    private void aplicarCampos(Evento ev, String body) {
        ev.setNome(json(body, "nome").trim());
        ev.setIdUsuarioResponsavel(parseSafeInt(json(body, "idUsuarioResponsavel")));
        ev.setIdCatEvento(parseSafeInt(json(body, "idCatEvento")));
        ev.setDataInicio(parseDateTime(json(body, "dataInicio")));
        ev.setDataFim(parseDateTime(json(body, "dataFim")));
        ev.setTotVagas(parseSafeInt(json(body, "totVagas")));

        String vagasStr = json(body, "vagasDisp");
        ev.setVagasDisp(vagasStr.isEmpty() ? null : parseSafeInt(vagasStr));

        String idStatusStr = json(body, "idEventoStatus");
        ev.setIdEventoStatus(idStatusStr.isEmpty() ? 1 : parseSafeInt(idStatusStr));

        String dataEvStr = json(body, "dataEvento");
        ev.setDataEvento(dataEvStr.isEmpty() ? null : parseDateTime(dataEvStr));

        String dataListaStr = json(body, "dataAberturaListaEspera");
        ev.setDataAberturaListaEspera(dataListaStr.isEmpty() ? null : parseDateTime(dataListaStr));

        String valorStr = json(body, "valorInscricao");
        ev.setValorInscricao(valorStr.isEmpty() ? null : parseSafeFloat(valorStr));
    }

    // ── Imagem ────────────────────────────────────────────────────────────

    private String salvarImagem(String body) throws Exception {
        String base64 = json(body, "imagemBase64");
        if (base64.isEmpty()) return "";
        String dados       = base64.contains(",") ? base64.split(",")[1] : base64;
        String nomeRaw     = json(body, "nomeImagemEvento");
        String nomeArquivo = sanitizarNome(nomeRaw.isEmpty() ? "imagem_evento.jpg" : nomeRaw);
        Path dir = resolverDirAssets();
        Files.createDirectories(dir);
        Files.write(dir.resolve(nomeArquivo), Base64.getDecoder().decode(dados));
        return nomeArquivo;
    }

    private Path resolverDirAssets() {
        Path base      = Paths.get(System.getProperty("user.dir"));
        Path candidato = base.resolve("FrontEnd/assets/img").normalize();
        if (candidato.getParent().getParent().toFile().isDirectory()) return candidato;
        return base.resolve("../FrontEnd/assets/img").normalize();
    }

    private String sanitizarNome(String nome) {
        if (nome == null || nome.isBlank()) return "arquivo";
        int dot   = nome.lastIndexOf('.');
        String b  = dot > 0 ? nome.substring(0, dot) : nome;
        String e  = dot > 0 ? nome.substring(dot)    : "";
        String s  = Normalizer.normalize(b, Normalizer.Form.NFD)
                        .replaceAll("\\p{InCombiningDiacriticalMarks}+", "")
                        .replaceAll("[^a-zA-Z0-9._-]", "_")
                        .replaceAll("_+", "_").replaceAll("^_|_$", "").toLowerCase();
        return (s.isEmpty() ? "arquivo" : s) + e.replaceAll("[^a-zA-Z0-9.]", "").toLowerCase();
    }

    // ── Utilitários de transação ───────────────────────────────────────────

    private void rollback(Connection conn) {
        try { if (conn != null) conn.rollback(); } catch (SQLException ignored) {}
    }

    private void restaurarAutoCommit(Connection conn) {
        try { if (conn != null) conn.setAutoCommit(true); } catch (SQLException ignored) {}
    }

    // ── Utilitários de parsing ─────────────────────────────────────────────

    /**
     * Extrai valor de campo de JSON simples sem biblioteca externa.
     * Suporta strings (delimitadas por aspas) e escalares (número, bool, null).
     */
    private String json(String body, String campo) {
        if (body == null || body.isEmpty()) return "";
        String chave = "\"" + campo + "\":";
        int inicio = body.indexOf(chave);
        if (inicio < 0) return "";
        inicio += chave.length();
        while (inicio < body.length() && body.charAt(inicio) == ' ') inicio++;
        if (inicio >= body.length()) return "";
        if (body.charAt(inicio) == '"') {
            inicio++;
            int fim = body.indexOf('"', inicio);
            return fim < 0 ? "" : body.substring(inicio, fim);
        }
        int fim = inicio;
        while (fim < body.length() && body.charAt(fim) != ',' && body.charAt(fim) != '}') fim++;
        String val = body.substring(inicio, fim).trim();
        return "null".equals(val) ? "" : val;
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
        if (s == null || s.isBlank()) return null;
        if (s.length() == 16) s = s + ":00";
        return LocalDateTime.parse(s);
    }

    private int parseSafeInt(String val) {
        try { return Integer.parseInt(val.trim()); } catch (Exception e) { return 0; }
    }

    private float parseSafeFloat(String val) {
        try { return Float.parseFloat(val.trim()); } catch (Exception e) { return 0f; }
    }

    private boolean vazio(String s) { return s == null || s.isBlank(); }

    // ── Utilitários de resposta ────────────────────────────────────────────

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

    private ResponseObject ok() {
        ResponseObject r = new ResponseObject();
        r.setStatus(ResponseObject.STATUS_OK);
        r.setCode(ResponseObject.CODE_OK);
        return r;
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
        r.addMessage("Erro interno: " + (e != null ? e.getMessage() : ""));
    }

    private ResponseObject naoEncontrado() {
        ResponseObject r = new ResponseObject();
        r.setStatus(ResponseObject.STATUS_FAIL);
        r.setCode(ResponseObject.CODE_NOT_FOUND);
        r.addMessage("Endpoint não encontrado.");
        return r;
    }
}
