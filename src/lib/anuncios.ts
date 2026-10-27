import { marked } from "marked";

// Texto plano del cuerpo de un anuncio, para las previsualizaciones.
// El corte visual con "..." lo hace el CSS (line-clamp); aquí solo se limita el tamaño.
export const extractoDeAnuncio = (markdown: string = "", max = 400): string => {
  const html = marked.parse(markdown, { async: false }) as string;
  const texto = html
    .replace(/<\/(p|h[1-6]|li|blockquote|tr|td|th|div)>|<br\s*\/?>/g, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
  return texto.length > max ? texto.slice(0, max).trimEnd() + "…" : texto;
};
