package agape.control;

import java.sql.Connection;
import java.sql.DriverManager;
import java.util.Properties;
import java.io.InputStream;

public class ConexaoBD {

    private static ConexaoBD instancia;
    private Connection conn;

    private ConexaoBD() {
        try {
            Properties props = new Properties();
            InputStream is = ConexaoBD.class.getClassLoader().getResourceAsStream("config.properties");
            if (is == null) {
                throw new RuntimeException("config.properties não encontrado no classpath");
            }
            props.load(is);

            String url      = props.getProperty("db.url");
            String user     = props.getProperty("db.user");
            String password = props.getProperty("db.password");

            conn = DriverManager.getConnection(url, user, password);

        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Erro de Conexão: " + e.getMessage(), e);
        }
    }

    public static ConexaoBD getInstance() {
        if (instancia == null) {
            instancia = new ConexaoBD();
        }
        return instancia;
    }

    public Connection getConexao() {
        try {
            if (conn == null || conn.isClosed()) {
                instancia = new ConexaoBD();
                return instancia.conn;
            }
            return conn;
        } catch (Exception e) {
            throw new RuntimeException("Erro ao verificar conexão", e);
        }
    }
}