"""
LEAFORA PDF Generator
Converts Markdown docs to branded PDFs for HCL submission.
"""
import os, re, sys
from pathlib import Path
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.colors import HexColor, white
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, HRFlowable,
    Table, TableStyle, PageBreak, Image as RLImage,
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.pdfgen import canvas

# Brand palette
ACCENT  = HexColor("#2D6A4F")
SOFT    = HexColor("#D8F3DC")
BG      = HexColor("#F5F2ED")
TXT_P   = HexColor("#1A1714")
TXT_S   = HexColor("#6B6560")
TXT_M   = HexColor("#9E9893")
BORDER  = HexColor("#DDD9D3")
SURF    = HexColor("#EFEDE8")
W, H    = A4
MARGIN  = 2.1 * cm

LOGO    = Path(__file__).parent / "leafora-logo.png"
OUT     = Path(__file__).parent / "LEAFORA_HCL_Submission"
DOCS    = Path(__file__).parent / "docs"
OUT.mkdir(exist_ok=True)


# ---------- numbered canvas (header/footer) ----------

class NC(canvas.Canvas):
    def __init__(self, fn, **kw):
        super().__init__(fn, **kw)
        self._pages = []

    def showPage(self):
        self._pages.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        n = len(self._pages)
        for i, s in enumerate(self._pages):
            self.__dict__.update(s)
            self._draw_footer(i + 1, n)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def _draw_footer(self, cur, total):
        self.saveState()
        self.setStrokeColor(BORDER)
        self.setLineWidth(0.4)
        self.line(MARGIN, 1.3*cm, W-MARGIN, 1.3*cm)
        self.setFont("Helvetica", 7)
        self.setFillColor(TXT_M)
        self.drawString(MARGIN, 0.8*cm, "LEAFORA - Crop Disease Detection")
        self.drawRightString(W-MARGIN, 0.8*cm, f"Page {cur} of {total}")
        self.restoreState()


# ---------- styles ----------

def S(name, **kw):
    return ParagraphStyle(name, **kw)

def styles():
    base = dict(fontName="Helvetica", fontSize=10, leading=15, textColor=TXT_P)
    return {
        "body":  S("body",  **base, spaceAfter=5, alignment=TA_JUSTIFY),
        "bsm":   S("bsm",  fontName="Helvetica", fontSize=9, leading=13, textColor=TXT_S, spaceAfter=3),
        "h1":    S("h1",   fontName="Helvetica-Bold", fontSize=20, leading=26, textColor=TXT_P, spaceAfter=8),
        "h2":    S("h2",   fontName="Helvetica-Bold", fontSize=14, leading=20, textColor=ACCENT,
                           spaceAfter=6, spaceBefore=16),
        "h3":    S("h3",   fontName="Helvetica-Bold", fontSize=11.5, leading=16, textColor=TXT_P,
                           spaceAfter=5, spaceBefore=10),
        "h4":    S("h4",   fontName="Helvetica-BoldOblique", fontSize=10, leading=14, textColor=TXT_S,
                           spaceAfter=4, spaceBefore=7),
        "code":  S("code", fontName="Courier", fontSize=7.5, leading=11, textColor=TXT_P,
                           backColor=SURF, borderPadding=(3,4,3,4), spaceAfter=6),
        "bq":    S("bq",   fontName="Helvetica-Oblique", fontSize=9, leading=13, textColor=TXT_S,
                           leftIndent=14, spaceAfter=5, backColor=SOFT,
                           borderColor=ACCENT, borderWidth=2, borderPadding=(4,0,4,8)),
        "li":    S("li",   fontName="Helvetica", fontSize=9.5, leading=13, textColor=TXT_P,
                           leftIndent=14, spaceAfter=2),
        "lism":  S("lism", fontName="Helvetica", fontSize=8.5, leading=12, textColor=TXT_S,
                           leftIndent=26, spaceAfter=2),
        "num":   S("num",  fontName="Helvetica", fontSize=9.5, leading=13, textColor=TXT_P,
                           leftIndent=18, spaceAfter=2),
        "cov_brand": S("cov_b", fontName="Helvetica-Bold", fontSize=11, leading=16,
                               textColor=ACCENT, alignment=TA_CENTER, letterSpacing=2),
        "cov_title": S("cov_t", fontName="Helvetica-Bold", fontSize=24, leading=30,
                               textColor=TXT_P, alignment=TA_CENTER),
        "cov_sub":   S("cov_s", fontName="Helvetica", fontSize=12, leading=18,
                               textColor=TXT_S, alignment=TA_CENTER),
        "cov_meta":  S("cov_m", fontName="Helvetica", fontSize=9, leading=14,
                               textColor=TXT_M, alignment=TA_CENTER),
    }


