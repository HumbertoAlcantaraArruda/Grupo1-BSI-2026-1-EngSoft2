package agape.control;

import java.sql.Connection;
import java.sql.DriverManager;
import java.util.Properties;
import java.io.FileInputStream;

public class ConexaoBD {

    private static ConexaoBD instancia;
    private Connection conn;

    private ConexaoBD() {
        try {
            // Força o carregamento do Driver do MySQL
            Class.forName("com.mysql.cj.jdbc.Driver");

            Properties props = new Properties();
            props.load(new FileInputStream("BackEnd/config.properties"));

            String url      = props.getProperty("db.url");
            String user     = props.getProperty("db.user");
            String password = props.getProperty("db.password");

            conn = DriverManager.getConnection(url, user, password);

        } catch (Exception e) {
            throw new RuntimeException("Erro de Conexão: " + e.getMessage() + " (Verifique se o arquivo BackEnd/config.properties existe)", e);
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