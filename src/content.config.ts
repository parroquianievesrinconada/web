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
    parroquiaNombre: z.string().optional(),
    direccion: z.string().optional(),
    email: z.string().optional(),
    mapa: z.string().optional(),
    misas: z
      .object({
        filas: z.array(
          z.object({
            dias: z.string(),
            horario: z.string(),
          })
        ),
      })
      .optional(),
    confesiones: z
      .object({
        texto: z.string(),
      })
      .optional(),
    despacho: z
      .object({
        filas: z.array(
          z.object({
            dias: z.string(),
            horario: z.string(),
          })
        ),
        nota: z.string().optional(),
      })
      .optional(),
    prebautismal: z
      .object({
        filas: z.array(
          z.object({
            dias: z.string(),
            horario: z.string(),
          })
        ),
      })
      .optional(),
    intro: z.string().optional(),
    informacion: z.string().optional(),
    requisitos: z.string().optional(),
    catequesis: z.string().optional(),
    nota: z.string().optional(),
    visionGeneral: z.string().optional(),
    catequesisAdultos: z.string().optional(),
    pasos: z
      .array(
        z.object({
          titulo: z.string(),
          descripcion: z.string().optional(),
        })
      )
      .optional(),
  }),
});

export const collections = { anuncios, paginas };
