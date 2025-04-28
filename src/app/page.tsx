import Link from 'next/link';
import Image from 'next/image';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col yukz-gradient text-white">
      <header className="yukz-container py-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold">Yukz</h1>
        <div className="flex items-center space-x-4">
          <Link 
            href="/login" 
            className="px-4 py-2 rounded-md border border-white hover:bg-white hover:text-[#00315c] transition-colors flex items-center justify-center"
          >
            Login
          </Link>
          <Link 
            href="/register" 
            className="px-4 py-2 rounded-md bg-[#faa631] text-white hover:bg-[#d69028] transition-colors shadow-sm flex items-center justify-center"
          >
            Registrar
          </Link>
        </div>
      </header>
      
      <main className="flex-1 flex items-center">
        <div className="yukz-container flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-10 md:mb-0">
            <h2 className="text-4xl md:text-6xl font-bold mb-6">Controle total da sua frota</h2>
            <p className="text-xl mb-8">Monitore seus veículos em tempo real, configure alertas e gere relatórios detalhados.</p>
            <Link 
              href="/register" 
              className="inline-block px-8 py-3 rounded-md bg-[#faa631] text-white font-bold text-lg hover:bg-[#d69028] transition-colors shadow-sm"
            >
              Começar agora
            </Link>
          </div>
          <div className="md:w-1/2 flex justify-center">
            <div className="w-full max-w-md h-auto bg-white/10 rounded-lg backdrop-blur-sm border border-white/20 flex items-center justify-center overflow-hidden">
              <div className="relative w-full h-full flex items-center justify-center p-4">
                <Image 
                  src="/yukz-app-screenshot.png" 
                  alt="Aplicativo Yukz mostrando mapa com veículos rastreados" 
                  width={320} 
                  height={640} 
                  className="rounded-lg shadow-lg" 
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="yukz-container py-6 border-t border-white/20">
        <p className="text-center">© 2025 Yukz - Todos os direitos reservados</p>
      </footer>
    </div>
  );
}

