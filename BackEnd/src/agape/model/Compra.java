package agape.model;

import java.sql.Connection;
import java.time.LocalDateTime;

import agape.dao.CompraDAO;

public class Compra {
    private final CompraDAO dao = new CompraDAO();

    private int idCompra;
    private LocalDateTime dataHora;
    private float valorTotal;
    private int idFornecedor;
    private int idUsuario;
    private String numNotaFiscal;   // varchar(44), opcional
    private String obs;             // varchar(400), opcional

    public int getIdCompra() {
        return idCompra;
    }

    public void setIdCompra(int idCompra) {
        this.idCompra = idCompra;
    }

    public LocalDateTime getDataHora() {
        return dataHora;
    }

    public void setDataHora(LocalDateTime dataHora) {
        this.dataHora = dataHora;
    }

    public float getValorTotal() {
        return valorTotal;
    }

    public void setValorTotal(float valorTotal) {
        this.valorTotal = valorTotal;
    }

    public int getIdFornecedor() {
        return idFornecedor;
    }

    public void setIdFornecedor(int idFornecedor) {
        this.idFornecedor = idFornecedor;
    }

    public int getIdUsuario() {
        return idUsuario;
    }

    public void setIdUsuario(int idUsuario) {
        this.idUsuario = idUsuario;
    }

    public String getNumNotaFiscal() {
        return numNotaFiscal;
    }

    public void setNumNotaFiscal(String numNotaFiscal) {
        this.numNotaFiscal = numNotaFiscal;
    }

    public String getObs() {
        return obs;
    }

    public void setObs(String obs) {
        this.obs = obs;
    }

    // ── Persistência (DAO encapsulado) ─────────────────────────────────────

    public int inserir(Connection conn) throws Exception {
        int id = dao.inserir(conn, this);
        this.idCompra = id;
        return id;
    }
}
