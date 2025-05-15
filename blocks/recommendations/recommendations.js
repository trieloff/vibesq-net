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
 * Stream HTML content from a URL and insert it into the DOM
 * @param {Element} targetElement Element to insert content before
 * @param {string} url URL to fetch content from
 * @returns {Promise} Promise that resolves when streaming is complete
 */
async function streamInto(targetElement, url) {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);
    }
    
    // Create a container for the streamed content
    const streamContainer = document.createElement('div');
    streamContainer.className = 'streamed-recommendations';
    
    // Insert the container before the target element
    targetElement.parentNode.insertBefore(streamContainer, targetElement);
    
    const decoder = new TextDecoder();
    
    // Check if ReadableStream is supported and response body is available
    if (res.body) {
      const reader = res.body.getReader();
      
      // Read the stream
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        // Decode and insert the chunk
        const chunk = decoder.decode(value, { stream: true });
        streamContainer.insertAdjacentHTML('beforeend', chunk);
      }
      
      // Flush the decoder
      streamContainer.insertAdjacentHTML('beforeend', decoder.decode());
    } else {
      // Fallback for browsers that don't support streaming
      const text = await res.text();
      streamContainer.insertAdjacentHTML('beforeend', text);
    }
    
    return streamContainer;
  } catch (error) {
    console.error('Error streaming content:', error);
    throw error;
  }
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
    let listItems = [...messageList.querySelectorAll('li')];
    
    // Shuffle all messages first
    listItems = shuffleArray(listItems);
    
    // Create new list from shuffled items
    messageList.innerHTML = '';
    listItems.forEach(item => messageList.appendChild(item));
    
    // Limit to max 30 messages - but only after shuffling
    if (listItems.length > 30) {
      // Hide messages beyond the first 30
      for (let i = 30; i < listItems.length; i++) {
        listItems[i].style.display = 'none';
      }
      // Only animate the first 30
      listItems = listItems.slice(0, 30);
    }
    
    // Assign animation delays to each list item (sequential after shuffle)
    listItems.forEach((item, index) => {
      // Set the delay using CSS custom property and regular animation-delay
      item.style.setProperty('--delay', `${index}s`);
      item.style.animationDelay = `var(--delay)`;
    });
  }
  
  // Request geolocation access immediately
  requestGeolocation()
    .then(async (position) => {
      console.log('Location access granted:', position);
      
      // Get the latitude and longitude
      const { latitude, longitude } = position.coords;
      
      // Construct the URL with coordinates
      const url = `/recommendations.html?lat=${latitude}&lon=${longitude}`;
      
      try {
        // Stream the content into the page
        await streamInto(block.parentNode, url);
        
        // After successful streaming, remove the loading animation
        setTimeout(() => {
          block.style.display = 'none';
        }, 2000); // Keep the loading animation visible for a moment
      } catch (error) {
        console.error('Failed to stream recommendations:', error);
      }
    })
    .catch((error) => {
      console.log('Location access denied:', error.message);
      // Redirect to home page if location access is denied
      window.location.href = '/';
    });
}