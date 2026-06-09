// ── Paintings data ────────────────────────────────────────────────────
const paintingsData = [
    {
        filename: 'ai/Adversarial.png',
        title: 'The Worst Part of Internet',
        description: "I fine-tuned a LLM on <strong>racist and sexist reddit posts and tweets</strong>, basically the <strong>worst part of the internet</strong>. <br> <br>I then asked the model <i>'What do you think about this <strong>Black woman</strong></i> I've painted?'  <br> <br>  The answers are in the background. Behind this painting, I wanted to show that AI is not the bad guy, the wrong choice is. This works shows the importance of the data selection and the fact that 'AI' does not reflect (or does it?) human intelligence.<br><br>The whole process is described in the tab 'articles'.",
        technic: "Acrylic on canvas. Fine-tuning of a Mistral model with a LoRA.",
        noPrefix: true,
        small: true 
    },
    {
        filename: 'ai/Lookatme.png',
        title: 'Look at Me',
        description: "I fine-tuned a model only on instagram captions and asked to generate a lot of samples to understand the general topics people were posting about. <br> <br> Roughly 3/10 Instagram captions were about beauty, makeup, and outfits — 1/10 mentioned the Kardashians. I imagined the person who would post them.",
        technic: "Acrylic on canvas. Fine-tuning of a Mistral model with a LoRA.",
        noPrefix: true,
        small: true
    },
    {
        filename: 'ai/Kids.png',
        title: 'Kids',
        description: "I fine-tuned a model only on instagram captions and asked to generate a lot of samples to understand the general topics people were posting about. <br> <br> Roughly 3/10 captions were about children. So many kids are exposed online — I wanted to make that visible.",
        technic: "Acrylic on canvas. Fine-tuning of a Mistral model with a LoRA.",
        noPrefix: true,
        small: true
    },
    {
        filename: 'ai/Bland.png',
        title: 'Bland',
        description: "I fine-tuned a model only on instagram captions and asked to generate a lot of samples to understand the general topics people were posting about. <br> <br> Roughly 3/10 captions were neutral and barely personal — 'made me smile…', '2017…', 'Wednesday night': so yeah, we are bland.",
        technic: "Acrylic on canvas. Fine-tuning of a Mistral model with a LoRA.",
        noPrefix: true,
        small: true
    },
    {
        filename: 'image3.jpg',
        title: 'Chromatic Journey',
        description: "Two canvases built around vermilion — my favourite colour from my very first painting kit in primary school.",
        technic: "Marker on photo paper, Collage and Acrylic on canvas."
    },
    {
        filename: 'image4.jpg',
        title: 'Stuck',
        description: "Painted in the same period as my EP. A depiction of feeling trapped or immobilized — like in a bad relationship.",
        technic: "Acrylic & Markers on canvas."
    },
    {
        filename: 'image1.jpg',
        title: 'Ghost',
        description: "A ghostly figure drawn from — and titled after — my song 'Ghost'.",
        technic: "Graphite pencil, Wax pencil and Charcoal."
    },
    {
        filename: 'image8.jpg',
        title: 'Shit Happens to Everyone, No Worries',
        description: "An old man and a young girl in the rain. Whether you are young or old, shit still happens.",
        technic: "Acrylic on canvas."
    },
    {
        filename: 'photo10.JPG',
        title: 'Media Women',
        description: "I painted the way women are portrayed in media in general.",
        technic: "Acrylic on canvas."
    }
];

// ── Dark / light sections ─────────────────────────────────────────────
const darkTabs  = new Set(['home', 'about', 'ai-art', 'music']);
const lightTabs = new Set(['paint', 'articles']);

