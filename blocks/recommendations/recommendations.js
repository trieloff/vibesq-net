/**
 * Shuffles an array using the Fisher-Yates algorithm
 * @param {Array} array The array to shuffle
 * @returns {Array} The shuffled array
 */
function shuffleArray(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

/**
 * Request geolocation access
 * @returns {Promise} Promise that resolves when location is granted, rejects when denied
 */
function requestGeolocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve(position);
      },
      (error) => {
        reject(error);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });
}

/**
 * Decorates the recommendations block
 * @param {Element} block The recommendations block element
 */
export default function decorate(block) {
  // Add loading class to activate the CSS animations
  block.classList.add('loading');
  
  // Find the list of messages
  const messageList = block.querySelector('ol, ul');
  
  if (messageList) {
    // Get all list items
    const listItems = [...messageList.querySelectorAll('li')];
    
    // Create a shuffled array of delays (0 to listItems.length - 1)
    const delays = shuffleArray([...Array(listItems.length).keys()]);
    
    // Assign shuffled animation delays to each list item
    listItems.forEach((item, index) => {
      // Assign a random delay from our shuffled array
      item.style.animationDelay = `${delays[index]}s`;
    });
  }
  
  // Request geolocation access immediately
  requestGeolocation()
    .then((position) => {
      console.log('Location access granted:', position);
    })
    .catch((error) => {
      console.log('Location access denied:', error.message);
      // Redirect to home page if location access is denied
      window.location.href = '/';
    });
}