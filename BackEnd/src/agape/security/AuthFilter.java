package agape.security;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import agape.util.ResponseObject;

/**
 * Wrapper de HttpHandler que valida o token JWT e o nível de acesso antes de
 * delegar a requisição ao controller real.
 *
 * O filtro:
 *  - Deixa OPTIONS passar (preflight CORS).
 *  - Lê o header Authorization: Bearer <token>.
 *  - Valida assinatura e expiração do token.
 *  - Compara o claim "nivel" com a lista de níveis permitidos.
 *  - Em caso de sucesso, expõe ao controller via exchange.getAttribute:
 *      - "usuarioNivel" (String): nível do solicitante (ex.: ADM, COLAB)
 *      - "usuarioEmail" (String): subject do token (e-mail do solicitante)
 */
public class AuthFilter implements HttpHandler {

    private final HttpHandler delegate;
    private final String[] niveisPermitidos;

    public AuthFilter(HttpHandler delegate, String... niveisPermitidos) {
        this.delegate = delegate;
        this.niveisPermitidos = niveisPermitidos;
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if (exchange.getRequestMethod().equalsIgnoreCase("OPTIONS")) {
            delegate.handle(exchange);
            return;
        }

        String auth = exchange.getRequestHeaders().getFirst("Authorization");
        if (auth == null || !auth.startsWith("Bearer ")) {
            enviarErro(exchange, ResponseObject.CODE_UNAUTHORIZED, "Token de autenticação não enviado.");
            return;
        }

        String token = auth.substring("Bearer ".length()).trim();

        if (!JWTTokenProvider.verifyToken(token)) {
            enviarErro(exchange, ResponseObject.CODE_UNAUTHORIZED, "Token inválido ou expirado.");
            return;
        }

        String nivel = JWTTokenProvider.getClaim(token, "nivel");
        String email = JWTTokenProvider.getClaim(token, "sub");

        if (nivel == null) {
            enviarErro(exchange, ResponseObject.CODE_UNAUTHORIZED, "Token sem nível de acesso.");
            return;
        }

        boolean permitido = false;
        for (String p : niveisPermitidos) {
            if (p.equalsIgnoreCase(nivel)) { permitido = true; break; }
        }
        if (!permitido) {
            enviarErro(exchange, ResponseObject.CODE_FORBIDDEN,
                    "Acesso negado: nível " + nivel + " não pode acessar este recurso.");
            return;
        }

        exchange.setAttribute("usuarioNivel", nivel);
        exchange.setAttribute("usuarioEmail", email);
        delegate.handle(exchange);
    }

    private void enviarErro(HttpExchange exchange, int code, String msg) throws IOException {
        ResponseObject r = new ResponseObject();
        r.setStatus(ResponseObject.STATUS_FAIL);
        r.setCode(code);
        r.addMessage(msg);

        String json = r.toJson();
        byte[] bytes = json.getBytes(StandardCharsets.UTF_8);

        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type, Authorization");

        exchange.sendResponseHeaders(code, bytes.length);
        exchange.getResponseBody().write(bytes);
        exchange.close();
    }
}
