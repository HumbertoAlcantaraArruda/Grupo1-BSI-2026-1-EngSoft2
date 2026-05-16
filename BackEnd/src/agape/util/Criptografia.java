package agape.util;

import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;
import java.security.SecureRandom;
import java.util.Base64;

public class Criptografia {

    private static final int    ITERACOES    = 310_000;
    private static final int    BITS_CHAVE   = 256;
    private static final String ALGORITMO    = "PBKDF2WithHmacSHA256";
    private static final int    BYTES_SALT   = 16;

    public static String hashSenha(String senha) {
        try {
            byte[] salt = new byte[BYTES_SALT];
            new SecureRandom().nextBytes(salt);

            byte[] hash = _derivar(senha.toCharArray(), salt, ITERACOES, BITS_CHAVE);

            // Formato armazenado: "iteracoes:salt_b64:hash_b64"
            return ITERACOES + ":"
                 + Base64.getEncoder().encodeToString(salt) + ":"
                 + Base64.getEncoder().encodeToString(hash);

        } catch (Exception e) {
            throw new RuntimeException("Erro ao gerar hash da senha", e);
        }
    }

    public static boolean verificarSenha(String senha, String hashArmazenado) {
        try {
            String[] partes = hashArmazenado.split(":", 3);
            if (partes.length != 3) return false;

            int    iteracoes = Integer.parseInt(partes[0]);
            byte[] salt      = Base64.getDecoder().decode(partes[1]);
            byte[] hashOrig  = Base64.getDecoder().decode(partes[2]);

            byte[] hashTeste = _derivar(senha.toCharArray(), salt, iteracoes, hashOrig.length * 8);

            // Comparação em tempo constante — evita timing attack
            int diff = hashTeste.length ^ hashOrig.length;
            for (int i = 0; i < Math.min(hashTeste.length, hashOrig.length); i++) {
                diff |= hashTeste[i] ^ hashOrig[i];
            }
            return diff == 0;

        } catch (Exception e) {
            return false;
        }
    }

    private static byte[] _derivar(char[] senha, byte[] salt, int iteracoes, int bits) throws Exception {
        PBEKeySpec spec = new PBEKeySpec(senha, salt, iteracoes, bits);
        try {
            return SecretKeyFactory.getInstance(ALGORITMO).generateSecret(spec).getEncoded();
        } finally {
            spec.clearPassword();
        }
    }
}
