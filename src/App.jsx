import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import imgBlusa from "./img/bluda.png";
import imgShort from "./img/short.png";
import imgRegata from "./img/regata.png";
import imgCalcaMoleton from "./img/calcaMoleton.png";

const PECAS_CONFIG = [
  { img: imgBlusa, nome: "Blusa",         preco: 58.00 },
  { img: imgShort, nome: "Regata",        preco: 29.00 },
  { img: imgRegata, nome: "Short",         preco: 69.00 },
  { img: imgCalcaMoleton, nome: "Calça Moletom", preco: 89.00 },
  { img: imgCalcaMoleton, nome: "Blusa Moletom", preco: 99.00 },
];
const NOMES_PECAS = PECAS_CONFIG.map(p => p.nome);
const TAMANHOS = ["PP", "P", "M", "G", "GG"];
const ADMIN_SENHA = "danca2025";

const fmt = v => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const C = {
  bg:       "#000000",
  surface:  "#000000",
  border:   "#970097",
  accent:   "#e879f9",
  accentD:  "#a855f7",
  glow:     "rgba(0, 0, 0, 0.16)",
  gold:     "#f472b6",
  text:     "#fdf4ff",
  muted:    "#9b7ec8",
  success:  "#6ee7b7",
  danger:   "#f87171",
  dangerBg: "rgba(248,113,113,0.10)",
};

const css = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
body{background:${C.bg};color:${C.text};font-family:'DM Sans',sans-serif;min-height:100vh;}
::-webkit-scrollbar{width:5px;}
::-webkit-scrollbar-thumb{background:linear-gradient(${C.accentD},${C.accent});border-radius:3px;}

.grain{position:fixed;inset:0;z-index:0;pointer-events:none;
  background:
    radial-gradient(ellipse 85% 55% at 50% -8%,rgba(168,85,247,0.30) 0%,transparent 65%),
    radial-gradient(ellipse 55% 45% at 90% 95%,rgba(244,114,182,0.13) 0%,transparent 60%),
    radial-gradient(ellipse 40% 35% at 5% 55%,rgba(232,121,249,0.08) 0%,transparent 55%);}

.wrap{position:relative;z-index:1;max-width:760px;margin:0 auto;padding:44px 20px 90px;}

.logo{text-align:center;margin-bottom:44px;}
.logo-title{font-family:'Cormorant Garamond',serif;font-size:2.8rem;font-weight:700;
  background:linear-gradient(135deg,#f472b6 0%,#e879f9 55%,#a855f7 100%);
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;letter-spacing:-.5px;}
.logo-sub{font-size:.8rem;color:${C.muted};letter-spacing:3px;text-transform:uppercase;margin-top:5px;}

.tabs{display:flex;justify-content:center;gap:8px;margin-top:20px;}
.tab{background:none;border:1.5px solid ${C.border};border-radius:9px;color:${C.muted};
  cursor:pointer;font-family:'DM Sans',sans-serif;font-size:.82rem;padding:6px 18px;transition:all .2s;}
.tab.active{background:${C.glow};border-color:${C.accent};color:${C.accent};}
.tab:hover:not(.active){border-color:${C.muted};}

.card{background:${C.surface};border:1px solid ${C.border};border-radius:20px;padding:28px;
  margin-bottom:18px;box-shadow:0 0 50px rgba(168,85,247,.08);}
.card-title{font-family:'Cormorant Garamond',serif;font-size:1.1rem;font-style:italic;
  color:${C.accent};margin-bottom:20px;display:flex;align-items:center;gap:10px;}
.card-title::before,.card-title::after{content:'';flex:1;height:1px;background:${C.border};}

input[type=text],input[type=password],input[type=url]{
  width:100%;background:${C.bg};border:1.5px solid ${C.border};border-radius:11px;
  color:${C.text};font-family:'DM Sans',sans-serif;font-size:.95rem;padding:13px 16px;
  outline:none;transition:border-color .2s,box-shadow .2s;}
input:focus{border-color:${C.accent};box-shadow:0 0 0 3px ${C.glow};}
input::placeholder{color:${C.muted};}

.peca-grid{display:flex;flex-direction:column;gap:14px;}
.peca-row{background:${C.bg};border:1.5px solid ${C.border};border-radius:14px;overflow:hidden;transition:border-color .2s,box-shadow .2s;}
.peca-row.ativa{border-color:${C.accent};box-shadow:0 0 0 1px ${C.accent},inset 0 0 28px ${C.glow};}
.peca-inner{display:flex;align-items:stretch;}
.peca-foto{width:94px;min-height:94px;flex-shrink:0;background:${C.surface};
  display:flex;align-items:center;justify-content:center;font-size:2.2rem;position:relative;overflow:hidden;}
.peca-foto img{width:100%;height:100%;object-fit:cover;position:absolute;inset:0;}
.peca-info{flex:1;padding:14px 16px;min-width:0;}
.peca-nome-row{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:3px;}
.peca-nome{font-size:.97rem;font-weight:600;}
.peca-preco{font-family:'Cormorant Garamond',serif;font-size:1.15rem;color:${C.gold};font-weight:600;white-space:nowrap;}
.toggle-btn{background:none;border:1.5px solid ${C.border};border-radius:8px;color:${C.muted};
  cursor:pointer;font-size:.75rem;padding:4px 11px;transition:all .2s;font-family:'DM Sans',sans-serif;flex-shrink:0;}
.toggle-btn:hover{border-color:${C.accent};color:${C.accent};}
.toggle-btn.on{background:${C.glow};border-color:${C.accent};color:${C.accent};}

.tam-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin-top:12px;}
.tam-item{display:flex;flex-direction:column;align-items:center;gap:5px;}
.tam-label{font-size:.73rem;color:${C.muted};font-weight:500;}
.qty-control{display:flex;align-items:center;gap:3px;}
.qty-btn{width:24px;height:24px;border-radius:6px;border:1.5px solid ${C.border};
  background:none;color:${C.text};cursor:pointer;font-size:.9rem;line-height:1;
  display:flex;align-items:center;justify-content:center;transition:all .15s;}
