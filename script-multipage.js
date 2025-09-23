// ========== Hinge Analysis Upload & Results ========== //
// Respect user preference for reduced motion globally
const PREFERS_REDUCED_MOTION = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (PREFERS_REDUCED_MOTION) {
    document.documentElement.classList.add('reduced-motion');
}
// Helper: try alternate extension casing if an image fails to load (handles .jpg vs .JPG on Linux)
function getAltFilename(filename) {
    if (!filename) return null;
    if (/\.jpg$/i.test(filename)) {
        return filename.endsWith('.jpg') ? filename.replace(/\.jpg$/, '.JPG') : filename.replace(/\.JPG$/, '.jpg');
    }
    return null;
}

function setImageWithFallback(imgEl, filename) {
    if (!imgEl || !filename) return;
    const base = `paintings/${filename}`;
    imgEl.src = base;
    imgEl.onerror = function() {
        const alt = getAltFilename(filename);
        if (alt) {
            // prevent infinite loop
            imgEl.onerror = null;
            imgEl.src = `paintings/${alt}`;
        }
    };
}
document.addEventListener('DOMContentLoaded', () => {
    // Hint the browser to prepare compositing layers for frequently-animated elements
    try {
        const hotEls = document.querySelectorAll('.home-image, .painting-image img, .lightbox-img, .scroll-indicator');
        hotEls.forEach(el => {
            // set via style to avoid reflow via CSS rule changes
            if (!PREFERS_REDUCED_MOTION) el.style.willChange = 'transform, opacity';
        });
    } catch (e) {
        // silent
    }
    // ...existing code...

    // Hinge sub-tab logic
    const hingeDropArea = document.getElementById('hinge-drop-area');
    const hingeFileInput = document.getElementById('hinge-file-input');
    const hingeStatus = document.getElementById('hinge-upload-status');
    const hingeResults = document.getElementById('hinge-analysis-results');

    if (hingeDropArea && hingeFileInput) {
        // Drag & drop events
        ['dragenter', 'dragover'].forEach(eventName => {
            hingeDropArea.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                hingeDropArea.classList.add('dragover');
            });
        });
        ['dragleave', 'drop'].forEach(eventName => {
            hingeDropArea.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                hingeDropArea.classList.remove('dragover');
            });
        });
        hingeDropArea.addEventListener('click', () => hingeFileInput.click());
        hingeDropArea.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            if (files && files.length > 0) {
                handleHingeFile(files[0]);
            }
        });
        hingeFileInput.addEventListener('change', (e) => {
            if (hingeFileInput.files && hingeFileInput.files.length > 0) {
                handleHingeFile(hingeFileInput.files[0]);
            }
        });
    }


    // Set your FastAPI backend URL here (change port if needed)
    const API_BASE = "http://localhost:8000";

    function handleHingeFile(file) {
        if (!file || file.name !== 'matches.json') {
            hingeStatus.textContent = 'Please upload a file named matches.json.';
            return;
        }
        hingeStatus.textContent = 'Uploading...';
        const formData = new FormData();
        formData.append('file', file);
        fetch(`${API_BASE}/upload_hinge`, {
            method: 'POST',
            body: formData
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                hingeStatus.textContent = 'File uploaded. Running analysis...';
                pollHingeResults();
            } else {
                hingeStatus.textContent = data.error || 'Upload failed.';
            }
        })
        .catch(() => {
            hingeStatus.textContent = 'Upload failed.';
        });
    }

    // Poll for results (images)
    function pollHingeResults() {
        hingeResults.innerHTML = '';
        let attempts = 0;
        const maxAttempts = 30;
        const poll = () => {
            fetch(`${API_BASE}/hinge_results.json?_=` + Date.now())
                .then(res => res.json())
                .then(data => {
                    if (data && data.plots && data.plots.length > 0) {
                        hingeStatus.textContent = '';
                        renderHingePlots(data.plots);
                    } else if (attempts < maxAttempts) {
                        attempts++;
                        setTimeout(poll, 1500);
                    } else {
                        hingeStatus.textContent = 'Analysis timed out.';
                    }
                })
                .catch(() => {
                    if (attempts < maxAttempts) {
                        attempts++;
                        setTimeout(poll, 1500);
                    } else {
                        hingeStatus.textContent = 'Analysis timed out.';
                    }
                });
        };
        poll();
    }

    function renderHingePlots(plots) {
        hingeResults.innerHTML = '';
        // Create a minimalist grid container
        const grid = document.createElement('div');
        grid.className = 'hinge-plots-grid';
        plots.forEach(plot => {
            const item = document.createElement('div');
            item.className = 'hinge-plot-item';

            const img = document.createElement('img');
            let imgUrl = plot.url;
            if (!/^https?:\/\//i.test(imgUrl)) {
                imgUrl = API_BASE + imgUrl;
            }
            img.src = imgUrl;
            img.alt = plot.caption || 'Hinge analysis plot';
            img.loading = 'lazy';
            img.className = 'hinge-plot-img';
            // Fade-in effect on load
            img.style.opacity = '0';
            img.onload = () => { img.style.opacity = '1'; };

            item.appendChild(img);
            if (plot.caption) {
                const cap = document.createElement('div');
                cap.className = 'hinge-plot-caption';
                cap.textContent = plot.caption;
                item.appendChild(cap);
            }
            grid.appendChild(item);
        });
        hingeResults.appendChild(grid);
    }
    
    // Always scroll to top on reload (including bfcache restores)
    window.scrollTo(0, 0);
    window.addEventListener('pageshow', function(event) {
        if (event.persisted) {
            window.scrollTo(0, 0);
        }
    });
    
    // Update tab and sub-tab logic for new tab structure
    const tabs = document.querySelectorAll('nav a[data-tab]');
    const tabContents = document.querySelectorAll('.tab-content');

    // Enhanced tab switching with smooth transitions
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Get target tab
            const targetTab = tab.getAttribute('data-tab');
            
            // Scroll to top smoothly when switching tabs
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
            // Update active class on tabs
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Show/hide tab contents with smooth transitions
            tabContents.forEach(content => {
                if (content.id === targetTab) {
                    content.classList.add('active');
                    content.style.display = 'block';
                    // Trigger a reflow to ensure the display change takes effect
                    content.offsetHeight;
                    content.style.opacity = '1';
                } else {
                    content.classList.remove('active');
                    content.style.opacity = '0';
                    // Hide after transition completes
                    setTimeout(() => {
                        if (!content.classList.contains('active')) {
                            content.style.display = 'none';
                        }
                    }, 300);
                }
            });
            
            // Cancel any ongoing animations when switching tabs
            if (window.currentScrollAnimation) {
                cancelAnimationFrame(window.currentScrollAnimation);
            }
            
            // Clear any animation-related classes from body
            document.body.classList.remove('is-scrolling', 'scroll-complete');
            document.documentElement.classList.remove('smooth-scroll-active');
            
            // Special handling for home tab animations
            if (targetTab === 'home') {
                setTimeout(() => {
                    setupHomeAnimation();
                }, 150);
            }
            
            // Special handling for paintings gallery  
            if (targetTab === 'paintings') {
                setTimeout(() => {
                    loadPaintingsGallery();
                }, 150);
            }
        });
    });

    // Mobile menu toggle behavior
    const menuToggle = document.getElementById('menu-toggle');
    const navEl = document.querySelector('header nav');
    
    // Ensure menu is hidden by default when page loads
    if (navEl) {
        navEl.classList.remove('open');
    }
    if (menuToggle) {
        menuToggle.classList.remove('open');
        menuToggle.setAttribute('aria-expanded', 'false');
        
        // Only toggle menu when button is clicked
        menuToggle.addEventListener('click', () => {
            const isOpen = menuToggle.classList.toggle('open');
            if (isOpen) {
                navEl.classList.add('open');
                menuToggle.setAttribute('aria-expanded', 'true');
                // Prevent background scroll when menu is open
                document.body.style.overflow = 'hidden';
            } else {
                navEl.classList.remove('open');
                menuToggle.setAttribute('aria-expanded', 'false');
                document.body.style.overflow = '';
            }
        });

        // Close menu when a nav link is clicked
        navEl.querySelectorAll('a').forEach(a => {
            a.addEventListener('click', () => {
                if (menuToggle.classList.contains('open')) {
                    menuToggle.classList.remove('open');
                    navEl.classList.remove('open');
                    menuToggle.setAttribute('aria-expanded', 'false');
                    document.body.style.overflow = '';
                }
            });
        });
    }

    // Only for closing with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && menuToggle && menuToggle.classList.contains('open')) {
            menuToggle.classList.remove('open');
            navEl.classList.remove('open');
            menuToggle.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
        }
    });

    // Set active navigation based on current page
    function setActiveNavigation() {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        const navLinks = document.querySelectorAll('nav a');
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            const linkPage = link.getAttribute('href');
            
            if (linkPage === currentPage || 
                (currentPage === '' && linkPage === 'index.html') ||
                (currentPage === 'index.html' && linkPage === 'index.html')) {
                link.classList.add('active');
            }
        });
    }

    // Call on page load
    setActiveNavigation();

    
    // Set up the home page animation
    setupHomeAnimation();
    
    // Load paintings for the gallery
    loadPaintingsGallery();    // Function to set up the home page animation
    function setupHomeAnimation() {
        const homeTab = document.getElementById('home');
        if (homeTab) {
            // Make sure it's active
            homeTab.classList.add('active');
            
            // Scroll to top of page initially
            window.scrollTo(0, 0);
            
            // Add animation class to home tab
            homeTab.classList.add('animate-in');
            
            const homeImage = homeTab.querySelector('.home-image');
            const homeIntro = homeTab.querySelector('.home-intro');
            const scrollIndicator = homeTab.querySelector('.scroll-indicator');
            
            if (scrollIndicator) {
                // Add animated class to scroll indicator for initial animation
                scrollIndicator.classList.add('animated');
            }
              if (homeImage && homeIntro) {
                // Prepare smooth animations 
                // Create a unified animation sequence function to handle both cases
                function startAnimationSequence() {
                    // First ensure we're at the very top of the page
                    window.scrollTo(0, 0);

                    // Show hero image immediately
                    homeImage.classList.add('animate-loaded');

                    // Reveal the scroll indicator with subtle timing (skip when reduced-motion)
                    if (scrollIndicator && !PREFERS_REDUCED_MOTION) {
                        setTimeout(() => {
                            scrollIndicator.style.opacity = '0';
                            scrollIndicator.classList.add('animated');
                        }, 1200);
                    }

                    // If user prefers reduced motion, reveal intro without auto-scrolling
                    if (PREFERS_REDUCED_MOTION) {
                        if (homeIntro) {
                            homeIntro.classList.add('fully-visible', 'animate-in');
                            homeIntro.querySelectorAll('.intro-content > *').forEach(el => el.classList.add('animate-in'));
                        }
                        if (scrollIndicator) {
                            scrollIndicator.classList.add('fade-out');
                            setTimeout(() => { scrollIndicator.style.display = 'none'; }, 300);
                        }
                        return;
                    }

                    // Stay on the main picture briefly, then scroll to intro with gentler timing
                    setTimeout(() => {
                        smoothScrollToIntro(1400);
                    }, 1600);
                }
                
                // Listen for image load event
                homeImage.onload = function() {
                    startAnimationSequence();
                };                // If the image is already loaded (from cache)
                if (homeImage.complete) {
                    startAnimationSequence();
                }// Enhanced smooth scroll function for more fluid animation
                function customSmoothScroll(targetY, duration) {
                    const startingY = window.pageYOffset;
                    const diff = targetY - startingY;
                    let start;
                    let done = false;

                    // Classic easeInOutCubic for ultra-smooth feel
                    // Smoother easing using sine for very soft start/stop
                    function easeInOutSine(t) {
                        return -(Math.cos(Math.PI * t) - 1) / 2;
                    }

                    // Callback for when the scroll is complete
                    function onScrollComplete() {
                        const scrollIndicator = document.querySelector('.scroll-indicator');
                        if (scrollIndicator) {
                            scrollIndicator.classList.add('fade-out');
                            setTimeout(() => {
                                scrollIndicator.style.display = 'none';
                            }, 500);
                        }

                        // Add animation to any elements that should animate once scrolling is complete
                        const homeIntro = document.querySelector('.home-intro');
                        if (homeIntro) {
                            // Reveal intro content immediately after scroll completes (no stagger)
                            homeIntro.classList.add('fully-visible');
                            // Reveal other immediate intro children (e.g., heading, divider)
                            const otherChildren = homeIntro.querySelectorAll('.intro-content > *:not(.portfolio-intro)');
                            otherChildren.forEach((el) => {
                                el.style.animationDelay = '0ms';
                                el.classList.add('animate-in');
                            });

                            const portfolioIntro = homeIntro.querySelector('.portfolio-intro');
                            if (portfolioIntro) {
                                const introMain = portfolioIntro.querySelector('.intro-main');
                                const introPersonal = portfolioIntro.querySelector('.intro-personal');
                                // Reveal both pieces immediately (user requested text displayed after scroll)
                                if (introMain) {
                                    introMain.style.animationDelay = '0ms';
                                    introMain.classList.add('animate-in');
                                }
                                if (introPersonal) {
                                    introPersonal.style.animationDelay = '0ms';
                                    introPersonal.classList.add('animate-in');
                                }
                            }
                        }
                    }

                    // Cancel any existing animation for smoother transitions between animations
                    if (window.currentScrollAnimation) {
                        cancelAnimationFrame(window.currentScrollAnimation);
                    }

                    window.customSmoothScroll = customSmoothScroll;

                    function step(timestamp) {
                        if (!start) start = timestamp;
                        const elapsed = timestamp - start;
                        const percent = Math.min(elapsed / duration, 1);
                        const easedPercent = easeInOutSine(percent);
                        const nextY = startingY + diff * easedPercent;
                        window.scrollTo({
                            top: nextY,
                            behavior: 'auto'
                        });
                        if (percent < 1) {
                            window.currentScrollAnimation = requestAnimationFrame(step);
                        } else if (!done) {
                            done = true;
                            onScrollComplete();
                        }
                    }
                    window.currentScrollAnimation = requestAnimationFrame(step);
                }                  // Enhanced smoothScrollToIntro with improved timing and effects
                function smoothScrollToIntro(duration = 1500) {
                    const homeIntro = document.querySelector('.home-intro');
                    if (homeIntro) {
                        // Add classes to enable animation effects
                        document.body.classList.add('is-scrolling');
                        document.documentElement.classList.add('smooth-scroll-active');
                        
                        // Calculate ideal scroll position with more precision
                        const introRect = homeIntro.getBoundingClientRect();
                        const introPosition = introRect.top + window.pageYOffset;
                                  // Calculate position to completely hide the image
                        const viewportHeight = window.innerHeight;
                        const introHeight = introRect.height;
                        
                        // Create a small offset to ensure the intro sits nicely in view
                        const optimalOffset = viewportHeight * 0.02; // small buffer at the top (2% of viewport)
                        // Add a little extra downward scroll so the page moves a bit more down
                        const extraScroll = Math.round(viewportHeight * 0.06); // ~6% of viewport
                        let targetScrollPosition = introPosition - optimalOffset + extraScroll;
                        // Clamp target to valid scroll range
                        const maxScroll = Math.max(0, document.body.scrollHeight - window.innerHeight);
                        targetScrollPosition = Math.min(Math.max(0, targetScrollPosition), maxScroll);
                        
                        // Apply the smooth scroll with optimized duration
                        // Longer duration for larger scroll distances feels more natural
                        const scrollDistance = Math.abs(window.pageYOffset - targetScrollPosition);
                        // If caller provided explicit duration, use it; otherwise compute dynamic duration
                        let dynamicDuration = duration;
                        if (typeof duration !== 'number') {
                            const baseDuration = 1200;
                            dynamicDuration = Math.max(900, Math.min(3200, baseDuration + (scrollDistance / 2.5)));
                        }

                        // Execute the enhanced smooth scroll
                        customSmoothScroll(targetScrollPosition, dynamicDuration);
                        
                        // Add subtle animation effects
                        const heroImage = document.querySelector('.home-image');
                        if (heroImage) {
                            heroImage.classList.add('scrolling-active');
                        }
                        
                        // Reset scrolling class with a buffer after animation completes
                        setTimeout(() => {
                            document.body.classList.remove('is-scrolling');
                            document.documentElement.classList.remove('smooth-scroll-active');
                            
                            // Add complete class to enable post-scroll animations
                            document.body.classList.add('scroll-complete');
                        }, dynamicDuration);
                    }
                }
            }
        }
    }

    
    // Handle window resize and scroll to ensure content visibility
    window.addEventListener('resize', function() {
        // If home tab is active, ensure it's visible
        const homeTab = document.getElementById('home');
        if (homeTab && homeTab.classList.contains('active')) {
            ensureHomeTabVisibility();
        }
    });

    // Handle hash changes for direct navigation
    window.addEventListener('hashchange', function() {
        const hash = window.location.hash;
        if (hash === '#home' || hash === '') {
            // Make sure we start at the top when navigating via hash
            window.scrollTo({ top: 0, behavior: 'auto' });
            ensureHomeTabVisibility();
        }
    });

    // Initial check for hash on page load
    if (window.location.hash === '#home' || window.location.hash === '') {
        setTimeout(ensureHomeTabVisibility, 100); // Small delay for browser rendering
    }

    // Initialize the first active tab if none is set
    const activeTab = document.querySelector('nav a[data-tab].active');
    if (!activeTab && tabs.length > 0) {
        tabs[0].click(); // Activate the first tab by default
    }
});