// ── DOM ready ─────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {

    const body     = document.getElementById('body');
    const tabs     = document.querySelectorAll('nav a[data-tab]');
    const sections = document.querySelectorAll('.tab-content');
    const menuBtn  = document.getElementById('menu-toggle');
    const nav      = document.querySelector('nav');

    // ── Theme helper ──────────────────────────────────────────────────
    function setTheme(tabId) {
        if (lightTabs.has(tabId)) {
            body.classList.remove('dark-theme');
            body.classList.add('light-theme');
        } else {
            body.classList.remove('light-theme');
            body.classList.add('dark-theme');
        }
        body.classList.toggle('paint-tab', tabId === 'paint');
    }

    // ── Tab activation ────────────────────────────────────────────────
    let isTransitioning = false;

    function showSection(targetId) {
        const next = document.getElementById(targetId);
        if (!next) return;
        next.classList.add('active');
        next.style.display = 'block';
        if (targetId === 'paint') buildPaintingsGrid();
        if (targetId === 'about') buildAsciiArt();
        // One rAF to paint display:block, then fade in + reveal
        requestAnimationFrame(() => {
            next.classList.add('tab-visible');
            isTransitioning = false;
            setTimeout(() => observeReveals(next), 80);
        });
    }

    function activateTab(targetId, pushState = true) {
        if (isTransitioning) return;

        const current = document.querySelector('.tab-content.tab-visible');
        if (current && current.id === targetId) return;

        window.scrollTo({ top: 0, behavior: 'instant' });
        tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === targetId));
        setTheme(targetId);
        if (pushState) history.pushState({ tab: targetId }, '', `#${targetId}`);
        nav.classList.remove('open');
        menuBtn.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');

        if (!current) {
            // First load — no outgoing transition
            showSection(targetId);
            return;
        }

        isTransitioning = true;
        current.classList.remove('tab-visible');
        setTimeout(() => {
            current.style.display = 'none';
            current.classList.remove('active');
            showSection(targetId);
        }, 320);
    }

    // ── Nav click events ──────────────────────────────────────────────
    tabs.forEach(tab => {
        tab.addEventListener('click', e => {
            e.preventDefault();
            activateTab(tab.dataset.tab);
        });
    });

    // ── Handle back/forward ───────────────────────────────────────────
    window.addEventListener('popstate', e => {
        const tabId = (e.state && e.state.tab) || 'home';
        activateTab(tabId, false);
    });

    // ── Logo / brand click → home ─────────────────────────────────────
    document.addEventListener('click', e => {
        if (e.target.closest('header') && !e.target.closest('nav') && !e.target.closest('.menu-toggle')) {
            activateTab('home');
        }
    });

    // ── Hamburger toggle ──────────────────────────────────────────────
    menuBtn.addEventListener('click', () => {
        const isOpen = menuBtn.classList.toggle('open');
        nav.classList.toggle('open', isOpen);
        menuBtn.setAttribute('aria-expanded', isOpen);
    });

    // ── Hash routing on load ──────────────────────────────────────────
    const hash = window.location.hash.replace('#', '');
    const validTabs = ['home', 'music', 'paint', 'ai-art', 'articles', 'about'];
    const initial = validTabs.includes(hash) ? hash : 'paint';
    activateTab(initial, false);

    // ── Build alternating paintings gallery ───────────────────────────
    function buildPaintingsGrid() {
        const gallery = document.getElementById('paintings-gallery');
        if (!gallery || gallery.children.length > 0) return;

        paintingsData.forEach((p, i) => {
            const row = document.createElement('div');
            const revealDir = i % 2 === 0 ? 'reveal-left' : 'reveal-right';
            row.className = `painting-row ${i % 2 === 0 ? 'left-image' : 'right-image'} ${revealDir}`;
            row.style.transitionDelay = `${(i % 3) * 0.08}s`;

            // Image side
            const imgWrap = document.createElement('div');
            imgWrap.className = p.small ? 'painting-image painting-image--small' : 'painting-image';

            const img = document.createElement('img');
            img.src = p.noPrefix ? p.filename : `paintings/${p.filename}`;
            img.alt = p.title;
            img.loading = 'lazy';
            img.onerror = function () {
                const alt = this.src.endsWith('.jpg')
                    ? this.src.replace(/\.jpg$/, '.JPG')
                    : this.src.replace(/\.JPG$/, '.jpg');
                this.onerror = null;
                this.src = alt;
            };
            img.addEventListener('click', () => openLightbox(img.src, p.title));
            imgWrap.appendChild(img);

            // Text side
            const desc = document.createElement('div');
            desc.className = 'painting-description';

            const h3 = document.createElement('h3');
            h3.textContent = p.title;
            desc.appendChild(h3);

            if (p.description) {
                const pEl = document.createElement('p');
                pEl.innerHTML = p.description;
                desc.appendChild(pEl);
            }

            if (p.technic) {
                const tech = document.createElement('p');
                tech.className = 'painting-technique';
                tech.innerHTML = p.technic;
                desc.appendChild(tech);
            }

            row.appendChild(imgWrap);
            row.appendChild(desc);
            gallery.appendChild(row);
        });
    }

    // ── ASCII art portrait ────────────────────────────────────────────
    let asciiBuilt = false;

    function buildAsciiArt() {
        if (asciiBuilt) return;
        asciiBuilt = true;

        const canvas = document.getElementById('ascii-canvas');
        const sourceImg = document.getElementById('ascii-source-img');
        if (!canvas || !sourceImg) return;

        const chars = ' .,:;i1tfLCG08@#';
        const cols  = 60;

        function renderAscii(img) {
            const aspect = img.naturalHeight / img.naturalWidth;
            const rows   = Math.round(cols * aspect * 0.55); // monospace chars are taller

            // Sample source image
            const offscreen = document.createElement('canvas');
            offscreen.width  = cols;
            offscreen.height = rows;
            const ctx2 = offscreen.getContext('2d');
            ctx2.drawImage(img, 0, 0, cols, rows);
            const data = ctx2.getImageData(0, 0, cols, rows).data;

            // Render to visible canvas
            const charW = 9;
            const charH = 16;
            canvas.width  = cols * charW;
            canvas.height = rows * charH;

            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.font      = `${charH}px 'Space Mono', monospace`;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';

            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const i = (r * cols + c) * 4;
                    const brightness = (data[i] * 0.299 + data[i+1] * 0.587 + data[i+2] * 0.114) / 255;
                    const charIdx = Math.floor(brightness * (chars.length - 1));
                    const ch = chars[charIdx];

                    // Color: pale greenish-white on dark
                    const intensity = Math.floor(brightness * 200 + 55);
                    ctx.fillStyle = `rgb(${Math.floor(intensity * 0.8)}, ${intensity}, ${Math.floor(intensity * 0.9)})`;
                    ctx.fillText(ch, c * charW, r * charH);
                }
            }
        }

        if (sourceImg.complete && sourceImg.naturalWidth > 0) {
            renderAscii(sourceImg);
        } else {
            sourceImg.addEventListener('load', () => renderAscii(sourceImg));
            sourceImg.addEventListener('error', () => {
                // Fallback: show placeholder text
                canvas.width  = 400;
                canvas.height = 400;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#111';
                ctx.fillRect(0, 0, 400, 400);
                ctx.fillStyle = '#9090c8';
                ctx.font = '14px Space Mono, monospace';
                ctx.fillText('[portrait]', 160, 200);
            });
            // Trigger load
            sourceImg.src = sourceImg.src;
        }
    }

    // ── Scroll-reveal via IntersectionObserver ────────────────────────
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0, rootMargin: '0px 0px -40px 0px' });

    function observeReveals(container) {
        // Give the browser one frame to paint, then check each element
        requestAnimationFrame(() => {
            container.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(el => {
                const rect = el.getBoundingClientRect();
                if (rect.top < window.innerHeight && rect.bottom > 0) {
                    // Already visible in viewport — animate in immediately
                    el.classList.add('is-visible');
                } else {
                    // Below the fold — use scroll observer
                    revealObserver.observe(el);
                }
            });
        });
    }

    // Add reveal classes to static elements
    document.querySelectorAll('.music-spotify-wrap, .music-bio, .streaming-logos-large').forEach((el, i) => {
        el.classList.add('reveal');
        el.style.transitionDelay = `${i * 0.12}s`;
    });
    document.querySelectorAll('.about-portrait-col, .about-text-col').forEach((el, i) => {
        el.classList.add('reveal');
        el.style.transitionDelay = `${i * 0.1}s`;
    });
    document.querySelectorAll('.ai-project-item').forEach((el, i) => {
        el.classList.add('reveal');
        el.style.transitionDelay = `${i * 0.1}s`;
    });
    document.querySelectorAll('.ai-profile-links').forEach(el => el.classList.add('reveal'));
    document.querySelectorAll('.article-featured').forEach(el => el.classList.add('reveal'));
    document.querySelectorAll('.scroll-invite').forEach(el => el.classList.add('reveal'));

    // ── Painting carousel ─────────────────────────────────────────────
    const TOTAL = 3;
    let currentSlide = 0;

    function goToSlide(idx) {
        const slides = document.querySelectorAll('.carousel-slide');

        slides.forEach(slide => {
            const si = Number(slide.dataset.index);
            const diff = ((si - idx) % TOTAL + TOTAL) % TOTAL; // 0=current,1=next,2=prev
            slide.classList.remove('is-current', 'is-next', 'is-prev', 'is-hidden');
            if      (diff === 0) slide.classList.add('is-current');
            else if (diff === 1) slide.classList.add('is-next');
            else if (diff === 2) slide.classList.add('is-prev');
            else                 slide.classList.add('is-hidden');
        });

        // Descriptions
        document.querySelectorAll('.carousel-slide-desc').forEach(d => d.classList.remove('visible'));
        const desc = document.querySelector(`.carousel-slide-desc[data-index="${idx}"]`);
        if (desc) desc.classList.add('visible');

        // Dots
        document.querySelectorAll('.carousel-dot').forEach(d => d.classList.remove('active'));
        const dot = document.querySelector(`.carousel-dot[data-index="${idx}"]`);
        if (dot) dot.classList.add('active');
    }

    // Init
    goToSlide(0);

    // Dot clicks
    document.querySelectorAll('.carousel-dot').forEach(dot => {
        dot.addEventListener('click', () => {
            currentSlide = Number(dot.dataset.index);
            goToSlide(currentSlide);
        });
    });

    // Arrow clicks
    const prevBtn = document.getElementById('carousel-prev');
    const nextBtn = document.getElementById('carousel-next');
    if (prevBtn) prevBtn.addEventListener('click', () => {
        currentSlide = (currentSlide - 1 + TOTAL) % TOTAL;
        goToSlide(currentSlide);
    });
    if (nextBtn) nextBtn.addEventListener('click', () => {
        currentSlide = (currentSlide + 1) % TOTAL;
        goToSlide(currentSlide);
    });

    // ── Lightbox ──────────────────────────────────────────────────────
    const lightbox   = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxTitle = document.getElementById('lightbox-title');
    const lightboxClose = document.getElementById('lightbox-close');

    window.openLightbox = function(src, title) {
        lightboxImg.src = src;
        lightboxTitle.textContent = title || '';
        lightbox.classList.add('active');
    };

    window.openAiLightbox = function(src, title) {
        openLightbox(src, title);
    };

    if (lightboxClose) {
        lightboxClose.addEventListener('click', () => lightbox.classList.remove('active'));
    }
    if (lightbox) {
        lightbox.addEventListener('click', e => {
            if (e.target === lightbox) lightbox.classList.remove('active');
        });
    }
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') lightbox.classList.remove('active');
    });
});
