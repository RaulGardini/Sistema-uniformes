const PRECOS = {
  "Blusa":         60.00,
  "Regata":        30.00,
  "Short":         60.00,
  "Calça Moletom": 90.00,
  "Blusa Moletom": 90.00,
};

function calcTotal(pecas) {
  let total = 0;
  for (const [nome, preco] of Object.entries(PRECOS)) {
    const tamanhos = pecas?.[nome]?.tamanhos || {};
    for (const qty of Object.values(tamanhos)) {
      total += (qty || 0) * preco;
    }
  }
  return total;
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { pedidoId, forma, nomeAluna, email, cpf } = JSON.parse(event.body);

    // Busca o pedido no Supabase para calcular o valor no servidor
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_KEY;

    const pedidoRes = await fetch(
      `${supabaseUrl}/rest/v1/pedidos?id=eq.${pedidoId}&select=pecas`,
      {
        headers: {
          apikey:        supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    );

    if (!pedidoRes.ok) throw new Error("Erro ao buscar pedido");

    const [pedido] = await pedidoRes.json();
    if (!pedido) throw new Error("Pedido não encontrado");

    const totalBase  = calcTotal(pedido.pecas);
    if (totalBase <= 0) throw new Error("Pedido sem itens");

    const totalFinal = parseFloat((forma === "pix" ? totalBase : totalBase * 1.05).toFixed(2));
    const siteUrl    = process.env.URL || "http://localhost:8888";

    let paymentMethods = {};
    if (forma === "pix") {
      paymentMethods = {
        excluded_payment_types: [
          { id: "credit_card"  },
          { id: "debit_card"   },
          { id: "ticket"       },
          { id: "prepaid_card" },
          { id: "atm"          },
        ],
      };
    } else {
      paymentMethods = {
        excluded_payment_types: [
          { id: "ticket"        },
          { id: "bank_transfer" },
          { id: "atm"           },
        ],
        installments:         forma === "cartao_2x" ? 2 : 1,
        default_installments: forma === "cartao_2x" ? 2 : 1,
      };
    }

    // Separa primeiro nome e sobrenome para o payer
    const partes    = (nomeAluna || "").trim().split(/\s+/);
    const firstName = partes[0] || "";
    const lastName  = partes.slice(1).join(" ") || firstName;

    const preference = {
      items: [{
        title:       "Fardamento TP 2026",
        quantity:    1,
        unit_price:  totalFinal,
        currency_id: "BRL",
      }],
      payer: {
        name:    firstName,
        surname: lastName,
        email:   email || undefined,
        identification: cpf ? {
          type:   "CPF",
          number: cpf.replace(/\D/g, ""),
        } : undefined,
      },
      external_reference: pedidoId,
      back_urls: {
        success: `${siteUrl}/?collection_status=approved`,
        failure: `${siteUrl}/?collection_status=rejected`,
        pending: `${siteUrl}/?collection_status=pending`,
      },
      notification_url:     `${siteUrl}/.netlify/functions/webhook-pagamento`,
      payment_methods:      paymentMethods,
      statement_descriptor: "FARDAMENTO TP",
    };

    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method:  "POST",
      headers: {
        Authorization:  `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(preference),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("MP Error:", JSON.stringify(data));
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Erro MP", detail: data }),
      };
    }

    const checkoutUrl = data.init_point;
    console.log(`Preferência criada | Pedido: ${pedidoId} | Valor: ${totalFinal} | Email: ${email || "N/A"}`);

    return {
      statusCode: 200,
      headers:    { "Content-Type": "application/json" },
      body:       JSON.stringify({ checkout_url: checkoutUrl, preference_id: data.id }),
    };
  } catch (err) {
    console.error("Function error:", err.message);
    return {
      statusCode: 500,
      body:       JSON.stringify({ error: err.message }),
    };
  }
};