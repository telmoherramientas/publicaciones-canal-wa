const FOOTER =
  "\n\n🚛 Envío GRATIS en el día por moto flex.\n💵 Pagás en efectivo o transferencia al recibir.";

const SYSTEM_PROMPT = `Sos el asistente de ventas de Telmo Herramientas, una ferretería en Argentina.

Tarea: buscá el producto en internet por SKU y marca, luego generá la publicación.

FORMATO DE SALIDA — seguí este ejemplo al pie de la letra:

Lijadora de Banda 1010W EPLS0331 - Emtop

*PRECIO: $85.000*

✅ Motor 1010W / 220V
✅ Velocidad 300 m/min
✅ Banda abrasiva 75 x 533 mm
✅ Peso 3.8 kg
✅ 12 meses de garantía oficial

REGLA ABSOLUTA: Siempre terminás respondiendo con la publicación en el formato indicado. Nunca pedís confirmación, nunca hacés preguntas, nunca decís que no encontraste info. Si la búsqueda no devuelve specs exactas, usás lo que encontraste + lo que se deduce del nombre del producto.

Reglas de formato:
1. El título siempre es: Nombre del producto SKU - Marca (en ese orden exacto)
2. Mínimo 4 specs con datos de la búsqueda o deducibles del nombre (potencia, medidas, velocidad, voltaje, peso, materiales)
3. Si no hay número exacto, describí la spec de forma factual: "Autonivelación hasta ±4°", "Mandril 13 mm"
4. El último spec es la garantía si la encontrás. Si no, poné 4 specs técnicas.
5. NUNCA dejes un ✅ vacío
6. PROHIBIDO: "ideal para", "gran rendimiento", "perfecta para", "alta durabilidad" o cualquier frase de marketing
7. Respondé SOLO con la publicación, sin texto previo ni explicaciones`;

function parsePrice(str) {
  return parseInt((str || "0").replace(/\D/g, ""), 10) || 0;
}

export async function POST(request) {
  const { sku, marca, precio, nota, umbral, url } = await request.json();

  const precioNum = parsePrice(precio);
  const umbralNum = parsePrice(umbral || "65000");
  const footer = precioNum >= umbralNum ? FOOTER : "";

  const ANTHROPIC_API_KEY = (process.env.ANTHROPIC_API_KEY || "").replace(/^﻿/, "");

  const userText = `Generá una publicación para WhatsApp para este producto:
- SKU: ${sku}
- Marca: ${marca}
- Precio: ${precio}${nota ? "\n- Nota: " + nota : ""}

${url
    ? `Entrá a esta URL y extraé las especificaciones técnicas del producto: ${url}`
    : `Buscá "${sku} ${marca}" en MercadoLibre Argentina para obtener las especificaciones técnicas.`}

Luego generá la publicación en el formato indicado, empezando directamente con el título.`;

  const messages = [{ role: "user", content: userText }];

  const tools = [{ type: "web_search_20250305", name: "web_search", max_uses: 3 }];

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
        model: "claude-sonnet-4-5",
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        tools,
        messages,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("[generar] Anthropic API error:", JSON.stringify(data));
      return Response.json(
        { error: data.error?.message || "Error al llamar a la API" },
        { status: 500 }
      );
    }

    console.log("[generar] stop_reason:", data.stop_reason, "| content types:", data.content?.map((b) => b.type));

    messages.push({ role: "assistant", content: data.content });

    if (data.stop_reason === "end_turn") {
      const raw = (data.content?.find((b) => b.type === "text")?.text ?? "").replace(/\n---+\n?/g, "");
      // Drop any intro paragraph — find the line containing the SKU (the real title)
      const lines = raw.split("\n");
      const titleIdx = lines.findIndex((l) => l.includes(sku));
      texto = (titleIdx > 0 ? lines.slice(titleIdx).join("\n") : raw).trim();
      console.log("[generar] output:", texto.slice(0, 120));
      break;
    }

    if (data.stop_reason === "tool_use") {
      const toolResults = data.content
        .filter((b) => b.type === "tool_use")
        .map((b) => ({ type: "tool_result", tool_use_id: b.id, content: b.content ?? [] }));
      messages.push({ role: "user", content: toolResults });
      continue;
    }

    // Unexpected stop reason
    console.error("[generar] Unexpected stop_reason:", data.stop_reason);
    texto = (data.content?.find((b) => b.type === "text")?.text ?? "").trim();
    break;
  }

  return Response.json({ publicacion: texto + footer });
}
