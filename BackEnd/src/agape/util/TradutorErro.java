package agape.util;

import java.sql.SQLException;

/**
 * TradutorErro — converte exceções técnicas em mensagens amigáveis.
 *
 * Para cada erro:
 *   1. Registra o detalhe técnico completo no console (visível apenas para a equipe).
 *   2. Retorna uma mensagem simples, sem jargão, compreensível por qualquer usuário.
 */
public class TradutorErro {

    private TradutorErro() {}

    /**
     * Traduz uma exceção: loga o erro técnico e retorna mensagem amigável.
     *
     * @param e exceção capturada (pode ser null)
     * @return mensagem amigável para exibição ao usuário
     */
    public static String traduzir(Exception e) {
        if (e == null) return "Ocorreu um problema inesperado. Tente novamente.";

        // ── Log técnico (somente no servidor, invisível ao usuário) ───────────
        System.err.println("[ERRO] " + e.getClass().getName() + ": " + e.getMessage());
        if (e.getCause() != null) {
            System.err.println("[CAUSA] " + e.getCause().getClass().getName()
                               + ": " + e.getCause().getMessage());
        }
        e.printStackTrace(System.err);

        // ── Detecção de erros de banco de dados ───────────────────────────────
        SQLException sqle = extrairSQLException(e);
        if (sqle != null) return traduzirSQL(sqle);

        // ── Detecção por nome / mensagem da exceção ───────────────────────────
        String classe = e.getClass().getName().toLowerCase();
        String msg    = e.getMessage() != null ? e.getMessage().toLowerCase() : "";

        if (classe.contains("connect") || msg.contains("connect")
                || classe.contains("communication") || msg.contains("communications link")) {
            return "Não foi possível conectar ao sistema no momento. Verifique sua conexão e tente novamente.";
        }
        if (classe.contains("timeout") || msg.contains("timeout")) {
            return "A operação demorou mais do que o esperado. Aguarde alguns instantes e tente novamente.";
        }

        return "Ocorreu um problema inesperado ao processar sua solicitação. Tente novamente.";
    }

    // ── Tradução de erros SQL por código MySQL ─────────────────────────────────

    private static String traduzirSQL(SQLException e) {
        // Log do erro SQL com código e estado
        System.err.println("[SQL-ERRO] código=" + e.getErrorCode()
                           + " estado=" + e.getSQLState()
                           + " msg=" + e.getMessage());

        int    codigo = e.getErrorCode();
        String msg    = e.getMessage() != null ? e.getMessage().toLowerCase() : "";

        switch (codigo) {
            case 1062: // Duplicate entry — chave única violada
                return "Já existe um registro com essas informações cadastradas. "
                     + "Verifique os dados e tente novamente.";

            case 1451: // Cannot delete — registro pai referenciado por filho
                return "Este registro está sendo utilizado em outra parte do sistema "
                     + "e não pode ser removido enquanto houver vínculos.";

            case 1452: // Cannot add — registro filho sem pai correspondente
                return "Um dos dados informados faz referência a um registro que não existe. "
                     + "Verifique as informações e tente novamente.";

            case 1213: // Deadlock
                return "O sistema detectou um conflito de acesso simultâneo. "
                     + "Tente novamente em alguns instantes.";

            case 1205: // Lock wait timeout
                return "O sistema está processando outra operação no momento. "
                     + "Aguarde e tente novamente.";

            case 1366: // Incorrect integer value
            case 1292: // Incorrect datetime value
            case 1264: // Out of range value
                return "Um dos valores informados está em formato inválido ou fora do intervalo permitido. "
                     + "Verifique os dados e tente novamente.";

            case 1406: // Data too long
                return "O conteúdo de um dos campos é maior do que o permitido. "
                     + "Reduza o texto e tente novamente.";

            case 1048: // Column cannot be null
                return "Um campo obrigatório não foi preenchido. Verifique os dados e tente novamente.";

            case 2003: // Can't connect to MySQL server
            case 2013: // Lost connection to MySQL server
            case 2006: // MySQL server has gone away
                return "Não foi possível conectar ao banco de dados no momento. "
                     + "Tente novamente em alguns instantes.";

            default:
                // Inferência pela mensagem quando não há código específico
                if (msg.contains("connect") || msg.contains("communication")) {
                    return "Não foi possível conectar ao banco de dados. Tente novamente.";
                }
                if (msg.contains("duplicate") || msg.contains("duplicado")) {
                    return "Já existe um registro com essas informações.";
                }
                if (msg.contains("foreign key") || msg.contains("constraint")) {
                    return "Este registro está vinculado a outros dados do sistema e não pode ser modificado.";
                }
                if (msg.contains("timeout")) {
                    return "A operação demorou mais do que o esperado. Tente novamente.";
                }
                return "Ocorreu um problema ao acessar os dados do sistema. Tente novamente.";
        }
    }

    /** Caminha pela cadeia de causas buscando um SQLException. */
    private static SQLException extrairSQLException(Throwable t) {
        while (t != null) {
            if (t instanceof SQLException) return (SQLException) t;
            t = t.getCause();
        }
        return null;
    }
}
