import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export const VictoryConfetti = () => {
  const [particles, setParticles] = useState<any[]>([]);

  useEffect(() => {
    const colors = ['#facc15', '#34d399', '#60a5fa', '#f87171', '#c084fc', '#fb923c', '#e879f9'];
    const p = Array.from({ length: 80 }).map((_, i) => {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * 300 + 50;
      
      return {
        id: i,
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 6,
        rotation: Math.random() * 360,
        delay: Math.random() * 0.1,
      };
    });
    setParticles(p);
  }, []);

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[100] overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 0, x: 0, y: 0, scale: 0, rotate: 0 }}
          animate={{
            opacity: [0, 1, 1, 0],
            x: p.x,
            y: [0, p.y - 100, p.y + 150],
            scale: [0, 1, 1, 0.5],
            rotate: p.rotation + 360,
          }}
          transition={{
            duration: 2.5 + Math.random(),
            delay: p.delay,
            ease: "easeOut",
            times: [0, 0.1, 0.6, 1]
          }}
          className="absolute"
          style={{
            width: p.size,
            height: p.size * (Math.random() > 0.5 ? 1 : 0.4),
            backgroundColor: p.color,
            borderRadius: Math.random() > 0.3 ? '2px' : '50%',
          }}
        />
      ))}
    </div>
  );
};
