import Link from 'next/link';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import Container from '@/components/ui/Container';
import Flex from '@/components/ui/Flex';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col yukz-gradient text-white">
      <header className="py-6">
        <Container className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Yukz</h1>
          <Flex className="items-center space-x-4">
            <Link href="/login">
              <Button variant="secondary" className="border border-white hover:bg-white hover:text-[#00315c]">
                Login
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="warning" className="bg-[#faa631] hover:bg-[#d69028]">
                Registrar
              </Button>
            </Link>
          </Flex>
        </Container>
      </header>
      
      <main className="flex-1 flex items-center">
        <Container>
          <Flex className="flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-10 md:mb-0">
              <h2 className="text-4xl md:text-6xl font-bold mb-6">Controle total da sua frota</h2>
              <p className="text-xl mb-8">Monitore seus veículos em tempo real, configure alertas e gere relatórios detalhados.</p>
              <Link href="/register">
                <Button variant="warning" size="lg" className="bg-[#faa631] hover:bg-[#d69028] shadow-sm">
                  Começar agora
                </Button>
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
          </Flex>
        </Container>
      </main>
      
      <footer className="py-6 border-t border-white/20">
        <Container>
          <p className="text-center">© 2025 Yukz - Todos os direitos reservados</p>
        </Container>
      </footer>
    </div>
  );
}

