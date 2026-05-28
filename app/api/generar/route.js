const FOOTER =
  "\n\n🚛 Envío GRATIS en el día por moto flex.\n💵 Pagás en efectivo o transferencia al recibir.";

const SYSTEM_PROMPT = `Sos el asistente de ventas de Telmo Herramientas, una ferretería y distribuidora de herramientas en Argentina.

Proceso obligatorio:
1. Buscá el producto en internet usando el SKU y la marca para obtener especificaciones técnicas reales.
2. Analizá la foto del producto.
3. Combiná ambas fuentes y generá la publicación.

Formato exacto de salida (solo esto, sin saludos ni explicaciones):

[Nombre completo del producto - SKU - Marca]

PRECIO: $[precio]

✅ [especificación técnica concreta]
✅ [especificación técnica concreta]
✅ [especificación técnica concreta]
✅ [especificación técnica concreta]
✅ [garantía oficial o diferencial]

Reglas: usá datos reales de la búsqueda web y de la foto. No inventes specs. Sé técnico y concreto.`;

export async function POST(request) {
  const { imageBase64, sku, marca, precio, nota } = await request.json();

  // Strip BOM (﻿) that PowerShell sometimes injects into env vars
  const ANTHROPIC_API_KEY = (process.env.ANTHROPIC_API_KEY || "").replace(/^﻿/, "");

  const userText = `Generá una publicación para WhatsApp para este producto:
- SKU: ${sku}
- Marca: ${marca}
- Precio: ${precio}${nota ? "\n- Nota: " + nota : ""}

Primero buscá el producto "${marca} ${sku}" en internet para obtener las specs técnicas reales. Luego analizá la foto. Finalmente combiná ambas fuentes y generá la publicación con el formato indicado.`;

  const messages = [
    {
      role: "user",
      content: [
        {
          type: "image",
          source: {
            type: "base64",
            media_type: "image/jpeg",
            data: imageBase64,
          },
        },
        { type: "text", text: userText },
      ],
    },
  ];

  const tools = [
    {
      type: "web_search_20250305",
      name: "web_search",
      max_uses: 3,
    },
  ];

  let texto = "";

  // Agentic loop: keep going while the model wants to use tools
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
        model: "claude-sonnet-4-5",
        max_tokens: 2000,
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

    // Add assistant turn to messages
    messages.push({ role: "assistant", content: data.content });

    if (data.stop_reason === "end_turn") {
      texto =
        data.content?.find((b) => b.type === "text")?.text?.trim() ?? "";
      break;
    }

    if (data.stop_reason === "tool_use") {
      // Build tool_results for every tool_use block
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

    // Unexpected stop reason — extract whatever text we have and bail
    texto =
      data.content?.find((b) => b.type === "text")?.text?.trim() ?? "";
    break;
  }

  return Response.json({ publicacion: texto + FOOTER });
}
