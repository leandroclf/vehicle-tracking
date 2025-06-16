'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-12 bg-gray-100 dark:bg-gray-900">
      <div className="text-center px-4">
        <h1 className="text-6xl font-bold text-[#00315c] dark:text-blue-400">404</h1>
        <h2 className="text-3xl font-semibold text-gray-800 dark:text-gray-200 mt-4">
          Página não encontrada
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2 mb-6">
          A página que você está procurando não existe ou foi movida.
        </p>
        <Link 
          href="/"
          className="px-6 py-3 bg-[#00315c] hover:bg-[#004680] text-white rounded-md transition-colors duration-300"
        >
          Voltar ao início
        </Link>
      </div>
    </div>
  );
}