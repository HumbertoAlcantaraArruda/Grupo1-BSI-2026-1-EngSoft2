package agape.control;

import java.io.IOException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.SQLException;

import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpExchange;

import agape.facade.InscricaoFacade;
import agape.model.Inscricao;
import agape.model.Paroquiano;
import agape.util.ResponseObject;
import agape.util.TradutorErro;

/**
 * CRealizarInscricao — Controller do caso de uso RF_F3: Realizar Inscrição.
 *
 * GRASP Controller — recebe a requisição HTTP, orquestra o fluxo e delega:
 *   - identificação do Paroquiano à entidade (Information Expert)
 *   - lógica de inscrição à InscricaoFacade (GOF Facade)
 *
 * SOLID SRP — este controller APENAS orquestra; não contém lógica de domínio.
 * GOF Singleton — instância única registrada em Main.java.
 *
 * Transacionalidade: a operação de confirmar inscrição gerencia a transação aqui,
 * garantindo que a criação da Inscricao E a atualização de vagasDisp ocorram
 * atomicamente (commit | rollback).
 */
public class CRealizarInscricao implements HttpHandler {

    // GOF Singleton
    private static CRealizarInscricao instancia;
    private CRealizarInscricao() {}
    public static CRealizarInscricao getInstancia() {
        if (instancia == null) instancia = new CRealizarInscricao();
        return instancia;
    }

    // GOF Facade — ponto único de acesso à lógica de inscrição
    private final InscricaoFacade facade = InscricaoFacade.getInstance();

    // ── Roteamento HTTP ────────────────────────────────────────────────────

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        String method = exchange.getRequestMethod().toUpperCase();
        String query  = exchange.getRequestURI().getQuery();

        try {
            Connection conn = ConexaoBD.getInstance().getConexao();
            String body = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);

            // GRASP Controller — despacha sem executar regras de negócio
            ResponseObject response = switch (method) {
                case "GET"     -> identificarParoquiano(conn, query);
                case "POST"    -> confirmar(conn, body);
                case "OPTIONS" -> ok();
                default        -> naoEncontrado();
            };

            enviarResposta(exchange, response);

        } catch (Exception e) {
            ResponseObject err = new ResponseObject();
            err.setStatus(ResponseObject.STATUS_FAIL);
            err.setCode(ResponseObject.CODE_ERROR);
            err.addMessage(TradutorErro.traduzir(e));
            enviarResposta(exchange, err);
        }
    }

    // ── Passo 1: Identificação do Paroquiano (Fluxo 2.1) ──────────────────

    /**
     * GET /realizarInscricao?cpf=...
     * Verifica se o CPF pertence a um Paroquiano ativo no sistema.
     * Fluxo 2.1: não encontrado → emite erro e encerra.
     */
    public ResponseObject identificarParoquiano(Connection conn, String query) {
        ResponseObject response = new ResponseObject();
        try {
            String cpf = param(query, "cpf").replaceAll("[^0-9]", "");

            if (cpf.length() != 11) {
                return falha(response, ResponseObject.CODE_BAD_REQUEST,
                    "CPF inválido. Informe 11 dígitos.");
            }

            // Information Expert — Paroquiano sabe buscar-se por CPF
            Paroquiano p = new Paroquiano().buscarPorCpf(conn, cpf);

            // Fluxo 2.1 — paroquiano não encontrado
            if (p == null) {
                return falha(response, ResponseObject.CODE_NOT_FOUND,
                    "Paroquiano não encontrado para o CPF informado.");
            }
            if (p.getStatus() != 1) {
                return falha(response, ResponseObject.CODE_BAD_REQUEST,
                    "Paroquiano encontrado, mas está inativo no sistema.");
            }

            response.setStatus(ResponseObject.STATUS_OK);
            response.setCode(ResponseObject.CODE_OK);
            response.setResult(p);

        } catch (Exception e) {
            erroInterno(response, e);
        }
        return response;
    }

    // ── Passo 5: Confirmação e Registro (Transacional) ────────────────────

    /**
     * POST /realizarInscricao  —  body JSON: { "idParoquiano": X, "idEvento": Y }
     *
     * Gerencia a transação:
     *   setAutoCommit(false) → InscricaoFacade.realizarInscricao() → commit | rollback
     *
     * A facade cria a Inscricao E atualiza vagasDisp dentro da mesma transação,
     * garantindo integridade mesmo em acesso concorrente (Tolerância a Falhas).
     */
    public ResponseObject confirmar(Connection conn, String body) {
        ResponseObject response = new ResponseObject();
        try {
            int idUsuario = parseSafeInt(json(body, "idUsuario"));
            int idEvento  = parseSafeInt(json(body, "idEvento"));

            if (idUsuario <= 0 || idEvento <= 0) {
                return falha(response, ResponseObject.CODE_BAD_REQUEST,
                    "idUsuario e idEvento são obrigatórios.");
            }

            conn.setAutoCommit(false); // ── Início da transação ──

            // GOF Facade — ponto único que consolida verificação + inscrição + vagas
            Inscricao inscricao = facade.realizarInscricao(conn, idUsuario, idEvento);

            conn.commit(); // ── Commit: inscrição + vagasDisp atualizados atomicamente ──

            response.setStatus(ResponseObject.STATUS_OK);
            response.setCode(ResponseObject.CODE_CREATED);

            if (inscricao.isListaEspera()) {
                response.addMessage("Sem vagas disponíveis. Paroquiano adicionado à lista de espera " +
                    "na posição " + inscricao.getPosicaoEspera() + ".");
            } else {
                response.addMessage("Inscrição realizada com sucesso!");
            }
            response.setResult(inscricao);

        } catch (Exception e) {
            rollback(conn); // ── Rollback: garante integridade em falha (Fluxo 7.2) ──
            response.setStatus(ResponseObject.STATUS_FAIL);
            response.setCode(ResponseObject.CODE_BAD_REQUEST);
            response.addMessage(TradutorErro.traduzir(e));
        } finally {
            restaurarAutoCommit(conn);
        }
        return response;
    }

    // ── Utilitários de transação ───────────────────────────────────────────

    private void rollback(Connection conn) {
        try { if (conn != null) conn.rollback(); } catch (SQLException ignored) {}
    }

    private void restaurarAutoCommit(Connection conn) {
        try { if (conn != null) conn.setAutoCommit(true); } catch (SQLException ignored) {}
    }

    // ── Utilitários de parsing ─────────────────────────────────────────────

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

    private int parseSafeInt(String val) {
        try { return Integer.parseInt(val.trim()); } catch (Exception e) { return 0; }
    }

    // ── Utilitários de resposta ────────────────────────────────────────────

    private void enviarResposta(HttpExchange exchange, ResponseObject response) throws IOException {
        String json  = response.toJson();
        byte[] bytes = json.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type",                 "application/json; charset=UTF-8");
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin",  "*");
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
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
        r.addMessage(TradutorErro.traduzir(e));
    }

    private ResponseObject naoEncontrado() {
        ResponseObject r = new ResponseObject();
        r.setStatus(ResponseObject.STATUS_FAIL);
        r.setCode(ResponseObject.CODE_NOT_FOUND);
        r.addMessage("Endpoint não encontrado.");
        return r;
    }
}

