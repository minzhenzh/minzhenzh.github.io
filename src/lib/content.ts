import { getCollection } from 'astro:content';

// Sample entries exist only so the layout can be previewed; drop them from production builds.
const visible = ({ data }: { data: { sample: boolean } }) => import.meta.env.DEV || !data.sample;

export async function getResearch() {
  const entries = await getCollection('research', visible);
  return entries.sort((a, b) => b.data.year - a.data.year);
}

export async function getProjects() {
  const entries = await getCollection('projects', visible);
  return entries.sort((a, b) => b.data.year - a.data.year);
}