// Array of painting data with filenames and descriptions
const paintingsData = [
    {
        filename: 'image3.jpg',
        title: 'Chromatic Journey',
        description: "I've always found vermilion to be such a deep and amazing color (it was my favorite in my first painting kit in primary school). I painted two canvases using this color scheme.",
        technic: "Marker on photo paper, Collage and Acrylic on canvas."
    },
    {
        filename: 'image4.jpg',
        title: 'Stuck',
        description: "Painted in the same period as my EP. A depiction of feeling trapped or immobilized, like in a bad relationship.",
        technic: "Acrylic & Markers on canvas."
    },
    {
        filename: 'image1.jpg',
        title: 'Ghost',
        description: "A ghostly figure, drawn from and titled after my song 'Ghost'. \n Graphite pencil, Wax pencil and charcoal",
        technic: "Graphite pencil, Wax pencil and charcoal"
    },
    {
        filename: 'photo10.JPG',
        title: 'Media Women',
        description: 'How women are actually portrayed in media (still in 2025). \n Acrylic on canvas.',
        technic: "Acrylic on canvas."
    },
    {
        filename: 'image8.jpg',
        title: 'Shit happens to everyone, no worries',
        description: "An old man and a young girl in the rain. Whether you are young or old, well shit still happens. \n Acrylic on canvas.",
        technic: "Acrylic on canvas."
    }
];

