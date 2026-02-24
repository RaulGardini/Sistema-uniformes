import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import imgBlusa from "./img/bluda.png";
import imgShort from "./img/short.png";
import imgRegata from "./img/regata.png";
import imgCalcaMoleton from "./img/calcamoleton.png";

const PECAS_CONFIG = [
  { img: imgBlusa, nome: "Blusa",         preco: 58.00 },
  { img: imgShort, nome: "Regata",        preco: 29.00 },
  { img: imgRegata, nome: "Short",         preco: 69.00 },
  { img: imgCalcaMoleton, nome: "Calça Moletom", preco: 89.00 },
  { img: imgCalcaMoleton, nome: "Blusa Moletom", preco: 99.00 },
];
const NOMES_PECAS = PECAS_CONFIG.map(p => p.nome);
const GRUPOS      = [
  { label: "Adulto",   tamanhos: ["P", "M", "G"] },
  { label: "Infantil", tamanhos: ["P", "M", "G"] },
];
const TODAS_CHAVES = GRUPOS.flatMap(g => g.tamanhos.map(t => `${g.label} ${t}`));
const ADMIN_SENHA  = "danca2025";

const fmt  = v => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmt2 = v => parseFloat(v.toFixed(2));

const STATUS_LABEL = {
  pago:        { txt: "Pago ✓",      cor: "#6ee7b7" },
  pendente:    { txt: "Pendente ⏳",  cor: "#fbbf24" },
  falhou:      { txt: "Falhou ✗",    cor: "#f87171" },
  reembolsado: { txt: "Reembolsado", cor: "#94a3b8" },
};

const FORMA_LABEL = {
  pix:      "Pix",
  cartao_1x: "Cartão 1×",
  cartao_2x: "Cartão 2×",
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
};

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
.peca-row{background:${C.bg};border:1.5px solid ${C.border};border-radius:14px;overflow:hidden;transition:border-color .2s,box-shadow .2s;}
.peca-row.ativa{border-color:${C.accentD};box-shadow:0 0 0 1px ${C.accentD},inset 0 0 24px ${C.glow};}
.peca-inner{display:flex;align-items:stretch;}
.peca-foto{width:94px;min-height:94px;flex-shrink:0;background:${C.surface};
  display:flex;align-items:center;justify-content:center;font-size:2.2rem;position:relative;overflow:hidden;}
.peca-foto img{width:100%;height:100%;object-fit:cover;position:absolute;inset:0;}
.peca-info{flex:1;padding:14px 16px;}
.peca-nome-row{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:3px;}
.peca-nome{font-size:.97rem;font-weight:600;}
.peca-preco{font-family:'Cormorant Garamond',serif;font-size:1.15rem;color:${C.gold};font-weight:600;}
.toggle-btn{background:none;border:1.5px solid ${C.border};border-radius:8px;color:${C.muted};
  cursor:pointer;font-size:.75rem;padding:4px 11px;transition:all .2s;font-family:'DM Sans',sans-serif;flex-shrink:0;}
.toggle-btn:hover{border-color:${C.accent};color:${C.accent};}
.toggle-btn.on{background:${C.glow};border-color:${C.accent};color:${C.accent};}

