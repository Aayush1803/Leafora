import Image from "next/image";

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
          <Image
            src="/leafora-logo.png"
            alt="LEAFORA"
            width={24}
            height={24}
            style={{
              height: "24px",
              width: "auto",
              display: "block",
              opacity: 0.85,
            }}
          />
          <span
            style={{
              fontSize: "0.8125rem",
              fontWeight: "700",
              letterSpacing: "0.14em",
              color: "var(--color-text-primary)",
            }}
          >
            LEAFORA
          </span>
          <span className="t-caption">·</span>
          <span className="t-caption">Crop Analysis</span>
        </div>
        <div style={{ display: "flex", gap: "1.5rem" }}>
          <span className="t-caption">LEAFORA CNN</span>
          <span className="t-caption">211 Classes</span>
        </div>
      </div>
    </footer>
  );
}
