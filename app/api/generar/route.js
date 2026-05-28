const FOOTER =
  "\n\n🚛 Envío GRATIS en el día por moto flex.\n💵 Pagás en efectivo o transferencia al recibir.";

const SYSTEM_PROMPT = `Sos el asistente de ventas de Telmo Herramientas, una ferretería y distribuidora de herramientas en Argentina.

Proceso obligatorio:
1. Buscá el producto en internet por SKU y marca para obtener especificaciones técnicas reales.
2. Generá la publicación con los datos encontrados.

Formato exacto de salida (solo esto, sin saludos ni explicaciones):

[Nombre completo del producto - SKU - Marca]

PRECIO: $[precio]

✅ [especificación técnica concreta]
✅ [especificación técnica concreta]
✅ [especificación técnica concreta]
✅ [especificación técnica concreta]
✅ [garantía oficial o diferencial]

Reglas estrictas:
- Usá SOLO datos reales de la búsqueda web (potencia en W, voltaje, RPM, medidas, peso, materiales, etc.)
- PROHIBIDO: frases como "ideal para trabajos pesados", "gran rendimiento", "perfecta para profesionales", "máxima potencia", "excelente calidad" o cualquier adjetivo de marketing
- Cada ✅ debe tener un número, unidad o dato concreto. Si no encontrás el dato, no lo pongas.`;

export async function POST(request) {
  const { sku, marca, precio, nota } = await request.json();

  // Strip BOM that PowerShell sometimes injects into env vars
  const ANTHROPIC_API_KEY = (process.env.ANTHROPIC_API_KEY || "").replace(/^﻿/, "");

  const userText = `Generá una publicación para WhatsApp para este producto:
- SKU: ${sku}
- Marca: ${marca}
- Precio: ${precio}${nota ? "\n- Nota: " + nota : ""}

Buscá "${marca} ${sku}" en internet para obtener las especificaciones técnicas reales y generá la publicación con el formato indicado.`;

  const messages = [{ role: "user", content: userText }];

  const tools = [
    {
      type: "web_search_20250305",
      name: "web_search",
      max_uses: 2,
    },
  ];

  let texto = "";

  while (true) {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "anthropic-beta": "web-search-2025-03-05",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5",
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        tools,
        messages,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Anthropic error:", data);
      return Response.json(
        { error: data.error?.message || "Error al llamar a la API" },
        { status: 500 }
      );
    }

    messages.push({ role: "assistant", content: data.content });

    if (data.stop_reason === "end_turn") {
      texto = data.content?.find((b) => b.type === "text")?.text?.trim() ?? "";
      break;
    }

    if (data.stop_reason === "tool_use") {
      const toolResults = data.content
        .filter((b) => b.type === "tool_use")
        .map((b) => ({
          type: "tool_result",
          tool_use_id: b.id,
          content: b.content ?? [],
        }));
      messages.push({ role: "user", content: toolResults });
      continue;
    }

    texto = data.content?.find((b) => b.type === "text")?.text?.trim() ?? "";
    break;
  }

  return Response.json({ publicacion: texto + FOOTER });
}
