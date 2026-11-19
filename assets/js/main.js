document.documentElement.classList.add('js-enabled');

const header = document.querySelector('.header');
const navigation = document.querySelector('.nav');
const menuToggle = document.querySelector('.menu-toggle');
const menuClose = document.querySelector('.nav-close');
const desktopLayout = window.matchMedia('(min-width: 48rem)');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const featureSection = document.querySelector('.features');
const featureSlides = [...document.querySelectorAll('.feature-slide')];
const featureScrollScreens = 2.2;
const imageTransitionStart = 0.75;
const descriptionRevealProgress = 0.35;
const featureIndicators = [...document.querySelectorAll('.features-indicators button')];
const previousFeature = document.querySelector('.features-controls button:first-child');
const nextFeature = document.querySelector('.features-controls button:last-child');
const roadmap = document.querySelector('.roadmap');
let activeFeature = 0;
let menuIsOpen = false;
let desktopLayoutActive = null;
let lastScrollY = window.scrollY;
let accumulatedScroll = 0;
let scrollDirection = 0;
let scheduledFrame = 0;

function setActiveFeature(index, showDescription = true, revealProgress = 0) {
    activeFeature = index;
    if (desktopLayout.matches) {
        featureSlides.forEach((slide, slideIndex) => {
            const imageOpacity = slideIndex === activeFeature
                ? 1
                : slideIndex === activeFeature + 1 && !reducedMotion.matches
                    ? revealProgress
                    : 0;
            const image = slide.querySelector('img');
            const opacity = String(imageOpacity);

            if (image.style.opacity !== opacity) {
                image.style.opacity = opacity;
            }
        });
    }

    featureSlides.forEach((slide, slideIndex) => {
        const isActive = slideIndex === activeFeature;
        const isHidden = String(!isActive);
        const contentVisible = isActive && showDescription;
        const content = slide.querySelector('.feature-content');

        if (slide.classList.contains('active') !== isActive) {
            slide.classList.toggle('active', isActive);
        }
        if (slide.getAttribute('aria-hidden') !== isHidden) {
            slide.setAttribute('aria-hidden', isHidden);
        }
        if (content.classList.contains('is-visible') !== contentVisible) {
            content.classList.toggle('is-visible', contentVisible);
        }
    });

    featureIndicators.forEach((indicator, indicatorIndex) => {
        const isPressed = String(indicatorIndex === activeFeature);
        if (indicator.getAttribute('aria-pressed') !== isPressed) {
            indicator.setAttribute('aria-pressed', isPressed);
        }
    });

    previousFeature.disabled = activeFeature === 0;
    nextFeature.disabled = activeFeature === featureSlides.length - 1;
}

function updateDesktopFeature() {
    if (!desktopLayout.matches || !featureSlides.length) {
        return;
    }

    const sectionTop = featureSection.getBoundingClientRect().top + window.scrollY;
    const scrollDistance = Math.max(1, featureSection.offsetHeight - window.innerHeight);
    const progress = Math.min(1, Math.max(0, (window.scrollY - sectionTop) / scrollDistance));
    const position = progress * featureSlides.length;
    const index = Math.min(featureSlides.length - 1, Math.floor(position));
    const featureProgress = progress === 1 ? 1 : position - index;
    const imageProgress = Math.min(
        1,
        Math.max(0, (featureProgress - imageTransitionStart) / (1 - imageTransitionStart))
    );
    const showDescription = featureProgress >= descriptionRevealProgress &&
        (
            reducedMotion.matches ||
            index === featureSlides.length - 1 ||
            featureProgress < imageTransitionStart
        );

    setActiveFeature(index, showDescription, imageProgress);
}

function closeMenu(restoreFocus = true) {
    if (!menuIsOpen) {
        return;
    }

    menuIsOpen = false;
    navigation.classList.remove('is-open');
    document.body.classList.remove('menu-open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Open navigation');
    header.classList.remove('is-hidden');

    if (restoreFocus && !desktopLayout.matches) {
        menuToggle.focus();
    }
}

function openMenu() {
    if (desktopLayout.matches || menuIsOpen) {
        return;
    }

    menuIsOpen = true;
    header.classList.remove('is-hidden');
    navigation.classList.add('is-open');
    document.body.classList.add('menu-open');
    menuToggle.setAttribute('aria-expanded', 'true');
    menuToggle.setAttribute('aria-label', 'Close navigation');
    menuClose.focus();
}

