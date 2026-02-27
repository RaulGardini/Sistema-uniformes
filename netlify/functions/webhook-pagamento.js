exports.handler = async (event) => {
  // ── Apenas aceita POST (webhooks do MP são POST) ──
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    // ── O MP envia dados no body (POST) ou query params ──
    let type, dataId;

    // Tenta extrair do body primeiro (formato mais recente do MP)
    if (event.body) {
      try {
        const body = JSON.parse(event.body);
        type   = body.type || body.topic;
        dataId = body.data?.id || body.id;
      } catch {}
    }

    // Fallback: query params (formato antigo)
    if (!type || !dataId) {
      const params = event.queryStringParameters || {};
      type   = type || params.type || params.topic;
      dataId = dataId || params["data.id"] || params.id;
    }

    // Ignora notificações que não são de pagamento
    if (type !== "payment" || !dataId) {
      return { statusCode: 200, body: "OK - ignorado" };
    }

    // ── SEGURANÇA: Busca o pagamento direto na API do MP ──
    // Isso garante que os dados são reais e não forjados
    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${dataId}`, {
      headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
    });

    if (!mpResponse.ok) {
      const errText = await mpResponse.text();
      console.error(`Erro ao buscar pagamento ${dataId}:`, errText);
      // Retorna 200 para o MP não reenviar se o pagamento não existe
      if (mpResponse.status === 404) return { statusCode: 200, body: "Pagamento não encontrado" };
      return { statusCode: 500, body: "Erro MP" };
    }

    const payment  = await mpResponse.json();
    const pedidoId = payment.external_reference;

    if (!pedidoId) {
      console.log(`Pagamento ${dataId} sem external_reference - ignorando`);
      return { statusCode: 200, body: "Sem external_reference" };
    }

    const statusMap = {
      approved:    "pago",
      pending:     "pendente",
      in_process:  "pendente",
      rejected:    "falhou",
      cancelled:   "falhou",
      refunded:    "reembolsado",
      charged_back: "reembolsado",
    };

    const novoStatus = statusMap[payment.status] || "pendente";

    // ── SEGURANÇA: Usa service key (não a anon key exposta no frontend) ──
    const supabaseUrl        = process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

    // ── IDEMPOTÊNCIA: Verifica se o pedido já foi pago antes de atualizar ──
    const checkRes = await fetch(
      `${supabaseUrl}/rest/v1/pedidos?id=eq.${pedidoId}&select=pagamento_status,pagamento_id`,
      {
        headers: {
          apikey:        supabaseServiceKey,
          Authorization: `Bearer ${supabaseServiceKey}`,
        },
      }
    );

    if (checkRes.ok) {
      const [pedidoAtual] = await checkRes.json();

      // Se já está pago, não sobrescreve (evita reprocessamento e ataques)
      if (pedidoAtual?.pagamento_status === "pago" && novoStatus !== "reembolsado") {
        console.log(`Pedido ${pedidoId} já está pago - ignorando webhook duplicado`);
        return { statusCode: 200, body: "Já processado" };
      }
    }

    // ── Determina a forma de pagamento ──
    const formaPagamento = payment.payment_type_id === "bank_transfer" ? "pix"
      : payment.installments > 1 ? "cartao_2x" : "cartao_1x";

    // ── Atualiza o pedido no Supabase ──
    const updateResponse = await fetch(
      `${supabaseUrl}/rest/v1/pedidos?id=eq.${pedidoId}`,
      {
        method: "PATCH",
        headers: {
          apikey:         supabaseServiceKey,
          Authorization:  `Bearer ${supabaseServiceKey}`,
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

    console.log(`Pedido ${pedidoId} → ${novoStatus} | Pagamento: ${payment.id} | Forma: ${formaPagamento} | Valor: ${payment.transaction_amount}`);
    return { statusCode: 200, body: "OK" };

  } catch (err) {
    console.error("Webhook error:", err);
    return { statusCode: 500, body: err.message };
  }
};