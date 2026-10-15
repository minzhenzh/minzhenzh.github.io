import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Papers and projects, shown together as figure cards on the home page. Each
// entry also gets a page at /work/<id>/ rendered from its Markdown body. Put the
// overview figure (and any figures the body uses) next to the .md file.
const work = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/work' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      // Papers: author list in order, shown under the title.
      authors: z.array(z.string()).optional(),
      // One-sentence summary: the project page's lede and meta description.
      summary: z.string().optional(),
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
      // Submitted but not yet accepted: the project page shows a PDF link that
      // can't be clicked, marked "(under review)", until links.paper is set.
      underReview: z.boolean().default(false),
      // Placeholder entry for previewing the layout. See src/lib/content.ts.
      sample: z.boolean().default(false),
    }),
});

export const collections = { work };