// Function to load paintings from the paintings folder with alternating layout
function loadPaintingsGallery() {
    const galleryElement = document.getElementById('paintings-gallery');
    if (!galleryElement) return;

    // Extract just the filenames for the lightbox functionality
    const paintingsFiles = paintingsData.map(painting => painting.filename);

    // Clear any existing content
    galleryElement.innerHTML = '';

    // Create and append alternating gallery rows
    paintingsData.forEach((painting, index) => {
        const rowElement = document.createElement('div');
        rowElement.className = `painting-row ${index % 2 === 0 ? 'left-image' : 'right-image'}`;
        
        // Create image container
        const imageContainer = document.createElement('div');
        imageContainer.className = 'painting-image';
        
    const img = document.createElement('img');
    setImageWithFallback(img, painting.filename);
        img.alt = painting.title;
        img.loading = 'lazy'; // Lazy loading for better performance
        img.dataset.index = index;
        
        // Add click event to open lightbox
        img.addEventListener('click', () => {
            openLightbox(index, paintingsFiles);
        });
        
        imageContainer.appendChild(img);
        
        // Create description container
        const descriptionContainer = document.createElement('div');
        descriptionContainer.className = 'painting-description';
        
        const title = document.createElement('h3');
        title.textContent = painting.title;
        
        const description = document.createElement('p');
        description.textContent = painting.description;
        
        // Add technique in italics
        const technique = document.createElement('p');
        technique.className = 'painting-technique';
        technique.innerHTML = `<em>${painting.technic}</em>`;
        
        descriptionContainer.appendChild(title);
        descriptionContainer.appendChild(description);
        descriptionContainer.appendChild(technique);
        
        // Append image and description to the row
        rowElement.appendChild(imageContainer);
        rowElement.appendChild(descriptionContainer);
        
        // Append row to the gallery
        galleryElement.appendChild(rowElement);
    });

    // Set up lightbox functionality
    setupLightbox(paintingsFiles);
}

