export default function Footer() {
  return (
    <footer
      style={{
        borderTop: "1px solid var(--color-border-subtle)",
        marginTop: "6rem",
        padding: "2rem 0",
      }}
    >
      <div
        className="container-main"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span
            style={{
              fontSize: "0.8125rem",
              fontWeight: "700",
              letterSpacing: "0.14em",
              color: "var(--color-text-primary)",
            }}
          >
            VEYRA
          </span>
          <span className="t-caption">·</span>
          <span className="t-caption">Crop Analysis</span>
        </div>
        <div style={{ display: "flex", gap: "1.5rem" }}>
          <span className="t-caption">VEYRA CNN</span>
          <span className="t-caption">211 Classes</span>
        </div>
      </div>
    </footer>
  );
}
