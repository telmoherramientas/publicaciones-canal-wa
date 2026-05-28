# Telmo Herramientas · Generador de Publicaciones

Herramienta interna para generar publicaciones de WhatsApp a partir de una foto y datos básicos del producto.

## Cómo deployar en Vercel

### 1. Subir a GitHub
- Creá un repositorio privado en github.com
- Subí todos estos archivos

### 2. Conectar con Vercel
- Entrá a vercel.com y conectá tu cuenta de GitHub
- Importá el repositorio
- En "Settings > Environment Variables" agregá:
  - **ANTHROPIC_API_KEY** = tu API key de Anthropic (la conseguís en console.anthropic.com)

### 3. Deploy
- Vercel detecta Next.js automáticamente
- Hacé clic en Deploy y listo

## Uso local (desarrollo)
```bash
npm install
cp .env.example .env.local
# Completá ANTHROPIC_API_KEY en .env.local
npm run dev
```