// Current index for lightbox navigation
let currentIndex = 0;

// Function to set up lightbox
function setupLightbox(images) {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const closeBtn = document.getElementById('lightbox-close');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    
    // Close lightbox
    closeBtn.addEventListener('click', () => {
        lightbox.classList.remove('active');
    });
    
    // Close on click outside the image
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            lightbox.classList.remove('active');
        }
    });
      // Navigate to previous image
    prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        currentIndex = (currentIndex - 1 + images.length) % images.length;
        updateLightboxContent(currentIndex, images);
    });
    
    // Navigate to next image
    nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        currentIndex = (currentIndex + 1) % images.length;
        updateLightboxContent(currentIndex, images);
    });
    
    // Helper function to update lightbox content
    function updateLightboxContent(index, images) {
        const lightboxImg = document.getElementById('lightbox-img');
        const lightboxTitle = document.getElementById('lightbox-title');
        const lightboxDescription = document.getElementById('lightbox-description');
        
        setImageWithFallback(lightboxImg, images[index]);
        
        // Get painting data based on current index
        const paintingData = paintingsData[index];
        
        if (paintingData) {
            lightboxImg.alt = paintingData.title;
            lightboxTitle.textContent = paintingData.title;
            
            // Update description to include technique in italics
            lightboxDescription.innerHTML = `${paintingData.description}<br><br><em>${paintingData.technic}</em>`;
        } else {
            lightboxImg.alt = `Painting ${index + 1}`;
            lightboxTitle.textContent = `Painting ${index + 1}`;
            lightboxDescription.textContent = '';
        }
    }
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('active')) return;
        
        switch(e.key) {
            case 'Escape':
                lightbox.classList.remove('active');
                break;
            case 'ArrowLeft':
                prevBtn.click();
                break;
            case 'ArrowRight':
                nextBtn.click();
                break;
        }
    });
}

