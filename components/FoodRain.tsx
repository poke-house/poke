import React, { useEffect, useRef } from 'react';

const EASTER_EGG_EMOJIS = ['🥑','🍅','🫛','🥕','🫒','🌽','🧅','🥦','🍓','🥭','🍍','🍣','🍤','🍪','🥗','🧀','🥚','🥔'];

export const FoodRain = ({ trigger, quantity = 1 }: { trigger: number; quantity?: number }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particlesRef = useRef<any[]>([]);

    useEffect(() => {
        if (!trigger || trigger === 0) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const newParticles = [];
        for (let i = 0; i < quantity; i++) {
            const size = 24 + Math.random() * 16;
            newParticles.push({
                x: Math.random() * (canvas.width - size), // Ensure it spawns within width
                y: -50,
                vx: (Math.random() - 0.5) * 3, // Reduced horizontal speed slightly
                vy: 1 + Math.random(), // Reduced initial vertical speed (was 2 + ...)
                gravity: 0.02, // Very low positive gravity for slow fall
                emoji: EASTER_EGG_EMOJIS[Math.floor(Math.random() * EASTER_EGG_EMOJIS.length)],
                size: size,
                life: 1.0
            });
        }
        particlesRef.current = [...particlesRef.current, ...newParticles];
    }, [trigger, quantity]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        
        const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
        window.addEventListener("resize", resize);
        resize();
        
        let animId: number;
        const render = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particlesRef.current = particlesRef.current.filter(p => p.y < canvas.height + 100);
            particlesRef.current.forEach(p => {
                p.y += p.vy;
                p.vy += p.gravity;
                p.x += p.vx;

                // Boundary checks to keep items within screen width
                // If it hits the left wall, position at 0 and reverse velocity
                if (p.x <= 0) {
                    p.x = 0;
                    p.vx *= -1;
                } 
                // If it hits the right wall (width - size), position at max and reverse velocity
                else if (p.x >= canvas.width - p.size) {
                    p.x = canvas.width - p.size;
                    p.vx *= -1;
                }

                ctx.font = `${p.size}px sans-serif`;
                ctx.fillText(p.emoji, p.x, p.y);
            });
            if(particlesRef.current.length > 0) animId = requestAnimationFrame(render);
        };
        render();
        return () => { window.removeEventListener("resize", resize); cancelAnimationFrame(animId); };
    }, [trigger]);

    return <canvas ref={canvasRef} className="fixed inset-0 w-full h-full pointer-events-none z-50" />;
};