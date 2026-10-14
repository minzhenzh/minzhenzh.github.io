import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Papers and projects, shown together as figure cards on the home page.
// Put each entry's overview figure next to its .md file.
const work = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/work' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      // Short label under the title, e.g. a venue, "Under review", or "Project".
      label: z.string(),
      year: z.number().int(),
      image: image(),
      imageAlt: z.string(),
      links: z
        .object({
          paper: z.url().optional(),
          code: z.url().optional(),
          demo: z.url().optional(),
          video: z.url().optional(),
        })
        .default({}),
      // Placeholder entry for previewing the layout. See src/lib/content.ts.
      sample: z.boolean().default(false),
    }),
});

export const collections = { work };
