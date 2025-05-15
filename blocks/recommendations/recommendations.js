import {
  decorateBlock,
  loadBlock,
} from '../../scripts/aem.js';

/**
 * Shuffles an array using the Fisher-Yates algorithm
 * @param {Array} array The array to shuffle
 * @returns {Array} The shuffled array
 */
function shuffleArray(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i -= 1) {
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
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
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
    // we ignore the error on localhost, so that we can test the injection cheaply
    if (!res.ok && window.location.hostname !== 'localhost') {
      throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);
    }

    const decoder = new TextDecoder();
    const domParser = new DOMParser();

    // Check if ReadableStream is supported and response body is available
    if (res.body) {
      const reader = res.body.getReader();
      let buffer = '';
      let result;

      // Create main container if it doesn't exist yet, or use existing one for appending
      let pseudoMain, pseudoSection;
      const existingMain = targetElement.parentNode.querySelector('main');

      if (existingMain) {
        // Use existing containers for appending
        pseudoMain = existingMain;
        pseudoSection = existingMain.querySelector('.section');

        // Add a visual separator if we're appending to existing content
        const separator = document.createElement('div');
        separator.classList.add('continuation-separator');
        separator.innerHTML = '<hr><div class="status"><h2>Follow-up Response</h2><p>Additional recommendations based on your request:</p></div>';
        pseudoSection.appendChild(separator);
      } else {
        // Create new containers for initial content
        pseudoMain = document.createElement('main');
        pseudoSection = document.createElement('div');
        pseudoSection.classList.add('section');
        pseudoMain.appendChild(pseudoSection);
        targetElement.parentNode.insertBefore(pseudoMain, targetElement);
      }

      do {
        // eslint-disable-next-line no-await-in-loop
        result = await reader.read();
        if (!result.done) {
          // Decode and buffer the chunk
          buffer += decoder.decode(result.value, { stream: true });

          // Try to parse and insert only complete HTML elements
          // We'll use a temporary wrapper to parse as a fragment
          let lastOpenTag = buffer.lastIndexOf('<');
          let lastCloseTag = buffer.lastIndexOf('>');
          // Only parse up to the last complete tag
          let parseUpTo = lastCloseTag > lastOpenTag ? buffer.length : lastCloseTag + 1;
          if (parseUpTo > 0) {
            const htmlToParse = buffer.slice(0, parseUpTo);

            const doc = domParser.parseFromString(htmlToParse, 'text/html');
            // Insert all child nodes of body
            Array.from(doc.body.childNodes).forEach((node) => {
              pseudoSection.appendChild(node);
              if (node.tagName === 'DIV') {
                decorateBlock(node);
                loadBlock(node);
              }
            });

            // Keep the rest in the buffer
            buffer = buffer.slice(parseUpTo);
          }
        }
      } while (!result.done);

      // Flush the decoder and parse any remaining buffer
      buffer += decoder.decode();
      if (buffer.trim()) {
        const doc = domParser.parseFromString(buffer, 'text/html');
        Array.from(doc.body.childNodes).forEach((node) => {
          pseudoSection.appendChild(node);
        });
      }

      // Add event listeners to any continuation links and follow-up demand buttons
      // This function handles both session continuation links and demand buttons
      function setupContinuationLinks() {
        // Find all continuation links (normal and demand buttons)
        const continuationLinks = pseudoSection.querySelectorAll('a[href*="session="]');

        continuationLinks.forEach((link) => {
          // Remove any existing listeners to avoid duplicates
          link.removeEventListener('click', handleContinuationClick);
          // Add the click handler
          link.addEventListener('click', handleContinuationClick);
        });
      }

      // Handle clicks on continuation links and demand buttons
      async function handleContinuationClick(e) {
        e.preventDefault();
        const href = e.currentTarget.getAttribute('href');
        const url = new URL(href, window.location.href);

        // Get the session ID for potential future use
        const sessionId = url.searchParams.get('session');
        if (sessionId) {
          localStorage.setItem('vibesquare_session_id', sessionId);
        }

        try {
          // Show a loading indicator
          const loadingIndicator = document.createElement('div');
          loadingIndicator.classList.add('status', 'loading-indicator');
          loadingIndicator.innerHTML = '<h2>Loading</h2><p>Processing your request...</p>';
          pseudoSection.appendChild(loadingIndicator);

          // Scroll to show the loading indicator
          loadingIndicator.scrollIntoView({ behavior: 'smooth', block: 'end' });

          // Stream the new content and append it to the existing page
          await streamInto(targetElement, href);

          // Remove the loading indicator
          loadingIndicator.remove();
        } catch (error) {
          console.error('Error streaming follow-up content:', error);

          // Show error message
          const errorEl = document.createElement('div');
          errorEl.classList.add('status', 'error');
          errorEl.innerHTML = `<h2>Error</h2><p>Failed to load follow-up content: ${error.message}</p>`;
          pseudoSection.appendChild(errorEl);
        }
      }

      // Apply the event listeners
      setupContinuationLinks();

      // Find all buttons within the demand options and style them
      const demandButtons = pseudoSection.querySelectorAll('.demand-button');
      demandButtons.forEach(button => {
        button.classList.add('styled-demand-button');
      });
    } else {
      // this does not work and is not supported
    }

    return targetElement;
  } catch (error) {
    // eslint-disable-next-line no-console
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
    listItems.forEach((item) => messageList.appendChild(item));

    // Use maximum of 30 messages for animation
    const MAX_MESSAGES = 30;
    // We've already calculated the max messages in MAX_MESSAGES

    // Hide messages beyond the first MAX_MESSAGES
    if (listItems.length > MAX_MESSAGES) {
      for (let i = MAX_MESSAGES; i < listItems.length; i += 1) {
        listItems[i].style.display = 'none';
      }
      listItems = listItems.slice(0, MAX_MESSAGES);
    }

    // Calculate precise delay for each message
    const totalCycle = 30; // 30 second cycle
    const visibleDuration = 1; // Each message visible for 1 second

    // Calculate the exact delay time for each message to ensure continuous display
    // Each message should start exactly when the previous message ends its visibility
    listItems.forEach((item, index) => {
      // Calculate the exact position in the cycle
      const delay = (index * visibleDuration) % totalCycle;

      // Set both animation-delay and a data attribute for debugging
      item.style.animationDelay = `${delay}s`;
      item.dataset.delay = delay;

      // Force each message to appear for exactly 1 second
      // We'll create a custom animation for each item to ensure precise timing
      const animationName = `message-fade-${index}`;

      // Calculate exact percentages for this message's animation
      const startVisible = (delay / totalCycle) * 100;
      const endVisible = ((delay + visibleDuration) / totalCycle) * 100;

      // Create dynamic keyframe animation
      const styleSheet = document.createElement('style');
      styleSheet.textContent = `
        @keyframes ${animationName} {
          0%, ${startVisible}%, ${endVisible}%, 100% { opacity: 0; }
          ${startVisible + 0.1}%, ${endVisible - 0.1}% { opacity: 1; }
        }
      `;
      document.head.appendChild(styleSheet);

      // Apply this custom animation to the item
      item.style.animation = `${animationName} ${totalCycle}s infinite`;
    });
  }

  // Request geolocation access immediately
  requestGeolocation()
    .then(async (position) => {
      // Location access granted, proceed with recommendations

      // Get the latitude and longitude
      const { latitude, longitude } = position.coords;

      // Check if we have a session ID in localStorage from a previous visit
      const sessionId = localStorage.getItem('vibesquare_session_id');

      // Construct the URL with coordinates
      let url = `/recommendations.html?lat=${latitude}&lon=${longitude}`;

      // If we have a session ID, append it to continue the conversation
      if (sessionId) {
        url += `&session=${sessionId}`;
        // Clear the session ID from localStorage to prevent reusing it unintentionally
        localStorage.removeItem('vibesquare_session_id');
      }

      try {
        // Stream the content into the page
        await streamInto(block.parentNode, url);

        // After successful streaming, remove the loading animation
        setTimeout(() => {
          block.style.display = 'none';
        }, 2000); // Keep the loading animation visible for a moment
      } catch (error) {
        // Failed to stream recommendations, handle error
      }
    })
    .catch(() => {
      // Location access denied, redirect to home
      // Redirect to home page if location access is denied
      window.location.href = '/';
    });
}
