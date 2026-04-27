// Ensure the DOM is fully loaded before running GSAP animations
document.addEventListener("DOMContentLoaded", (event) => {
    // Register the ScrollTrigger plugin
    gsap.registerPlugin(ScrollTrigger);

    // --- 1. Initialize Lenis (Smooth Scrolling alternative for ScrollSmoother) ---
    // ScrollSmoother from GSAP often requires a premium Club GreenSock license and 
    // redirects local execution on file:// protocols. Lenis provides the exact same 
    // smooth scrolling effect completely free and seamlessly integrates with ScrollTrigger.
    if (typeof Lenis !== 'undefined') {
        const lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            direction: 'vertical',
            gestureDirection: 'vertical',
            smooth: true,
            mouseMultiplier: 1,
            smoothTouch: false,
            touchMultiplier: 2,
            infinite: false,
        });

        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add((time) => {
            lenis.raf(time * 1000);
        });
        gsap.ticker.lagSmoothing(0);

        // --- Smooth Anchor Internal Navigation using Lenis ---
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                const targetId = this.getAttribute('href');
                if (targetId === '#') return;

                const target = document.querySelector(targetId);
                if (target) {
                    e.preventDefault();
                    lenis.scrollTo(target, { duration: 1.5, offset: -30 });
                }
            });
        });
    }

    // --- 2. Custom Cursor Follower ---
    const cursor = document.querySelector('.cursor-follower');
    if (window.matchMedia("(pointer: fine)").matches && cursor) {
        let mouseX = 0, mouseY = 0;
        // Setup movement with 0.15s duration for a slightly delayed "trail" effect
        let xTo = gsap.quickTo(cursor, "x", { duration: 0.15, ease: "power3" }),
            yTo = gsap.quickTo(cursor, "y", { duration: 0.15, ease: "power3" });

        window.addEventListener("mousemove", e => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            xTo(mouseX);
            yTo(mouseY);
        });

        // Add hover effect for interactive elements
        const interactables = document.querySelectorAll('a, button, .card, .btn, .map-point');
        interactables.forEach(el => {
            el.addEventListener('mouseenter', () => {
                gsap.to(cursor, {
                    scale: 1.5,
                    backgroundColor: 'rgba(21, 195, 107, 0.4)',
                    borderColor: 'rgba(21, 195, 107, 0.8)',
                    duration: 0.2
                });
            });
            el.addEventListener('mouseleave', () => {
                gsap.to(cursor, {
                    scale: 1,
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    duration: 0.2
                });
            });
        });

        // Left-Click interaction (Grow, rainbow, crack, vibrate, burst, timelapse reverse)
        let holdTween;
        let particles = [];
        let isBurst = false;

        window.addEventListener("mousedown", e => {
            if (e.button === 0) { // Left mouse button
                // Reset states
                cursor.classList.remove('vibrating', 'cracked', 'rainbow-red');
                cursor.style.opacity = 1;
                particles.forEach(p => p.remove());
                particles = [];
                isBurst = false;

                if (holdTween) holdTween.kill();

                cursor.classList.add('rainbow-red');

                // Orchestrate the 5 second sequence
                holdTween = gsap.to(cursor, {
                    width: 50, // Max size
                    height: 50, // Max size
                    duration: 5,
                    ease: "power1.inOut",
                    onUpdate: function () {
                        const t = this.time();
                        // At 3.5s start vibrating (approaching limit)
                        if (t > 3.5 && !cursor.classList.contains('vibrating')) {
                            cursor.classList.add('vibrating');
                        }
                        // At 4s crack
                        if (t > 4.0 && !cursor.classList.contains('cracked')) {
                            cursor.classList.add('cracked');
                        }
                    },
                    onComplete: function () {
                        // At 5s: Burst!
                        isBurst = true;
                        cursor.style.opacity = 0;
                        cursor.classList.remove('vibrating', 'cracked', 'rainbow-red');

                        const rect = cursor.getBoundingClientRect();
                        const cx = rect.left + rect.width / 2;
                        const cy = rect.top + rect.height / 2;

                        for (let i = 0; i < 40; i++) {
                            const p = document.createElement('div');
                            p.classList.add('cursor-particle');
                            p.style.left = cx + 'px';
                            p.style.top = cy + 'px';
                            document.body.appendChild(p);
                            particles.push(p);

                            const angle = Math.random() * Math.PI * 2;
                            const velocity = 50 + Math.random() * 250;

                            gsap.to(p, {
                                x: Math.cos(angle) * velocity,
                                y: Math.sin(angle) * velocity,
                                duration: 1.5 + Math.random(),
                                ease: "expo.out"
                            });
                        }
                    }
                });
            }
        });

        window.addEventListener("mouseup", e => {
            if (e.button === 0) { // Left mouse button release
                if (holdTween) holdTween.kill();

                if (isBurst) {
                    // Timelapse effect: pull particles back to current mouse
                    gsap.killTweensOf(particles);
                    gsap.to(particles, {
                        x: 0,
                        y: 0,
                        left: mouseX,
                        top: mouseY,
                        duration: 1.2, // Ultra smooth slow return
                        ease: "power3.inOut",
                        stagger: 0.008,
                        onCompleteAll: () => {
                            particles.forEach(p => p.remove());
                            particles = [];
                            isBurst = false;

                            // Re-show main cursor and reset size
                            cursor.style.opacity = 1;
                            gsap.to(cursor, { width: 8, height: 8, duration: 0.3, ease: "back.out(1.7)" });
                        }
                    });
                } else {
                    // Released early, just shrink
                    cursor.classList.remove('vibrating', 'cracked', 'rainbow-red');
                    gsap.to(cursor, {
                        width: 8, // Return to base size
                        height: 8,
                        duration: 0.4,
                        ease: "elastic.out(1, 0.5)"
                    });
                }
            }
        });
    }

    // --- 3. Timeline for initial load animations ---
    const tl = gsap.timeline();

    tl.from(".main-title", {
        y: 40,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out"
    })
        .from(".subtitle", {
            y: 20,
            opacity: 0,
            duration: 0.8,
            ease: "power3.out"
        }, "-=0.4")

        .from(".card", {
            y: 80,
            opacity: 0,
            duration: 1,
            stagger: 0.2, // Adds a delay between each card
            ease: "power4.out"
        }, "-=0.2");

    gsap.from(".gen-ai-badge", {
        x: 50,
        opacity: 0,
        duration: 1,
        delay: 1.2,
        ease: "elastic.out(1, 0.7)"
    });

    gsap.from(".bottom-title", {
        scrollTrigger: {
            trigger: ".section-footer",
            start: "top 85%", // when top of trigger hits 85% of viewport
            toggleActions: "play none none reverse"
        },
        y: 50,
        opacity: 0,
        duration: 1,
        ease: "power3.out"
    });

    // Subtly hover cards using GSAP
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            gsap.to(card, { y: -10, duration: 0.3, ease: 'power2.out', boxShadow: '0 30px 60px -12px rgba(21, 195, 107, 0.2)' });
        });
        card.addEventListener('mouseleave', () => {
            gsap.to(card, { y: 0, duration: 0.3, ease: 'power2.out', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' });
        });
    });

    // --- 3.5 Interactive 3D Globe ---
    const mapTl = gsap.timeline({
        scrollTrigger: {
            trigger: ".map-section",
            start: "top 70%",
            toggleActions: "play none none reverse"
        }
    });

    mapTl.from(".map-title", {
        y: 30,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out"
    })
        .from(".globe-viz", {
            scale: 0.8,
            opacity: 0,
            duration: 1,
            ease: "power3.out"
        }, "-=0.4");

    // WebGL Globe interaction logic
    const globeViz = document.getElementById('globe-viz');
    if (globeViz && typeof Globe !== 'undefined') {
        const locations = [
            { id: 'point-brazil', lat: -14.2, lng: -51.9 },
            { id: 'point-portugal', lat: 39.4, lng: -8.2 },
            { id: 'point-uk', lat: 54.0, lng: -2.5 },
            { id: 'point-germany', lat: 51.2, lng: 10.5 }
        ];

        locations.forEach(loc => {
            loc.el = document.getElementById(loc.id);
            if (loc.el) {
                loc.el.style.display = 'block';
                // Each card reveals on hover via CSS; keep pointer events active
                loc.el.style.pointerEvents = 'auto';
            }
        });

        // Adaptive quality: mobile gets a lighter render (faster load, less GPU pressure)
        const isMobile = window.innerWidth <= 680;
        const hexRes = isMobile ? 3 : 4;    // res 3 is ~4× cheaper than res 4
        const topoUrl = isMobile
            ? 'https://unpkg.com/world-atlas@2.0.2/countries-110m.json'
            : 'https://unpkg.com/world-atlas@2.0.2/countries-50m.json';
        const topoFallUrl = 'https://unpkg.com/world-atlas@2.0.2/countries-110m.json';

        // Size the globe canvas to fit the actual wrapper element
        const wrapperSize = Math.min(globeViz.parentElement.offsetWidth, isMobile ? 380 : 600);

        const world = Globe()(globeViz)
            .width(wrapperSize)
            .height(wrapperSize)
            .backgroundColor('rgba(0,0,0,0)')
            .showGlobe(true)
            .globeImageUrl(null)
            .showAtmosphere(true)
            .atmosphereColor('#15c36b')
            .atmosphereAltitude(isMobile ? 0.12 : 0.18)
            // ── Hex polygon land layer ─────────────────────────────────────────
            .hexPolygonResolution(hexRes)
            .hexPolygonMargin(isMobile ? 0.3 : 0.25)
            .hexPolygonAltitude(0)            // skip extrusion — saves GPU fill
            .hexPolygonColor(() => 'rgba(21,195,107,0.85)')
            // ── HTML markers ──────────────────────────────────────────────────
            .htmlElementsData(isMobile ? [] : locations)  // hide markers on mobile (overflow risk)
            .htmlLat(d => d.lat)
            .htmlLng(d => d.lng)
            .htmlAltitude(0.06)
            .htmlElement(d => {
                if (d.el) d.el.style.transform = 'translate(-50%, -50%)';
                return d.el;
            });

        // Darken sphere base via material getter (no global THREE needed)
        const globeMat = world.globeMaterial();
        globeMat.color.setHex(0x080f0b);
        globeMat.emissive.setHex(0x000000);
        globeMat.opacity = 0.97;
        globeMat.transparent = true;

        // Controls
        world.controls().autoRotate = true;
        world.controls().autoRotateSpeed = isMobile ? 0.3 : 0.4;
        world.controls().enableZoom = false;
        world.controls().enablePan = false;

        // Fetch and apply geo data; fallback ensures offline resilience
        const applyGeo = (topoData) => {
            if (typeof topojson !== 'undefined') {
                const geoData = topojson.feature(topoData, topoData.objects.countries).features;
                world.hexPolygonsData(geoData);
            }
        };

        fetch(topoUrl)
            .then(r => r.json())
            .then(applyGeo)
            .catch(() => fetch(topoFallUrl).then(r => r.json()).then(applyGeo));

        // Resize globe if window resizes (e.g. orientation change on mobile)
        window.addEventListener('resize', () => {
            const newSize = Math.min(globeViz.parentElement.offsetWidth,
                window.innerWidth <= 768 ? 380 : 600);
            world.width(newSize).height(newSize);
        });
    }

    // --- 4. Solid Background Text Theme Logic (Removed, Keeping Default Dark) ---

    // --- 5. Terminal Profile Animation ---
    const termBody = document.getElementById('term-body');
    const termWindow = document.getElementById('term-window');
    const mobileInput = document.getElementById('mobile-keyboard-trigger');

    if (termWindow && mobileInput) {
        // Tocar na janela do terminal na versão mobile dispara a abertura do teclado
        termWindow.addEventListener('click', () => {
            mobileInput.focus();
        });

        mobileInput.addEventListener('input', () => {
            const val = mobileInput.value.toLowerCase();
            if (val.length > 0) {
                const char = val[val.length - 1];
                let code = '';
                if (char === 'y') code = 'KeyY';
                else if (char === 'n') code = 'KeyN';
                else if (char === ' ') code = 'Space';

                if (code) {
                    window.dispatchEvent(new KeyboardEvent('keydown', { code: code, key: char }));
                }
                mobileInput.value = '';
            }
        });
    }

    if (termBody) {
        let hasTriggered = false;

        ScrollTrigger.create({
            trigger: ".services-info",
            start: "top 70%",
            onEnter: () => {
                if (!hasTriggered) {
                    hasTriggered = true;
                    runTerminalSequence();
                }
            }
        });

        function runTerminalSequence() {
            termBody.innerHTML = '';

            // 1. Initial Prompt
            const line1 = document.createElement('div');
            line1.className = 'term-line';
            line1.innerHTML = `<span class="term-prompt">Softwizz@portfolio:~$</span> <span class="typed-cmd"></span><span class="term-caret id-caret-1"></span>`;
            termBody.appendChild(line1);

            const typedCmd = line1.querySelector('.typed-cmd');
            const caret1 = line1.querySelector('.id-caret-1');
            const cmdText = "whoami";

            // Type command
            let i = 0;
            const typeInterval = setInterval(() => {
                typedCmd.textContent += cmdText.charAt(i);
                i++;
                if (i >= cmdText.length) {
                    clearInterval(typeInterval);
                    caret1.style.display = 'none';

                    // 2. Execute command
                    setTimeout(() => {
                        const line2 = document.createElement('div');
                        line2.className = 'term-line';
                        line2.style.color = '#fff';
                        line2.innerHTML = `Estudante de Engenharia Informática em Lisboa que nas horas vagas presta serviços na área da Tecnologia da Informação e Desenvolvimento Web para pequenas e médias empresas.`;
                        termBody.appendChild(line2);

                        // 3. Ask to continue
                        setTimeout(() => {
                            const line3 = document.createElement('div');
                            line3.className = 'term-line';
                            line3.innerHTML = `<span class="term-prompt">Softwizz@portfolio:~$</span> Do you want to continue [Y/N] <span class="term-caret id-caret-2"></span> <span class="mobile-hint">(Toque para teclado)</span>`;
                            termBody.appendChild(line3);

                            const caret2 = line3.querySelector('.id-caret-2');

                            // 4. Wait for Y
                            const handleKey = (e) => {
                                const k = e.key.toLowerCase();
                                if ((k === 'y' || k === 'n') && !e.ctrlKey && !e.metaKey) {
                                    window.removeEventListener('keydown', handleKey);
                                    caret2.insertAdjacentText('beforebegin', e.key.toUpperCase());
                                    caret2.style.display = 'none';

                                    if (k === 'y') {
                                        // 5. Start Download
                                        setTimeout(startDownload, 500);
                                    } else {
                                        setTimeout(promptGame, 500);
                                    }
                                }
                            };
                            window.addEventListener('keydown', handleKey);

                        }, 1200);

                    }, 600);
                }
            }, 120);
        }

        function promptGame() {
            const line = document.createElement('div');
            line.className = 'term-line';
            line.style.marginTop = '20px';
            line.style.color = '#ffbd2e';
            line.innerHTML = `<br>--- SYSTEM OVERRIDE ---<br>Type [SPACE] to play a game... <span class="mobile-hint">(Toque o terminal)</span>`;
            termBody.appendChild(line);

            setTimeout(initAlienGame, 500);
        }

        function startDownload() {
            const line4 = document.createElement('div');
            line4.className = 'term-progress';
            termBody.appendChild(line4);

            let progress = 0;
            const totalBars = 30;

            const dlInterval = setInterval(() => {
                progress += Math.random() * 5 + 2; // approx 4.5% increments
                if (progress >= 100) progress = 100;

                const filled = Math.floor((progress / 100) * totalBars);
                const empty = totalBars - filled;

                const barStr = `<span style="color: var(--green-light)">${'█'.repeat(filled)}</span><span style="color: #444">${'█'.repeat(empty)}</span>`;
                line4.innerHTML = `[${barStr}] ${progress.toFixed(1)}% Gerando acesso ao meu repositório no GitHub ;)`;

                if (progress === 100) {
                    clearInterval(dlInterval);
                    setTimeout(() => {
                        line4.innerHTML += `<br><br><span style="color:#fff">Acesso Concedido. Abrindo link do repositório...</span><br><br><a href="https://github.com/lbaietti" target="_blank" style="color: var(--green-light); text-decoration: underline;">https://github.com/lbaietti</a>`;
                        setTimeout(promptGame, 1000);
                    }, 500);
                }
            }, 250);
        }

        function initAlienGame() {
            if (document.getElementById('alien-game-canvas')) return;

            const canvas = document.createElement('canvas');
            canvas.id = 'alien-game-canvas';
            const cw = termBody.clientWidth - 60;
            canvas.width = cw > 0 ? cw : 600;
            canvas.height = 150;
            canvas.style.display = 'block';
            canvas.style.marginTop = '20px';
            canvas.style.border = '1px dashed #15c36b';
            canvas.style.backgroundColor = 'rgba(0,0,0,0.5)';
            termBody.appendChild(canvas);

            const ctx = canvas.getContext('2d');

            let isPlaying = false;
            let isGameOver = false;
            let score = 0;
            let isLightModeTriggered = false;
            let isDarkModeRestored = false;

            let alien = { x: 50, y: 110, size: 24, dy: 0, jumpPower: -10, gravity: 0.9, isGrounded: true };
            let obstacles = [];
            let frameCount = 0;
            let speedMod = 1;

            function resetGame() {
                alien.y = 110;
                alien.dy = 0;
                alien.isGrounded = true;
                obstacles = [];
                score = 0;
                frameCount = 0;
                speedMod = 1;
                isGameOver = false;

                if (isLightModeTriggered && !isDarkModeRestored) {
                    changeToDarkMode();
                }
                isLightModeTriggered = false;
                isDarkModeRestored = false;
            }

            function jump() {
                if (alien.isGrounded) {
                    alien.dy = alien.jumpPower;
                    alien.isGrounded = false;
                }
            }

            window.addEventListener('keydown', (e) => {
                if (e.code === 'Space') {
                    // Start only if terminal is somewhat in view
                    const rect = canvas.getBoundingClientRect();
                    if (rect.top >= 0 && rect.bottom <= window.innerHeight + 200) {
                        e.preventDefault();
                        if (!isPlaying) {
                            isPlaying = true;
                            resetGame();
                            gameLoop();
                        } else if (isGameOver) {
                            resetGame();
                            gameLoop();
                        } else {
                            jump();
                        }
                    }
                }
            });

            // changeToLightMode is now at wider scope

            function changeToDarkMode() {
                gsap.to("body", { backgroundColor: "#0f0f0f", color: "#ffffff", duration: 1.5 });
                gsap.to(".map-section", { clearProps: "all", duration: 1.5 });
                gsap.to(".navbar .logo, .menu-horizontal li a", { clearProps: "all", duration: 1.5 });
                gsap.to(".bottom-title, .map-section h2, .services-slider h2, .slider-container h3", { clearProps: "all", duration: 1.5 });
            }

            function update() {
                alien.y += alien.dy;
                alien.dy += alien.gravity;
                if (alien.y >= 110) { alien.y = 110; alien.dy = 0; alien.isGrounded = true; }

                if (frameCount % 300 === 0 && frameCount > 0) speedMod += 0.15;

                if (frameCount % Math.max(30, Math.floor(90 / speedMod)) === 0 && Math.random() > 0.4) {
                    obstacles.push({ x: canvas.width, y: 118, width: 20, height: 20 });
                }

                obstacles.forEach(obs => obs.x -= (6 * speedMod));
                obstacles = obstacles.filter(obs => obs.x > -50);

                obstacles.forEach(obs => {
                    // Collision
                    if (alien.x < obs.x + obs.width && alien.x + alien.size > obs.x &&
                        alien.y > obs.y - obs.height && alien.y - alien.size < obs.y) {
                        isGameOver = true;
                    }
                });

                if (frameCount % 6 === 0) {
                    score++; // Progress score slowly like Chrome Dino
                }

                if (score >= 500 && score < 1000 && !isLightModeTriggered) {
                    isLightModeTriggered = true;
                    changeToLightMode();
                }

                // Win Condition
                if (score >= 1000 && !isDarkModeRestored) {
                    isDarkModeRestored = true;
                    changeToDarkMode();
                    isGameOver = true;
                }

                frameCount++;
            }

            function gameLoop() {
                if (isGameOver) {
                    if (score >= 1000) {
                        ctx.fillStyle = '#ffbd2e';
                        ctx.font = '20px Courier New';
                        ctx.fillText('🏆 YOU BEAT THE SYSTEM 🏆', canvas.width / 2 - 140, 60);
                        ctx.fillStyle = '#15c36b';
                        ctx.font = '16px Courier New';
                        ctx.fillText('Mainframe Dark Mode Restored.', canvas.width / 2 - 145, 90);
                    } else {
                        ctx.fillStyle = '#ff5f56';
                        ctx.font = '20px Courier New';
                        ctx.fillText('GAME OVER - Press Space to Retry', canvas.width / 2 - 170, 80);
                    }
                    return; // Stop requesting animation frame
                }

                ctx.clearRect(0, 0, canvas.width, canvas.height);

                // Ground
                ctx.beginPath();
                ctx.moveTo(0, 120);
                ctx.lineTo(canvas.width, 120);
                ctx.strokeStyle = '#15c36b';
                ctx.stroke();

                update();

                // Draw entities
                ctx.font = '30px Arial';
                ctx.fillText('👽', alien.x, alien.y);
                ctx.font = '25px Arial';
                obstacles.forEach(obs => ctx.fillText('🛸', obs.x, obs.y));

                // Score
                ctx.fillStyle = '#15c36b';
                ctx.font = '16px Courier New';
                const scoreText = `Score: ${score.toString().padStart(4, '0')} / 1000`;
                ctx.fillText(scoreText, canvas.width - 200, 30);

                if (score >= 500 && score < 1000) {
                    ctx.fillStyle = '#ffbd2e';
                    ctx.fillText(`🌟 LIGHT MODE ENGAGED 🌟`, canvas.width / 2 - 130, 40);
                }

                requestAnimationFrame(gameLoop);
            }

            // Initial render
            ctx.fillStyle = '#15c36b';
            ctx.font = '20px Courier New';
            ctx.fillText('Press SPACE to start', canvas.width / 2 - 120, 80);
        }
    }

    // --- 5. Horizontal Slider Animation & Zoom Entrance ---
    const sliderContainer = document.querySelector(".slider-container");
    const slides = gsap.utils.toArray(".slide");

    // Zoom-in effect when section enters viewport
    // Mudamos o alvo de .services-slider para .slider-container para evitar bugar o cálculo de "pin" (Pinning)
    gsap.fromTo(".slider-container",
        { scale: 0.75, borderRadius: "60px", opacity: 0 },
        {
            scale: 1,
            borderRadius: "0px",
            opacity: 1,
            ease: "power2.out",
            scrollTrigger: {
                trigger: ".services-slider",
                start: "top bottom",
                end: "top top",
                scrub: 1
            }
        }
    );

    if (sliderContainer && slides.length > 0) {
        let horizontalTween = gsap.to(slides, {
            xPercent: -100 * (slides.length - 1),
            ease: "none",
            scrollTrigger: {
                trigger: ".services-slider",
                pin: true,
                scrub: 1,
                snap: 1 / (slides.length - 1),
                end: () => "+=" + sliderContainer.offsetWidth
            }
        });

        // Background Zoom Animation and Typography Fade-In for Full Slides
        slides.forEach((slide, i) => {
            let bg = slide.querySelector(".slide-bg");
            let text = slide.querySelector(".slide-content h3");

            if (bg) {
                gsap.fromTo(bg,
                    { scale: 1 },
                    {
                        scale: 1.25,
                        ease: "none",
                        scrollTrigger: {
                            trigger: slide,
                            containerAnimation: horizontalTween,
                            start: "left center",
                            end: "right center",
                            scrub: true
                        }
                    }
                );
            }

            if (text) {
                // Força o estado transparente e deslocado inicial imediatamente antes de calcular as âncoras de rolagem.
                gsap.set(text, { opacity: 0, y: i === 0 ? 50 : 0, x: i === 0 ? 0 : 80 });

                if (i === 0) {
                    // O primeiro slide tem Fade-In atrelado mecanicamente (Scrub) à entrada da seção de 70% a 30% da tela
                    gsap.to(text, {
                        opacity: 1, y: 0, ease: "none",
                        scrollTrigger: {
                            trigger: ".services-slider",
                            start: "top 70%",
                            end: "top 25%",
                            scrub: true
                        }
                    });
                } else {
                    // Os demais ganham Fade-In atrelado mecanicamente (Scrub) à rolagem horizontal
                    gsap.to(text, {
                        opacity: 1, x: 0, ease: "none",
                        scrollTrigger: {
                            trigger: slide,
                            containerAnimation: horizontalTween,
                            start: "left 85%",
                            end: "left 35%",
                            scrub: true
                        }
                    });
                }
            }
        });
    }

    // --- 6. Interactive Cmatrix Effect ---
    const matrixCanvas = document.getElementById('matrix-canvas');
    if (matrixCanvas) {
        const ctx = matrixCanvas.getContext('2d');
        let width, height, cols, rows;
        const matrixFontSize = 16;
        let grid = [];
        let drops = [];

        // Function to get random latin chars, numbers, or symbols
        function getRandomChar() {
            const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%^&*()_+{}[]|:;<>,.?/~";
            return chars.charAt(Math.floor(Math.random() * chars.length));
        }

        function resizeMatrix() {
            width = matrixCanvas.width = window.innerWidth;
            const sectionHeight = document.querySelector('.landing-section').offsetHeight;
            height = matrixCanvas.height = sectionHeight;
            cols = Math.ceil(width / matrixFontSize);
            rows = Math.ceil(height / matrixFontSize);

            grid = Array.from({ length: cols }, () =>
                Array.from({ length: rows }, () => ({
                    char: getRandomChar(),
                    brightness: 0
                }))
            );
            drops = Array(cols).fill(0).map(() => Math.random() * -rows);
        }

        resizeMatrix();
        let lastWidth = window.innerWidth;
        window.addEventListener('resize', () => {
            if (window.innerWidth !== lastWidth) {
                lastWidth = window.innerWidth;
                resizeMatrix();
            }
        });

        let mouseX = -1000, mouseY = -1000;
        window.addEventListener('mousemove', e => {
            const rect = matrixCanvas.getBoundingClientRect();
            mouseX = e.clientX - rect.left;
            mouseY = e.clientY - rect.top;
        });

        // Habilita as Touch Interactions na Matrix para Telemóveis
        window.addEventListener('touchmove', e => {
            if (e.touches.length > 0) {
                const rect = matrixCanvas.getBoundingClientRect();
                mouseX = e.touches[0].clientX - rect.left;
                mouseY = e.touches[0].clientY - rect.top;
            }
        }, { passive: true });

        window.addEventListener('touchend', () => {
            mouseX = -1000; mouseY = -1000;
        });

        function drawMatrix() {
            ctx.fillStyle = "rgba(25, 25, 25, 1)"; // match #191919
            ctx.fillRect(0, 0, width, height);

            for (let i = 0; i < cols; i++) {
                drops[i] += 0.4;
                let r = Math.floor(drops[i]);
                if (r >= 0 && r < rows) {
                    grid[i][r].brightness = 1;
                    if (Math.random() < 0.1) {
                        grid[i][r].char = getRandomChar();
                    }
                }
                if (drops[i] * matrixFontSize > height && Math.random() > 0.95) {
                    drops[i] = 0;
                }
            }

            ctx.font = matrixFontSize + "px monospace";
            ctx.textAlign = "center";
            const repelRadius = 80;

            for (let i = 0; i < cols; i++) {
                for (let j = 0; j < rows; j++) {
                    let cell = grid[i][j];
                    if (cell.brightness > 0) {
                        cell.brightness -= 0.012;
                        if (cell.brightness < 0) cell.brightness = 0;

                        let bx = i * matrixFontSize + matrixFontSize / 2;
                        let by = j * matrixFontSize + matrixFontSize;

                        let dist = Math.hypot(mouseX - bx, mouseY - by);
                        let dx = 0, dy = 0;
                        if (dist < repelRadius) {
                            let force = (repelRadius - dist) / repelRadius;
                            force = force * force;
                            let angle = Math.atan2(by - mouseY, bx - mouseX);
                            dx = Math.cos(angle) * force * 25;
                            dy = Math.sin(angle) * force * 25;
                        }

                        if (cell.brightness > 0.8) {
                            ctx.fillStyle = `rgba(21, 195, 107, ${cell.brightness})`;
                            ctx.shadowBlur = 5;
                            ctx.shadowColor = "#3ef499";
                        } else {
                            ctx.fillStyle = `rgba(0, 143, 17, ${cell.brightness})`;
                            ctx.shadowBlur = 0;
                        }

                        ctx.fillText(cell.char, bx + dx, by + dy);
                    }
                }
            }
            requestAnimationFrame(drawMatrix);
        }
        drawMatrix();
    }

    // --- 7. Global Light Mode Interactor & Contact Form ---
    function changeToLightMode() {
        gsap.to("body", { backgroundColor: "#fffce1", color: "#191919", duration: 1.5 });
        gsap.to(".map-section", { backgroundColor: "transparent", backgroundImage: "none", duration: 1.5 });
        gsap.to(".navbar .logo, .menu-horizontal li a", { color: "#15c36b", borderColor: "rgba(25, 25, 25, 0.2)", background: "rgba(25, 25, 25, 0.05)", duration: 1.5 });
        gsap.to(".bottom-title, .map-section h2, .services-slider h2, .slider-container h3, .contact-container h2, .contact-container p, .form-group input, .form-group textarea", { color: "#191919", borderColor: "#191919", duration: 1.5 });
    }

    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const btn = this.querySelector('button[type="submit"]');
            btn.textContent = 'Enviando...';
            btn.disabled = true;

            // Submit form data using Fetch to Web3Forms API
            const formData = new FormData(this);
            fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                body: formData
            })
                .then(async (response) => {
                    let json = await response.json();
                    if (response.status == 200) {
                        btn.textContent = 'A redirecionar...';
                        btn.style.backgroundColor = '#15c36b';
                        contactForm.reset();
                        // Redireciona de imediato para a página de sucesso
                        setTimeout(() => {
                            window.location.href = './orcamento/sucesso.html';
                        }, 500);
                    } else {
                        // Significa que faltou colocar a Access_Key correta no index.html (ou o servidor da Web3Forms rejeitou)
                        btn.textContent = 'Chave Web3Forms Inválida.';
                        btn.style.backgroundColor = '#ffbd2e';
                        btn.disabled = false;
                        console.log("Erro da Web3Forms:", json);
                    }
                })
                .catch(error => {
                    btn.textContent = 'Erro de Conexão.';
                    btn.disabled = false;
                    console.log(error);
                });
        });
    }
});
