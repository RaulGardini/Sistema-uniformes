exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { pedidoId, senha } = JSON.parse(event.body);

    if (!senha || senha !== process.env.ADMIN_SENHA) {
      return { statusCode: 401, body: JSON.stringify({ error: "Não autorizado" }) };
    }

    if (!pedidoId) {
      return { statusCode: 400, body: JSON.stringify({ error: "pedidoId obrigatório" }) };
    }

    const supabaseUrl        = process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

    const res = await fetch(
      `${supabaseUrl}/rest/v1/pedidos?id=eq.${pedidoId}`,
      {
        method: "PATCH",
        headers: {
          apikey:         supabaseServiceKey,
          Authorization:  `Bearer ${supabaseServiceKey}`,
          "Content-Type": "application/json",
          Prefer:         "return=minimal",
        },
        body: JSON.stringify({ pagamento_status: "pago" }),
      }
    );

    if (!res.ok) {
      const txt = await res.text();
      console.error("Erro Supabase ao confirmar:", txt);
      return { statusCode: 500, body: JSON.stringify({ error: "Erro ao confirmar pedido" }) };
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error("Erro confirmar-pedido-lojinha:", err.message);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
