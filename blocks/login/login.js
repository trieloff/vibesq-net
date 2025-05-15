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
 * Decorates the login block
 * @param {Element} block The login block element
 */
export default function decorate(block) {
  // Get the block rows
  const rows = [...block.children];

  // First row contains terms and conditions text
  const termsRow = rows[0];
  const termsCell = termsRow.querySelector('div');

  // Second row contains login button
  const loginRow = rows[1];
  const loginCell = loginRow.querySelector('div');
  const loginButton = loginCell.querySelector('a');

  // Add disabled class to login button initially
  if (loginButton) {
    loginButton.classList.add('login-button', 'disabled');
  }

  // Create a status message element
  const statusMessage = document.createElement('div');
  statusMessage.className = 'location-status';
  statusMessage.style.color = '#666';
  statusMessage.style.fontSize = '0.875rem';
  statusMessage.style.marginTop = '0.5rem';
  loginCell.appendChild(statusMessage);

  // Create the checkbox for terms
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.id = 'terms-checkbox';
  checkbox.className = 'terms-checkbox';

  // Track whether location has been granted
  let locationGranted = false;

  // Add event listener to handle checkbox changes
  checkbox.addEventListener('change', () => {
    if (checkbox.checked) {
      // Request geolocation when checkbox is checked
      statusMessage.textContent = 'Requesting location access...';

      requestGeolocation()
        .then(() => {
          locationGranted = true;
          statusMessage.textContent = 'Location access granted';
          statusMessage.style.color = 'green';
          loginButton.classList.remove('disabled');
        })
        .catch((error) => {
          checkbox.checked = false;
          statusMessage.textContent = `Location access denied: ${error.message}`;
          statusMessage.style.color = 'red';
          loginButton.classList.add('disabled');
        });
    } else {
      // Checkbox unchecked, disable login
      loginButton.classList.add('disabled');
      if (locationGranted) {
        statusMessage.textContent = 'Please check the box to proceed';
        statusMessage.style.color = '#666';
      }
    }
  });

  // Prevent default behavior of login link when disabled
  loginButton.addEventListener('click', (event) => {
    if (loginButton.classList.contains('disabled')) {
      event.preventDefault();
    }
  });

  // Process the terms paragraph - we assume the first cell contains a paragraph
  const termsParagraph = termsCell.querySelector('p') || termsCell;

  // Create a label to wrap the existing paragraph content
  const label = document.createElement('label');
  label.setAttribute('for', 'terms-checkbox');

  // Move all content from the paragraph to the label
  while (termsParagraph.childNodes.length > 0) {
    label.appendChild(termsParagraph.childNodes[0]);
  }

  // Insert checkbox at the beginning of the paragraph and add the label
  termsParagraph.appendChild(checkbox);
  termsParagraph.appendChild(label);

  // Add a class to the container for styling
  termsCell.classList.add('terms-container');
}
