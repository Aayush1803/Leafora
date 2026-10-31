import Image from "next/image";

export default function Footer() {
  const year = new Date().getFullYear();

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
            src="/leafora-leaf.png"
            alt="LEAFORA"
            width={24}
            height={24}
            style={{
              height: "22px",
              width: "auto",
              display: "block",
            }}
          />
          <span
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "0.85rem",
              fontWeight: "700",
              letterSpacing: "0.18em",
              color: "var(--color-brand)",
            }}
          >
            LEAFORA
          </span>
          <span className="t-caption">·</span>
          <span className="t-caption">Crop Analysis</span>
        </div>
        <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
          <span className="t-caption">211 Classes · CNN</span>
          <span className="t-caption">© {year}</span>
        </div>
      </div>
    </footer>
  );
}