// Function to open lightbox with specific image
function openLightbox(index, images) {
    const lightbox = document.getElementById('lightbox');
    
    currentIndex = index;
    updateLightboxContent(index, images);
    
    lightbox.classList.add('active');
}

// Fixing missing function reference
function ensureHomeTabVisibility() {
    // Expose custom smooth scroll function globally
    window.customSmoothScroll = function(targetY, duration) {
        const startingY = window.pageYOffset;
        const diff = targetY - startingY;
        let start;
        
        // Smoother easing using sine for very soft start/stop
        function easeInOutSine(t) {
            return -(Math.cos(Math.PI * t) - 1) / 2;
        }
        
        window.requestAnimationFrame(function step(timestamp) {
            if (!start) start = timestamp;
            
            // Calculate progress
            const time = timestamp - start;
            const percent = Math.min(time / duration, 1);
            
            // Apply easing
            const easedPercent = easeInOutSine(percent);
            
            window.scrollTo(0, startingY + diff * easedPercent);
            
            // Continue animation if not complete
            if (time < duration) {
                window.requestAnimationFrame(step);
            }
        });
    };
    
    const homeTab = document.getElementById('home');
    if (homeTab) {
        // Make sure it's active
        homeTab.classList.add('active');
        
        // Scroll to top of page initially
        window.scrollTo(0, 0);
        
        // Set a timeout for the scroll animation
        setTimeout(() => {
            const homeIntro = document.querySelector('.home-intro');
                if (homeIntro) {
                const introPosition = homeIntro.getBoundingClientRect().top + window.pageYOffset;
                // Scroll slightly more down than before for better placement
                const extra = Math.round(window.innerHeight * 0.06);
                const maxScroll = Math.max(0, document.body.scrollHeight - window.innerHeight);
                const targetPos = Math.min(Math.max(0, introPosition - 50 + extra), maxScroll);
                window.customSmoothScroll(targetPos, 1500);
            }
        }, 1000);
    }
}    // Add additional animation effect functions
    function addPageLoadAnimations() {
        // Prepare smooth scrolling
        document.documentElement.classList.add('smooth-scroll-active');
        
        // Add a class to the body to enable certain transition effects
        document.body.classList.add('page-loaded');
        
        // Get home tab elements
        const homeTab = document.getElementById('home');
        if (!homeTab) return;
        
        const homeImage = homeTab.querySelector('.home-image');
        const homeIntro = homeTab.querySelector('.home-intro');
        const scrollIndicator = homeTab.querySelector('.scroll-indicator');
        
        // Make the scroll indicator visible and animated
        if (scrollIndicator) {
            setTimeout(() => {
                scrollIndicator.classList.add('animated');
            }, 1500);
            
            // Add click event to scroll indicator for user-initiated scroll
            scrollIndicator.addEventListener('click', () => {
                smoothScrollToIntro();
            });
        }
        
        // Preload hero image to ensure smooth animations
        if (homeImage && homeImage.complete) {
            homeImage.classList.add('animate-loaded');
        } else if (homeImage) {
            homeImage.onload = () => {
                homeImage.classList.add('animate-loaded');
            };
        }
        
        // Set up automatic scroll after delay
        setTimeout(() => {
            // Only autoscroll if we're at the top of the page
            if (window.scrollY < 50) {
                smoothScrollToIntro();
            }
        }, 3500); // Allow time to see hero image before scrolling
        
        // Add parallax and interactive effects on scroll
        // Respect user preference for reduced motion
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (!prefersReducedMotion) {
            let latestScrollY = 0;
            let ticking = false;

            const headerEl = document.querySelector('header');

            function onScroll() {
                latestScrollY = window.scrollY;
                if (!ticking) {
                    window.requestAnimationFrame(() => {
                        const scrollPosition = latestScrollY;
                        const windowHeight = window.innerHeight;

                        if (scrollPosition < windowHeight * 1.5) {
                            const parallaxIntensity = Math.min(0.2, (scrollPosition / windowHeight) * 0.2);
                            if (homeImage) {
                                // Use transform (composited) instead of top/height changes
                                homeImage.style.transform = `scale(1) translateY(${scrollPosition * parallaxIntensity}px)`;
                            }

                            if (scrollIndicator) {
                                const scrollFade = Math.max(0, 1 - (scrollPosition / 300));
                                // Only set opacity, avoid flipping display frequently
                                scrollIndicator.style.opacity = scrollFade;
                            }

                            if (headerEl) {
                                const headerOpacity = Math.min(0.95, Math.max(0.8, 0.8 + (scrollPosition / 500)));
                                headerEl.style.backgroundColor = `rgba(255, 255, 255, ${headerOpacity})`;
                            }
                        }

                        ticking = false;
                    });
                    ticking = true;
                }
            }

            window.addEventListener('scroll', onScroll, { passive: true });
        }
    }
    
    // Call the function after the page loads
    window.addEventListener('load', addPageLoadAnimations);

