// Slider functionality
const sliderTrack = document.querySelector('.slider-track');
const slides = document.querySelectorAll('.slide');
const dots = document.querySelectorAll('.dot');

let currentSlide = 0;
let autoPlayInterval;
let isDragging = false;
let startPos = 0;
let currentTranslate = 0;
let prevTranslate = 0;

// Function to update slider position
function updateSlider() {
  sliderTrack.style.transform = `translateX(-${currentSlide * 100}%)`;
  
  // Update dots
  dots.forEach((dot, index) => {
    dot.classList.toggle('active', index === currentSlide);
  });
}

// Function to go to specific slide
function goToSlide(slideIndex) {
  currentSlide = slideIndex;
  if (currentSlide < 0) {
    currentSlide = slides.length - 1;
  } else if (currentSlide >= slides.length) {
    currentSlide = 0;
  }
  updateSlider();
  resetAutoPlay();
}

// Auto play functionality
function startAutoPlay() {
  autoPlayInterval = setInterval(() => {
    goToSlide(currentSlide + 1);
  }, 5000);
}

function resetAutoPlay() {
  clearInterval(autoPlayInterval);
  startAutoPlay();
}

// Dot click handlers
dots.forEach((dot, index) => {
  dot.addEventListener('click', () => {
    goToSlide(index);
  });
});

// Touch and mouse drag functionality
function getPositionX(event) {
  return event.type.includes('mouse') ? event.pageX : event.touches[0].clientX;
}

function dragStart(event) {
  isDragging = true;
  startPos = getPositionX(event);
  sliderTrack.style.cursor = 'grabbing';
  clearInterval(autoPlayInterval);
}

function dragMove(event) {
  if (!isDragging) return;
  
  const currentPosition = getPositionX(event);
  const diff = currentPosition - startPos;
  currentTranslate = prevTranslate + diff;
}

function dragEnd() {
  if (!isDragging) return;
  
  isDragging = false;
  sliderTrack.style.cursor = 'grab';
  
  const movedBy = currentTranslate - prevTranslate;
  
  // If moved enough, change slide
  if (movedBy < -50) {
    goToSlide(currentSlide + 1);
  } else if (movedBy > 50) {
    goToSlide(currentSlide - 1);
  }
  
  currentTranslate = 0;
  prevTranslate = 0;
}

// Mouse events
sliderTrack.addEventListener('mousedown', dragStart);
sliderTrack.addEventListener('mousemove', dragMove);
sliderTrack.addEventListener('mouseup', dragEnd);
sliderTrack.addEventListener('mouseleave', dragEnd);

// Touch events
sliderTrack.addEventListener('touchstart', dragStart);
sliderTrack.addEventListener('touchmove', dragMove);
sliderTrack.addEventListener('touchend', dragEnd);

// Prevent context menu on long press
sliderTrack.addEventListener('contextmenu', (e) => {
  e.preventDefault();
});

// Initialize slider
updateSlider();
startAutoPlay();
