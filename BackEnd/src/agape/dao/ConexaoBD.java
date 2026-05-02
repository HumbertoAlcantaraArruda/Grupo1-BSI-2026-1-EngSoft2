package agape.dao;

import java.sql.Connection;
import java.sql.DriverManager;
import java.util.Properties;
import java.io.FileInputStream;

public class ConexaoBD {

    private static Connection conn;

    public static Connection getConexao() {
        try {
            if (conn == null || conn.isClosed()) {

                Properties props = new Properties();
                props.load(new FileInputStream("BackEnd/config.properties"));

                String url = props.getProperty("db.url");
                String user = props.getProperty("db.user");
                String password = props.getProperty("db.password");

                conn = DriverManager.getConnection(url, user, password);
            }

            return conn;

        } catch (Exception e) {
            throw new RuntimeException("Erro ao conectar", e);
        }
    }
}