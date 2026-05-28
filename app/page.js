"use client";

import { useState } from "react";
import styles from "./page.module.css";

export default function Home() {
  const [sku, setSku] = useState("");
  const [marca, setMarca] = useState("");
  const [precio, setPrecio] = useState("");
  const [nota, setNota] = useState("");
  const [resultado, setResultado] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [umbral, setUmbral] = useState("65000");
  const [umbralLocked, setUmbralLocked] = useState(true);

  const canGenerate = sku.trim() && marca.trim() && precio.trim();

  const generar = async () => {
    setLoading(true);
    setResultado("");
    try {
      const res = await fetch("/api/generar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sku, marca, precio, nota, umbral }),
      });
      const data = await res.json();
      setResultado(data.publicacion || data.error || "Error al generar.");
    } catch {
      setResultado("Error de conexión. Intentá de nuevo.");
    }
    setLoading(false);
  };

  const copiar = () => {
    navigator.clipboard.writeText(resultado).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.logoMark}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M3 10L8 15L17 5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <h1 className={styles.title}>Generador de publicaciones</h1>
            <p className={styles.subtitle}>Telmo Herramientas · WhatsApp</p>
          </div>
        </header>

        <div className={styles.grid}>
          {/* Left column: inputs */}
          <div className={styles.column}>
            <section className={styles.card}>
              <p className={styles.label}>
                <span className={styles.step}>1</span>
                Datos del producto
              </p>
              <div className={styles.fields}>
                <div className={styles.fieldRow}>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>SKU</label>
                    <input
                      type="text"
                      placeholder="Ej: EPLS0331"
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Marca</label>
                    <input
                      type="text"
                      placeholder="Ej: Emtop"
                      value={marca}
                      onChange={(e) => setMarca(e.target.value)}
                    />
                  </div>
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Precio</label>
                  <input
                    type="text"
                    placeholder="Ej: $49.000"
                    value={precio}
                    onChange={(e) => setPrecio(e.target.value)}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>
                    Nota extra <span className={styles.optional}>(opcional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: viene en set de 3 piezas"
                    value={nota}
                    onChange={(e) => setNota(e.target.value)}
                  />
                </div>
              </div>
            </section>

            {/* Umbral de envío */}
            <section className={styles.cardUmbral}>
              <div className={styles.umbralHeader}>
                <div>
                  <p className={styles.umbralTitle}>Umbral de envío gratis</p>
                  <p className={styles.umbralDesc}>
                    El footer de envío y pago se agrega solo si el precio supera este monto
                  </p>
                </div>
                <button
                  className={`${styles.lockBtn} ${umbralLocked ? styles.lockBtnLocked : styles.lockBtnUnlocked}`}
                  onClick={() => setUmbralLocked(!umbralLocked)}
                  title={umbralLocked ? "Desbloquear para editar" : "Bloquear"}
                >
                  {umbralLocked ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2"/>
                      <path d="M7 11V7a5 5 0 0110 0v4" strokeLinecap="round"/>
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2"/>
                      <path d="M7 11V7a5 5 0 019.9-1" strokeLinecap="round"/>
                    </svg>
                  )}
                </button>
              </div>
              <div className={styles.umbralInputWrap}>
                <span className={styles.umbralPrefix}>$</span>
                <input
                  type="text"
                  className={styles.umbralInput}
                  value={Number(umbral).toLocaleString("es-AR")}
                  disabled={umbralLocked}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, "");
                    setUmbral(raw);
                  }}
                />
              </div>
            </section>

            <button
              className={styles.btnGenerar}
              onClick={generar}
              disabled={!canGenerate || loading}
            >
              {loading ? (
                <>
                  <span className={styles.spinner} />
                  Buscando specs y generando...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" strokeLinejoin="round"/>
                  </svg>
                  Generar publicación
                </>
              )}
            </button>
          </div>

          {/* Right column: result */}
          <div className={styles.column}>
            {resultado ? (
              <section className={styles.card}>
                <div className={styles.resultHeader}>
                  <p className={styles.label} style={{ marginBottom: 0 }}>
                    <span className={styles.stepSuccess}>✓</span>
                    Publicación lista
                  </p>
                  <button className={styles.copyBtn} onClick={copiar}>
                    {copied ? (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        ¡Copiado!
                      </>
                    ) : (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <rect x="9" y="9" width="13" height="13" rx="2"/>
                          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                        </svg>
                        Copiar texto
                      </>
                    )}
                  </button>
                </div>
                <pre className={styles.resultado}>{resultado}</pre>
              </section>
            ) : (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p className={styles.emptyTitle}>La publicación aparecerá acá</p>
                <p className={styles.emptyText}>
                  Completá los datos de la izquierda<br />y hacé clic en "Generar publicación"
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
