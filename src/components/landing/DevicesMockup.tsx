'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

export default function DevicesMockup() {
    return (
        <section className="py-24 bg-slate-950 relative overflow-hidden">
            <div className="container px-4 md:px-6 mx-auto text-center">
                <div className="mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                        Controle Total <span className="text-cyan-400">Onde Você Estiver</span>
                    </h2>
                    <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                        Acesse a plataforma via web ou aplicativo mobile. Uma experiência unificada e fluida em qualquer dispositivo.
                    </p>
                </div>

                <div className="relative max-w-5xl mx-auto h-[400px] md:h-[600px]">
                    {/* Desktop Mockup */}
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="absolute left-1/2 top-0 -translate-x-1/2 w-[90%] md:w-[80%] h-full z-10"
                    >
                        <div className="relative w-full h-[80%] bg-slate-900 rounded-t-xl border-t border-x border-slate-700 shadow-2xl overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-8 bg-slate-800 flex items-center px-4 gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500" />
                                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                                <div className="w-3 h-3 rounded-full bg-green-500" />
                            </div>
                            <div className="relative w-full h-[calc(100%-2rem)] mt-8 bg-slate-950">
                                <Image
                                    src="/images/landing/analytics_dashboard_01.webp"
                                    alt="Dashboard Desktop"
                                    fill
                                    className="object-cover opacity-90"
                                />
                            </div>
                        </div>
                    </motion.div>

                    {/* Mobile Mockup */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        className="absolute right-[5%] md:right-[10%] bottom-0 w-[120px] md:w-[200px] h-[240px] md:h-[400px] z-20"
                    >
                        <div className="relative w-full h-full bg-slate-900 rounded-[2rem] border-4 border-slate-800 shadow-2xl overflow-hidden">
                            <Image
                                src="/images/landing/mobile_app_01.webp"
                                alt="App Mobile"
                                fill
                                className="object-cover"
                            />
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