# ---------- inline markdown → safe ReportLab XML ----------

def xesc(t):
    return t.replace("&","&amp;").replace("<","&lt;").replace(">","&gt;")

def inline(text):
    # Remove LaTeX math
    text = re.sub(r'\$\$.*?\$\$', '', text, flags=re.S)
    text = re.sub(r'\$[^\$\n]+\$', '', text)
    text = re.sub(r'\\\[(.*?)\\\]', r'\1', text, flags=re.S)
    text = re.sub(r'\\\(.*?\\\)', '', text, flags=re.S)
    # Extract code spans (to prevent tag conflicts)
    codes = []
    def _code(m):
        codes.append(m.group(1))
        return f"CODESPAN{len(codes)-1}END"
    text = re.sub(r'`([^`\n]+)`', _code, text)
    # Links → display text only
    text = re.sub(r'!\[[^\]]*\]\([^)]+\)', '', text)
    text = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', text)
    # HTML tags strip
    text = re.sub(r'<[^>]+>', '', text)
    # Escape XML
    text = xesc(text)
    # Bold+italic
    text = re.sub(r'\*\*\*(.+?)\*\*\*', r'<b><i>\1</i></b>', text)
    # Bold
    text = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', text)
    # Italic * (simple non-nested only)
    text = re.sub(r'\*([^*\n<>]+)\*', r'<i>\1</i>', text)
    # Restore code spans
    for i, c in enumerate(codes):
        text = text.replace(f"CODESPAN{i}END",
            f'<font name="Courier" size="8">{xesc(c)}</font>')
    return text.strip()


# ---------- table parser ----------

def md_table(lines, st):
    rows = []
    for ln in lines:
        s = ln.strip()
        if re.match(r'^[\|\s:*-]+$', s):
            continue
        cells = [c.strip() for c in s.strip("|").split("|")]
        rows.append(cells)
    if not rows:
        return None
    cols = max(len(r) for r in rows)
    rows = [r + [""]*(cols-len(r)) for r in rows]

    def cp(txt, hdr):
        fn = "Helvetica-Bold" if hdr else "Helvetica"
        fc = white if hdr else TXT_P
        try:
            return Paragraph(inline(txt),
                ParagraphStyle("tc", fontName=fn, fontSize=7.5, leading=11, textColor=fc))
        except Exception:
            return Paragraph(xesc(txt),
                ParagraphStyle("tc", fontName=fn, fontSize=7.5, leading=11, textColor=fc))

    data = [[cp(c, ri==0) for c in r] for ri, r in enumerate(rows)]
    cw = (W - 2*MARGIN) / cols
    t = Table(data, colWidths=[cw]*cols, repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND",(0,0),(-1,0), ACCENT),
        ("TEXTCOLOR",(0,0),(-1,0), white),
        ("ROWBACKGROUNDS",(0,1),(-1,-1),[white, SURF]),
        ("GRID",(0,0),(-1,-1),0.3,BORDER),
        ("TOPPADDING",(0,0),(-1,-1),4),
        ("BOTTOMPADDING",(0,0),(-1,-1),4),
        ("LEFTPADDING",(0,0),(-1,-1),5),
        ("RIGHTPADDING",(0,0),(-1,-1),5),
        ("VALIGN",(0,0),(-1,-1),"TOP"),
    ]))
    return t


# ---------- Markdown → flowables ----------