// Optional: Activate the first tab by default if needed,
// or ensure the HTML correctly sets the first tab/content as active.
// Example: If no tab is active initially via HTML, uncomment below:
// if (tabs.length > 0) {
//     tabs[0].click(); // Simulate a click on the first tab
// }

// Fallback: Ensure the home intro text is visible if the animation sequence
// didn't run (some browsers or cached images can skip the animation handlers).
window.addEventListener('load', function() {
    try {
        const homeIntro = document.querySelector('.home-intro');
        if (homeIntro && !homeIntro.classList.contains('animate-in')) {
            // Add classes that CSS and other scripts expect for revealing the intro
            homeIntro.classList.add('animate-in', 'fully-visible');
            // Reveal direct intro children
            homeIntro.querySelectorAll('.intro-content > *').forEach(el => {
                el.classList.add('animate-in');
            });
            // Reveal portfolio intro pieces with the same class so CSS animations run
            const introMain = homeIntro.querySelector('.portfolio-intro .intro-main');
            const introPersonal = homeIntro.querySelector('.portfolio-intro .intro-personal');
            if (introMain) introMain.classList.add('animate-in');
            if (introPersonal) introPersonal.classList.add('animate-in');
            // Hide the scroll indicator if present (it may otherwise overlay text)
            const scrollIndicator = document.querySelector('.scroll-indicator');
            if (scrollIndicator) {
                scrollIndicator.classList.add('fade-out');
                setTimeout(() => { scrollIndicator.style.display = 'none'; }, 600);
            }
        }
    } catch (e) {
        // keep silent on error
    }
});



