package agape.util;

/**
 * Utilitário para validação de CPF seguindo o algoritmo oficial da Receita Federal.
 *
 * Regras aplicadas:
 *  - Remove pontuação (pontos e traço) antes de validar.
 *  - Rejeita CPFs com comprimento diferente de 11 dígitos.
 *  - Rejeita CPFs com todos os dígitos iguais (ex.: 111.111.111-11).
 *  - Valida os dois dígitos verificadores pelo algoritmo padrão.
 *
 * Uso:
 *   ValidacaoCPF.validar("123.456.789-09")  → true/false
 *   ValidacaoCPF.formatar("12345678909")    → "123.456.789-09"
 *   ValidacaoCPF.limpar("123.456.789-09")   → "12345678909"
 */
public class ValidacaoCPF {

    private ValidacaoCPF() {
        // Classe utilitária – não instanciável
    }

    /**
     * Valida um CPF. Aceita com ou sem pontuação (ex.: "123.456.789-09" ou "12345678909").
     *
     * @param cpf string com o CPF a ser validado
     * @return {@code true} se o CPF for válido; {@code false} caso contrário
     */
    public static boolean validar(String cpf) {
        if (cpf == null) return false;

        String c = limpar(cpf);

        // Deve ter exatamente 11 dígitos
        if (c.length() != 11) return false;

        // Deve conter apenas dígitos
        if (!c.matches("\\d{11}")) return false;

        // Rejeita sequências uniformes (ex.: 000...0, 111...1, etc.)
        if (c.chars().distinct().count() == 1) return false;

        // Valida primeiro dígito verificador
        if (!verificarDigito(c, 9)) return false;

        // Valida segundo dígito verificador
        if (!verificarDigito(c, 10)) return false;

        return true;
    }

    /**
     * Remove toda pontuação do CPF, mantendo apenas os dígitos.
     *
     * @param cpf CPF com ou sem pontuação
     * @return string contendo apenas os 11 dígitos
     */
    public static String limpar(String cpf) {
        if (cpf == null) return "";
        return cpf.replaceAll("[^0-9]", "");
    }

    /**
     * Formata um CPF de 11 dígitos no padrão "XXX.XXX.XXX-XX".
     * Se o CPF não tiver 11 dígitos após limpeza, devolve a string original.
     *
     * @param cpf CPF com ou sem pontuação
     * @return CPF formatado ou a string original em caso de tamanho inválido
     */
    public static String formatar(String cpf) {
        String c = limpar(cpf);
        if (c.length() != 11) return cpf;
        return c.substring(0, 3) + "." +
               c.substring(3, 6) + "." +
               c.substring(6, 9) + "-" +
               c.substring(9);
    }

    // ── Auxiliar ─────────────────────────────────────────────────────────────

    /**
     * Verifica se o dígito na posição {@code posicao} é o dígito verificador correto.
     *
     * @param cpf     CPF limpo com 11 dígitos
     * @param posicao 9 para o primeiro dígito verificador, 10 para o segundo
     */
    private static boolean verificarDigito(String cpf, int posicao) {
        int soma = 0;
        int peso = posicao + 1; // peso inicial: 10 (1º dígito) ou 11 (2º dígito)

        for (int i = 0; i < posicao; i++) {
            soma += Character.getNumericValue(cpf.charAt(i)) * peso;
            peso--;
        }

        int resto = (soma * 10) % 11;
        if (resto == 10 || resto == 11) resto = 0;

        return resto == Character.getNumericValue(cpf.charAt(posicao));
    }
}