def md2flow(md, st):
    els = []
    lines = md.splitlines()
    i = 0
    in_code = False
    cbuf = []

    while i < len(lines):
        ln = lines[i]
        stripped = ln.strip()

        # Code fences
        if stripped.startswith("```"):
            if not in_code:
                in_code = True
                cbuf = []
            else:
                raw = "\n".join(cbuf)
                # Split large blocks
                for chunk in [raw[j:j+900] for j in range(0,len(raw),900)]:
                    try:
                        els.append(Paragraph(
                            f'<font name="Courier" size="7">{xesc(chunk)}</font>',
                            st["code"]))
                    except Exception:
                        pass
                in_code = False
                cbuf = []
            i += 1
            continue

        if in_code:
            cbuf.append(ln)
            i += 1
            continue

        # Tables
        if stripped.startswith("|"):
            tlines = []
            while i < len(lines) and lines[i].strip().startswith("|"):
                tlines.append(lines[i])
                i += 1
            tbl = md_table(tlines, st)
            if tbl:
                els += [Spacer(1,0.15*cm), tbl, Spacer(1,0.15*cm)]
            continue

        # Headings
        if stripped.startswith("# ") and not stripped.startswith("## "):
            txt = inline(stripped[2:])
            try: els.append(Paragraph(txt, st["h1"]))
            except: pass
        elif stripped.startswith("## ") and not stripped.startswith("### "):
            txt = inline(stripped[3:])
            try: els.append(Paragraph(txt, st["h2"]))
            except: pass
        elif stripped.startswith("### ") and not stripped.startswith("#### "):
            txt = inline(stripped[4:])
            try: els.append(Paragraph(txt, st["h3"]))
            except: pass
        elif stripped.startswith("#### "):
            txt = inline(stripped[5:])
            try: els.append(Paragraph(txt, st["h4"]))
            except: pass

        # HR
        elif re.match(r'^-{3,}$', stripped) or re.match(r'^\*{3,}$', stripped):
            els += [Spacer(1,0.1*cm),
                    HRFlowable(width="100%", thickness=0.4, color=BORDER),
                    Spacer(1,0.1*cm)]

        # Blockquote
        elif stripped.startswith("> "):
            txt = inline(stripped[2:])
            try: els.append(Paragraph(txt, st["bq"]))
            except: pass

        # Unordered list (nested)
        elif re.match(r'^  +[-*+] |^\t[-*+] ', ln):
            txt = inline(re.sub(r'^[\s\t]+[-*+] ','',stripped))
            try: els.append(Paragraph(f"- {txt}", st["lism"]))
            except: pass

        # Unordered list
        elif re.match(r'^[-*+] ', stripped):
            txt = inline(stripped[2:])
            try: els.append(Paragraph(f"- {txt}", st["li"]))
            except: pass

        # Numbered list
        elif re.match(r'^\d+\. ', stripped):
            txt = inline(re.sub(r'^\d+\. ','',stripped))
            num = re.match(r'^(\d+)\.',stripped).group(1)
            try: els.append(Paragraph(f"{num}. {txt}", st["num"]))
            except: pass

        # Image (skip)
        elif stripped.startswith("!["):
            pass

        # Blank
        elif stripped == "":
            els.append(Spacer(1, 0.12*cm))

        # Paragraph
        else:
            txt = inline(stripped)
            if txt:
                try: els.append(Paragraph(txt, st["body"]))
                except Exception:
                    try: els.append(Paragraph(xesc(stripped), st["body"]))
                    except: pass

        i += 1
    return els


# ---------- cover page ----------

def cover(els, title, subtitle, meta):
    els.append(Spacer(1, 2.5*cm))
    if LOGO.exists():
        img = RLImage(str(LOGO), width=5*cm, height=5*cm, kind="proportional")
        img.hAlign = "CENTER"
        els.append(img)
        els.append(Spacer(1, 0.9*cm))
    st = styles()
    els.append(Paragraph("LEAFORA", st["cov_brand"]))
    els.append(Spacer(1, 0.4*cm))
    els.append(Paragraph(title, st["cov_title"]))
    els.append(Spacer(1, 0.4*cm))
    if subtitle:
        els.append(Paragraph(subtitle, st["cov_sub"]))
        els.append(Spacer(1, 1.8*cm))
    els.append(HRFlowable(width="55%", thickness=0.5, color=BORDER, hAlign="CENTER"))
    els.append(Spacer(1, 0.8*cm))
    for m in meta:
        els.append(Paragraph(m, st["cov_meta"]))
    els.append(PageBreak())


