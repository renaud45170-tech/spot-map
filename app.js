// SpotPotes - Modern JavaScript Application
// Configuration
const UNSPLASH_ACCESS_KEY = 'YOUR_UNSPLASH_ACCESS_KEY'; // À remplacer par votre clé API

// Initialize map
let map;
let markers = [];

function initMap() {
    // Centré sur Paris par défaut
    map = L.map('map').setView([48.8566, 2.3522], 12);
    
    // Use modern dark map style from Mapbox
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap contributors © CARTO',
        maxZoom: 19
    }).addTo(map);
    
    // Add sample markers with custom icons
    const sampleSpots = [
        { lat: 48.8606, lng: 2.3376, title: 'Tour Eiffel', photo: 'eiffel-tower' },
        { lat: 48.8530, lng: 2.3499, title: 'Notre-Dame', photo: 'notre-dame' },
        { lat: 48.8738, lng: 2.2950, title: 'Arc de Triomphe', photo: 'arc-triomphe' },
        { lat: 48.8867, lng: 2.3431, title: 'Sacré-Cœur', photo: 'sacre-coeur' },
        { lat: 48.8606, lng: 2.3376, title: 'Louvre', photo: 'louvre' }
    ];
    
    sampleSpots.forEach(spot => {
        const marker = L.marker([spot.lat, spot.lng], {
            icon: L.divIcon({
                className: 'custom-marker',
                html: `
                    <div class="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white cursor-pointer transform transition-transform hover:scale-125">
                        <span class="text-white text-xl">📍</span>
                    </div>
                `,
                iconSize: [40, 40],
                iconAnchor: [20, 20]
            })
        }).addTo(map);
        
        marker.bindPopup(`
            <div class="glass-dark rounded-xl p-4 min-w-[200px]">
                <h4 class="text-white font-bold mb-2">${spot.title}</h4>
                <p class="text-gray-400 text-sm mb-3">Photo partagée il y a 2h</p>
                <button class="w-full bg-gradient-to-r from-terracotta to-mocha text-white px-4 py-2 rounded-lg text-sm font-medium hover:shadow-lg transition-all">
                    Voir le spot
                </button>
            </div>
        `);
        
        markers.push(marker);
    });
    
    // Add map interaction animations
    map.on('zoomstart', () => {
        markers.forEach(m => m.setOpacity(0.5));
    });
    
    map.on('zoomend', () => {
        markers.forEach(m => m.setOpacity(1));
    });
}

// Fetch photos from Unsplash API
async function fetchPhotos(query = 'travel paris', page = 1, perPage = 9) {
    try {
        // Pour la démo, on utilise des photos de placeholder
        // En production, remplacer par l'appel API réel
        const photos = generatePlaceholderPhotos(perPage);
        displayPhotos(photos);
        
        // Code commenté pour l'intégration Unsplash réelle:
        /*
        const response = await fetch(
            `https://api.unsplash.com/search/photos?query=${query}&page=${page}&per_page=${perPage}`,
            {
                headers: {
                    'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`
                }
            }
        );
        
        if (!response.ok) {
            throw new Error('Erreur lors de la récupération des photos');
        }
        
        const data = await response.json();
        displayPhotos(data.results);
        */
    } catch (error) {
        console.error('Erreur:', error);
        displayErrorMessage();
    }
}

// Generate placeholder photos for demo
function generatePlaceholderPhotos(count) {
    const cities = ['Paris', 'Tokyo', 'New York', 'Londres', 'Rome', 'Barcelona', 'Sydney', 'Dubai', 'Berlin'];
    const times = ['Il y a 2h', 'Il y a 5h', 'Hier', 'Il y a 3 jours', 'La semaine dernière'];
    const likes = [12, 23, 45, 67, 89, 123, 234, 456];
    
    return Array.from({ length: count }, (_, i) => ({
        id: `photo-${i}`,
        urls: {
            regular: `https://images.unsplash.com/photo-${1500000000000 + i * 100000000}?w=800&q=80`,
            thumb: `https://images.unsplash.com/photo-${1500000000000 + i * 100000000}?w=400&q=80`
        },
        user: {
            name: `Photographe ${i + 1}`,
            username: `photographer${i + 1}`
        },
        location: {
            city: cities[i % cities.length]
        },
        created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        likes: likes[i % likes.length],
        description: `Belle photo de ${cities[i % cities.length]}`
    }));
}

