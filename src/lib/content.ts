import { getCollection } from 'astro:content';

// Sample entries exist only so the layout can be previewed. While true, they also
// appear on the live site; set to false to keep them in `npm run dev` only.
const SHOW_SAMPLES_IN_PRODUCTION = true;

// Hidden entries (`hidden: true`) stay in `npm run dev` but never reach the live site.
const visible = ({ data }: { data: { sample: boolean; hidden: boolean } }) =>
  import.meta.env.DEV || (!data.hidden && (SHOW_SAMPLES_IN_PRODUCTION || !data.sample));

// Newest year first; within a year, entries with a later `date` come first.
const time = (entry: { data: { date?: Date } }) => entry.data.date?.getTime() ?? 0;

export async function getWork() {
  const entries = await getCollection('work', visible);
  return entries.sort((a, b) => b.data.year - a.data.year || time(b) - time(a));
}