function configureFeatureLayout() {
    const isDesktop = desktopLayout.matches;
    if (desktopLayoutActive === isDesktop) {
        return;
    }

    desktopLayoutActive = isDesktop;
    closeMenu(false);

    if (isDesktop) {
        featureSection.classList.remove('is-mobile');
        featureSection.classList.add('is-pinned');
        featureSection.style.height = `${(featureSlides.length * featureScrollScreens + 1) * 100}vh`;
        updateDesktopFeature();
        return;
    }

    featureSection.classList.remove('is-pinned');
    featureSection.style.removeProperty('height');
    featureSlides.forEach((slide) => {
        slide.querySelector('img').style.removeProperty('opacity');
    });
    featureSection.classList.add('is-mobile');
    setActiveFeature(activeFeature);
}

function updateHeader() {
    const currentScrollY = window.scrollY;
    const delta = currentScrollY - lastScrollY;
    lastScrollY = currentScrollY;

    if (menuIsOpen) {
        header.classList.remove('is-hidden');
        accumulatedScroll = 0;
        return;
    }

    if (currentScrollY <= 20) {
        header.classList.remove('is-hidden');
        accumulatedScroll = 0;
        scrollDirection = 0;
        return;
    }

    if (delta === 0) {
        return;
    }

    const direction = Math.sign(delta);
    if (direction !== scrollDirection) {
        scrollDirection = direction;
        accumulatedScroll = 0;
    }

    accumulatedScroll += Math.abs(delta);
    if (accumulatedScroll < 12) {
        return;
    }

    header.classList.toggle('is-hidden', direction > 0);
    accumulatedScroll = 0;
}

function updateOnScroll() {
    scheduledFrame = 0;
    updateHeader();
    updateDesktopFeature();
}

function scheduleScrollUpdate() {
    if (!scheduledFrame) {
        scheduledFrame = window.requestAnimationFrame(updateOnScroll);
    }
}

menuToggle.addEventListener('click', () => {
    if (menuIsOpen) {
        closeMenu();
    } else {
        openMenu();
    }
});

menuClose.addEventListener('click', () => closeMenu());

navigation.addEventListener('click', (event) => {
    if (event.target.closest('.nav-links a')) {
        closeMenu();
    }
});

document.addEventListener('click', (event) => {
    if (menuIsOpen && !navigation.contains(event.target) && !menuToggle.contains(event.target)) {
        closeMenu(false);
    }
});

document.addEventListener('keydown', (event) => {
    if (!menuIsOpen) {
        return;
    }

    if (event.key === 'Escape') {
        event.preventDefault();
        closeMenu();
        return;
    }

    if (event.key === 'Tab') {
        const focusableElements = [...navigation.querySelectorAll('button:not([disabled]), a[href]')];
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey && document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
        } else if (!event.shiftKey && document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
        }
    }
});

featureSlides.forEach((slide) => {
    slide.setAttribute('aria-hidden', 'true');
});

featureIndicators.forEach((indicator, index) => {
    indicator.addEventListener('click', () => {
        if (!desktopLayout.matches) {
            setActiveFeature(index);
        }
    });
});

previousFeature.addEventListener('click', () => {
    if (!desktopLayout.matches && activeFeature > 0) {
        setActiveFeature(activeFeature - 1);
    }
});

nextFeature.addEventListener('click', () => {
    if (!desktopLayout.matches && activeFeature < featureSlides.length - 1) {
        setActiveFeature(activeFeature + 1);
    }
});

featureSection.addEventListener('keydown', (event) => {
    if (desktopLayout.matches || !event.target.closest('.features-controls, .features-indicators')) {
        return;
    }

    if (event.key === 'ArrowLeft' && activeFeature > 0) {
        event.preventDefault();
        setActiveFeature(activeFeature - 1);
    } else if (event.key === 'ArrowRight' && activeFeature < featureSlides.length - 1) {
        event.preventDefault();
        setActiveFeature(activeFeature + 1);
    }
});

roadmap.addEventListener('click', (event) => {
    const button = event.target.closest('.roadmap-toggle');
    if (!button) {
        return;
    }

    const details = document.getElementById(button.getAttribute('aria-controls'));
    const isExpanded = button.getAttribute('aria-expanded') === 'true';

    button.setAttribute('aria-expanded', String(!isExpanded));
    details.hidden = isExpanded;
});

const heroEmail = document.querySelector('.hero .waitlist-form input[type="email"]');
heroEmail.addEventListener('focus', () => {
    heroEmail.placeholder = 'you@domain.com';
});
heroEmail.addEventListener('blur', () => {
    heroEmail.placeholder = 'Enter your email address';
});

window.addEventListener('scroll', scheduleScrollUpdate, { passive: true });
window.addEventListener('resize', scheduleScrollUpdate, { passive: true });
window.addEventListener('resize', configureFeatureLayout, { passive: true });
desktopLayout.addEventListener('change', configureFeatureLayout);
reducedMotion.addEventListener('change', updateDesktopFeature);

configureFeatureLayout();
