import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase";
import imgBlusa from "./img/bluda.png";
import imgShort from "./img/short.png";
import imgRegata from "./img/regata.png";
import imgCalcaMoleton from "./img/calcamoleton.png";

const PECAS_CONFIG = [
  { img: imgBlusa, nome: "Blusa",         preco: 60.00 },
  { img: imgRegata, nome: "Regata",        preco: 30.00 },
  { img: imgShort, nome: "Short",         preco: 60.00 },
  { img: imgCalcaMoleton, nome: "Calça Moletom", preco: 90.00 },
  { img: imgCalcaMoleton, nome: "Blusa Moletom", preco: 90.00 },
];
const NOMES_PECAS = PECAS_CONFIG.map(p => p.nome);
const GRUPOS      = [
  { label: "Adulto",   tamanhos: ["PP", "P", "M", "G"] },
  { label: "Infantil", tamanhos: ["P", "M", "G"] },
];
const TODAS_CHAVES = GRUPOS.flatMap(g => g.tamanhos.map(t => `${g.label} ${t}`));

const fmt  = v => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmt2 = v => parseFloat(v.toFixed(2));

const FORMA_LABEL = {
  pix:             "Pix",
  cartao_1x:       "Cartão 1×",
  cartao_2x:       "Cartão 2×",
  credito_lojinha: "Cartão na lojinha",
};

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
  pix:      "#00b37e",
  pixBg:    "rgba(0,179,126,0.10)",
  lojinha:  "#f59e0b",
  lojinhaBg:"rgba(245,158,11,0.10)",
};

/* ── Detecta status de retorno do Mercado Pago ── */
function detectarStatusRetorno() {
  const params = new URLSearchParams(window.location.search);
  const collectionStatus = params.get("collection_status");
  const status           = params.get("status");
  const paymentId        = params.get("payment_id") || params.get("collection_id");

  if (!collectionStatus && !status && !paymentId) {
    if (sessionStorage.getItem("pagamento_pendente")) {
      sessionStorage.removeItem("pagamento_pendente");
      return "pendente";
    }
    return null;
  }

  sessionStorage.removeItem("pagamento_pendente");
  const mpStatus = collectionStatus || status;

  if (mpStatus === "approved")                             return "aprovado";
  if (mpStatus === "pending" || mpStatus === "in_process") return "pendente";
  return "falhou";
}

const css = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
body{background:${C.bg};color:${C.text};font-family:'DM Sans',sans-serif;min-height:100vh;}
::-webkit-scrollbar{width:4px;}
::-webkit-scrollbar-thumb{background:${C.accentD};border-radius:2px;}

.grain{position:fixed;inset:0;z-index:0;pointer-events:none;
  background:
    radial-gradient(ellipse 90% 55% at 50% -5%,rgba(139,60,247,0.22) 0%,transparent 65%),
    radial-gradient(ellipse 45% 45% at 85% 90%,rgba(185,124,243,0.07) 0%,transparent 60%);}

.wrap{position:relative;z-index:1;max-width:700px;margin:0 auto;padding:44px 20px 90px;}

.logo{text-align:center;margin-bottom:44px;}
.logo-title{font-family:'Cormorant Garamond',serif;font-size:2.8rem;font-weight:700;
  background:linear-gradient(130deg,${C.accent} 0%,${C.gold} 100%);
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;letter-spacing:-.5px;}
.logo-sub{font-size:.8rem;color:${C.muted};letter-spacing:3px;text-transform:uppercase;margin-top:5px;}

.tabs{display:flex;justify-content:center;gap:8px;margin-top:20px;}
.tab{background:none;border:1.5px solid ${C.border};border-radius:9px;color:${C.muted};
  cursor:pointer;font-family:'DM Sans',sans-serif;font-size:.82rem;padding:6px 18px;transition:all .2s;}
.tab.active{background:${C.glow};border-color:${C.accent};color:${C.accent};}
.tab:hover:not(.active){border-color:${C.muted};}

.card{background:${C.surface};border:1px solid ${C.border};border-radius:20px;padding:28px;
  margin-bottom:18px;box-shadow:0 0 40px rgba(139,60,247,.05);}
.card-title{font-family:'Cormorant Garamond',serif;font-size:1.1rem;font-style:italic;
  color:${C.accent};margin-bottom:20px;display:flex;align-items:center;gap:10px;}
.card-title::before,.card-title::after{content:'';flex:1;height:1px;background:${C.border};}

input[type=text],input[type=password]{
  width:100%;background:${C.bg};border:1.5px solid ${C.border};border-radius:11px;
  color:${C.text};font-family:'DM Sans',sans-serif;font-size:.95rem;padding:13px 16px;
  outline:none;transition:border-color .2s,box-shadow .2s;}
input:focus{border-color:${C.accent};box-shadow:0 0 0 3px ${C.glow};}
input::placeholder{color:${C.muted};}

.peca-grid{display:flex;flex-direction:column;gap:14px;}
.peca-row{background:${C.bg};border:1.5px solid ${C.border};border-radius:14px;overflow:hidden;transition:border-color .2s,box-shadow .2s;cursor:pointer;}
.peca-row.ativa{border-color:${C.accentD};box-shadow:0 0 0 1px ${C.accentD},inset 0 0 24px ${C.glow};}
.peca-inner{display:flex;align-items:stretch;min-width:0;}
.peca-foto{width:94px;min-height:94px;flex-shrink:0;background:${C.surface};
  display:flex;align-items:center;justify-content:center;font-size:2.2rem;position:relative;overflow:hidden;}
