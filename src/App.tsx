import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  ChevronRight, 
  Server, 
  Globe, 
  CheckCircle2,
  X,
  Zap
} from 'lucide-react';
import { cn } from './lib/utils';
import { PLATFORMS, INSTANCE_TYPES, CloudPlatform, VMInstance } from './types';

const Navbar = () => (
  <nav className="nav-blur">
    <div className="max-w-5xl mx-auto px-8 h-24 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 bg-black rounded-full" />
        <span className="font-bold text-lg tracking-tight">CloudScale</span>
      </div>
      <div className="hidden sm:flex items-center gap-10 text-[13px] font-medium text-black/40">
        <a href="#" className="hover:text-black transition-colors">Инфраструктура</a>
        <a href="#" className="hover:text-black transition-colors">Цены</a>
        <a href="#" className="hover:text-black transition-colors">Поддержка</a>
      </div>
      <button className="pill-button">Войти</button>
    </div>
  </nav>
);

export default function App() {
  const [selectedPlatform, setSelectedPlatform] = useState<string>(PLATFORMS[0].id);
  const [selectedInstance, setSelectedInstance] = useState<string>(INSTANCE_TYPES[0].id);
  const [isDeploying, setIsDeploying] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const currentInstance = useMemo(() => 
    INSTANCE_TYPES.find(i => i.id === selectedInstance)!,
  [selectedInstance]);

  const handleDeploy = () => {
    setIsDeploying(true);
    setTimeout(() => {
      setIsDeploying(false);
      setShowSuccess(true);
    }, 2000);
  };

  return (
    <div className="min-h-screen selection:bg-black selection:text-white">
      <Navbar />
      
      <main className="max-w-3xl mx-auto px-8 pt-48 pb-32">
        {/* Header */}
        <header className="mb-24 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-6xl md:text-8xl font-bold tracking-tight mb-8"
          >
            Облако. <br />
            <span className="text-black/10">Просто.</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-black/40 font-medium"
          >
            Выберите мощность. Запустите мгновенно.
          </motion.p>
        </header>

        {/* Step 1: Platforms */}
        <section className="mb-32">
          <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-black/20 mb-12 text-center">
            01 Провайдер
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            {PLATFORMS.map(platform => (
              <button
                key={platform.id}
                onClick={() => setSelectedPlatform(platform.id)}
                className={cn(
                  "px-8 py-4 rounded-full text-sm font-semibold transition-all duration-500",
                  selectedPlatform === platform.id 
                    ? "bg-black text-white shadow-xl shadow-black/20" 
                    : "bg-[#F5F5F7] text-black/40 hover:text-black"
                )}
              >
                {platform.name}
              </button>
            ))}
          </div>
        </section>

        {/* Step 2: Instances */}
        <section className="mb-32">
          <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-black/20 mb-12 text-center">
            02 Конфигурация
          </div>
          <div className="space-y-4">
            {INSTANCE_TYPES.map(instance => (
              <div
                key={instance.id}
                onClick={() => setSelectedInstance(instance.id)}
                className={cn(
                  "selection-card group cursor-pointer flex items-center justify-between",
                  selectedInstance === instance.id ? "selection-card-active" : "hover:bg-black/[0.02]"
                )}
              >
                <div className="flex items-center gap-6">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500",
                    selectedInstance === instance.id ? "bg-black text-white" : "bg-black/5"
                  )}>
                    <Server className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">{instance.name}</h4>
                    <p className="text-xs font-medium text-black/30 uppercase tracking-widest mt-1">
                      {instance.cpu} Core • {instance.ram} GB RAM
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold tracking-tight">${instance.pricePerHour.toFixed(3)}</div>
                  <div className="text-[10px] font-bold text-black/20 uppercase tracking-widest mt-1">в час</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Action */}
        <section className="text-center">
          <div className="mb-12">
            <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-black/20 mb-4">
              Итого
            </div>
            <div className="text-4xl font-bold tracking-tight">
              ${(currentInstance.pricePerHour * 730).toFixed(2)} <span className="text-lg text-black/20 font-medium">/ месяц</span>
            </div>
          </div>
          
          <button 
            onClick={handleDeploy}
            disabled={isDeploying}
            className="minimal-btn inline-flex items-center gap-3"
          >
            {isDeploying ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>Развернуть <ChevronRight className="w-5 h-5" /></>
            )}
          </button>
          
          <div className="mt-12 flex justify-center gap-8 opacity-20">
            <ShieldCheck className="w-5 h-5" />
            <Globe className="w-5 h-5" />
            <Zap className="w-5 h-5" />
          </div>
        </section>
      </main>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccess && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSuccess(false)}
              className="absolute inset-0 bg-white/90 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative max-w-md w-full text-center"
            >
              <div className="w-20 h-20 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-12 shadow-2xl">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-4xl font-bold mb-6 tracking-tight">Готово.</h2>
              <p className="text-lg text-black/40 mb-12 leading-relaxed">
                Инстанс <strong>{currentInstance.name}</strong> запускается. <br />
                Проверьте почту через пару минут.
              </p>
              <button 
                onClick={() => setShowSuccess(false)}
                className="minimal-btn w-full"
              >
                В панель управления
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="py-20 px-8 border-t border-black/5">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-8 text-[11px] font-bold uppercase tracking-[0.2em] text-black/20">
          <div>© 2024 CLOUDSCALE</div>
          <div className="flex gap-8">
            <a href="#" className="hover:text-black transition-colors">Условия</a>
            <a href="#" className="hover:text-black transition-colors">Приватность</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
