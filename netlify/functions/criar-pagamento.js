exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { pedidoId, valor, forma, nomeAluna } = JSON.parse(event.body);

    const valorFinal = forma === "cartao_2x"
      ? parseFloat((valor * 1.06).toFixed(2))
      : parseFloat(Number(valor).toFixed(2));

    const siteUrl  = process.env.URL || "http://localhost:8888";
    const isTest   = process.env.MP_ENV !== "production";

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

    const preference = {
      items: [{
        title:       "Fardamento Studio de Dança",
        quantity:    1,
        unit_price:  valorFinal,
        currency_id: "BRL",
      }],
      payer:              { name: nomeAluna },
      external_reference: pedidoId,
      back_urls: {
        success: `${siteUrl}/?status=aprovado&pedido_id=${pedidoId}`,
        failure: `${siteUrl}/?status=falhou&pedido_id=${pedidoId}`,
        pending: `${siteUrl}/?status=pendente&pedido_id=${pedidoId}`,
      },
      auto_return:          "approved",
      notification_url:     `${siteUrl}/.netlify/functions/webhook-pagamento`,
      payment_methods:      paymentMethods,
      statement_descriptor: "STUDIO DANCA",
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

    // Em produção usa init_point (real), em teste usa sandbox_init_point
    const checkoutUrl = data.init_point;

    console.log(`Modo: ${isTest ? "TESTE" : "PRODUÇÃO"} | URL: ${checkoutUrl}`);

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