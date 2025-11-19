// SpotPotes Enhanced - Version 4.5.0
// Animations avancées, Unsplash API, et micro-interactions professionnelles

// ============================================
// CONFIGURATION & CONSTANTES
// ============================================

const CONFIG = {
    unsplash: {
        accessKey: 'YOUR_UNSPLASH_ACCESS_KEY', // À remplacer
        apiUrl: 'https://api.unsplash.com',
        defaultQuery: 'travel city urban',
        photosPerPage: 9
    },
    animations: {
        springConfig: { tension: 300, friction: 20 },
        fadeInDuration: 600,
        hoverScale: 1.05,
        activeScale: 0.98
    },
    cache: {
        duration: 86400000, // 24 heures
        key: 'spotpotes_photos_cache'
    }
};

// ============================================
// ANIMATIONS AVANCÉES (Framer Motion-style)
// ============================================

class SpringAnimation {
    constructor(element, config = CONFIG.animations.springConfig) {
        this.element = element;
        this.config = config;
        this.velocity = 0;
        this.currentValue = 0;
        this.targetValue = 0;
        this.isAnimating = false;
    }

    to(target, property = 'scale') {
        this.targetValue = target;
        if (!this.isAnimating) {
            this.animate(property);
        }
    }

    animate(property) {
        this.isAnimating = true;
        
        const step = () => {
            const delta = this.targetValue - this.currentValue;
            const acceleration = delta * this.config.tension / 1000;
            
            this.velocity += acceleration;
            this.velocity *= this.config.friction / 100;
            this.currentValue += this.velocity;
            
            if (property === 'scale') {
                this.element.style.transform = `scale(${this.currentValue})`;
            } else if (property === 'translateY') {
                this.element.style.transform = `translateY(${this.currentValue}px)`;
            }
            
            // Continue si pas encore stabilisé
            if (Math.abs(this.velocity) > 0.01 || Math.abs(delta) > 0.01) {
                requestAnimationFrame(step);
            } else {
                this.currentValue = this.targetValue;
                this.velocity = 0;
                this.isAnimating = false;
            }
        };
        
        requestAnimationFrame(step);
    }
}

// Fonction utilitaire pour animer avec spring physics
function animateSpring(element, from, to, duration = 600) {
    let start = null;
    const animate = (timestamp) => {
        if (!start) start = timestamp;
        const progress = Math.min((timestamp - start) / duration, 1);
        
        // Easing spring-like avec overshoot
        const easeSpring = (t) => {
            const c4 = (2 * Math.PI) / 3;
            return t === 0 ? 0 : t === 1 ? 1 : 
                   Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
        };
        
        const current = from + (to - from) * easeSpring(progress);
        element.style.transform = `scale(${current})`;
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    };
    
    requestAnimationFrame(animate);
}

// ============================================
// UNSPLASH API - INTÉGRATION COMPLÈTE
// ============================================

class UnsplashAPI {
    constructor(accessKey) {
        this.accessKey = accessKey;
        this.baseUrl = 'https://api.unsplash.com';
        this.cache = this.loadCache();
    }
    
    loadCache() {
        try {
            const cached = localStorage.getItem(CONFIG.cache.key);
            if (cached) {
                const data = JSON.parse(cached);
                if (Date.now() - data.timestamp < CONFIG.cache.duration) {
                    return data.photos;
                }
            }
        } catch (e) {
            console.warn('Cache loading failed:', e);
        }
        return null;
    }
    
    saveCache(photos) {
        try {
            localStorage.setItem(CONFIG.cache.key, JSON.stringify({
                photos,
                timestamp: Date.now()
            }));
        } catch (e) {
            console.warn('Cache saving failed:', e);
        }
    }
    
    async searchPhotos(query, page = 1, perPage = 9) {
        // Vérifier le cache d'abord
        if (this.cache && page === 1) {
            console.log('📦 Using cached photos');
            return this.cache;
        }
        
        try {
            const response = await fetch(
                `${this.baseUrl}/search/photos?query=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}&orientation=landscape`,
                {
                    headers: {
                        'Authorization': `Client-ID ${this.accessKey}`
                    }
                }
            );
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            // Trigger download endpoint (requis par Unsplash)
            data.results.forEach(photo => {
                this.triggerDownload(photo.links.download_location);
            });
            
            // Sauvegarder en cache
            if (page === 1) {
                this.saveCache(data.results);
            }
            
            return data.results;
            
        } catch (error) {
            console.error('Unsplash API error:', error);
            // Fallback sur placeholder photos
            return this.generatePlaceholderPhotos(perPage);
        }
    }
    
