import React from 'react';
import { SectionTitle } from '@/components/ui';
import { ProjectCard } from '@/components/portfolio';
import { projects } from '@/data/projects';

export default function CreationsPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <section className="relative max-w-6xl mx-auto px-6 py-28 lg:py-32">
        <div className="text-center mb-16">
          <SectionTitle
            title="Mes créations"
            subtitle="Accède directement à mes morceaux, vidéos et produits.
            Clique sur un lien pour ouvrir Spotify, YouTube ou Printify."
            centered
          />
        </div>

        <div className="mb-12 grid grid-cols-1 md:grid-cols-3 gap-4">
          {projects.map((project) => {
            const label =
              project.platform === 'spotify'
                ? 'Spotify'
                : project.platform === 'youtube'
                ? 'YouTube'
                : project.platform === 'printify'
                ? 'Printify'
                : project.title;

            return (
              <a
                key={project.slug}
                href={project.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm font-semibold text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                {project.platform === 'spotify' && (
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 168 168"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M84 0C37.6 0 0 37.6 0 84C0 130.4 37.6 168 84 168C130.4 168 168 130.4 168 84C168 37.6 130.4 0 84 0Z"
                      fill="#1DB954"
                    />
                    <path
                      d="M123.2 117.2C118.8 122 112.4 122.4 107.2 118.8C81.2 103.6 52.4 101.6 25.2 108.4C19.2 109.6 13.6 106 12.4 100C11.2 94 14.8 88.4 20.8 87.2C52 80 84.8 82.4 114.4 98C119.6 100.8 122 106 123.2 111.2C124 114 123.6 115.6 123.2 117.2Z"
                      fill="white"
                    />
                    <path
                      d="M128.4 94C123.6 99.2 116 99.6 110.2 96.4C79.6 82 45.6 80.4 14.4 88.8C8.4 90 3.2 85.6 2 79.6C0.8 73.6 5.2 68.4 11.2 67.2C45.2 57.6 82 59.6 113.2 75.6C119.6 78.4 124 84 125.6 89.6C126.4 92.8 126 94.4 125.2 94.8C124.4 95.2 123.6 95.2 122.8 94.8H128.4Z"
                      fill="white"
                    />
                    <path
                      d="M125.6 74.8C119.6 80.4 110 80.8 103.6 77.2C73.2 63.2 37.6 61.6 7.6 69.6C0.8 70.8 -2.4 65.2 0.4 60C3.2 54.8 8.8 51.6 14.8 50.4C49.6 42 87.2 44.4 116.8 60.4C123.2 63.6 127.6 70 129.2 76.8C130 80.4 129.6 82.4 129.2 83C128.8 83.6 128 83.6 127.2 83.2H125.6Z"
                      fill="white"
                    />
                  </svg>
                )}
                {project.platform === 'youtube' && (
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M23.498 6.186c-.275-1.03-1.082-1.84-2.112-2.112C19.738 3.5 12 3.5 12 3.5s-7.738 0-9.386.574c-1.03.272-1.837 1.083-2.112 2.112C0 7.838 0 12 0 12s0 4.162.502 5.814c.275 1.03 1.082 1.84 2.112 2.112C4.262 20.5 12 20.5 12 20.5s7.738 0 9.386-.574c1.03-.272 1.837-1.083 2.112-2.112C24 16.162 24 12 24 12s0-4.162-.502-5.814Z"
                      fill="#FF0000"
                    />
                    <path d="M9.545 15.568l6.545-3.568-6.545-3.568v7.136Z" fill="white" />
                  </svg>
                )}
                {project.platform === 'printify' && (
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 32 32"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M16 2C8.268 2 2 8.268 2 16C2 23.732 8.268 30 16 30C23.732 30 30 23.732 30 16C30 8.268 23.732 2 16 2Z"
                      fill="#004C65"
                    />
                    <path
                      d="M9 11C9 9.343 10.343 8 12 8H20C21.657 8 23 9.343 23 11V21C23 22.657 21.657 24 20 24H12C10.343 24 9 22.657 9 21V11Z"
                      fill="white"
                    />
                    <path
                      d="M12 17C12 15.343 13.343 14 15 14H17C18.657 14 20 15.343 20 17V19C20 20.657 18.657 22 17 22H15C13.343 22 12 20.657 12 19V17Z"
                      fill="#004C65"
                    />
                  </svg>
                )}
                <span>{label}</span>
              </a>
            );
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project) => (
            <ProjectCard
              key={project.slug}
              title={project.title}
              description={project.description}
              href={project.url}
              platform={project.platform}
              fallbackEmoji="🎧"
              tags={project.tags}
            />
          ))}
        </div>

        <div className="text-center mt-16">
          <a
            href="/"
            className="inline-flex items-center gap-2 px-8 py-4 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            Retour à l’accueil
            <span aria-hidden>→</span>
          </a>
        </div>
      </section>
    </div>
  );
}
