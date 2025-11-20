'use client';

import { motion } from 'framer-motion';
import { Satellite, Radio, Server, Smartphone } from 'lucide-react';

const steps = [
    {
        icon: Satellite,
        title: '1. Coleta de Dados',
        description: 'O rastreador instalado no veículo capta coordenadas GPS e dados de telemetria em tempo real.',
        color: 'text-cyan-400',
        bg: 'bg-cyan-500/20',
        line: 'from-cyan-500'
    },
    {
        icon: Radio,
        title: '2. Transmissão',
        description: 'Os dados são transmitidos via rede celular (4G/LTE) ou satelital para nossos servidores seguros.',
        color: 'text-violet-400',
        bg: 'bg-violet-500/20',
        line: 'from-violet-500'
    },
    {
        icon: Server,
        title: '3. Processamento',
        description: 'Nossa nuvem processa milhões de pontos de dados instantaneamente, aplicando regras de negócio e alertas.',
        color: 'text-emerald-400',
        bg: 'bg-emerald-500/20',
        line: 'from-emerald-500'
    },
    {
        icon: Smartphone,
        title: '4. Visualização',
        description: 'Você recebe todas as informações no seu painel web ou aplicativo mobile, com alertas imediatos.',
        color: 'text-white',
        bg: 'bg-white/10',
        line: 'from-white'
    }
];

export default function HowItWorks() {
    return (
        <section className="py-24 bg-slate-950 relative">
            <div className="container px-4 md:px-6 mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                        Como Funciona o <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-500">Ecossistema Yukz</span>
                    </h2>
                    <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                        Uma infraestrutura robusta e invisível que conecta sua frota à sua gestão em milissegundos.
                    </p>
                </div>

                <div className="relative">
                    {/* Connecting Line (Desktop) */}
                    <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-slate-800 -translate-y-1/2 z-0" />

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative z-10">
                        {steps.map((step, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.2 }}
                                className="flex flex-col items-center text-center group"
                            >
                                <div className={`w-20 h-20 rounded-2xl ${step.bg} backdrop-blur-md border border-white/10 flex items-center justify-center mb-6 relative z-10 transition-transform duration-300 group-hover:scale-110 shadow-[0_0_30px_-10px_rgba(0,0,0,0.5)]`}>
                                    <step.icon className={`w-8 h-8 ${step.color}`} />
                                    {/* Pulse Effect */}
                                    <div className={`absolute inset-0 rounded-2xl ${step.bg} opacity-0 group-hover:animate-ping`} />
                                </div>

                                <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                                <p className="text-slate-400 text-sm leading-relaxed">
                                    {step.description}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
