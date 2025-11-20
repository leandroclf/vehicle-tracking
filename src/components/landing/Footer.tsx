import Link from 'next/link';
import { Github, Twitter, Linkedin } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="bg-slate-950 border-t border-white/5 pt-16 pb-8">
            <div className="container px-4 md:px-6 mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    <div className="col-span-1 md:col-span-1">
                        <Link href="/" className="text-2xl font-bold text-white mb-4 block">
                            YUKZ
                        </Link>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            Tecnologia avançada em rastreamento e telemetria veicular para empresas que buscam eficiência máxima.
                        </p>
                    </div>

                    <div>
                        <h4 className="text-white font-semibold mb-4">Plataforma</h4>
                        <ul className="space-y-2 text-sm text-slate-400">
                            <li><Link href="#" className="hover:text-cyan-400 transition-colors">Funcionalidades</Link></li>
                            <li><Link href="#" className="hover:text-cyan-400 transition-colors">Integrações</Link></li>
                            <li><Link href="#" className="hover:text-cyan-400 transition-colors">Preços</Link></li>
                            <li><Link href="#" className="hover:text-cyan-400 transition-colors">API Docs</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-white font-semibold mb-4">Empresa</h4>
                        <ul className="space-y-2 text-sm text-slate-400">
                            <li><Link href="#" className="hover:text-cyan-400 transition-colors">Sobre Nós</Link></li>
                            <li><Link href="#" className="hover:text-cyan-400 transition-colors">Carreiras</Link></li>
                            <li><Link href="#" className="hover:text-cyan-400 transition-colors">Blog</Link></li>
                            <li><Link href="#" className="hover:text-cyan-400 transition-colors">Contato</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-white font-semibold mb-4">Legal</h4>
                        <ul className="space-y-2 text-sm text-slate-400">
                            <li><Link href="#" className="hover:text-cyan-400 transition-colors">Privacidade</Link></li>
                            <li><Link href="#" className="hover:text-cyan-400 transition-colors">Termos de Uso</Link></li>
                            <li><Link href="#" className="hover:text-cyan-400 transition-colors">Compliance</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-slate-500 text-sm">
                        © {new Date().getFullYear()} Yukz Tracking Systems. Todos os direitos reservados.
                    </p>
                    <div className="flex items-center gap-4">
                        <Link href="#" className="text-slate-400 hover:text-white transition-colors"><Twitter className="w-5 h-5" /></Link>
                        <Link href="#" className="text-slate-400 hover:text-white transition-colors"><Github className="w-5 h-5" /></Link>
                        <Link href="#" className="text-slate-400 hover:text-white transition-colors"><Linkedin className="w-5 h-5" /></Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
