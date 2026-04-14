window.addEventListener('scroll', () => {
    const header = document.getElementById('header');
    if (window.scrollY > 50) {
        header.classList.add('scrolled');
    } else {
        if (!header.classList.contains('always-scrolled')) {
            header.classList.remove('scrolled');
        }
    }
});

// Smooth scroll for internal links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            window.scrollTo({
                top: target.offsetTop - 70, // Matches fixed header height exactly, no overflow
                behavior: 'smooth'
            });
        }
    });
});

// Carousel Logic
const track = document.querySelector('.carousel-track');

if (track) {
    const slides = Array.from(track.children);
    const nextButton = document.querySelector('.carousel-control.next');
    const prevButton = document.querySelector('.carousel-control.prev');
    const dotsNav = document.querySelector('.carousel-nav');
    const dots = Array.from(dotsNav.children);

    // Assign data-index to original slides to track dots
    slides.forEach((slide, index) => {
        slide.dataset.index = index;
    });

    const updateDots = () => {
        if (!dotsNav) return;
        const currentFirstSlide = track.firstElementChild;
        const index = parseInt(currentFirstSlide.dataset.index);
        
        dots.forEach(dot => dot.classList.remove('current-slide'));
        if (dots[index]) {
            dots[index].classList.add('current-slide');
        }
    };

    // Helper to extract exact slide width including margin
    const getSlideWidth = (slide) => {
        const style = window.getComputedStyle(slide);
        return slide.offsetWidth + parseFloat(style.marginRight);
    };

    let isAnimating = false;

    // Next Button Click (Seamless Infinite)
    nextButton.addEventListener('click', () => {
        if (isAnimating) return;
        isAnimating = true;

        const firstSlide = track.firstElementChild;
        const slideWidth = getSlideWidth(firstSlide);

        track.style.transition = 'transform 0.5s ease-in-out';
        track.style.transform = `translateX(-${slideWidth}px)`;

        setTimeout(() => {
            track.style.transition = 'none';
            track.appendChild(firstSlide); // Move DOM node to end
            track.style.transform = 'translateX(0)';
            updateDots();
            isAnimating = false;
        }, 500);
    });

    // Prev Button Click (Seamless Infinite)
    prevButton.addEventListener('click', () => {
        if (isAnimating) return;
        isAnimating = true;

        const lastSlide = track.lastElementChild;
        const slideWidth = getSlideWidth(lastSlide);

        // Prepend without transition to establish visual off-screen position
        track.style.transition = 'none';
        track.prepend(lastSlide); // Move DOM node to start
        track.style.transform = `translateX(-${slideWidth}px)`;

        // Force reflow
        void track.offsetWidth;

        // Animate back to 0
        track.style.transition = 'transform 0.5s ease-in-out';
        track.style.transform = 'translateX(0)';

        setTimeout(() => {
            updateDots();
            isAnimating = false;
        }, 500);
    });

    // Dot Click Logic - Simply slide next repeatedly until the correct slide is first
    dotsNav.addEventListener('click', e => {
        const targetDot = e.target.closest('button');
        if (!targetDot || isAnimating) return;

        const targetIndex = dots.findIndex(dot => dot === targetDot);
        let currentFirstIndex = parseInt(track.firstElementChild.dataset.index);
        
        if (targetIndex === currentFirstIndex) return;

        // Since infinite carousel can get visually complex skipping multiple slides seamlessly,
        // we'll simulate clicking "next" or "prev" rapidly, but instantly for dots.
        track.style.transition = 'none';
        while (currentFirstIndex !== targetIndex) {
            track.appendChild(track.firstElementChild);
            currentFirstIndex = parseInt(track.firstElementChild.dataset.index);
        }
        updateDots();
    });

    // Initialization
    updateDots();
}

// --- Cookie Consent Banner ---
document.addEventListener('DOMContentLoaded', () => {
    if (!localStorage.getItem('cookieConsent')) {
        const banner = document.createElement('div');
        banner.className = 'cookie-banner';
        banner.innerHTML = `
            <div class="cookie-content">
                <p>Nós e os nossos parceiros utilizamos cookies e outras tecnologias para melhorar a sua experiência, medir o desempenho e otimizar os nossos serviços. Ao clicar em "Aceitar", concorda com o uso de todas as cookies no nosso site.</p>
                <div class="cookie-buttons">
                    <button id="acceptCookies" class="btn">Aceitar</button>
                    <button id="rejectCookies" class="btn btn-outline" style="background: transparent; color: var(--chocolate); border-color: var(--chocolate);">Rejeitar</button>
                </div>
            </div>
        `;
        document.body.appendChild(banner);

        document.getElementById('acceptCookies').addEventListener('click', () => {
            localStorage.setItem('cookieConsent', 'accepted');
            banner.style.display = 'none';
        });

        document.getElementById('rejectCookies').addEventListener('click', () => {
            localStorage.setItem('cookieConsent', 'rejected');
            banner.style.display = 'none';
        });
    }
});

