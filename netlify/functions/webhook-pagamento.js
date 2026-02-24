exports.handler = async (event) => {
  try {
    const params = event.queryStringParameters || {};
    const type   = params.type;
    const dataId = params["data.id"] || params.id;

    if (type !== "payment" || !dataId) {
      return { statusCode: 200, body: "OK" };
    }

    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${dataId}`, {
      headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
    });

    if (!mpResponse.ok) {
      console.error("Erro ao buscar pagamento:", await mpResponse.text());
      return { statusCode: 500, body: "Erro MP" };
    }

    const payment  = await mpResponse.json();
    const pedidoId = payment.external_reference;
    if (!pedidoId) return { statusCode: 200, body: "Sem external_reference" };

    const statusMap = {
      approved:   "pago",
      pending:    "pendente",
      in_process: "pendente",
      rejected:   "falhou",
      cancelled:  "falhou",
      refunded:   "reembolsado",
    };

    const novoStatus     = statusMap[payment.status] || "pendente";
    const formaPagamento = payment.payment_type_id === "bank_transfer" ? "pix"
      : payment.installments > 1 ? "cartao_2x" : "cartao_1x";

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_KEY;

    const updateResponse = await fetch(
      `${supabaseUrl}/rest/v1/pedidos?id=eq.${pedidoId}`,
      {
        method: "PATCH",
        headers: {
          apikey:         supabaseKey,
          Authorization:  `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
          Prefer:         "return=minimal",
        },
        body: JSON.stringify({
          pagamento_status: novoStatus,
          pagamento_id:     String(payment.id),
          forma_pagamento:  formaPagamento,
          valor_pago:       payment.transaction_amount,
        }),
      }
    );

    if (!updateResponse.ok) {
      console.error("Erro Supabase:", await updateResponse.text());
      return { statusCode: 500, body: "Erro Supabase" };
    }

    console.log(`Pedido ${pedidoId} → ${novoStatus}`);
    return { statusCode: 200, body: "OK" };

  } catch (err) {
    console.error("Webhook error:", err);
    return { statusCode: 500, body: err.message };
  }
};