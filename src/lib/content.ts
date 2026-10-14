import { getCollection } from 'astro:content';

// Sample entries exist only so the layout can be previewed. While true, they also
// appear on the live site; set to false to keep them in `npm run dev` only.
const SHOW_SAMPLES_IN_PRODUCTION = true;

const visible = ({ data }: { data: { sample: boolean } }) =>
  SHOW_SAMPLES_IN_PRODUCTION || import.meta.env.DEV || !data.sample;

export async function getWork() {
  const entries = await getCollection('work', visible);
  return entries.sort((a, b) => b.data.year - a.data.year);
}