.peca-foto img{width:100%;height:100%;object-fit:cover;position:absolute;inset:0;}
.peca-info{flex:1;padding:14px 16px;min-width:0;overflow:hidden;}
.peca-nome-row{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:3px;flex-wrap:wrap;}
.peca-nome{font-size:.97rem;font-weight:600;}
.peca-preco{font-family:'arial',serif;font-size:1.15rem;color:${C.gold};font-weight:600;}
.peca-tags-resumo{display:flex;flex-wrap:wrap;gap:4px;justify-content:flex-end;max-width:140px;}
.peca-tag-mini{background:rgba(168,85,247,0.15);border:1px solid ${C.accentD};border-radius:5px;font-size:.65rem;color:${C.accent};padding:2px 6px;white-space:nowrap;}

.grupos-wrap{display:flex;flex-direction:column;gap:10px;width:100%;max-height:0;overflow:hidden;transition:max-height .35s ease,margin-top .35s ease;}
.peca-row.ativa .grupos-wrap{max-height:600px;margin-top:12px;}
.grupo-bloco{background:rgba(0,0,0,.2);border:1px solid ${C.border};border-radius:10px;padding:10px 12px;width:100%;overflow:hidden;}
.grupo-label{font-size:.68rem;letter-spacing:2px;text-transform:uppercase;color:${C.muted};margin-bottom:8px;font-weight:600;}
.grupo-label.adulto{color:#a78bfa;}
.grupo-label.infantil{color:#67e8f9;}
.tam-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;width:100%;}
.tam-item{display:flex;flex-direction:column;align-items:center;gap:5px;border:1px solid ${C.border};border-radius:8px;padding:8px 0;cursor:pointer;transition:all .2s;}
.tam-label{font-size:.73rem;color:${C.muted};font-weight:500;}
.qty-control{display:flex;align-items:center;gap:3px;}
.qty-btn{width:24px;height:24px;border-radius:6px;border:1.5px solid ${C.border};
  background:none;color:${C.text};cursor:pointer;font-size:.9rem;line-height:1;
  display:flex;align-items:center;justify-content:center;transition:all .15s;}
.qty-btn:hover{border-color:${C.accent};color:${C.accent};}
.qty-num{width:24px;text-align:center;font-size:.88rem;font-weight:500;color:${C.muted};}
.qty-num.has-val{color:${C.accent};}

.total-bar{position:sticky;bottom:16px;background:rgba(22,18,42,.95);
  backdrop-filter:blur(12px);border:1px solid ${C.border};border-radius:16px;
  padding:14px 20px;display:flex;align-items:center;justify-content:space-between;
  box-shadow:0 8px 32px rgba(0,0,0,.5);margin-top:16px;}
.total-label{font-size:.78rem;color:${C.muted};}
.total-val{font-family:'arial',serif;font-size:1.5rem;color:${C.gold};font-weight:700;}

@media(max-width:480px){
  .peca-foto{width:70px;min-height:70px;}
  .peca-info{padding:10px 12px;}
  .qty-btn{width:28px;height:28px;}
  .qty-num{width:22px;font-size:.82rem;}
  .grupo-bloco{padding:8px 8px;}
  .tam-grid{gap:4px;grid-template-columns:repeat(2,1fr);}
}

@media(max-width:460px){
  .peca-foto{width:70px;min-height:70px;}
  .peca-info{padding:10px 12px;}
  .qty-btn{width:28px;height:28px;}
  .qty-num{width:22px;font-size:.82rem;}
  .grupo-bloco{padding:8px 8px;}
  .tam-grid{gap:4px;grid-template-columns:repeat(1,1fr);}
}

/* ── PAGAMENTO ── */
.pgto-resumo{background:${C.bg};border:1px solid ${C.border};border-radius:14px;padding:16px 20px;margin-bottom:20px;}
.pgto-resumo-title{font-size:.75rem;letter-spacing:2px;text-transform:uppercase;color:${C.muted};margin-bottom:10px;}
.pgto-resumo-tags{display:flex;flex-wrap:wrap;gap:6px;}
.pgto-total-row{display:flex;justify-content:space-between;align-items:center;margin-top:14px;padding-top:12px;border-top:1px solid ${C.border};}
.pgto-total-label{font-size:.85rem;color:${C.muted};}
.pgto-total-val{font-family:'arial',serif;font-size:1.4rem;color:${C.gold};font-weight:700;}

.pgto-opcoes{display:flex;flex-direction:column;gap:12px;margin-bottom:20px;}
.pgto-opcao{background:${C.bg};border:2px solid ${C.border};border-radius:14px;
  padding:18px 20px;cursor:pointer;transition:all .2s;display:flex;align-items:center;gap:16px;}
.pgto-opcao:hover{border-color:${C.muted};}
.pgto-opcao.selecionada.pix{border-color:${C.pix};box-shadow:0 0 0 1px ${C.pix},inset 0 0 20px ${C.pixBg};}
.pgto-opcao.selecionada.lojinha{border-color:${C.lojinha};box-shadow:0 0 0 1px ${C.lojinha},inset 0 0 20px ${C.lojinhaBg};}
.pgto-icone{font-size:1.8rem;flex-shrink:0;}
.pgto-info{flex:1;}
.pgto-nome{font-weight:600;font-size:.97rem;margin-bottom:2px;}
.pgto-desc{font-size:.78rem;color:${C.muted};}
.pgto-valor{font-family:'arial',serif;font-size:1.2rem;font-weight:700;text-align:right;}
.pgto-valor.pix-val{color:${C.pix};}
.pgto-valor.lojinha-val{color:${C.lojinha};}
.pgto-acrescimo{font-size:.7rem;color:${C.muted};text-align:right;margin-top:2px;}

/* ── BOTÕES ── */
.btn-primary{width:100%;background:linear-gradient(135deg,${C.accentD},#6d28d9);
  border:none;border-radius:13px;color:white;font-family:'DM Sans',sans-serif;
  font-size:.97rem;font-weight:500;padding:15px;cursor:pointer;transition:all .2s;
  box-shadow:0 4px 20px rgba(139,60,247,.3);margin-top:8px;}
.btn-primary:hover{transform:translateY(-1px);box-shadow:0 6px 28px rgba(139,60,247,.45);}
.btn-primary:active{transform:translateY(0);}
.btn-primary:disabled{opacity:.4;cursor:not-allowed;transform:none;}
.btn-pix{background:linear-gradient(135deg,#059669,#047857)!important;box-shadow:0 4px 20px rgba(5,150,105,.3)!important;}
.btn-pix:hover{box-shadow:0 6px 28px rgba(5,150,105,.45)!important;}
.btn-lojinha{background:linear-gradient(135deg,#d97706,#b45309)!important;box-shadow:0 4px 20px rgba(217,119,6,.3)!important;}
.btn-lojinha:hover{box-shadow:0 6px 28px rgba(217,119,6,.45)!important;}

.btn-ghost{background:none;border:1.5px solid ${C.border};border-radius:10px;color:${C.muted};
  cursor:pointer;font-family:'DM Sans',sans-serif;font-size:.85rem;padding:8px 16px;transition:all .2s;}
.btn-ghost:hover{border-color:${C.accent};color:${C.accent};}

/* ── SUCESSO / ESTADOS ── */
.success-box{text-align:center;padding:48px 28px;}
.suc-icon{font-size:3.5rem;margin-bottom:14px;animation:pop .4s cubic-bezier(.175,.885,.32,1.275);}
@keyframes pop{from{transform:scale(0);opacity:0}to{transform:scale(1);opacity:1}}
.suc-title{font-family:'Cormorant Garamond',serif;font-size:1.7rem;color:${C.success};margin-bottom:8px;}
.suc-title.falhou{color:${C.danger};}
.suc-title.lojinha{color:${C.lojinha};}
.suc-sub{color:${C.muted};font-size:.9rem;line-height:1.6;}

/* ── ADMIN ── */
.stat-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:10px;}
.stat-card{background:${C.bg};border:1.5px solid ${C.border};border-radius:13px;padding:15px;text-align:center;}
.stat-card.hl{border-color:${C.accentD};background:${C.glow};}
.stat-num{font-family:'Cormorant Garamond',serif;font-size:2rem;color:${C.accent};font-weight:700;}
.stat-lbl{font-size:.75rem;color:${C.muted};margin-top:2px;}

.tam-table{width:100%;border-collapse:collapse;font-size:.83rem;}
.tam-table th{color:${C.muted};font-weight:500;padding:7px 10px;text-align:center;border-bottom:1px solid ${C.border};}
.tam-table td{padding:7px 10px;border-bottom:1px solid ${C.border};text-align:center;}
.tam-table tr:last-child td{border-bottom:none;}
.tam-val{color:${C.accent};font-weight:600;}
.tam-zero{color:${C.border};}

.sec-label{font-size:.7rem;letter-spacing:2.5px;text-transform:uppercase;color:${C.muted};margin-bottom:10px;margin-top:20px;}

.ptab-row{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px;}
.ptab{background:none;border:1.5px solid ${C.border};border-radius:8px;color:${C.muted};
  cursor:pointer;font-family:'DM Sans',sans-serif;font-size:.78rem;padding:5px 12px;transition:all .2s;}
.ptab.active{background:${C.glow};border-color:${C.accent};color:${C.accent};}

.pedido-item{background:${C.bg};border:1px solid rgba(110,231,183,.25);border-radius:12px;padding:15px 18px;margin-bottom:9px;}
.pedido-item.pendente-lojinha{border-color:rgba(245,158,11,.35);}
.pedido-nome{font-weight:600;margin-bottom:8px;font-size:.97rem;}
.pedido-tags{display:flex;flex-wrap:wrap;gap:5px;}
.tag{background:${C.glow};border:1px solid ${C.accentD};border-radius:6px;font-size:.73rem;color:${C.accent};padding:3px 9px;}
.pedido-footer{display:flex;align-items:center;justify-content:space-between;margin-top:12px;gap:10px;flex-wrap:wrap;}
.pedido-hora{font-size:.72rem;color:${C.muted};}
.pedido-total-lbl{font-family:'Cormorant Garamond',serif;font-size:.97rem;color:${C.gold};}

.del-btn{background:none;border:1.5px solid ${C.border};border-radius:8px;color:${C.muted};
  cursor:pointer;font-size:.78rem;padding:5px 12px;transition:all .2s;display:flex;align-items:center;
  gap:5px;white-space:nowrap;font-family:'DM Sans',sans-serif;}
.del-btn:hover{border-color:${C.danger};color:${C.danger};background:${C.dangerBg};}

.confirm-btn{background:none;border:1.5px solid ${C.lojinha};border-radius:8px;color:${C.lojinha};
  cursor:pointer;font-size:.78rem;padding:5px 12px;transition:all .2s;display:flex;align-items:center;
  gap:5px;white-space:nowrap;font-family:'DM Sans',sans-serif;}
.confirm-btn:hover{background:${C.lojinhaBg};}

.empty-state{text-align:center;padding:40px;color:${C.muted};}
.empty-state .em{font-size:2.5rem;display:block;margin-bottom:12px;}
.alert{background:${C.dangerBg};border:1px solid rgba(248,113,113,.3);border-radius:9px;
  padding:11px 15px;color:${C.danger};font-size:.85rem;margin-top:10px;}

.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.72);backdrop-filter:blur(5px);
  z-index:1000;display:flex;align-items:center;justify-content:center;padding:20px;
  animation:fadeIn .15s ease;}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
.modal{background:${C.surface};border:1px solid ${C.border};border-radius:20px;
  padding:32px 28px;max-width:380px;width:100%;
  box-shadow:0 24px 60px rgba(0,0,0,.6);
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
.btn-confirm-modal{flex:1;background:linear-gradient(135deg,#d97706,#b45309);border:none;border-radius:11px;
  color:white;font-family:'DM Sans',sans-serif;font-size:.9rem;font-weight:500;padding:13px;cursor:pointer;transition:all .2s;}
.btn-confirm-modal:hover{transform:translateY(-1px);box-shadow:0 4px 16px rgba(217,119,6,.4);}
`;

/* ── helpers ── */
function initPecas() {
  return Object.fromEntries(
    NOMES_PECAS.map(p => [p, { ativo: false, tamanhos: Object.fromEntries(TODAS_CHAVES.map(k => [k, 0])) }])
  );
}
function calcTotal(pecas) {
  return PECAS_CONFIG.reduce((acc, { nome, preco }) => {
    const qtd = Object.values(pecas[nome]?.tamanhos || {}).reduce((s, v) => s + v, 0);
    return acc + qtd * preco;
  }, 0);
}
function gerarTags(pecas) {
  return PECAS_CONFIG.flatMap(({ nome }) =>
    TODAS_CHAVES.flatMap(chave => {
      const q = pecas?.[nome]?.tamanhos?.[chave] || 0;
      return q > 0 ? [`${nome} · ${chave}${q > 1 ? ` ×${q}` : ""}`] : [];
    })
  );
}

/* ── MODAL ── */
function Modal({ nome, onConfirm, onCancel, tipo }) {
  const isConfirm = tipo === "confirmar";
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-icon">{isConfirm ? "✅" : "🗑️"}</div>
        <div className="modal-title">{isConfirm ? "Confirmar pagamento?" : "Remover pedido?"}</div>
        <div className="modal-sub">
          {isConfirm
            ? <>Confirmar que <strong>{nome}</strong> pagou com cartão na lojinha?<br />O pedido será marcado como pago.</>
            : <>Tem certeza que deseja remover o pedido de <strong>{nome}</strong>?<br />Esta ação não pode ser desfeita.</>
          }
        </div>
        <div className="modal-btns">
          <button className="btn-cancel" onClick={onCancel}>Cancelar</button>
          {isConfirm
            ? <button className="btn-confirm-modal" onClick={onConfirm}>Sim, confirmar</button>
            : <button className="btn-danger" onClick={onConfirm}>Sim, remover</button>
          }
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

/* ── TELA DE RETORNO DO MERCADO PAGO ── */
function TelaRetorno({ status, onVoltar }) {
  const isFail    = status === "falhou";
  const isLojinha = status === "lojinha";
  return (
    <div className="card">
      <div className="success-box">
        <div className="suc-icon">{isFail ? "😕" : isLojinha ? "🏪" : "🎉"}</div>
        <div className={`suc-title ${isFail ? "falhou" : isLojinha ? "lojinha" : ""}`}>
          {isFail
            ? "Pagamento não confirmado!"
            : isLojinha
              ? "Pedido reservado com sucesso!"
              : "Se você realizou o pix, irá aparecer uma confirmação no seu Email em instantes!"}
        </div>
        <div className="suc-sub">
          {isFail
            ? "O pagamento não foi processado. Você pode tentar novamente."
            : isLojinha
              ? "Seu pedido foi salvo. Compareça à lojinha TP para efetuar o pagamento com cartão, fique atendo ao WhatsApp para saber a data de retirada dos uniformes!"
              : "Assim que a confirmação do pagamento aparecer no seu Email, Fique atento no WhatsApp, informaremos em breve a data para você retirar o seu fardamento na loja TP. Obrigado!"}
        </div>
        <br />
        <button className="btn-ghost" onClick={onVoltar}>← Voltar ao início</button>
      </div>
    </div>
  );
}

/* ── TELA DE PAGAMENTO ── */
function TelaPagamento({ nome, pecas, onVoltar }) {
  const [formaSelecionada, setFormaSelecionada] = useState(null);
  const [processando, setProcessando]           = useState(false);
  const [erro, setErro]                         = useState("");
  const [mostrarPendente, setMostrarPendente]   = useState(false);
  const [mostrarLojinha, setMostrarLojinha]      = useState(false);
  const timerRef    = useRef(null);
  const pedidoIdRef = useRef(null);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  if (mostrarPendente) return <TelaRetorno status="pendente" onVoltar={onVoltar} />;
  if (mostrarLojinha)  return <TelaRetorno status="lojinha"  onVoltar={onVoltar} />;

  const totalBase = calcTotal(pecas);

  const opcoes = [
    // {
    //   id:      "pix",
    //   icone:   "❖",
    //   nome:    "Pix",
    //   desc:    "Aprovação imediata · Sem acréscimo",
    //   valor:   totalBase,
    //   cls:     "pix",
    //   valCls:  "pix-val",
    // },
    {
      id:      "credito_lojinha",
      icone:   "🏪",
      nome:    "Cartão de crédito na lojinha",
      desc:    "Pague presencialmente na loja TP · +5% de acréscimo",
      valor:   fmt2(totalBase * 1.05),
      cls:     "lojinha",
      valCls:  "lojinha-val",
      acrescimo: true,
    },
  ];

  async function irParaPagamento() {
    if (!formaSelecionada || processando) return;
    setErro("");
    setProcessando(true);

    try {
      let pedidoId = pedidoIdRef.current;

      // ── IDEMPOTÊNCIA: só cria novo pedido se não tiver um já criado nesta sessão ──
      if (!pedidoId) {
        const { data: pedidoSalvo, error: errSalvar } = await supabase
          .from("pedidos")
          .insert([{
            nome:             nome,
            pecas,
            pagamento_status: formaSelecionada === "credito_lojinha" ? "pendente_credito_lojinha" : "pendente",
            forma_pagamento:  formaSelecionada,
          }])
          .select()
          .single();

        if (errSalvar) throw errSalvar;
        pedidoId = pedidoSalvo.id;
        pedidoIdRef.current = pedidoId;
      } else {
        // Se já tem pedido mas mudou a forma de pagamento, atualiza
        await supabase
          .from("pedidos")
          .update({
            forma_pagamento:  formaSelecionada,
            pagamento_status: formaSelecionada === "credito_lojinha" ? "pendente_credito_lojinha" : "pendente",
          })
          .eq("id", pedidoId);
      }

      // ── Se é pagamento na lojinha, não precisa ir pro MP ──
      if (formaSelecionada === "credito_lojinha") {
        setMostrarLojinha(true);
        return;
      }

      // ── Pix: vai pro Mercado Pago normalmente ──
      const response = await fetch("/.netlify/functions/criar-pagamento", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pedidoId:  pedidoId,
          forma:     formaSelecionada,
          nomeAluna: nome,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.checkout_url) {
        throw new Error(data.error || "Erro ao gerar link de pagamento.");
      }

      sessionStorage.setItem("pagamento_pendente", "true");
      timerRef.current = setTimeout(() => setMostrarPendente(true), 10000);
      window.location.href = data.checkout_url;

    } catch (e) {
      console.error(e);
      setErro("Erro ao processar. Tente novamente em instantes.");
      setProcessando(false);
    }
  }

  const opcaoAtual = opcoes.find(o => o.id === formaSelecionada);

  return (
    <div className="card">
      <div className="card-title">Forma de pagamento</div>

      <div className="pgto-resumo">
        <div className="pgto-resumo-title">Resumo do pedido</div>
        <div className="pgto-resumo-tags">
          {gerarTags(pecas).map((tag, i) => <span key={i} className="tag">{tag}</span>)}
        </div>
        <div className="pgto-total-row">
          <span className="pgto-total-label">Subtotal</span>
          <span className="pgto-total-val">{fmt(totalBase)}</span>
        </div>
      </div>

      <div className="pgto-opcoes">
        {opcoes.map(op => (
          <div
            key={op.id}
            className={`pgto-opcao ${formaSelecionada === op.id ? `selecionada ${op.cls}` : ""}`}
            onClick={() => setFormaSelecionada(op.id)}
          >
            <div className="pgto-icone">{op.icone}</div>
            <div className="pgto-info">
              <div className="pgto-nome">{op.nome}</div>
              <div className="pgto-desc">{op.desc}</div>
            </div>
            <div>
              <div className={`pgto-valor ${op.valCls}`}>{fmt(op.valor)}</div>
              {op.acrescimo && (
                <div className="pgto-acrescimo">+{fmt(op.valor - totalBase)} de acréscimo</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {erro && <div className="alert">{erro}</div>}

      <div style={{ display: "flex", gap: 10 }}>
        <button className="btn-ghost" onClick={onVoltar} style={{ flex: "0 0 auto" }}>
          ← Voltar
        </button>
        <button
          className={`btn-primary ${formaSelecionada === "pix" ? "btn-pix" : formaSelecionada === "credito_lojinha" ? "btn-lojinha" : ""}`}
          style={{ flex: 1, marginTop: 0 }}
          disabled={!formaSelecionada || processando}
          onClick={irParaPagamento}
        >
          {processando
            ? "Processando…"
            : formaSelecionada === "credito_lojinha"
              ? "Reservar pedido →"
              : formaSelecionada
                ? `Pagar ${fmt(opcaoAtual.valor)} →`
                : "Selecione uma forma de pagamento"}
        </button>
      </div>
    </div>
  );
}

/* ── PÁGINA DA ALUNA ── */
function AlunaPage({ statusRetorno }) {
  const [step, setStep]         = useState(statusRetorno ? "retorno" : "nome");
  const [nome, setNome]         = useState("");
  const [sobrenome, setSobrenome] = useState("");
  const [pecas, setPecas]       = useState(initPecas());

  const nomeCompleto = `${nome.trim()} ${sobrenome.trim()}`.trim();
  const nomeValido   = nome.trim().length >= 2 && sobrenome.trim().length >= 2;

  const totalQtd = Object.values(pecas).reduce(
    (a, p) => a + Object.values(p.tamanhos).reduce((s, v) => s + v, 0), 0
  );
  const totalVal = calcTotal(pecas);

  function togglePeca(p) {
    setPecas(prev => {
      const abrindo = !prev[p].ativo;
      return Object.fromEntries(
        NOMES_PECAS.map(n => [n, { ...prev[n], ativo: n === p ? abrindo : false }])
      );
    });
  }
  function setQty(peca, chave, val) {
    setPecas(prev => ({
      ...prev,
      [peca]: { ...prev[peca], tamanhos: { ...prev[peca].tamanhos, [chave]: val } }
    }));
  }
  function reiniciar() {
    setNome(""); setSobrenome(""); setPecas(initPecas()); setStep("nome");
    window.history.replaceState({}, "", "/");
  }

  if (step === "retorno") return (
    <TelaRetorno status={statusRetorno} onVoltar={reiniciar} />
  );

  if (step === "pagamento") return (
    <TelaPagamento
      nome={nomeCompleto}
      pecas={pecas}
      onVoltar={() => setStep("escolha")}
    />
  );

  if (step === "nome") return (
    <div className="card">
      <div className="card-title">Identificação</div>
      <label style={{ display: "block", fontSize: ".8rem", color: C.muted, marginBottom: 8, letterSpacing: "1px", textTransform: "uppercase" }}>
        Nome
      </label>
      <input
        type="text"
        placeholder="Ex: Raul"
        value={nome}
        autoFocus
        onChange={e => setNome(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") document.getElementById("input-sobrenome").focus(); }}
      />
      <br /><br />
      <label style={{ display: "block", fontSize: ".8rem", color: C.muted, marginBottom: 8, letterSpacing: "1px", textTransform: "uppercase" }}>
        Sobrenome
      </label>
      <input
        id="input-sobrenome"
        type="text"
        placeholder="Ex: Passos Gardini"
        value={sobrenome}
        onChange={e => setSobrenome(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter" && nomeValido) setStep("escolha"); }}
      />
      <br /><br />
      <button className="btn-primary" disabled={!nomeValido} onClick={() => setStep("escolha")}>
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
            <div key={pNome} className={`peca-row ${pecas[pNome].ativo ? "ativa" : ""}`} onClick={() => togglePeca(pNome)}>
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
                    {(() => {
                      const itens = TODAS_CHAVES.filter(k => (pecas[pNome].tamanhos[k] || 0) > 0);
                      if (itens.length === 0) return null;
                      return (
                        <div className="peca-tags-resumo">
                          {itens.map(k => (
                            <span key={k} className="peca-tag-mini">
                              {k.replace("Adulto ", "").replace("Infantil ", "Inf ")}
                              {pecas[pNome].tamanhos[k] > 1 ? ` ×${pecas[pNome].tamanhos[k]}` : ""}
                            </span>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                  <div className="grupos-wrap" onClick={e => e.stopPropagation()}>
                    {GRUPOS.map(({ label, tamanhos }) => (
                      <div key={label} className="grupo-bloco">
                        <div className={`grupo-label ${label.toLowerCase()}`}>{label}</div>
                        <div className="tam-grid">
                          {tamanhos.map(t => {
                            const chave = `${label} ${t}`;
                            return (
                              <div key={chave} className="tam-item">
                                <span className="tam-label">{t}</span>
                                <QtyControl
                                  value={pecas[pNome].tamanhos[chave] || 0}
                                  onChange={v => setQty(pNome, chave, v)}
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="total-bar">
          <div>
            <div className="total-label">{totalQtd} {totalQtd === 1 ? "peça" : "peças"}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="total-label">Total</div>
            <div className="total-val">{fmt(totalVal)}</div>
          </div>
        </div>
        <button
          className="btn-primary"
          onClick={() => setStep("pagamento")}
          disabled={totalQtd === 0}
        >
          Continuar para pagamento →
        </button>
      </div>
    </>
  );
}

/* ── ADMIN LOGIN ── */
function AdminLogin({ onEntrar }) {
  const [senha, setSenha]     = useState("");
  const [erro, setErro]       = useState(false);
  const [loading, setLoading] = useState(false);

  async function tentar() {
    setLoading(true);
    try {
      const res  = await fetch("/.netlify/functions/admin-auth", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ senha }),
      });
      const data = await res.json();
      if (data.ok) { onEntrar(senha); return; }
    } catch {}
    setErro(true); setSenha(""); setLoading(false);
  }

  return (
    <div className="card" style={{ maxWidth: 340, margin: "0 auto" }}>
      <div className="card-title">Área Admin</div>
      <label style={{ display: "block", fontSize: ".8rem", color: C.muted, marginBottom: 8, letterSpacing: "1px", textTransform: "uppercase" }}>Senha</label>
      <input
        type="password" placeholder="••••••••" value={senha} autoFocus
        onChange={e => { setSenha(e.target.value); setErro(false); }}
        onKeyDown={e => { if (e.key === "Enter") tentar(); }}
      />
      {erro && <div className="alert">Senha incorreta.</div>}
      <br /><br />
      <button className="btn-primary" onClick={tentar} disabled={loading}>{loading ? "Verificando..." : "Entrar"}</button>
    </div>
  );
}

/* ── ADMIN ── */
function AdminPage({ onSair, adminSenha }) {
  const [aba, setAba]               = useState("resumo");
  const [pedidos, setPedidos]       = useState(null);
  const [pedidosLojinha, setPedidosLojinha] = useState(null);
  const [filtro, setFiltro]         = useState("Todos");
  const [loading, setLoading]       = useState(true);
  const [modalId, setModalId]       = useState(null);
  const [modalTipo, setModalTipo]   = useState("remover");
  const [erroAdmin, setErroAdmin]   = useState("");
  const [busca, setBusca]           = useState("");

  async function carregar() {
    setLoading(true); setErroAdmin("");
    try {
      const { data: pagos, error: e1 } = await supabase
        .from("pedidos")
        .select("*")
        .eq("pagamento_status", "pago")
        .order("hora", { ascending: false });
      if (e1) throw e1;

      const { data: lojinha, error: e2 } = await supabase
        .from("pedidos")
        .select("*")
        .eq("pagamento_status", "pendente_credito_lojinha")
        .order("hora", { ascending: false });
      if (e2) throw e2;

      setPedidos(pagos || []);
      setPedidosLojinha(lojinha || []);
    } catch (e) {
      console.error(e);
      setErroAdmin("Erro ao carregar pedidos.");
      setPedidos([]); setPedidosLojinha([]);
    }
    setLoading(false);
  }

  async function confirmarDelete() {
    if (!modalId) return;
    try {
      const res = await fetch("/.netlify/functions/deletar-pedido", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ pedidoId: modalId, senha: adminSenha }),
      });
      if (!res.ok) throw new Error("Erro ao deletar");
      setModalId(null); setModalTipo("remover"); carregar();
    } catch (e) {
      console.error(e); setErroAdmin("Erro ao remover pedido."); setModalId(null);
    }
  }

  async function confirmarPagamentoLojinha() {
    if (!modalId) return;
    try {
      const res = await fetch("/.netlify/functions/confirmar-pedido-lojinha", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ pedidoId: modalId, senha: adminSenha }),
      });
      if (!res.ok) throw new Error("Erro ao confirmar");
      setModalId(null); setModalTipo("remover"); carregar();
    } catch (e) {
      console.error(e); setErroAdmin("Erro ao confirmar pedido."); setModalId(null);
    }
  }

  useEffect(() => { carregar(); }, []);

  const todosPedidos = [...(pedidos || []), ...(pedidosLojinha || [])];
  const totais = Object.fromEntries(
    NOMES_PECAS.map(p => [p, Object.fromEntries(TODAS_CHAVES.map(k => [k, 0]))])
  );
  let receitaTotal = 0;
  (pedidos || []).forEach(p => {
    PECAS_CONFIG.forEach(({ nome, preco }) => {
      TODAS_CHAVES.forEach(chave => {
        const q = p.pecas?.[nome]?.tamanhos?.[chave] || 0;
        totais[nome][chave] += q;
        receitaTotal += q * preco;
      });
    });
  });

  const nomeModal = todosPedidos?.find(p => p.id === modalId)?.nome || "";
  const pecasFiltradas = filtro === "Todos" ? NOMES_PECAS : [filtro];

  let pedidosFiltrados = pedidos || [];
  if (filtro !== "Todos") pedidosFiltrados = pedidosFiltrados.filter(p =>
    TODAS_CHAVES.some(k => (p.pecas?.[filtro]?.tamanhos?.[k] || 0) > 0)
  );
  if (busca) pedidosFiltrados = pedidosFiltrados.filter(p =>
    p.nome?.toLowerCase().includes(busca.toLowerCase())
  );

  let lojinhaFiltrados = pedidosLojinha || [];
  if (busca) lojinhaFiltrados = lojinhaFiltrados.filter(p =>
    p.nome?.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <>
      {modalId && (
        <Modal
          nome={nomeModal}
          tipo={modalTipo}
          onConfirm={modalTipo === "confirmar" ? confirmarPagamentoLojinha : confirmarDelete}
          onCancel={() => { setModalId(null); setModalTipo("remover"); }}
        />
      )}

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
        {[["resumo", "📊 Resumo"], ["pedidos", "📋 Pedidos"], ["lojinha", "🏪 Lojinha"]].map(([a, lbl]) => (
          <button key={a} className={`ptab ${aba === a ? "active" : ""}`} onClick={() => setAba(a)}>
            {lbl}
            {a === "lojinha" && (pedidosLojinha?.length || 0) > 0 && (
              <span style={{ marginLeft: 6, background: C.lojinha, color: "#000", borderRadius: 10, padding: "1px 7px", fontSize: ".7rem", fontWeight: 700 }}>
                {pedidosLojinha.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading && <div className="empty-state"><span className="em">⏳</span>Carregando...</div>}

      {!loading && aba === "resumo" && (
        <div className="card">
          <div className="card-title">Resumo geral</div>
          <div className="stat-grid">
            <div className="stat-card hl">
              <div className="stat-num">{pedidos?.length}</div>
              <div className="stat-lbl">Pedidos confirmados</div>
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
              <div className="stat-num" style={{ fontSize: "1.2rem" }}>{fmt(receitaTotal)}</div>
              <div className="stat-lbl">Receita total</div>
            </div>
            {(pedidosLojinha?.length || 0) > 0 && (
              <div className="stat-card" style={{ borderColor: C.lojinha }}>
                <div className="stat-num" style={{ color: C.lojinha }}>{pedidosLojinha.length}</div>
                <div className="stat-lbl">Pendentes lojinha</div>
              </div>
            )}
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
              <div key={peca} style={{ marginBottom: 20 }}>
                <div className="sec-label">{peca}</div>
                <table className="tam-table">
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left", width: 80 }}>Grupo</th>
                      {["PP", "P", "M", "G"].map(t => <th key={t}>{t}</th>)}
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {GRUPOS.map(({ label, tamanhos }) => {
                      const sub = tamanhos.reduce((s, t) => s + (totais[peca][`${label} ${t}`] || 0), 0);
                      return (
                        <tr key={label}>
                          <td style={{ textAlign: "left", color: label === "Adulto" ? "#a78bfa" : "#67e8f9", fontWeight: 600, fontSize: ".78rem" }}>
                            {label}
                          </td>
                          {["PP", "P", "M", "G"].map(t => {
                            if (!tamanhos.includes(t)) return <td key={t}><span className="tam-zero">–</span></td>;
                            const v = totais[peca][`${label} ${t}`] || 0;
                            return <td key={t}><span className={v > 0 ? "tam-val" : "tam-zero"}>{v > 0 ? v : "–"}</span></td>;
                          })}
                          <td><span style={{ color: C.gold, fontWeight: 600 }}>{sub || "–"}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && aba === "pedidos" && (
        <div className="card">
          <div className="card-title">Pedidos confirmados ({pedidosFiltrados?.length || 0})</div>
          <input
            type="text"
            placeholder="Pesquisar por nome..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            style={{ width: "100%", marginBottom: 14, padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: "rgba(0,0,0,.2)", color: C.text, fontSize: ".88rem", outline: "none", boxSizing: "border-box" }}
          />

          {pedidosFiltrados?.length === 0
            ? <div className="empty-state"><span className="em">📋</span>Nenhum pedido confirmado.</div>
            : pedidosFiltrados.map(p => (
                <div key={p.id} className="pedido-item">
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
                    <div className="pedido-nome">{p.nome}</div>
                    <span
                      style={{ color: C.success, borderColor: C.success, background: `${C.success}18`, fontSize: ".72rem", padding: "3px 10px", borderRadius: 20, fontWeight: 600, border: "1px solid" }}
                    >
                      Confirmado ✓
                    </span>
                  </div>
                  <div className="pedido-tags">
                    {gerarTags(p.pecas).map((tag, i) => <span key={i} className="tag">{tag}</span>)}
                  </div>
                  <div className="pedido-footer">
                    <div>
                      <div className="pedido-hora">
                        {new Date(p.hora).toLocaleString("pt-BR", {
                          day: "2-digit", month: "2-digit", year: "numeric",
                          hour: "2-digit", minute: "2-digit"
                        })}
                      </div>
                      <div className="pedido-total-lbl">
                        {fmt(p.valor_pago || calcTotal(p.pecas))}
                        {p.forma_pagamento && (
                          <span style={{ fontSize: ".92rem", color: C.muted, marginLeft: 6 }}>
                            via {FORMA_LABEL[p.forma_pagamento] || p.forma_pagamento}
                          </span>
                        )}
                      </div>
                    </div>
                    <button className="del-btn" onClick={() => { setModalId(p.id); setModalTipo("remover"); }}>
                      🗑 Remover
                    </button>
                  </div>
                </div>
              ))
          }
        </div>
      )}

      {!loading && aba === "lojinha" && (
        <div className="card">
          <div className="card-title">Pagamentos pendentes na lojinha ({lojinhaFiltrados?.length || 0})</div>
          <input
            type="text"
            placeholder="Pesquisar por nome..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            style={{ width: "100%", marginBottom: 14, padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: "rgba(0,0,0,.2)", color: C.text, fontSize: ".88rem", outline: "none", boxSizing: "border-box" }}
          />

          {lojinhaFiltrados?.length === 0
            ? <div className="empty-state"><span className="em">🏪</span>Nenhum pedido pendente na lojinha.</div>
            : lojinhaFiltrados.map(p => (
                <div key={p.id} className="pedido-item pendente-lojinha">
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
                    <div className="pedido-nome">{p.nome}</div>
                    <span
                      style={{ color: C.lojinha, borderColor: C.lojinha, background: `${C.lojinha}18`, fontSize: ".72rem", padding: "3px 10px", borderRadius: 20, fontWeight: 600, border: "1px solid" }}
                    >
                      Pendente 🏪
                    </span>
                  </div>
                  <div className="pedido-tags">
                    {gerarTags(p.pecas).map((tag, i) => <span key={i} className="tag">{tag}</span>)}
                  </div>
                  <div className="pedido-footer">
                    <div>
                      <div className="pedido-hora">
                        {new Date(p.hora).toLocaleString("pt-BR", {
                          day: "2-digit", month: "2-digit", year: "numeric",
                          hour: "2-digit", minute: "2-digit"
                        })}
                      </div>
                      <div className="pedido-total-lbl">
                        {fmt(calcTotal(p.pecas) * 1.05)}
                        <span style={{ fontSize: ".92rem", color: C.muted, marginLeft: 6 }}>
                          via Cartão na lojinha
                        </span>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="confirm-btn" onClick={() => { setModalId(p.id); setModalTipo("confirmar"); }}>
                        ✅ Confirmar
                      </button>
                      <button className="del-btn" onClick={() => { setModalId(p.id); setModalTipo("remover"); }}>
                        🗑
                      </button>
                    </div>
                  </div>
                </div>
              ))
          }
        </div>
      )}
    </>
  );
}

/* ── APP PRINCIPAL ── */
export default function App() {
  const [tela, setTela]           = useState("aluna");
  const [adminAuth, setAdminAuth] = useState(false);
  const [adminSenha, setAdminSenha] = useState("");
  const [statusRetorno, setStatusRetorno] = useState(() => detectarStatusRetorno());

  useEffect(() => {
    const handlePageShow = (e) => {
      if (e.persisted) {
        const status = detectarStatusRetorno();
        if (status) setStatusRetorno(status);
      }
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="grain" />
      <div className="wrap">
        <div className="logo">
          <div className="logo-title">Fardamento TP 2026</div>
          <div className="logo-sub">
            {tela === "aluna" ? "Escolha seu uniforme" : "Painel da administração"}
          </div>
          <div className="tabs">
            <button className={`tab ${tela === "aluna" ? "active" : ""}`} onClick={() => setTela("aluna")}>Aluna</button>
            <button className={`tab ${tela !== "aluna" ? "active" : ""}`} onClick={() => setTela(adminAuth ? "admin" : "admin-login")}>
              Administração
            </button>
          </div>
        </div>

        {tela === "aluna"       && <AlunaPage statusRetorno={statusRetorno} />}
        {tela === "admin-login" && <AdminLogin onEntrar={(s) => { setAdminAuth(true); setAdminSenha(s); setTela("admin"); }} />}
        {tela === "admin"       && <AdminPage onSair={() => { setAdminAuth(false); setAdminSenha(""); setTela("aluna"); }} adminSenha={adminSenha} />}
      </div>
    </>
  );
}