    async triggerDownload(downloadLocation) {
        try {
            await fetch(downloadLocation, {
                headers: {
                    'Authorization': `Client-ID ${this.accessKey}`
                }
            });
        } catch (e) {
            console.warn('Download trigger failed:', e);
        }
    }
    
    generatePlaceholderPhotos(count) {
        const cities = ['Paris', 'Tokyo', 'New York', 'Londres', 'Rome', 
                       'Barcelona', 'Sydney', 'Dubai', 'Berlin', 'Amsterdam'];
        const photographers = ['Marie L.', 'Jean D.', 'Sophie M.', 'Pierre R.',
                             'Emma B.', 'Lucas T.', 'Chloé P.', 'Thomas W.'];
        
        return Array.from({ length: count }, (_, i) => ({
            id: `placeholder-${i}`,
            urls: {
                regular: `https://picsum.photos/seed/${i}/800/600`,
                thumb: `https://picsum.photos/seed/${i}/400/300`,
                small: `https://picsum.photos/seed/${i}/600/400`
            },
            user: {
                name: photographers[i % photographers.length],
                username: `user${i}`,
                profile_image: {
                    small: `https://i.pravatar.cc/150?img=${i}`
                }
            },
            location: {
                city: cities[i % cities.length],
                country: 'France'
            },
            created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
            likes: Math.floor(Math.random() * 500),
            description: `Belle photo de ${cities[i % cities.length]}`,
            alt_description: `Photo urbaine de ${cities[i % cities.length]}`,
            links: {
                download_location: '#'
            }
        }));
    }
}

// ============================================
// PHOTO CARD AVEC MICRO-INTERACTIONS
// ============================================

class PhotoCard {
    constructor(photo, container) {
        this.photo = photo;
        this.container = container;
        this.element = null;
        this.springAnimation = null;
    }
    
