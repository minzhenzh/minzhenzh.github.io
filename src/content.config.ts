import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const links = z
  .object({
    paper: z.url().optional(),
    code: z.url().optional(),
    demo: z.url().optional(),
    video: z.url().optional(),
  })
  .default({});

// Publications and other research output. Listed on /research/.
const research = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/research' }),
  schema: z.object({
    title: z.string(),
    authors: z.array(z.string()),
    venue: z.string(),
    year: z.number().int(),
    summary: z.string().optional(),
    links,
    // Show under "Selected work" on the home page.
    featured: z.boolean().default(false),
    // Placeholder entry: visible in `npm run dev` only, never in production builds.
    sample: z.boolean().default(false),
  }),
});

// Projects. Listed on /projects/, each with its own page at /projects/<id>/.
const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    year: z.number().int(),
    tags: z.array(z.string()).default([]),
    links,
    featured: z.boolean().default(false),
    sample: z.boolean().default(false),
  }),
});

export const collections = { research, projects };
