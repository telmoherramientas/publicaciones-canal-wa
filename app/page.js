"use client";

import { useState, useRef, useCallback } from "react";
import styles from "./page.module.css";

export default function Home() {
  const [imgFile, setImgFile] = useState(null);
  const [imgPreview, setImgPreview] = useState(null);
  const [sku, setSku] = useState("");
  const [marca, setMarca] = useState("");
  const [precio, setPrecio] = useState("");
  const [nota, setNota] = useState("");
  const [resultado, setResultado] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef(null);

  const canGenerate = imgFile && sku.trim() && marca.trim() && precio.trim();

  const handleFile = useCallback((file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setImgFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setImgPreview(e.target.result);
    reader.readAsDataURL(file);
    setResultado("");
  }, []);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const generar = async () => {
    setLoading(true);
    setResultado("");

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target.result.split(",")[1];
      try {
        const res = await fetch("/api/generar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageBase64: base64,
            sku,
            marca,
            precio,
            nota,
          }),
        });
        const data = await res.json();
        setResultado(data.publicacion || "Error al generar.");
      } catch {
        setResultado("Error de conexión. Intentá de nuevo.");
      }
      setLoading(false);
    };
    reader.readAsDataURL(imgFile);
  };

  const copiar = () => {
    navigator.clipboard.writeText(resultado).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const resetImagen = () => {
    setImgFile(null);
    setImgPreview(null);
    setResultado("");
  };

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        {/* Header */}
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
            {/* Foto */}
            <section className={styles.card}>
              <p className={styles.label}>
                <span className={styles.step}>1</span>
                Foto del producto
              </p>
              {!imgPreview ? (
                <div
                  className={`${styles.dropzone} ${dragging ? styles.dropzoneDragging : ""}`}
                  onClick={() => fileRef.current.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={styles.uploadIcon}>
                    <path d="M4 16l4-4 4 4M12 12l4-4 4 4M12 12V21M20 16.5A4.5 4.5 0 0016 7a.6.6 0 01-.6-.4A7.5 7.5 0 104 15.9" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <p className={styles.dropText}>Hacé clic o arrastrá la foto aquí</p>
                  <p className={styles.dropHint}>JPG, PNG, WEBP</p>
                </div>
              ) : (
                <div className={styles.previewWrap}>
                  <img src={imgPreview} alt="Preview" className={styles.preview} />
                  <button className={styles.removeBtn} onClick={resetImagen}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/>
                    </svg>
                    Cambiar foto
                  </button>
                </div>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => handleFile(e.target.files[0])}
              />
            </section>

            {/* Datos */}
            <section className={styles.card}>
              <p className={styles.label}>
                <span className={styles.step}>2</span>
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
                  <label className={styles.fieldLabel}>Nota extra <span className={styles.optional}>(opcional)</span></label>
                  <input
                    type="text"
                    placeholder="Ej: viene en set de 3 piezas"
                    value={nota}
                    onChange={(e) => setNota(e.target.value)}
                  />
                </div>
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
