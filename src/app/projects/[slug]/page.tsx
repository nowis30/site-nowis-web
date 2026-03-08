import { notFound } from 'next/navigation';
import { projects } from '@/data/projects';
import Link from 'next/link';

interface PageProps {
  params: { slug: string };
}

export const dynamicParams = true;

export default function ProjectPage({ params }: PageProps) {
  const project = projects.find((item) => item.slug === params.slug);
  if (!project) return notFound();

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="flex flex-col lg:flex-row gap-10 items-start">
          <div className="flex-1">
            <h1 className="text-4xl font-bold text-slate-900 mb-6">{project.title}</h1>
            <p className="text-lg text-gray-700 mb-6">{project.description}</p>
            <div className="prose prose-slate max-w-none">
              <p>{project.details}</p>
              <p>
                Besoin d'un exemple concret ? <Link href="#contact" className="text-primary-600 font-semibold hover:underline">Contacte-moi</Link> et je t'envoie un extrait sur mesure.
              </p>
            </div>

            <div className="mt-10">
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-800 rounded-xl hover:bg-gray-200 transition"
              >
                ← Retour à l’accueil
              </Link>
            </div>
          </div>

          <div className="w-full lg:w-1/3">
            <div className="rounded-3xl overflow-hidden shadow-lg">
              <img
                src={project.image ?? '/hero.jpg'}
                alt={project.title}
                className="w-full h-64 object-cover"
              />
            </div>
            {project.tags && (
              <div className="mt-6 flex flex-wrap gap-2">
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