.qty-btn:hover{border-color:${C.accent};color:${C.accent};}
.qty-num{width:24px;text-align:center;font-size:.88rem;font-weight:500;color:${C.muted};}
.qty-num.has-val{color:${C.accent};}

.total-bar{position:sticky;bottom:16px;background:rgba(23,16,43,.96);
  backdrop-filter:blur(14px);border:1px solid ${C.border};border-radius:16px;
  padding:14px 20px;display:flex;align-items:center;justify-content:space-between;
  box-shadow:0 8px 32px rgba(0,0,0,.5),0 0 0 1px rgba(232,121,249,.07);margin-top:16px;}
.total-label{font-size:.78rem;color:${C.muted};}
.total-val{font-family:'Cormorant Garamond',serif;font-size:1.5rem;color:${C.gold};font-weight:700;}

.btn-primary{width:100%;background:linear-gradient(135deg,#c026d3,#7c3aed);
  border:none;border-radius:13px;color:white;font-family:'DM Sans',sans-serif;
  font-size:.97rem;font-weight:500;padding:15px;cursor:pointer;transition:all .2s;
  box-shadow:0 4px 22px rgba(192,38,211,.35);margin-top:8px;}
.btn-primary:hover{transform:translateY(-1px);box-shadow:0 6px 30px rgba(192,38,211,.5);}
.btn-primary:active{transform:translateY(0);}
.btn-primary:disabled{opacity:.4;cursor:not-allowed;transform:none;}

.btn-ghost{background:none;border:1.5px solid ${C.border};border-radius:10px;color:${C.muted};
  cursor:pointer;font-family:'DM Sans',sans-serif;font-size:.85rem;padding:8px 16px;transition:all .2s;}
.btn-ghost:hover{border-color:${C.accent};color:${C.accent};}

.success-box{text-align:center;padding:48px 28px;}
.suc-icon{font-size:3.5rem;margin-bottom:14px;animation:pop .4s cubic-bezier(.175,.885,.32,1.275);}
@keyframes pop{from{transform:scale(0);opacity:0}to{transform:scale(1);opacity:1}}
.suc-title{font-family:'Cormorant Garamond',serif;font-size:1.7rem;color:${C.success};margin-bottom:8px;}
.suc-sub{color:${C.muted};font-size:.9rem;}
.suc-total{font-family:'Cormorant Garamond',serif;font-size:1.2rem;color:${C.gold};margin:14px 0;}

.stat-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:10px;}
.stat-card{background:${C.bg};border:1.5px solid ${C.border};border-radius:13px;padding:15px;text-align:center;}
.stat-card.hl{border-color:${C.accentD};background:rgba(168,85,247,0.10);}
.stat-num{font-family:'Cormorant Garamond',serif;font-size:2rem;color:${C.accent};font-weight:700;}
.stat-lbl{font-size:.75rem;color:${C.muted};margin-top:2px;}

