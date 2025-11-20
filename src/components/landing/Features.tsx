'use client';

import { motion } from 'framer-motion';
import { MapPin, Lock, BarChart3, Smartphone, Zap, Shield } from 'lucide-react';

const features = [
    {
        icon: MapPin,
        title: 'Rastreamento em Tempo Real',
        description: 'Visualize a localização exata de cada veículo da sua frota com atualização instantânea e histórico de rotas.',
        color: 'text-cyan-400',
        bg: 'bg-cyan-400/10',
        border: 'border-cyan-400/20'
    },
    {
        icon: Lock,
        title: 'Bloqueio Remoto',
        description: 'Em caso de emergência, bloqueie o veículo instantaneamente através do aplicativo ou painel web.',
        color: 'text-red-400',
        bg: 'bg-red-400/10',
        border: 'border-red-400/20'
    },
    {
        icon: BarChart3,
        title: 'Relatórios Avançados',
        description: 'Analise o desempenho da frota, consumo de combustível e comportamento do motorista com gráficos detalhados.',
        color: 'text-violet-400',
        bg: 'bg-violet-400/10',
        border: 'border-violet-400/20'
    },
    {
        icon: Smartphone,
        title: 'App Mobile Nativo',
        description: 'Tenha o controle na palma da mão com nosso aplicativo para iOS e Android. Notificações push em tempo real.',
        color: 'text-emerald-400',
        bg: 'bg-emerald-400/10',
        border: 'border-emerald-400/20'
    },
    {
        icon: Zap,
        title: 'Alertas Inteligentes',
        description: 'Configure alertas para excesso de velocidade, saída de cerca virtual, ignição ligada e muito mais.',
        color: 'text-yellow-400',
        bg: 'bg-yellow-400/10',
        border: 'border-yellow-400/20'
    },
    {
        icon: Shield,
        title: 'Segurança de Dados',
        description: 'Seus dados são criptografados e armazenados com redundância para garantir total segurança e privacidade.',
        color: 'text-blue-400',
        bg: 'bg-blue-400/10',
        border: 'border-blue-400/20'
    }
];

export default function Features() {
    return (
        <section className="py-24 bg-slate-950 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 -left-64 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 -right-64 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
            </div>

            <div className="container px-4 md:px-6 mx-auto relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                        Tecnologia de Ponta para <span className="text-cyan-400">Sua Frota</span>
                    </h2>
                    <p className="text-slate-400 text-lg">
                        Ferramentas poderosas desenhadas para maximizar a eficiência e garantir a segurança da sua operação logística.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className={`group p-6 rounded-2xl bg-slate-900/50 backdrop-blur-sm border border-white/5 hover:border-white/10 transition-all duration-300 hover:-translate-y-1`}
                        >
                            <div className={`w-12 h-12 rounded-lg ${feature.bg} ${feature.border} border flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                                <feature.icon className={`w-6 h-6 ${feature.color}`} />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-cyan-400 transition-colors">
                                {feature.title}
                            </h3>
                            <p className="text-slate-400 leading-relaxed">
                                {feature.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
