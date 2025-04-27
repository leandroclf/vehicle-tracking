import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-800 to-blue-900 text-white">
      <header className="container mx-auto py-6 px-4 flex justify-between items-center">
        <h1 className="text-3xl font-bold">Yukz</h1>
        <div className="space-x-4">
          <Link 
            href="/login" 
            className="px-4 py-2 rounded-md border border-white hover:bg-white hover:text-blue-900 transition-colors"
          >
            Login
          </Link>
          <Link 
            href="/register" 
            className="px-4 py-2 rounded-md bg-white text-blue-900 hover:bg-blue-100 transition-colors"
          >
            Registrar
          </Link>
        </div>
      </header>
      
      <main className="flex-1 flex items-center">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-10 md:mb-0">
            <h2 className="text-4xl md:text-6xl font-bold mb-6">Controle total da sua frota</h2>
            <p className="text-xl mb-8">Monitore seus veículos em tempo real, configure alertas e gere relatórios detalhados.</p>
            <Link 
              href="/register" 
              className="inline-block px-8 py-3 rounded-md bg-white text-blue-900 font-bold text-lg hover:bg-blue-100 transition-colors"
            >
              Começar agora
            </Link>
          </div>
          <div className="md:w-1/2 flex justify-center">
            <div className="w-full max-w-md h-64 bg-white/10 rounded-lg backdrop-blur-sm border border-white/20 flex items-center justify-center">
              <p className="text-xl font-semibold">Imagem do aplicativo</p>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="container mx-auto py-6 px-4 border-t border-white/20">
        <p className="text-center">© 2025 Yukz - Todos os direitos reservados</p>
      </footer>
    </div>
  );
}