.tam-table{width:100%;border-collapse:collapse;font-size:.85rem;}
.tam-table th{color:${C.muted};font-weight:500;padding:8px 10px;text-align:center;border-bottom:1px solid ${C.border};}
.tam-table td{padding:8px 10px;border-bottom:1px solid ${C.border};text-align:center;}
.tam-table tr:last-child td{border-bottom:none;}
.tam-val{color:${C.accent};font-weight:600;}
.tam-zero{color:${C.border};}

.sec-label{font-size:.7rem;letter-spacing:2.5px;text-transform:uppercase;color:${C.muted};margin-bottom:10px;margin-top:20px;}

.ptab-row{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px;}
.ptab{background:none;border:1.5px solid ${C.border};border-radius:8px;color:${C.muted};
  cursor:pointer;font-family:'DM Sans',sans-serif;font-size:.78rem;padding:5px 12px;transition:all .2s;}
.ptab.active{background:${C.glow};border-color:${C.accent};color:${C.accent};}

.pedido-item{background:${C.bg};border:1px solid ${C.border};border-radius:12px;padding:15px 18px;margin-bottom:9px;}
.pedido-nome{font-weight:600;margin-bottom:8px;font-size:.97rem;}
.pedido-tags{display:flex;flex-wrap:wrap;gap:5px;}
.tag{background:rgba(232,121,249,0.10);border:1px solid ${C.accentD};border-radius:6px;font-size:.73rem;color:${C.accent};padding:3px 9px;}
.pedido-footer{display:flex;align-items:center;justify-content:space-between;margin-top:12px;gap:10px;flex-wrap:wrap;}
.pedido-hora{font-size:.72rem;color:${C.muted};}
.pedido-total-lbl{font-family:'Cormorant Garamond',serif;font-size:.97rem;color:${C.gold};}

.del-btn{background:none;border:1.5px solid ${C.border};border-radius:8px;color:${C.muted};
  cursor:pointer;font-size:.78rem;padding:5px 12px;transition:all .2s;display:flex;align-items:center;gap:5px;white-space:nowrap;font-family:'DM Sans',sans-serif;}
.del-btn:hover{border-color:${C.danger};color:${C.danger};background:${C.dangerBg};}

.empty-state{text-align:center;padding:40px;color:${C.muted};}
.empty-state .em{font-size:2.5rem;display:block;margin-bottom:12px;}
.alert{background:${C.dangerBg};border:1px solid rgba(248,113,113,.3);border-radius:9px;
  padding:11px 15px;color:${C.danger};font-size:.85rem;margin-top:10px;}

.foto-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px;}
.foto-card{background:${C.bg};border:1.5px solid ${C.border};border-radius:12px;overflow:hidden;}
.foto-preview{height:110px;display:flex;align-items:center;justify-content:center;font-size:2.2rem;
  background:${C.surface};position:relative;overflow:hidden;}
.foto-preview img{width:100%;height:100%;object-fit:cover;position:absolute;inset:0;}
.foto-body{padding:12px;}
.foto-nome strong{display:block;color:${C.text};font-size:.9rem;margin-bottom:2px;}
.foto-nome span{font-size:.75rem;color:${C.muted};}
.foto-body input{margin-top:6px;font-size:.77rem;padding:7px 10px;}

.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.75);backdrop-filter:blur(6px);
  z-index:1000;display:flex;align-items:center;justify-content:center;padding:16px;
  animation:fadeIn .15s ease;}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
.modal{background:${C.surface};border:1px solid ${C.border};border-radius:20px;
  padding:32px 28px;max-width:380px;width:100%;
  box-shadow:0 24px 60px rgba(0,0,0,.6),0 0 0 1px rgba(232,121,249,.08);
  animation:slideUp .22s cubic-bezier(.175,.885,.32,1.275);}