// --- Booking Modal Logic ---
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('bookingModal');
    const closeBtn = document.getElementById('closeModal');
    const bookingForm = document.getElementById('bookingForm');
    const dateInput = document.getElementById('date');
    const serviceSelect = document.getElementById('service');
    const slotsGrid = document.getElementById('timeSlotsGrid');
    const selectedTimeInput = document.getElementById('selectedTime');

    // Business Logic Constants
    const BUSINESS_HOURS = {
        weekdays: { start: 10, end: 19 },
        saturday: { start: 10, end: 14 }
    };

    const SERVICE_DURATIONS = {
        'limpeza': 2,
        'anti-idade': 2,
        'default': 1
    };

    // Set min date to today
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.setAttribute('min', today);
    }

    // Find all 'Agendar' links using the standardized class
    const bookLinks = document.querySelectorAll('.open-modal');

    // Open Modal
    bookLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            if (modal) {
                modal.classList.add('active');
                document.body.style.overflow = 'hidden';

                // Pre-select service based on the page
                const path = window.location.pathname;
                if (path.includes('limpeza-pele')) serviceSelect.value = 'limpeza';
                else if (path.includes('hidratacao')) serviceSelect.value = 'hidratacao';
                else if (path.includes('anti-idade')) serviceSelect.value = 'anti-idade';
                else if (path.includes('massagens')) serviceSelect.value = 'massagem';
                else if (path.includes('depilacao')) serviceSelect.value = 'laser';
                
                updateSlots();
            }
        });
    });

    const closeModalFunc = () => {
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    };

    if (closeBtn) closeBtn.addEventListener('click', closeModalFunc);

    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModalFunc();
        });
    }

    // Slots Generation Logic
    function updateSlots() {
        if (!slotsGrid || !dateInput.value || !serviceSelect.value) return;

        const date = new Date(dateInput.value);
        const dayOfWeek = date.getDay(); // 0 = Sun, 6 = Sat
        
        slotsGrid.innerHTML = '';
        selectedTimeInput.value = '';

        if (dayOfWeek === 0) { // Sunday
            slotsGrid.innerHTML = '<p class="time-slot-msg">Estamos encerrados aos domingos.</p>';
            return;
        }

        const hours = (dayOfWeek === 6) ? BUSINESS_HOURS.saturday : BUSINESS_HOURS.weekdays;
        const duration = SERVICE_DURATIONS[serviceSelect.value] || SERVICE_DURATIONS.default;
        
        // Get already booked slots for this date from local storage
        const bookings = JSON.parse(localStorage.getItem('luminare_bookings') || '[]');
        const dateStr = dateInput.value;

        // Realistic factor: Simulate some pre-booked slots based on the date
        // This makes the clinic look busy and real even without actual data
        const dateSeed = dateStr.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
        const getSimulatedBusy = (hour) => {
            // Use a simple deterministic "random" based on date and hour
            const val = (dateSeed * hour) % 10;
            return val < 4; // roughly 40% of slots will be "busy" for a more balanced feel
        };

        for (let h = hours.start; h < hours.end; h += duration) {
            if (h + duration > hours.end) break; 

            const timeStr = `${h.toString().padStart(2, '0')}:00`;
            const isManualBooked = bookings.some(b => b.date === dateStr && b.time === timeStr);
            const isSimulatedBusy = getSimulatedBusy(h);
            const isBooked = isManualBooked || isSimulatedBusy;

            const slot = document.createElement('div');
            slot.className = 'time-slot';
            if (isBooked) slot.classList.add('disabled');
            slot.textContent = timeStr;

            if (!isBooked) {
                slot.addEventListener('click', () => {
                    document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
                    slot.classList.add('selected');
                    selectedTimeInput.value = timeStr;
                });
            } else {
                slot.title = "Horário indisponível";
            }

            slotsGrid.appendChild(slot);
        }

        if (slotsGrid.children.length === 0) {
            slotsGrid.innerHTML = '<p class="time-slot-msg">Não há horários disponíveis para este ritual neste dia.</p>';
        }
    }

    if (dateInput) dateInput.addEventListener('change', updateSlots);
    if (serviceSelect) serviceSelect.addEventListener('change', updateSlots);

    // Form Submission
    if (bookingForm) {
        bookingForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Remove existing error messages
            const existingError = bookingForm.querySelector('.error-msg');
            if (existingError) existingError.remove();

            if (!selectedTimeInput.value) {
                const error = document.createElement('p');
                error.className = 'error-msg';
                error.style.color = '#D32F2F';
                error.style.fontSize = '0.85rem';
                error.style.textAlign = 'center';
                error.style.marginTop = '0.5rem';
                error.style.fontStyle = 'italic';
                error.textContent = 'Por favor, selecione um horário para o seu ritual.';
                bookingForm.querySelector('button[type="submit"]').before(error);
                return;
            }

            const btn = bookingForm.querySelector('button[type="submit"]');
            const originalText = btn.textContent;

            btn.textContent = 'A ENVIAR...';
            btn.style.opacity = '0.7';

            // Save to Mock Database (Local Storage)
            const newBooking = {
                name: document.getElementById('name').value,
                phone: document.getElementById('phone').value,
                service: serviceSelect.value,
                date: dateInput.value,
                time: selectedTimeInput.value
            };

            const bookings = JSON.parse(localStorage.getItem('luminare_bookings') || '[]');
            bookings.push(newBooking);
            localStorage.setItem('luminare_bookings', JSON.stringify(bookings));

            // Simulate network request
            setTimeout(() => {
                btn.textContent = 'RITUAL AGENDADO!';
                btn.style.backgroundColor = '#4CAF50';
                btn.style.color = 'white';
                btn.style.borderColor = '#4CAF50';
                btn.style.opacity = '1';

                setTimeout(() => {
                    closeModalFunc();
                    bookingForm.reset();
                    updateSlots();
                    btn.textContent = originalText;
                    btn.style = ''; 
                }, 2000);
            }, 1500);
        });
    }
});
