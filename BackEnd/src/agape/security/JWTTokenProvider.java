package agape.security;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Base64;
import java.util.Date;

import javax.crypto.SecretKey;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

public class JWTTokenProvider {

    private static final SecretKey CHAVE = Keys.hmacShaKeyFor(
            Base64.getDecoder().decode(
            "VU7WbLVaKYKBYbPBNwGOVFBIXqQJp6KjI8K8JeyNuGIV7LMmwcmtBAU/LjT+SuRsxNFViCKIhNDW4PuIT18P2A=="));

    private static final long EXPIRACAO_MINUTOS = 480L; // 8 horas

    public static String createToken(String usuario, String nivel) {
        return Jwts.builder()
                .subject(usuario)
                .issuer("agape-backend")
                .claim("nivel", nivel)
                .issuedAt(new Date())
                .expiration(Date.from(LocalDateTime.now().plusMinutes(EXPIRACAO_MINUTOS)
                        .atZone(ZoneId.systemDefault()).toInstant()))
                .signWith(CHAVE)
                .compact();
    }

    public static boolean verifyToken(String token) {
        try {
            Jwts.parser()
                    .verifyWith(CHAVE)
                    .build()
                    .parseSignedClaims(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public static Claims getAllClaims(String token) {
        try {
            return Jwts.parser()
                    .verifyWith(CHAVE)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (Exception e) {
            return null;
        }
    }

    public static String getClaim(String token, String chave) {
        Claims claims = getAllClaims(token);
        if (claims == null || claims.get(chave) == null) return null;
        return claims.get(chave).toString();
    }
}