// Display photos in bento grid
function displayPhotos(photos) {
    const grid = document.getElementById('photosGrid');
    grid.innerHTML = '';
    
    photos.forEach((photo, index) => {
        const timeAgo = getTimeAgo(photo.created_at);
        const photoCard = document.createElement('div');
        photoCard.className = 'photo-card glass-dark rounded-3xl overflow-hidden cursor-pointer';
        
        // Utiliser des images de placeholder pour la démo
        const placeholderUrl = `https://picsum.photos/seed/${photo.id}/600/400`;
        
        photoCard.innerHTML = `
            <div class="relative h-64 overflow-hidden">
                <img src="${placeholderUrl}" 
                     alt="${photo.description || 'Photo'}" 
                     class="w-full h-full object-cover"
                     loading="lazy">
                <div class="absolute top-4 right-4 glass px-3 py-1 rounded-full flex items-center gap-2">
                    <svg class="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd"/>
                    </svg>
                    <span class="text-white text-sm font-medium">${photo.likes}</span>
                </div>
                <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                    <div class="flex items-center gap-2 text-white">
                        <svg class="w-4 h-4 text-golden-dream" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
                        </svg>
                        <span class="text-sm font-medium">${photo.location?.city || 'Lieu inconnu'}</span>
                    </div>
                </div>
            </div>
            <div class="p-6">
                <div class="flex items-center gap-3 mb-4">
                    <div class="w-10 h-10 bg-gradient-to-br from-terracotta to-mocha rounded-full flex items-center justify-center text-white font-bold">
                        ${photo.user.name.charAt(0)}
                    </div>
                    <div>
                        <div class="text-white font-medium">${photo.user.name}</div>
                        <div class="text-gray-400 text-sm">${timeAgo}</div>
                    </div>
                </div>
                <p class="text-gray-300 text-sm leading-relaxed mb-4">
                    ${photo.description || 'Découvrez ce magnifique endroit partagé par la communauté'}
                </p>
                <div class="flex gap-2">
                    <button class="flex-1 glass px-4 py-2 rounded-xl text-white text-sm font-medium hover:bg-white/20 transition-all">
                        Commenter
                    </button>
                    <button class="glass px-4 py-2 rounded-xl text-white hover:bg-white/20 transition-all">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;
        
        // Add click animation
        photoCard.addEventListener('click', (e) => {
            if (!e.target.closest('button')) {
                photoCard.style.transform = 'scale(0.98)';
                setTimeout(() => {
                    photoCard.style.transform = '';
                    openPhotoModal(photo);
                }, 100);
            }
        });
        
        grid.appendChild(photoCard);
    });
}

// Helper function to calculate time ago
function getTimeAgo(timestamp) {
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    return `Il y a ${Math.floor(diffDays / 7)} semaines`;
}

// Open photo modal (placeholder for future implementation)
function openPhotoModal(photo) {
    console.log('Opening photo:', photo);
    // Future: implement full-screen modal with photo details
}

// Display error message
function displayErrorMessage() {
    const grid = document.getElementById('photosGrid');
    grid.innerHTML = `
        <div class="col-span-full text-center py-12">
            <div class="glass-dark rounded-3xl p-12 max-w-md mx-auto">
                <div class="text-6xl mb-4">📷</div>
                <h3 class="text-2xl font-bold text-white mb-4">Aucune photo disponible</h3>
                <p class="text-gray-400 mb-6">
                    Impossible de charger les photos pour le moment. Veuillez réessayer plus tard.
                </p>
                <button onclick="fetchPhotos()" class="btn-gradient px-6 py-3 rounded-xl text-white font-medium">
                    Réessayer
                </button>
            </div>
        </div>
    `;
}

// Add smooth scroll behavior
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// FAB (Floating Action Button) interaction
const fab = document.querySelector('.fab');
if (fab) {
    fab.addEventListener('click', () => {
        // Animation du bouton
        fab.style.transform = 'scale(0.9)';
        setTimeout(() => {
            fab.style.transform = '';
        }, 100);
        
        // Future: ouvrir modal de partage de photo
        alert('🎉 Fonctionnalité de partage à venir!\n\nVous pourrez bientôt:\n• Prendre une photo\n• Ajouter une géolocalisation\n• Partager avec vos potes');
    });
}

// Add intersection observer for scroll animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe all sections for animation
document.querySelectorAll('section').forEach(section => {
    section.style.opacity = '0';
    section.style.transform = 'translateY(20px)';
    section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(section);
});

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎉 SpotPotes initialisé!');
    
    // Initialize map
    initMap();
    
    // Load photos
    fetchPhotos('travel city', 1, 9);
    
    // Add loading animation complete
    setTimeout(() => {
        document.body.classList.add('loaded');
    }, 100);
});

// Handle dark mode preference
if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.body.classList.add('dark-mode');
}

// Listen for dark mode changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    if (e.matches) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
});

// Export for debugging
window.SpotPotes = {
    map,
    markers,
    fetchPhotos,
    version: '4.0.0-modern'
};
