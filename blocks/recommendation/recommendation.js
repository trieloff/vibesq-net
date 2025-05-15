export default function decorate(block) {
  console.log('override recommendation block');
  /*
   * Add WebTUI helper attributes
   * ---------------------------
   * 1) Mark this block as a rounded box so WebTUI renders it as a card.
   * 2) Convert any eligible links into WebTUI buttons. The conversion rules
   *    are identical to the ones used in the global `decorateWebTUIButtons`
   *    helper inside `scripts/scripts.js`, duplicated here so we don't rely on
   *    cross-module scope.
   */

  // Ensure the recommendation block itself gets the proper box- helper attr
  block.setAttribute('box-', 'round');
  

  // Convert links to WebTUI buttons
  block.querySelectorAll('a').forEach((a) => {
    // Always keep a helpful title attribute
    // (avoids tooltip being the naked href when the link text is replaced)
    a.title = a.title || a.textContent;

    // Skip image links and bare URLs (those whose text equals the href)
    if (a.href === a.textContent.trim() || a.querySelector('img')) return;

    const parent = a.parentElement;
    const grandParent = parent?.parentElement;

    // Helper to turn the link into a button with the given colour variant
    const makeButton = (variant, container) => {
      a.setAttribute('is-', 'button');
      a.setAttribute('variant-', variant);
      container.classList.add('button-container');
    };

    // Case 1: link is the sole child of a <p> or <div>
    if (parent && parent.childNodes.length === 1 && (parent.tagName === 'P' || parent.tagName === 'DIV')) {
      makeButton('sky', parent);
      return;
    }

    // Case 2: <strong><a></a></strong> inside its own <p>
    if (
      parent && parent.tagName === 'STRONG' && parent.childNodes.length === 1
      && grandParent && grandParent.childNodes.length === 1 && grandParent.tagName === 'P'
    ) {
      makeButton('maroon', grandParent);
      return;
    }

    // Case 3: <em><a></a></em> inside its own <p>
    if (
      parent && parent.tagName === 'EM' && parent.childNodes.length === 1
      && grandParent && grandParent.childNodes.length === 1 && grandParent.tagName === 'P'
    ) {
      makeButton('peach', grandParent);
    }
  });
}
