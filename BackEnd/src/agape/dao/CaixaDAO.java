package agape.dao;

import agape.model.Caixa;
import agape.model.MovimentacaoCaixa;

import java.sql.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class CaixaDAO {

    private Caixa mapear(ResultSet rs) throws SQLException {
        Caixa c = new Caixa();
        c.setIdCaixa(rs.getInt("idCaixa"));
        c.setIdUsuario(rs.getInt("idUsuario"));
        c.setValorInicial(rs.getFloat("valorInicial"));
        c.setValorFinal(rs.getFloat("valorFinal"));
        Timestamp abertura   = rs.getTimestamp("dataHoraAbertura");
        Timestamp fechamento = rs.getTimestamp("dataHoraFechamento");
        if (abertura   != null) c.setDataHoraAbertura(abertura.toLocalDateTime());
        if (fechamento != null) c.setDataHoraFechamento(fechamento.toLocalDateTime());
        return c;
    }

    /** RF_F4 — Abre um novo caixa para o operador e devolve o id gerado. */
    public int abrir(Connection conn, int idUsuario, float valorInicial) throws Exception {
        String sql =
                "INSERT INTO Caixa (idUsuario, dataHoraAbertura, valorInicial, valorFinal) " +
                        "VALUES (?, ?, ?, ?)";
        try (PreparedStatement stmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            stmt.setInt(1, idUsuario);
            stmt.setObject(2, LocalDateTime.now());
            stmt.setFloat(3, valorInicial);
            stmt.setFloat(4, valorInicial);
            stmt.executeUpdate();
            try (ResultSet rs = stmt.getGeneratedKeys()) {
                if (rs.next()) return rs.getInt(1);
            }
        }
        throw new Exception("Não foi possível obter o id do caixa criado.");
    }

    /** Retorna o caixa aberto do operador, ou null se não houver. */
    public Caixa buscarAbertoPorUsuario(Connection conn, int idUsuario) throws Exception {
        String sql =
                "SELECT * FROM Caixa " +
                        "WHERE idUsuario = ? AND dataHoraFechamento IS NULL " +
                        "ORDER BY dataHoraAbertura DESC LIMIT 1";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, idUsuario);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) return mapear(rs);
            }
        }
        return null;
    }

    /** Retorna o caixa aberto mais recente (qualquer operador) — usado por CVenda. */
    public Caixa buscarAberto(Connection conn) throws Exception {
        String sql =
                "SELECT * FROM Caixa WHERE dataHoraFechamento IS NULL " +
                        "ORDER BY dataHoraAbertura DESC LIMIT 1";
        try (PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {
            if (rs.next()) return mapear(rs);
        }
        return null;
    }

    /** Busca caixa pelo id. */
    public Caixa buscarPorId(Connection conn, int idCaixa) throws Exception {
        String sql = "SELECT * FROM Caixa WHERE idCaixa = ?";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, idCaixa);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) return mapear(rs);
            }
        }
        return null;
    }

    /** Fecha o caixa: registra dataHoraFechamento e o valorFinal consolidado. */
    public void fechar(Connection conn, int idCaixa, float valorFinal) throws Exception {
        String sql =
                "UPDATE Caixa SET dataHoraFechamento = ?, valorFinal = ? " +
                        "WHERE idCaixa = ?";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setObject(1, LocalDateTime.now());
            stmt.setFloat(2, valorFinal);
            stmt.setInt(3, idCaixa);
            stmt.executeUpdate();
        }
    }

    /** Acrescenta (ou subtrai, se negativo) valor ao saldo atual do caixa. */
    public void adicionarAoValorFinal(Connection conn, int idCaixa, float valor) throws Exception {
        String sql = "UPDATE Caixa SET valorFinal = valorFinal + ? WHERE idCaixa = ?";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setFloat(1, valor);
            stmt.setInt(2, idCaixa);
            stmt.executeUpdate();
        }
    }

    /** Retorna o saldo atual (valorFinal) do caixa informado. */
    public float getSaldoAtual(Connection conn, int idCaixa) throws Exception {
        String sql = "SELECT COALESCE(valorFinal, valorInicial, 0) AS saldo FROM Caixa WHERE idCaixa = ?";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, idCaixa);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) return rs.getFloat("saldo");
            }
        }
        throw new Exception("Caixa não encontrado: " + idCaixa);
    }

    /** Lista todas as movimentações manuais de um caixa (suprimentos e sangrias). */
    public List<MovimentacaoCaixa> listarMovimentacoes(Connection conn, int idCaixa) throws Exception {
        String sql =
                "SELECT * FROM MovimentacaoCaixa " +
                        "WHERE idCaixa = ? AND motivo NOT LIKE 'Venda #%' " +
                        "ORDER BY dataHora ASC";
        List<MovimentacaoCaixa> lista = new ArrayList<>();
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, idCaixa);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    MovimentacaoCaixa m = new MovimentacaoCaixa();
                    m.setIdMov(rs.getInt("idMov"));
                    m.setIdCaixa(rs.getInt("idCaixa"));
                    m.setIdUsuario(rs.getInt("Usuario_idUsuario"));
                    m.setValor(rs.getFloat("valor"));
                    m.setMotivo(rs.getString("motivo"));
                    Timestamp dt = rs.getTimestamp("dataHora");
                    if (dt != null) m.setDataHora(dt.toLocalDateTime());
                    lista.add(m);
                }
            }
        }
        return lista;
    }

    /**
     * Retorna o total de vendas e o breakdown por forma de pagamento
     * realizadas durante o período em que o caixa esteve aberto.
     * Chave do mapa: nome da forma de pagamento. Valor: total recebido.
     */
    public Map<String, Float> resumoVendasPorFormaPag(Connection conn, int idCaixa) throws Exception {
        // Busca o caixa para pegar o período de abertura
        Caixa caixa = buscarPorId(conn, idCaixa);
        if (caixa == null) return new LinkedHashMap<>();

        String sql =
                "SELECT COALESCE(fp.descricao, 'Não informado') AS formaPag, " +
                        "       SUM(v.valorFinal) AS total " +
                        "FROM Venda v " +
                        "LEFT JOIN FormaPagamento fp ON v.idFormaPag = fp.idFormaPag " +
                        "WHERE v.dataHora >= ? " +
                        "  AND (? IS NULL OR v.dataHora <= ?) " +
                        "GROUP BY fp.descricao " +
                        "ORDER BY fp.descricao";

        Map<String, Float> resultado = new LinkedHashMap<>();
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setObject(1, caixa.getDataHoraAbertura());
            // Se o caixa ainda está aberto, usa agora como limite; senão usa o fechamento
            LocalDateTime fim = caixa.getDataHoraFechamento() != null
                    ? caixa.getDataHoraFechamento()
                    : LocalDateTime.now();
            stmt.setObject(2, fim);
            stmt.setObject(3, fim);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    resultado.put(rs.getString("formaPag"), rs.getFloat("total"));
                }
            }
        }
        return resultado;
    }
}