.grupos-wrap{display:flex;flex-direction:column;gap:10px;margin-top:12px;}
.grupo-bloco{background:rgba(0,0,0,.2);border:1px solid ${C.border};border-radius:10px;padding:10px 12px;}
.grupo-label{font-size:.68rem;letter-spacing:2px;text-transform:uppercase;color:${C.muted};margin-bottom:8px;font-weight:600;}
.grupo-label.adulto{color:#a78bfa;}
.grupo-label.infantil{color:#67e8f9;}
.tam-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;}
.tam-item{display:flex;flex-direction:column;align-items:center;gap:5px;}
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
.total-val{font-family:'Cormorant Garamond',serif;font-size:1.5rem;color:${C.gold};font-weight:700;}

/* ── PAGAMENTO ── */
.pgto-resumo{background:${C.bg};border:1px solid ${C.border};border-radius:14px;padding:16px 20px;margin-bottom:20px;}
.pgto-resumo-title{font-size:.75rem;letter-spacing:2px;text-transform:uppercase;color:${C.muted};margin-bottom:10px;}
.pgto-resumo-tags{display:flex;flex-wrap:wrap;gap:6px;}
.pgto-total-row{display:flex;justify-content:space-between;align-items:center;margin-top:14px;padding-top:12px;border-top:1px solid ${C.border};}
.pgto-total-label{font-size:.85rem;color:${C.muted};}
.pgto-total-val{font-family:'Cormorant Garamond',serif;font-size:1.4rem;color:${C.gold};font-weight:700;}

.pgto-opcoes{display:flex;flex-direction:column;gap:12px;margin-bottom:20px;}
.pgto-opcao{background:${C.bg};border:2px solid ${C.border};border-radius:14px;
  padding:18px 20px;cursor:pointer;transition:all .2s;display:flex;align-items:center;gap:16px;}
.pgto-opcao:hover{border-color:${C.muted};}
.pgto-opcao.selecionada.pix{border-color:${C.pix};box-shadow:0 0 0 1px ${C.pix},inset 0 0 20px ${C.pixBg};}
.pgto-opcao.selecionada.cartao{border-color:${C.accentD};box-shadow:0 0 0 1px ${C.accentD},inset 0 0 20px ${C.glow};}
.pgto-icone{font-size:1.8rem;flex-shrink:0;}
.pgto-info{flex:1;}
.pgto-nome{font-weight:600;font-size:.97rem;margin-bottom:2px;}
.pgto-desc{font-size:.78rem;color:${C.muted};}
.pgto-valor{font-family:'Cormorant Garamond',serif;font-size:1.2rem;font-weight:700;text-align:right;}
.pgto-valor.pix-val{color:${C.pix};}
.pgto-valor.cartao-val{color:${C.accent};}
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

.btn-ghost{background:none;border:1.5px solid ${C.border};border-radius:10px;color:${C.muted};
  cursor:pointer;font-family:'DM Sans',sans-serif;font-size:.85rem;padding:8px 16px;transition:all .2s;}
.btn-ghost:hover{border-color:${C.accent};color:${C.accent};}

/* ── SUCESSO / ESTADOS ── */
.success-box{text-align:center;padding:48px 28px;}
.suc-icon{font-size:3.5rem;margin-bottom:14px;animation:pop .4s cubic-bezier(.175,.885,.32,1.275);}
@keyframes pop{from{transform:scale(0);opacity:0}to{transform:scale(1);opacity:1}}
.suc-title{font-family:'Cormorant Garamond',serif;font-size:1.7rem;color:${C.success};margin-bottom:8px;}
.suc-title.pendente{color:#fbbf24;}
.suc-title.falhou{color:${C.danger};}
.suc-sub{color:${C.muted};font-size:.9rem;line-height:1.6;}
.suc-total{font-family:'Cormorant Garamond',serif;font-size:1.2rem;color:${C.gold};margin:14px 0;}

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

.pedido-item{background:${C.bg};border:1px solid ${C.border};border-radius:12px;padding:15px 18px;margin-bottom:9px;}
.pedido-item.pago{border-color:rgba(110,231,183,.25);}
.pedido-item.falhou{border-color:rgba(248,113,113,.2);}
.pedido-nome{font-weight:600;margin-bottom:8px;font-size:.97rem;}
.pedido-tags{display:flex;flex-wrap:wrap;gap:5px;}
.tag{background:${C.glow};border:1px solid ${C.accentD};border-radius:6px;font-size:.73rem;color:${C.accent};padding:3px 9px;}
.pedido-footer{display:flex;align-items:center;justify-content:space-between;margin-top:12px;gap:10px;flex-wrap:wrap;}
.pedido-hora{font-size:.72rem;color:${C.muted};}
.pedido-total-lbl{font-family:'Cormorant Garamond',serif;font-size:.97rem;color:${C.gold};}
.status-badge{font-size:.72rem;padding:3px 10px;border-radius:20px;font-weight:600;border:1px solid;}

.del-btn{background:none;border:1.5px solid ${C.border};border-radius:8px;color:${C.muted};
  cursor:pointer;font-size:.78rem;padding:5px 12px;transition:all .2s;display:flex;align-items:center;
  gap:5px;white-space:nowrap;font-family:'DM Sans',sans-serif;}
.del-btn:hover{border-color:${C.danger};color:${C.danger};background:${C.dangerBg};}

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
function Modal({ nome, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-icon">🗑️</div>
        <div className="modal-title">Remover pedido?</div>
        <div className="modal-sub">
          Tem certeza que deseja remover o pedido de <strong>{nome}</strong>?<br />
          Esta ação não pode ser desfeita.
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

/* ── TELA DE RETORNO DO MERCADO PAGO ── */
function TelaRetorno({ status, onVoltar }) {
  const configs = {
    aprovado: {
      icon:  "🎉",
      title: "Pagamento aprovado!",
      cls:   "",
      sub:   "Seu pedido foi confirmado e o pagamento foi processado com sucesso. Obrigada!",
    },
    pendente: {
      icon:  "⏳",
      title: "Pagamento em análise",
      cls:   "pendente",
      sub:   "Seu pedido foi recebido. Assim que o pagamento for confirmado, seu status será atualizado.",
    },
    falhou: {
      icon:  "😕",
      title: "Pagamento não concluído",
      cls:   "falhou",
      sub:   "O pagamento não foi processado. Você pode tentar novamente com outro método de pagamento.",
    },
  };
  const c = configs[status] || configs.falhou;
  return (
    <div className="card">
      <div className="success-box">
        <div className="suc-icon">{c.icon}</div>
        <div className={`suc-title ${c.cls}`}>{c.title}</div>
        <div className="suc-sub">{c.sub}</div>
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

  const totalBase = calcTotal(pecas);
  const total2x   = fmt2(totalBase * 1.06);

  const opcoes = [
    {
      id:      "pix",
      icone:   "💚",
      nome:    "Pix",
      desc:    "Aprovação imediata · Sem acréscimo",
      valor:   totalBase,
      cls:     "pix",
      valCls:  "pix-val",
    },
    {
      id:      "cartao_1x",
      icone:   "💳",
      nome:    "Cartão de crédito — 1×",
      desc:    "À vista no cartão",
      valor:   totalBase,
      cls:     "cartao",
      valCls:  "cartao-val",
    },
    {
      id:      "cartao_2x",
      icone:   "💳",
      nome:    "Cartão de crédito — 2×",
      desc:    "+6% de acréscimo sobre o total",
      valor:   total2x,
      cls:     "cartao",
      valCls:  "cartao-val",
      acrescimo: true,
    },
  ];

  async function irParaPagamento() {
    if (!formaSelecionada) return;
    setErro("");
    setProcessando(true);

    try {
      const opcao = opcoes.find(o => o.id === formaSelecionada);

      // 1. Salva o pedido no Supabase com status "pendente"
      const { data: pedidoSalvo, error: errSalvar } = await supabase
        .from("pedidos")
        .insert([{
          nome:             nome.trim(),
          pecas,
          pagamento_status: "pendente",
          forma_pagamento:  formaSelecionada,
        }])
        .select()
        .single();

      if (errSalvar) throw errSalvar;

      // 2. Cria preferência no Mercado Pago via Netlify Function
      const response = await fetch("/.netlify/functions/criar-pagamento", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pedidoId:  pedidoSalvo.id,
          valor:     opcao.valor,
          forma:     formaSelecionada,
          nomeAluna: nome.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.checkout_url) {
        throw new Error(data.error || "Erro ao gerar link de pagamento.");
      }

      // 3. Redireciona para o checkout do Mercado Pago
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

      {/* Resumo do pedido */}
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

      {/* Opções de pagamento */}
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
          className={`btn-primary ${formaSelecionada === "pix" ? "btn-pix" : ""}`}
          style={{ flex: 1, marginTop: 0 }}
          disabled={!formaSelecionada || processando}
          onClick={irParaPagamento}
        >
          {processando
            ? "Redirecionando…"
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
  const [pecas, setPecas]       = useState(initPecas());

  const totalQtd = Object.values(pecas).reduce(
    (a, p) => a + Object.values(p.tamanhos).reduce((s, v) => s + v, 0), 0
  );
  const totalVal = calcTotal(pecas);

  function togglePeca(p) {
    setPecas(prev => ({ ...prev, [p]: { ...prev[p], ativo: !prev[p].ativo } }));
  }
  function setQty(peca, chave, val) {
    setPecas(prev => ({
      ...prev,
      [peca]: { ...prev[peca], tamanhos: { ...prev[peca].tamanhos, [chave]: val } }
    }));
  }
  function reiniciar() {
    setNome(""); setPecas(initPecas()); setStep("nome");
    window.history.replaceState({}, "", "/");
  }

  if (step === "retorno") return (
    <TelaRetorno status={statusRetorno} onVoltar={reiniciar} />
  );

  if (step === "pagamento") return (
    <TelaPagamento
      nome={nome}
      pecas={pecas}
      onVoltar={() => setStep("escolha")}
    />
  );

  if (step === "nome") return (
    <div className="card">
      <div className="card-title">Identificação</div>
      <label style={{ display: "block", fontSize: ".8rem", color: C.muted, marginBottom: 8, letterSpacing: "1px", textTransform: "uppercase" }}>
        Seu nome completo
      </label>
      <input
        type="text"
        placeholder="Ex: Maria da Silva"
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
          {PECAS_CONFIG.map(({ nome: pNome, preco, emoji, img }) => (
            <div key={pNome} className={`peca-row ${pecas[pNome].ativo ? "ativa" : ""}`}>
              <div className="peca-inner">
                <div className="peca-foto">
                  {img ? <img src={img} alt={pNome} /> : <span>{emoji}</span>}
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
                    <div className="grupos-wrap">
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
                  )}
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
  const [senha, setSenha] = useState("");
  const [erro, setErro]   = useState(false);

  function tentar() {
    if (senha === ADMIN_SENHA) onEntrar();
    else { setErro(true); setSenha(""); }
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
      <button className="btn-primary" onClick={tentar}>Entrar</button>
    </div>
  );
}

/* ── ADMIN ── */
function AdminPage({ onSair }) {
  const [aba, setAba]             = useState("resumo");
  const [pedidos, setPedidos]     = useState(null);
  const [filtro, setFiltro]       = useState("Todos");
  const [filtroStatus, setFiltroStatus] = useState("Todos");
  const [loading, setLoading]     = useState(true);
  const [modalId, setModalId]     = useState(null);
  const [erroAdmin, setErroAdmin] = useState("");

  async function carregar() {
    setLoading(true); setErroAdmin("");
    try {
      const { data, error } = await supabase
        .from("pedidos").select("*").order("hora", { ascending: false });
      if (error) throw error;
      setPedidos(data || []);
    } catch (e) {
      console.error(e);
      setErroAdmin("Erro ao carregar pedidos.");
      setPedidos([]);
    }
    setLoading(false);
  }

  async function confirmarDelete() {
    if (!modalId) return;
    try {
      const { error } = await supabase.from("pedidos").delete().eq("id", modalId);
      if (error) throw error;
      setModalId(null); carregar();
    } catch (e) {
      console.error(e); setErroAdmin("Erro ao remover pedido."); setModalId(null);
    }
  }

  useEffect(() => { carregar(); }, []);

  // totais (apenas pedidos pagos)
  const pedidosPagos = pedidos?.filter(p => p.pagamento_status === "pago") || [];
  const totais = Object.fromEntries(
    NOMES_PECAS.map(p => [p, Object.fromEntries(TODAS_CHAVES.map(k => [k, 0]))])
  );
  let receitaTotal = 0;
  pedidosPagos.forEach(p => {
    PECAS_CONFIG.forEach(({ nome, preco }) => {
      TODAS_CHAVES.forEach(chave => {
        const q = p.pecas?.[nome]?.tamanhos?.[chave] || 0;
        totais[nome][chave] += q;
        receitaTotal += q * preco;
      });
    });
  });

  const nomeModal = pedidos?.find(p => p.id === modalId)?.nome || "";
  const pecasFiltradas = filtro === "Todos" ? NOMES_PECAS : [filtro];

  let pedidosFiltrados = pedidos || [];
  if (filtroStatus !== "Todos") pedidosFiltrados = pedidosFiltrados.filter(p => p.pagamento_status === filtroStatus);
  if (filtro !== "Todos") pedidosFiltrados = pedidosFiltrados.filter(p =>
    TODAS_CHAVES.some(k => (p.pecas?.[filtro]?.tamanhos?.[k] || 0) > 0)
  );

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
        {[["resumo", "📊 Resumo"], ["pedidos", "📋 Pedidos"]].map(([a, lbl]) => (
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
              <div className="stat-lbl">Total pedidos</div>
            </div>
            <div className="stat-card" style={{ borderColor: "rgba(110,231,183,.3)" }}>
              <div className="stat-num" style={{ color: C.success }}>{pedidosPagos.length}</div>
              <div className="stat-lbl">Pagos ✓</div>
            </div>
            <div className="stat-card" style={{ borderColor: "rgba(251,191,36,.3)" }}>
              <div className="stat-num" style={{ color: "#fbbf24" }}>
                {pedidos?.filter(p => p.pagamento_status === "pendente").length}
              </div>
              <div className="stat-lbl">Pendentes</div>
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
              <div className="stat-lbl">Receita (pagos)</div>
            </div>
          </div>

          <div style={{ marginTop: 24 }}>
            <div style={{ fontSize: ".7rem", letterSpacing: "2px", textTransform: "uppercase", color: C.muted, marginBottom: 12 }}>
              Quantidade por tamanho (pedidos pagos)
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
                      {["P", "M", "G"].map(t => <th key={t}>{t}</th>)}
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
                          {tamanhos.map(t => {
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

      {/* ABA PEDIDOS */}
      {!loading && aba === "pedidos" && (
        <div className="card">
          <div className="card-title">Pedidos ({pedidosFiltrados?.length || 0})</div>

          {/* Filtro por status */}
          <div className="ptab-row">
            {["Todos", "pago", "pendente", "falhou"].map(s => (
              <button key={s} className={`ptab ${filtroStatus === s ? "active" : ""}`} onClick={() => setFiltroStatus(s)}>
                {s === "Todos" ? "Todos" : STATUS_LABEL[s]?.txt || s}
              </button>
            ))}
          </div>

          {pedidosFiltrados?.length === 0
            ? <div className="empty-state"><span className="em">📋</span>Nenhum pedido encontrado.</div>
            : pedidosFiltrados.map(p => {
              const st = STATUS_LABEL[p.pagamento_status] || STATUS_LABEL.pendente;
              return (
                <div key={p.id} className={`pedido-item ${p.pagamento_status}`}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
                    <div className="pedido-nome">{p.nome}</div>
                    <span
                      className="status-badge"
                      style={{ color: st.cor, borderColor: st.cor, background: `${st.cor}18` }}
                    >
                      {st.txt}
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
                          <span style={{ fontSize: ".72rem", color: C.muted, marginLeft: 6 }}>
                            via {FORMA_LABEL[p.forma_pagamento] || p.forma_pagamento}
                          </span>
                        )}
                      </div>
                    </div>
                    <button className="del-btn" onClick={() => setModalId(p.id)}>
                      🗑 Remover
                    </button>
                  </div>
                </div>
              );
            })
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

  // Detecta retorno do Mercado Pago pela URL
  const params        = new URLSearchParams(window.location.search);
  const statusRetorno = params.get("status"); // aprovado | pendente | falhou

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
            <button className={`tab ${tela === "aluna" ? "active" : ""}`} onClick={() => setTela("aluna")}>Aluna</button>
            <button className={`tab ${tela !== "aluna" ? "active" : ""}`} onClick={() => setTela(adminAuth ? "admin" : "admin-login")}>
              Administração
            </button>
          </div>
        </div>

        {tela === "aluna"       && <AlunaPage statusRetorno={statusRetorno} />}
        {tela === "admin-login" && <AdminLogin onEntrar={() => { setAdminAuth(true); setTela("admin"); }} />}
        {tela === "admin"       && <AdminPage onSair={() => { setAdminAuth(false); setTela("aluna"); }} />}
      </div>
    </>
  );
}