@keyframes slideUp{from{transform:translateY(22px);opacity:0}to{transform:translateY(0);opacity:1}}
.modal-icon{font-size:2.8rem;text-align:center;margin-bottom:14px;}
.modal-title{font-family:'Cormorant Garamond',serif;font-size:1.5rem;text-align:center;margin-bottom:8px;}
.modal-sub{font-size:.87rem;color:${C.muted};text-align:center;margin-bottom:26px;line-height:1.6;}
.modal-sub strong{color:${C.text};}
.modal-btns{display:flex;gap:10px;}
.btn-danger{flex:1;background:linear-gradient(135deg,#dc2626,#b91c1c);border:none;border-radius:11px;
  color:white;font-family:'DM Sans',sans-serif;font-size:.9rem;font-weight:500;padding:13px;cursor:pointer;transition:all .2s;}
.btn-danger:hover{transform:translateY(-1px);box-shadow:0 4px 16px rgba(220,38,38,.4);}
.btn-cancel{flex:1;background:none;border:1.5px solid ${C.border};border-radius:11px;color:${C.muted};
  font-family:'DM Sans',sans-serif;font-size:.9rem;padding:13px;cursor:pointer;transition:all .2s;}
.btn-cancel:hover{border-color:${C.muted};color:${C.text};}

/* ── Responsivo ── */
@media(max-width:480px){
  .wrap{padding:20px 14px 80px;}
  .logo{margin-bottom:28px;}
  .logo-title{font-size:2rem;}
  .logo-sub{font-size:.7rem;letter-spacing:2px;}
  .tabs{gap:6px;margin-top:14px;}
  .tab{padding:5px 13px;font-size:.78rem;}
  .card{padding:16px 14px;}
  .card-title{font-size:1rem;margin-bottom:14px;}
  .peca-foto{width:76px;min-height:76px;}
  .peca-info{padding:10px 10px;}
  .peca-nome{font-size:.88rem;}
  .peca-preco{font-size:1rem;}
  .toggle-btn{font-size:.68rem;padding:3px 8px;}
  .tam-grid{gap:4px;margin-top:10px;}
  .qty-btn{width:22px;height:22px;font-size:.82rem;}
  .qty-num{width:18px;font-size:.78rem;}
  .total-bar{padding:11px 14px;border-radius:13px;bottom:10px;}
  .total-val{font-size:1.25rem;}
  .total-label{font-size:.72rem;}
  .btn-primary{padding:13px;font-size:.9rem;}
  .btn-ghost{padding:7px 13px;font-size:.8rem;}
  .success-box{padding:32px 16px;}
  .stat-grid{grid-template-columns:repeat(2,1fr);}
  .foto-grid{grid-template-columns:1fr;}
  .modal{padding:24px 18px;}
  .ptab-row{gap:4px;}
  .ptab{font-size:.72rem;padding:4px 9px;}
  .pedido-item{padding:12px 13px;}
}
@media(max-width:360px){
  .logo-title{font-size:1.75rem;}
  .tam-grid{gap:2px;}
  .qty-btn{width:19px;height:19px;font-size:.76rem;}
  .tam-label{font-size:.63rem;}
  .toggle-btn{font-size:.64rem;padding:3px 6px;}
}
@media(min-width:481px) and (max-width:768px){
  .wrap{padding:36px 24px 90px;}
  .logo-title{font-size:2.55rem;}
}
@media(min-width:769px){
  .wrap{padding:52px 28px 100px;}
}
`;

/* ── helpers ── */
function initPecas() {
  return Object.fromEntries(
    NOMES_PECAS.map(p => [p, { ativo: false, tamanhos: Object.fromEntries(TAMANHOS.map(t => [t, 0])) }])
  );
}
function calcTotal(pecas) {
  return PECAS_CONFIG.reduce((acc, { nome, preco }) => {
    const qtd = Object.values(pecas[nome]?.tamanhos || {}).reduce((s, v) => s + v, 0);
    return acc + qtd * preco;
  }, 0);
}

/* ── MODAL ── */
function Modal({ nome, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-icon">🗑️</div>
        <div className="modal-title">Remover pedido?</div>
        <div className="modal-sub">
          Tem certeza que deseja remover o pedido de <strong>{nome}</strong>?
          <br />Esta ação não pode ser desfeita.
        </div>
        <div className="modal-btns">
          <button className="btn-cancel" onClick={onCancel}>Cancelar</button>
          <button className="btn-danger" onClick={onConfirm}>Sim, remover</button>
        </div>
      </div>
    </div>
  );
}

/* ── QTY CONTROL ── */
function QtyControl({ value, onChange }) {
  return (
    <div className="qty-control">
      <button className="qty-btn" onClick={() => onChange(Math.max(0, value - 1))}>−</button>
      <span className={`qty-num ${value > 0 ? "has-val" : ""}`}>{value}</span>
      <button className="qty-btn" onClick={() => onChange(value + 1)}>+</button>
    </div>
  );
}

/* ── PÁGINA DA ALUNA ── */
function AlunaPage({ fotos }) {
  const [step, setStep] = useState("nome");
  const [nome, setNome] = useState("");
  const [pecas, setPecas] = useState(initPecas());
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [nomeConfirmado, setNomeConfirmado] = useState("");

  const totalQtd = Object.values(pecas).reduce(
    (a, p) => a + Object.values(p.tamanhos).reduce((s, v) => s + v, 0), 0
  );
  const totalVal = calcTotal(pecas);

  function togglePeca(p) {
    setPecas(prev => ({ ...prev, [p]: { ...prev[p], ativo: !prev[p].ativo } }));
  }
  function setQty(peca, tam, val) {
    setPecas(prev => ({
      ...prev,
      [peca]: { ...prev[peca], tamanhos: { ...prev[peca].tamanhos, [tam]: val } }
    }));
  }

  async function confirmar() {
    setErro("");
    if (totalQtd === 0) { setErro("Selecione pelo menos uma peça com quantidade."); return; }
    setSalvando(true);
    try {
      const { error } = await supabase
        .from("pedidos")
        .insert([{ nome: nome.trim(), pecas }]);

      if (error) throw error;
      setNomeConfirmado(nome.split(" ")[0]);
      setStep("sucesso");
    } catch (e) {
      console.error(e);
      setErro("Erro ao salvar. Verifique a conexão e tente novamente.");
    }
    setSalvando(false);
  }

  if (step === "sucesso") return (
    <div className="card">
      <div className="success-box">
        <div className="suc-icon">🩰</div>
        <div className="suc-title">Pedido confirmado!</div>
        <div className="suc-sub">Obrigada, <strong>{nomeConfirmado}</strong>! Seu fardamento foi registrado com sucesso.</div>
        <div className="suc-total">Total estimado: {fmt(totalVal)}</div>
        <br />
        <button className="btn-ghost" onClick={() => { setStep("nome"); setNome(""); setPecas(initPecas()); }}>
          Fazer outro pedido
        </button>
      </div>
    </div>
  );

  if (step === "nome") return (
    <div className="card">
      <div className="card-title">Identificação</div>
      <label style={{ display: "block", fontSize: ".8rem", color: C.muted, marginBottom: 8, letterSpacing: "1px", textTransform: "uppercase" }}>
        Seu nome completo
      </label>
      <input
        type="text"
        placeholder="Ex: Raul Passos gardini"
        value={nome}
        autoFocus
        onChange={e => setNome(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter" && nome.trim().length >= 3) setStep("escolha"); }}
      />
      <br /><br />
      <button className="btn-primary" disabled={nome.trim().length < 3} onClick={() => setStep("escolha")}>
        Continuar →
      </button>
    </div>
  );

  return (
    <>
      <div style={{ marginBottom: 14, display: "flex", alignItems: "center", gap: 10 }}>
        <button className="btn-ghost" style={{ fontSize: ".8rem" }} onClick={() => setStep("nome")}>← Voltar</button>
        <span style={{ color: C.muted, fontSize: ".88rem" }}>
          Olá, <strong style={{ color: C.text }}>{nome.split(" ")[0]}</strong> 👋
        </span>
      </div>
      <div className="card">
        <div className="card-title">Escolha o fardamento</div>
        <div className="peca-grid">
          {PECAS_CONFIG.map(({ nome: pNome, preco, img }) => (
            <div key={pNome} className={`peca-row ${pecas[pNome].ativo ? "ativa" : ""}`}>
              <div className="peca-inner">
                <div className="peca-foto">
                  <img src={img} alt={pNome} />
                </div>
                <div className="peca-info">
                  <div className="peca-nome-row">
                    <div>
                      <div className="peca-nome">{pNome}</div>
                      <div className="peca-preco">{fmt(preco)}</div>
                    </div>
                    <button
                      className={`toggle-btn ${pecas[pNome].ativo ? "on" : ""}`}
                      onClick={() => togglePeca(pNome)}
                    >
                      {pecas[pNome].ativo ? "✓ Selecionado" : "+ Adicionar"}
                    </button>
                  </div>
                  {pecas[pNome].ativo && (
                    <div className="tam-grid">
                      {TAMANHOS.map(t => (
                        <div key={t} className="tam-item">
                          <span className="tam-label">{t}</span>
                          <QtyControl
                            value={pecas[pNome].tamanhos[t]}
                            onChange={v => setQty(pNome, t, v)}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        {erro && <div className="alert">{erro}</div>}
        <div className="total-bar">
          <div>
            <div className="total-label">
              {totalQtd} {totalQtd === 1 ? "peça selecionada" : "peças selecionadas"}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="total-label">Total estimado</div>
            <div className="total-val">{fmt(totalVal)}</div>
          </div>
        </div>
        <button className="btn-primary" onClick={confirmar} disabled={salvando || totalQtd === 0}>
          {salvando ? "Salvando..." : "Confirmar pedido →"}
        </button>
      </div>
    </>
  );
}

/* ── ADMIN LOGIN ── */
function AdminLogin({ onEntrar }) {
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState(false);

  function tentar() {
    if (senha === ADMIN_SENHA) onEntrar();
    else { setErro(true); setSenha(""); }
  }

  return (
    <div className="card" style={{ maxWidth: 340, margin: "0 auto" }}>
      <div className="card-title">Área Admin</div>
      <label style={{ display: "block", fontSize: ".8rem", color: C.muted, marginBottom: 8, letterSpacing: "1px", textTransform: "uppercase" }}>
        Senha
      </label>
      <input
        type="password"
        placeholder="••••••••"
        value={senha}
        autoFocus
        onChange={e => { setSenha(e.target.value); setErro(false); }}
        onKeyDown={e => { if (e.key === "Enter") tentar(); }}
      />
      {erro && <div className="alert">Senha incorreta.</div>}
      <br /><br />
      <button className="btn-primary" onClick={tentar}>Entrar</button>
    </div>
  );
}

/* ── ADMIN ── */
function AdminPage({ onSair, fotos, setFotos }) {
  const [aba, setAba] = useState("resumo");
  const [pedidos, setPedidos] = useState(null);
  const [filtro, setFiltro] = useState("Todos");
  const [loading, setLoading] = useState(true);
  const [modalId, setModalId] = useState(null);
  const [fotosTmp, setFotosTmp] = useState({ ...fotos });
  const [salvoFotos, setSalvoFotos] = useState(false);
  const [erroAdmin, setErroAdmin] = useState("");

  async function carregar() {
    setLoading(true);
    setErroAdmin("");
    try {
      const { data, error } = await supabase
        .from("pedidos")
        .select("*")
        .order("hora", { ascending: false });

      if (error) throw error;
      setPedidos(data || []);
    } catch (e) {
      console.error(e);
      setErroAdmin("Erro ao carregar pedidos. Verifique sua conexão.");
      setPedidos([]);
    }
    setLoading(false);
  }

  async function confirmarDelete() {
    if (!modalId) return;
    try {
      const { error } = await supabase
        .from("pedidos")
        .delete()
        .eq("id", modalId);

      if (error) throw error;
      setModalId(null);
      carregar();
    } catch (e) {
      console.error(e);
      setErroAdmin("Erro ao remover pedido.");
      setModalId(null);
    }
  }

  async function salvarFotos() {
    try {
      const { error } = await supabase
        .from("configuracoes")
        .upsert([{ chave: "fotos", valor: fotosTmp }], { onConflict: "chave" });

      if (error) throw error;
      setFotos(fotosTmp);
      setSalvoFotos(true);
      setTimeout(() => setSalvoFotos(false), 2500);
    } catch (e) {
      console.error(e);
      setErroAdmin("Erro ao salvar fotos.");
    }
  }

  useEffect(() => { carregar(); }, []);

  // calcular totais
  const totais = Object.fromEntries(
    NOMES_PECAS.map(p => [p, Object.fromEntries(TAMANHOS.map(t => [t, 0]))])
  );
  let receitaTotal = 0;
  if (pedidos) {
    pedidos.forEach(p => {
      PECAS_CONFIG.forEach(({ nome, preco }) => {
        TAMANHOS.forEach(t => {
          const q = p.pecas?.[nome]?.tamanhos?.[t] || 0;
          totais[nome][t] += q;
          receitaTotal += q * preco;
        });
      });
    });
  }

  const nomeModal = pedidos?.find(p => p.id === modalId)?.nome || "";
  const pecasFiltradas = filtro === "Todos" ? NOMES_PECAS : [filtro];
  const pedidosFiltrados = filtro === "Todos"
    ? pedidos
    : pedidos?.filter(p => TAMANHOS.some(t => (p.pecas?.[filtro]?.tamanhos?.[t] || 0) > 0));

  return (
    <>
      {modalId && <Modal nome={nomeModal} onConfirm={confirmarDelete} onCancel={() => setModalId(null)} />}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1.05rem", color: C.accent, fontStyle: "italic" }}>
          Painel Administrativo
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn-ghost" style={{ fontSize: ".78rem" }} onClick={carregar}>↻ Atualizar</button>
          <button className="btn-ghost" style={{ fontSize: ".78rem" }} onClick={onSair}>Sair</button>
        </div>
      </div>

      {erroAdmin && <div className="alert" style={{ marginBottom: 16 }}>{erroAdmin}</div>}

      <div className="ptab-row">
        {[["resumo", "📊 Resumo"], ["pedidos", "📋 Pedidos"], ["fotos", "🖼️ Fotos"]].map(([a, lbl]) => (
          <button key={a} className={`ptab ${aba === a ? "active" : ""}`} onClick={() => setAba(a)}>{lbl}</button>
        ))}
      </div>

      {loading && <div className="empty-state"><span className="em">⏳</span>Carregando...</div>}

      {/* ABA RESUMO */}
      {!loading && aba === "resumo" && (
        <div className="card">
          <div className="card-title">Resumo geral</div>
          <div className="stat-grid">
            <div className="stat-card hl">
              <div className="stat-num">{pedidos?.length}</div>
              <div className="stat-lbl">Alunas</div>
            </div>
            {PECAS_CONFIG.map(({ nome, preco }) => {
              const qtd = Object.values(totais[nome]).reduce((s, v) => s + v, 0);
              return (
                <div key={nome} className="stat-card">
                  <div className="stat-num">{qtd}</div>
                  <div className="stat-lbl">{nome}</div>
                  <div style={{ fontSize: ".7rem", color: C.gold, marginTop: 3 }}>{fmt(qtd * preco)}</div>
                </div>
              );
            })}
            <div className="stat-card hl">
              <div className="stat-num" style={{ fontSize: "1.3rem" }}>{fmt(receitaTotal)}</div>
              <div className="stat-lbl">Receita estimada</div>
            </div>
          </div>

          <div style={{ marginTop: 24 }}>
            <div style={{ fontSize: ".7rem", letterSpacing: "2px", textTransform: "uppercase", color: C.muted, marginBottom: 12 }}>
              Quantidade por tamanho
            </div>
            <div className="ptab-row">
              {["Todos", ...NOMES_PECAS].map(p => (
                <button key={p} className={`ptab ${filtro === p ? "active" : ""}`} onClick={() => setFiltro(p)}>{p}</button>
              ))}
            </div>
            {pecasFiltradas.map(peca => (
              <div key={peca} style={{ marginBottom: 18 }}>
                <div className="sec-label">{peca}</div>
                <table className="tam-table">
                  <thead><tr>{TAMANHOS.map(t => <th key={t}>{t}</th>)}</tr></thead>
                  <tbody>
                    <tr>
                      {TAMANHOS.map(t => {
                        const v = totais[peca][t];
                        return (
                          <td key={t}>
                            <span className={v > 0 ? "tam-val" : "tam-zero"}>{v > 0 ? v : "–"}</span>
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ABA PEDIDOS */}
      {!loading && aba === "pedidos" && (
        <div className="card">
          <div className="card-title">Pedidos ({pedidos?.length || 0})</div>
          {pedidosFiltrados?.length === 0
            ? <div className="empty-state"><span className="em">📋</span>Nenhum pedido registrado ainda.</div>
            : pedidosFiltrados?.map(p => (
              <div key={p.id} className="pedido-item">
                <div className="pedido-nome">{p.nome}</div>
                <div className="pedido-tags">
                  {PECAS_CONFIG.flatMap(({ nome }) =>
                    TAMANHOS.flatMap(t => {
                      const q = p.pecas?.[nome]?.tamanhos?.[t] || 0;
                      return q > 0 ? [`${nome} ${t}${q > 1 ? ` ×${q}` : ""}`] : [];
                    })
                  ).map((tag, i) => <span key={i} className="tag">{tag}</span>)}
                </div>
                <div className="pedido-footer">
                  <div>
                    <div className="pedido-hora">
                      {new Date(p.hora).toLocaleString("pt-BR", {
                        day: "2-digit", month: "2-digit", year: "numeric",
                        hour: "2-digit", minute: "2-digit"
                      })}
                    </div>
                    <div className="pedido-total-lbl">{fmt(calcTotal(p.pecas))}</div>
                  </div>
                  <button className="del-btn" onClick={() => setModalId(p.id)}>
                    🗑 Remover pedido
                  </button>
                </div>
              </div>
            ))
          }
        </div>
      )}

      {/* ABA FOTOS */}
      {aba === "fotos" && (
        <div className="card">
          <div className="card-title">Fotos dos produtos</div>
          <p style={{ fontSize: ".85rem", color: C.muted, marginBottom: 20, lineHeight: 1.6 }}>
            Cole a URL da foto de cada produto. A imagem aparecerá automaticamente para as alunas.
            Use links diretos que terminem em <code style={{ color: C.accent }}>.jpg</code>, <code style={{ color: C.accent }}>.png</code>, etc.
          </p>
          <div className="foto-grid">
            {PECAS_CONFIG.map(({ nome, emoji }) => (
              <div key={nome} className="foto-card">
                <div className="foto-preview">
                  {fotosTmp[nome]
                    ? <img src={fotosTmp[nome]} alt={nome} onError={e => { e.target.style.display = "none"; }} />
                    : <span>{emoji}</span>}
                </div>
                <div className="foto-body">
                  <div className="foto-nome">
                    <strong>{nome}</strong>
                    <span>URL da imagem</span>
                  </div>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={fotosTmp[nome] || ""}
                    onChange={e => setFotosTmp(prev => ({ ...prev, [nome]: e.target.value }))}
                  />
                </div>
              </div>
            ))}
          </div>
          <br />
          <button className="btn-primary" onClick={salvarFotos}>
            {salvoFotos ? "✓ Fotos salvas com sucesso!" : "Salvar fotos"}
          </button>
        </div>
      )}
    </>
  );
}

/* ── APP PRINCIPAL ── */
export default function App() {
  const [tela, setTela] = useState("aluna");
  const [adminAuth, setAdminAuth] = useState(false);
  const [fotos, setFotos] = useState({});

  // Carrega as fotos salvas no Supabase ao iniciar
  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase
          .from("configuracoes")
          .select("valor")
          .eq("chave", "fotos")
          .single();

        if (data?.valor) setFotos(data.valor);
      } catch {}
    })();
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="grain" />
      <div className="wrap">
        <div className="logo">
          <div className="logo-title">Studio Fardamento</div>
          <div className="logo-sub">
            {tela === "aluna" ? "Escolha seu uniforme" : "Painel da administração"}
          </div>
          <div className="tabs">
            <button className={`tab ${tela === "aluna" ? "active" : ""}`} onClick={() => setTela("aluna")}>
              Aluna
            </button>
            <button className={`tab ${tela !== "aluna" ? "active" : ""}`} onClick={() => setTela(adminAuth ? "admin" : "admin-login")}>
              Administração
            </button>
          </div>
        </div>

        {tela === "aluna"       && <AlunaPage fotos={fotos} />}
        {tela === "admin-login" && <AdminLogin onEntrar={() => { setAdminAuth(true); setTela("admin"); }} />}
        {tela === "admin"       && (
          <AdminPage
            onSair={() => { setAdminAuth(false); setTela("aluna"); }}
            fotos={fotos}
            setFotos={setFotos}
          />
        )}
      </div>
    </>
  );
}