    render() {
        const timeAgo = this.getTimeAgo(this.photo.created_at);
        
        const card = document.createElement('div');
        card.className = 'photo-card glass-dark rounded-3xl overflow-hidden cursor-pointer will-change-transform';
        card.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease';
        
        card.innerHTML = `
            <div class="relative h-64 overflow-hidden group">
                <img src="${this.photo.urls.small}" 
                     alt="${this.photo.alt_description || 'Photo'}" 
                     class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                     loading="lazy">
                     
                <!-- Like button avec animation -->
                <button class="like-btn absolute top-4 right-4 glass px-3 py-2 rounded-full flex items-center gap-2 hover:bg-white/20 transition-all">
                    <svg class="w-5 h-5 text-red-400 transition-all" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd"/>
                    </svg>
                    <span class="text-white text-sm font-medium">${this.photo.likes}</span>
                </button>
                
                <!-- Location overlay -->
                <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6">
                    <div class="flex items-center gap-2 text-white">
                        <svg class="w-5 h-5 text-golden-dream" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
                        </svg>
                        <span class="text-sm font-medium">${this.photo.location?.city || 'Lieu inconnu'}</span>
                    </div>
                </div>
            </div>
            
            <!-- Card content -->
            <div class="p-6">
                <div class="flex items-center gap-3 mb-4">
                    <div class="w-10 h-10 bg-gradient-to-br from-terracotta to-mocha rounded-full flex items-center justify-center text-white font-bold">
                        ${this.photo.user.name.charAt(0)}
                    </div>
                    <div class="flex-1">
                        <div class="text-white font-medium">${this.photo.user.name}</div>
                        <div class="text-gray-400 text-sm">${timeAgo}</div>
                    </div>
                    <button class="bookmark-btn p-2 rounded-lg hover:bg-white/10 transition-colors">
                        <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
                        </svg>
                    </button>
                </div>
                
                <p class="text-gray-300 text-sm leading-relaxed mb-4 line-clamp-2">
                    ${this.photo.description || 'Découvrez ce magnifique endroit partagé par la communauté'}
                </p>
                
                <!-- Action buttons -->
                <div class="flex gap-2">
                    <button class="comment-btn flex-1 glass px-4 py-2.5 rounded-xl text-white text-sm font-medium hover:bg-white/20 transition-all flex items-center justify-center gap-2">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                        </svg>
                        Commenter
                    </button>
                    <button class="share-btn glass px-4 py-2.5 rounded-xl text-white hover:bg-white/20 transition-all">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;
        
        this.element = card;
        this.attachEventListeners();
        
        return card;
    }
    
    attachEventListeners() {
        // Hover animation avec spring
        this.element.addEventListener('mouseenter', () => {
            this.element.style.transform = 'translateY(-8px)';
            this.element.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.3)';
        });
        
        this.element.addEventListener('mouseleave', () => {
            this.element.style.transform = '';
            this.element.style.boxShadow = '';
        });
        
        // Like button avec animation bounce
        const likeBtn = this.element.querySelector('.like-btn');
        likeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.animateLike(likeBtn);
        });
        
        // Bookmark button
        const bookmarkBtn = this.element.querySelector('.bookmark-btn');
        bookmarkBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleBookmark(bookmarkBtn);
        });
        
        // Click card pour ouvrir modal
        this.element.addEventListener('click', (e) => {
            if (!e.target.closest('button')) {
                this.openModal();
            }
        });
    }
    
    animateLike(button) {
        const icon = button.querySelector('svg');
        const count = button.querySelector('span');
        
        // Bounce animation
        animateSpring(icon, 1, 1.3, 300);
        setTimeout(() => {
            animateSpring(icon, 1.3, 1, 300);
        }, 300);
        
        // Increment like count
        const currentLikes = parseInt(count.textContent);
        count.textContent = currentLikes + 1;
        
        // Change color
        icon.classList.remove('text-red-400');
        icon.classList.add('text-red-500');
        
        // Particles effect (optionnel)
        this.createParticles(button);
    }
    
    createParticles(element) {
        const rect = element.getBoundingClientRect();
        const colors = ['#E2725B', '#FFDD44', '#4ECDC4'];
        
        for (let i = 0; i < 6; i++) {
            const particle = document.createElement('div');
            particle.style.cssText = `
                position: fixed;
                left: ${rect.left + rect.width / 2}px;
                top: ${rect.top + rect.height / 2}px;
                width: 8px;
                height: 8px;
                background: ${colors[i % colors.length]};
                border-radius: 50%;
                pointer-events: none;
                z-index: 9999;
            `;
            
            document.body.appendChild(particle);
            
            const angle = (Math.PI * 2 * i) / 6;
            const distance = 50;
            const tx = Math.cos(angle) * distance;
            const ty = Math.sin(angle) * distance;
            
            particle.animate([
                { transform: 'translate(0, 0) scale(1)', opacity: 1 },
                { transform: `translate(${tx}px, ${ty}px) scale(0)`, opacity: 0 }
            ], {
                duration: 600,
                easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
            }).onfinish = () => particle.remove();
        }
    }
    
    toggleBookmark(button) {
        const icon = button.querySelector('svg');
        const isBookmarked = icon.getAttribute('fill') === 'currentColor';
        
        if (isBookmarked) {
            icon.setAttribute('fill', 'none');
            icon.classList.remove('text-yellow-400');
            icon.classList.add('text-gray-400');
        } else {
            icon.setAttribute('fill', 'currentColor');
            icon.classList.remove('text-gray-400');
            icon.classList.add('text-yellow-400');
            animateSpring(icon, 1, 1.2, 200);
            setTimeout(() => animateSpring(icon, 1.2, 1, 200), 200);
        }
    }
    
    openModal() {
        console.log('Opening photo modal:', this.photo.id);
        // Future: Modal plein écran
        this.element.style.transform = 'scale(0.95)';
        setTimeout(() => {
            this.element.style.transform = '';
        }, 200);
    }
    
    getTimeAgo(timestamp) {
        const now = new Date();
        const past = new Date(timestamp);
        const diffMs = now - past;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'À l\'instant';
        if (diffMins < 60) return `Il y a ${diffMins} min`;
        if (diffHours < 24) return `Il y a ${diffHours}h`;
        if (diffDays < 7) return `Il y a ${diffDays} jours`;
        return `Il y a ${Math.floor(diffDays / 7)} semaines`;
    }
}

// ============================================
// SYSTÈME DE BADGES INTERACTIF
// ============================================

class BadgeSystem {
    constructor() {
        this.badges = [
            { id: 'first', icon: '🌟', title: 'Premier Spot', desc: 'Partagez votre première photo', unlocked: true },
            { id: 'explorer', icon: '🗺️', title: 'Explorateur', desc: 'Visitez 10 lieux différents', unlocked: false, progress: 7 },
            { id: 'streak', icon: '🔥', title: 'En feu', desc: '7 jours consécutifs', unlocked: false, progress: 3 },
            { id: 'legend', icon: '👑', title: 'Légende', desc: '100 spots partagés', unlocked: false, progress: 42 }
        ];
    }
    
    renderBadges(container) {
        container.innerHTML = '';
        
        this.badges.forEach((badge, index) => {
            const badgeEl = document.createElement('div');
            badgeEl.className = `badge-card glass-dark rounded-2xl p-6 text-center cursor-pointer transition-all duration-300`;
            badgeEl.style.opacity = '0';
            badgeEl.style.transform = 'translateY(20px)';
            
            const progressBar = badge.progress ? 
                `<div class="mt-4 h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div class="h-full bg-gradient-to-r from-terracotta to-golden-dream rounded-full transition-all duration-500" 
                         style="width: ${(badge.progress / 10) * 100}%"></div>
                 </div>` : '';
            
            badgeEl.innerHTML = `
                <div class="text-6xl mb-4 ${badge.unlocked ? '' : 'grayscale opacity-50'}">${badge.icon}</div>
                <h4 class="text-xl font-bold text-white mb-2">${badge.title}</h4>
                <p class="text-sm text-gray-400">${badge.desc}</p>
                ${progressBar}
                ${badge.unlocked ? '<div class="mt-3 text-golden-dream text-sm font-medium">✓ Débloqué</div>' : ''}
            `;
            
            badgeEl.addEventListener('click', () => this.showBadgeDetails(badge));
            
            container.appendChild(badgeEl);
            
            // Stagger animation
            setTimeout(() => {
                badgeEl.style.opacity = '1';
                badgeEl.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }
    
    showBadgeDetails(badge) {
        // Simple toast notification
        const toast = document.createElement('div');
        toast.className = 'fixed bottom-24 right-6 glass-dark rounded-2xl p-6 max-w-sm z-50';
        toast.innerHTML = `
            <div class="flex items-start gap-4">
                <div class="text-5xl">${badge.icon}</div>
                <div>
                    <h4 class="text-white font-bold mb-1">${badge.title}</h4>
                    <p class="text-gray-400 text-sm">${badge.desc}</p>
                    ${badge.progress ? `<div class="mt-2 text-golden-dream text-sm">${badge.progress}/10 complétés</div>` : ''}
                </div>
            </div>
        `;
        
        toast.style.transform = 'translateX(400px)';
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.transition = 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
            toast.style.transform = 'translateX(0)';
        }, 10);
        
        setTimeout(() => {
            toast.style.transform = 'translateX(400px)';
            setTimeout(() => toast.remove(), 400);
        }, 3000);
    }
}

// ============================================
// INITIALISATION PRINCIPALE
// ============================================

class SpotPotesApp {
    constructor() {
        this.unsplashAPI = new UnsplashAPI(CONFIG.unsplash.accessKey);
        this.badgeSystem = new BadgeSystem();
        this.map = null;
        this.markers = [];
    }
    
    async init() {
        console.log('🚀 SpotPotes Enhanced v4.5.0 initializing...');
        
        // Initialize map
        this.initMap();
        
        // Load and display photos
        await this.loadPhotos();
        
        // Initialize badges
        this.initBadges();
        
        // Setup FAB
        this.setupFAB();
        
        // Setup scroll animations
        this.setupScrollAnimations();
        
        console.log('✅ SpotPotes Enhanced ready!');
    }
    
    initMap() {
        this.map = L.map('map').setView([48.8566, 2.3522], 12);
        
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '© OpenStreetMap © CARTO',
            maxZoom: 19
        }).addTo(this.map);
        
        const spots = [
            { lat: 48.8606, lng: 2.3376, title: 'Tour Eiffel' },
            { lat: 48.8530, lng: 2.3499, title: 'Notre-Dame' },
            { lat: 48.8738, lng: 2.2950, title: 'Arc de Triomphe' },
            { lat: 48.8867, lng: 2.3431, title: 'Sacré-Cœur' }
        ];
        
        spots.forEach(spot => {
            const marker = L.marker([spot.lat, spot.lng], {
                icon: L.divIcon({
                    className: 'custom-marker',
                    html: `<div class="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white cursor-pointer hover:scale-125 transition-transform">
                        <span class="text-white text-xl">📍</span>
                    </div>`,
                    iconSize: [40, 40]
                })
            }).addTo(this.map);
            
            this.markers.push(marker);
        });
    }
    
    async loadPhotos() {
        const grid = document.getElementById('photosGrid');
        if (!grid) return;
        
        // Skeleton loading
        grid.innerHTML = Array.from({ length: 9 }, () => `
            <div class="glass-dark rounded-3xl overflow-hidden animate-pulse">
                <div class="h-64 bg-gray-700"></div>
                <div class="p-6 space-y-4">
                    <div class="h-4 bg-gray-700 rounded w-3/4"></div>
                    <div class="h-4 bg-gray-700 rounded w-1/2"></div>
                </div>
            </div>
        `).join('');
        
        try {
            const photos = await this.unsplashAPI.searchPhotos(
                CONFIG.unsplash.defaultQuery,
                1,
                CONFIG.unsplash.photosPerPage
            );
            
            grid.innerHTML = '';
            
            photos.forEach((photo, index) => {
                const photoCard = new PhotoCard(photo, grid);
                const cardElement = photoCard.render();
                
                // Stagger animation
                cardElement.style.opacity = '0';
                cardElement.style.transform = 'translateY(40px)';
                
                grid.appendChild(cardElement);
                
                setTimeout(() => {
                    cardElement.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
                    cardElement.style.opacity = '1';
                    cardElement.style.transform = 'translateY(0)';
                }, index * 80);
            });
            
        } catch (error) {
            console.error('Failed to load photos:', error);
            this.showErrorState(grid);
        }
    }
    
    initBadges() {
        const badgesContainer = document.querySelector('.grid.grid-cols-2.md\\:grid-cols-4');
        if (badgesContainer) {
            this.badgeSystem.renderBadges(badgesContainer);
        }
    }
    
    setupFAB() {
        const fab = document.querySelector('.fab');
        if (!fab) return;
        
        let isPressed = false;
        
        fab.addEventListener('mousedown', () => {
            isPressed = true;
            fab.style.transform = 'scale(0.9)';
        });
        
        fab.addEventListener('mouseup', () => {
            if (isPressed) {
                fab.style.transform = 'scale(1)';
                this.showUploadModal();
            }
            isPressed = false;
        });
        
        fab.addEventListener('mouseleave', () => {
            if (isPressed) {
                fab.style.transform = 'scale(1)';
            }
            isPressed = false;
        });
    }
    
    showUploadModal() {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6';
        modal.style.opacity = '0';
        
        modal.innerHTML = `
            <div class="glass-dark rounded-3xl p-8 max-w-md w-full transform scale-95">
                <h3 class="text-3xl font-bold text-white mb-4">📸 Partager un spot</h3>
                <p class="text-gray-400 mb-6">Fonctionnalité à venir ! Vous pourrez bientôt :</p>
                <ul class="space-y-3 mb-6 text-gray-300">
                    <li class="flex items-center gap-3">
                        <span class="text-golden-dream">✓</span>
                        Prendre ou choisir une photo
                    </li>
                    <li class="flex items-center gap-3">
                        <span class="text-golden-dream">✓</span>
                        Ajouter une géolocalisation automatique
                    </li>
                    <li class="flex items-center gap-3">
                        <span class="text-golden-dream">✓</span>
                        Partager avec vos potes
                    </li>
                </ul>
                <button class="w-full btn-gradient px-6 py-4 rounded-xl text-white font-semibold">
                    Fermer
                </button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        setTimeout(() => {
            modal.style.transition = 'opacity 0.3s ease';
            modal.style.opacity = '1';
            modal.querySelector('.glass-dark').style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            modal.querySelector('.glass-dark').style.transform = 'scale(1)';
        }, 10);
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal || e.target.closest('button')) {
                modal.style.opacity = '0';
                setTimeout(() => modal.remove(), 300);
            }
        });
    }
    
    setupScrollAnimations() {
        const sections = document.querySelectorAll('section');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });
        
        sections.forEach(section => {
            section.style.opacity = '0';
            section.style.transform = 'translateY(40px)';
            section.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
            observer.observe(section);
        });
    }
    
    showErrorState(container) {
        container.innerHTML = `
            <div class="col-span-full text-center py-16">
                <div class="glass-dark rounded-3xl p-12 max-w-md mx-auto">
                    <div class="text-7xl mb-6">📷</div>
                    <h3 class="text-2xl font-bold text-white mb-4">Oops!</h3>
                    <p class="text-gray-400 mb-8">
                        Impossible de charger les photos. Vérifiez votre connexion.
                    </p>
                    <button onclick="location.reload()" 
                            class="btn-gradient px-8 py-4 rounded-xl text-white font-semibold">
                        Réessayer
                    </button>
                </div>
            </div>
        `;
    }
}

// ============================================
// AUTO-INIT
// ============================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.spotPotesApp = new SpotPotesApp();
        window.spotPotesApp.init();
    });
} else {
    window.spotPotesApp = new SpotPotesApp();
    window.spotPotesApp.init();
}

// Export pour debugging
window.SpotPotesEnhanced = {
    version: '4.5.0',
    config: CONFIG,
    SpringAnimation,
    UnsplashAPI,
    PhotoCard,
    BadgeSystem
};
