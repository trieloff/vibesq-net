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
  
  // Create the checkbox for terms
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.id = 'terms-checkbox';
  checkbox.className = 'terms-checkbox';
  
  // Add event listener to toggle disabled class
  checkbox.addEventListener('change', () => {
    if (checkbox.checked) {
      loginButton.classList.remove('disabled');
    } else {
      loginButton.classList.add('disabled');
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