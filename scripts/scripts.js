import {
  buildBlock,
  loadHeader,
  loadFooter,
  decorateButtons,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  waitForFirstImage,
  loadSection,
  loadSections,
  loadCSS,
} from './aem.js';

/**
 * Builds hero block and prepends to main in a new section.
 * @param {Element} main The container element
 */
function buildHeroBlock(main) {
  const h1 = main.querySelector('h1');
  const picture = main.querySelector('picture');
  // eslint-disable-next-line no-bitwise
  if (h1 && picture && (h1.compareDocumentPosition(picture) & Node.DOCUMENT_POSITION_PRECEDING)) {
    const section = document.createElement('div');
    section.append(buildBlock('hero', { elems: [picture, h1] }));
    main.prepend(section);
  }
}

/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
    // do nothing
  }
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks(main) {
  try {
    buildHeroBlock(main);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

/**
 * Custom button decoration for WebTUI
 * @param {Element} element The element to decorate
 */
function decorateWebTUIButtons(element) {
  element.querySelectorAll('a').forEach((a) => {
    a.title = a.title || a.textContent;
    if (a.href !== a.textContent) {
      const up = a.parentElement;
      const twoup = a.parentElement.parentElement;
      if (!a.querySelector('img')) {
        if (up.childNodes.length === 1 && (up.tagName === 'P' || up.tagName === 'DIV')) {
          // Convert to button with WebTUI attributes
          a.setAttribute('is-', 'button');
          a.setAttribute('variant-', 'sky');
          up.classList.add('button-container');
        }
        if (
          up.childNodes.length === 1
          && up.tagName === 'STRONG'
          && twoup.childNodes.length === 1
          && twoup.tagName === 'P'
        ) {
          // Primary button
          a.setAttribute('is-', 'button');
          a.setAttribute('variant-', 'maroon');
          twoup.classList.add('button-container');
        }
        if (
          up.childNodes.length === 1
          && up.tagName === 'EM'
          && twoup.childNodes.length === 1
          && twoup.tagName === 'P'
        ) {
          // Secondary button
          a.setAttribute('is-', 'button');
          a.setAttribute('variant-', 'peach');
          twoup.classList.add('button-container');
        }
      }
    }
  });
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  // Use custom WebTUI button decoration
  decorateWebTUIButtons(main);
  decorateIcons(main);
  buildAutoBlocks(main);
  decorateSections(main);
  // Add box attribute to all sections
  main.querySelectorAll('.section').forEach((section) => {
    section.setAttribute('box-', 'square');
  });
  decorateBlocks(main);
  // Add box attribute to all blocks
  main.querySelectorAll('.block').forEach((block) => {
    block.setAttribute('box-', 'round');
  });
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = 'en';
  // Enable catppuccin theme based on OS settings
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.setAttribute('data-webtui-theme', 'catppuccin-mocha');
  } else {
    document.documentElement.setAttribute('data-webtui-theme', 'catppuccin-latte');
  }
  
  // Listen for theme changes
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (e.matches) {
        document.documentElement.setAttribute('data-webtui-theme', 'catppuccin-mocha');
      } else {
        document.documentElement.setAttribute('data-webtui-theme', 'catppuccin-latte');
      }
    });
  }
  
  decorateTemplateAndTheme();
  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
    document.body.classList.add('appear');
    await loadSection(main.querySelector('.section'), waitForFirstImage);
  }

  try {
    /* if desktop (proxy for fast connection) or fonts already loaded, load fonts.css */
    if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) {
      loadFonts();
    }
  } catch (e) {
    // do nothing
  }
}

/**
 * Adds a home button at the bottom of non-home pages
 * @param {Element} main The main element
 */
function addHomeButton(main) {
  // Only add button if not on home page
  if (window.location.pathname !== '/' && window.location.pathname !== '/index.html') {
    const homeSection = document.createElement('div');
    homeSection.classList.add('section');
    
    const homeDiv = document.createElement('div');
    const homeP = document.createElement('p');
    const homeLink = document.createElement('a');
    
    homeLink.href = '/';
    homeLink.textContent = '⏏ Eject Eject Eject';
    homeLink.setAttribute('is-', 'button');
    homeLink.setAttribute('variant-', 'sky');
    homeLink.setAttribute('box-', 'round');
    
    homeP.appendChild(homeLink);
    homeDiv.appendChild(homeP);
    homeSection.appendChild(homeDiv);
    main.appendChild(homeSection);
  }
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  const main = doc.querySelector('main');
  await loadSections(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  loadHeader(doc.querySelector('header'));
  loadFooter(doc.querySelector('footer'));
  
  // Add home button for non-home pages
  addHomeButton(main);

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadFonts();
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  // eslint-disable-next-line import/no-cycle
  window.setTimeout(() => import('./delayed.js'), 3000);
  // load anything that can be postponed to the latest here
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();
