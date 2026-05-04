import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const anuncios = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/anuncios" }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date().optional(),
    image: z.string().optional(),
    summary: z.string(),
  }),
});

const paginas = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/content/paginas" }),
  schema: z.object({
    title: z.string(),
    direccion: z.string().optional(),
    telefono: z.string().optional(),
    email: z.string().optional(),
    mapa: z.string().optional(),
    eventos: z
      .array(
        z.object({
          dia: z.coerce.number(),
          mes: z.coerce.number(),
          texto: z.string(),
          tipo: z.string(),
        })
      )
      .optional(),
  }),
});

export const collections = { anuncios, paginas };
