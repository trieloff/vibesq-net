/**
 * Decorates the recommendations block
 * @param {Element} block The recommendations block element
 */
export default function decorate(block) {
  // Add loading class to activate the CSS animations
  block.classList.add('loading');
  
  // The messages are already in the DOM, and the CSS animations will handle
  // showing/hiding them in sequence
}