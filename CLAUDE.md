# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Adobe Experience Manager (AEM) site built using the AEM Boilerplate. It follows a block-based architecture where UI components are organized as reusable blocks, each with its own CSS and JS file.

## Commands

### Installation

```sh
npm i
```

### Linting

```sh
npm run lint       # Run both JS and CSS linting
npm run lint:js    # Run only JS linting
npm run lint:css   # Run only CSS linting
npm run lint:fix   # Fix automatically fixable lint issues
```

### Local Development

```sh
# Install AEM CLI if not already installed
npm install -g @adobe/aem-cli

# Start AEM Proxy for local development
aem up

# This opens your browser at http://localhost:3000
```

## Architecture

### Block-based Components

The site is structured around blocks (components) in the `/blocks` directory:
- Each block has its own CSS and JS file (`blockname/blockname.css` and `blockname/blockname.js`)
- Blocks include: header, footer, hero, cards, columns, fragment, etc.
- The system automatically loads both CSS and JS for blocks when they're used

### Content Source

- Content is sourced from Google Drive as configured in `fstab.yaml`
- The AEM Code Sync GitHub App synchronizes content changes

### Core Scripts

- `scripts/aem.js`: Core utilities for block loading, decoration, and rendering
- `scripts/scripts.js`: Main site script that loads blocks and initializes the site
- `scripts/delayed.js`: Handles deferred loading of non-critical components

### Progressive Loading Strategy

The site implements a progressive loading approach:
1. Critical content loads first (LCP - Largest Contentful Paint)
2. Non-critical elements load after initial render
3. Low-priority components load after everything else

### Styling

- Global styles are in `/styles` directory
- Block-specific styles are in each block's directory
- The system uses a decoration approach to enhance HTML elements

## Development Workflow

1. Edit block files in their respective directories
2. Run local development server with `aem up`
3. Changes are automatically synced and visible at `http://localhost:3000`
4. Content is edited in the connected Google Drive folder

## Performance Considerations

- The system implements Real User Monitoring (RUM)
- Uses optimized picture elements for images
- Implements progressive loading for better performance
- Font optimization with proper fallbacks

## Contribution Guidelines

- Follow existing code structure and naming conventions
- Use ESLint and Stylelint to ensure code quality (`npm run lint`)
- Follow the PR process outlined in CONTRIBUTING.md