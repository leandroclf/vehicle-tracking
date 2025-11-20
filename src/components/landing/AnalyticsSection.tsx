'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { CheckCircle2 } from 'lucide-react';

const benefits = [
    'Redução de até 30% em custos de combustível',
    'Aumento da vida útil da frota',
    'Prevenção de acidentes e multas',
    'Otimização de rotas em tempo real'
];

export default function AnalyticsSection() {
    return (
        <section className="py-24 bg-slate-900/50 relative overflow-hidden">
            <div className="container px-4 md:px-6 mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="inline-block px-3 py-1 mb-4 rounded-full bg-violet-500/10 border border-violet-500/20">
                            <span className="text-sm font-medium text-violet-400">Intelligence & Analytics</span>
                        </div>
                        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
                            Transforme Dados em <br />
                            <span className="text-violet-400">Decisões Estratégicas</span>
                        </h2>
                        <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                            Não basta apenas saber onde seus veículos estão. O Yukz analisa padrões de condução, consumo e manutenção para entregar insights que economizam dinheiro real.
                        </p>

                        <ul className="space-y-4 mb-8">
                            {benefits.map((benefit, index) => (
                                <li key={index} className="flex items-center gap-3 text-slate-300">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                                    <span>{benefit}</span>
                                </li>
                            ))}
                        </ul>

                        <button className="px-6 py-3 rounded-lg bg-violet-600 text-white font-medium hover:bg-violet-500 transition-colors shadow-[0_0_20px_-5px_rgba(139,92,246,0.5)]">
                            Explorar Relatórios
                        </button>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="relative"
                    >
                        <div className="relative aspect-video rounded-xl overflow-hidden border border-white/10 shadow-2xl bg-slate-950">
                            <Image
                                src="/images/landing/analytics_dashboard_01.webp"
                                alt="Interface de dashboard flutuante exibindo gráficos de consumo e comportamento do motorista"
                                fill
                                className="object-cover"
                            />
                            {/* Overlay Gradient */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-slate-950/50 to-transparent" />
                        </div>

                        {/* Floating Card Effect */}
                        <motion.div
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute -bottom-6 -left-6 bg-slate-900/90 backdrop-blur-md p-4 rounded-lg border border-white/10 shadow-xl max-w-xs"
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-xs font-medium text-slate-400 uppercase">Economia Estimada</span>
                            </div>
                            <div className="text-2xl font-bold text-white">R$ 12.450,00</div>
                            <div className="text-xs text-emerald-400 mt-1">▲ 15% vs. mês anterior</div>
                        </motion.div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
