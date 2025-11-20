'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function CtaSection() {
    return (
        <section className="py-24 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-slate-950 z-0" />

            {/* Glow Effects */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-4xl bg-cyan-500/5 blur-3xl pointer-events-none" />

            <div className="container px-4 md:px-6 mx-auto relative z-10 text-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="max-w-3xl mx-auto"
                >
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                        Pronto para assumir o controle?
                    </h2>
                    <p className="text-xl text-slate-400 mb-10">
                        Junte-se a centenas de empresas que já otimizaram suas frotas com o Yukz.
                        Segurança, economia e eficiência em uma única plataforma.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            href="/register"
                            className="w-full sm:w-auto px-8 py-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg transition-all transform hover:scale-105 shadow-[0_0_20px_-5px_rgba(34,211,238,0.6)] flex items-center justify-center gap-2"
                        >
                            Começar Agora <ArrowRight className="w-5 h-5" />
                        </Link>
                        <button className="w-full sm:w-auto px-8 py-4 bg-transparent border border-slate-700 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors">
                            Falar com Consultor
                        </button>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
