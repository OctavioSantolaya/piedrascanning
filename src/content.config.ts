import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const proyectos = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/proyectos' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional().default(''),
    featuredImage: z.string(),
    images: z.array(z.string()).default([]),
    date: z.string().optional(),
    order: z.number().default(0),
  }),
});

export const collections = { proyectos };