# ---------- build one PDF ----------

def gen(src, out, title, sub, meta):
    md = Path(src).read_text(encoding="utf-8")
    st = styles()
    doc = SimpleDocTemplate(
        str(out), pagesize=A4,
        leftMargin=MARGIN, rightMargin=MARGIN,
        topMargin=1.8*cm, bottomMargin=2*cm,
        title=title, author="LEAFORA Project Team",
    )
    els = []
    cover(els, title, sub, meta)
    els += md2flow(md, st)
    doc.build(els, canvasmaker=NC)
    print("  OK  " + Path(out).name)


# ---------- document list ----------

META = [
    "LEAFORA - Crop Disease Detection Platform",
    "B.Tech Final-Year Capstone  |  Academic Year 2026",
    "Technology: PyTorch  FastAPI  Next.js 16  React 19",
]

DOCS_LIST = [
    ("PRD.md",                        "LEAFORA_PRD.pdf",
     "Product Requirements Document",
     "LEAFORA Crop Disease Detection Platform"),
    ("REPORT.md",                     "LEAFORA_Project_Report.pdf",
     "Technical Project Report",
     "Comprehensive B.Tech Capstone Report"),
    ("ARCHITECTURE.md",               "LEAFORA_System_Architecture.pdf",
     "System Architecture",
     "Full-Stack ML System Design Document"),
    ("API.md",                        "LEAFORA_API_Documentation.pdf",
     "API Documentation",
     "REST Inference Microservice Specification"),
    ("SETUP.md",                      "LEAFORA_Setup_and_User_Guide.pdf",
     "Setup and User Guide",
     "Installation, Configuration and Usage Manual"),
    ("TESTING.md",                    "LEAFORA_Testing_and_Results.pdf",
     "Testing and Verification Results",
     "Test Suite, Smoke Tests and Evaluation Outcomes"),
    ("DEPLOYMENT.md",                 "LEAFORA_Deployment_Guide.pdf",
     "Deployment Guide",
     "Cloud Infrastructure and Hosting Configuration"),
    ("MODEL_CARD.md",                 "LEAFORA_Model_Card.pdf",
     "Model Card",
     "CropDiseaseCNN - 211-Class Custom CNN"),
    ("DATASET.md",                    "LEAFORA_Dataset_Documentation.pdf",
     "Dataset Documentation",
     "Data Sources, Taxonomy and Split Analysis"),
    ("EXPERIMENTS.md",                "LEAFORA_Experiments_and_Training.pdf",
     "Experiments and Training History",
     "Training Convergence, Metrics and Analysis"),
    ("LIMITATIONS_AND_FUTURE_SCOPE.md","LEAFORA_Limitations_and_Future_Scope.pdf",
     "Limitations and Future Scope",
     "Current Constraints and Research Roadmap"),
    ("CHANGELOG.md",                  "LEAFORA_Changelog.pdf",
     "Project Changelog",
     "Version History and Release Notes"),
]

if __name__ == "__main__":
    print("LEAFORA PDF Generator")
    print("="*50)
    print("Output: " + str(OUT))
    print()
    ok = 0
    for src_name, out_name, title, sub in DOCS_LIST:
        src = DOCS / src_name
        out = OUT  / out_name
        if not src.exists():
            print("  SKIP  " + src_name + " (not found)")
            continue
        try:
            gen(src, out, title, sub, META)
            ok += 1
        except Exception as e:
            print("  ERR  " + out_name + ": " + str(e))
    print()
    print(f"Generated {ok}/{len(DOCS_LIST)} PDFs")
    print("Output folder: " + str(OUT))
