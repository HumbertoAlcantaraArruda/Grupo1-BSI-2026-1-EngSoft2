package agape.model;

import java.time.LocalDate;

/**
 * ParcelaRecebimento — representa uma parcela individual de uma venda parcelada.
 *
 * Information Expert (GRASP) — o modelo conhece seus próprios dados de parcela.
 * Cada ContasReceber tem N ParcelasRecebimento (RN03).
 */
public class ParcelaRecebimento {

    private int       idParcela;
    private int       idConta;       // FK → ContasReceber
    private int       numeroParcela; // 1, 2, 3 ...
    private float     valor;
    private LocalDate dataVencimento;
    private String    status;        // PENDENTE | PAGO
    private LocalDate dataPagamento; // preenchido ao quitar a parcela

    public int getIdParcela()                  { return idParcela; }
    public void setIdParcela(int v)            { this.idParcela = v; }

    public int getIdConta()                    { return idConta; }
    public void setIdConta(int v)              { this.idConta = v; }

    public int getNumeroParcela()              { return numeroParcela; }
    public void setNumeroParcela(int v)        { this.numeroParcela = v; }

    public float getValor()                    { return valor; }
    public void setValor(float v)              { this.valor = v; }

    public LocalDate getDataVencimento()       { return dataVencimento; }
    public void setDataVencimento(LocalDate v) { this.dataVencimento = v; }

    public String getStatus()                  { return status; }
    public void setStatus(String v)            { this.status = v; }

    public LocalDate getDataPagamento()        { return dataPagamento; }
    public void setDataPagamento(LocalDate v)  { this.dataPagamento = v; }
}
