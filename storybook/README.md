# Newspack UI Storybook

This directory contains the Storybook implementation for Newspack UI components. Storybook is a development environment for UI components, allowing you to browse a component library, view the different states of each component, and interactively develop and test components.

## Running Storybook

From the plugin root directory:

```bash
npm run storybook
```

This will open Storybook in your default browser at `http://localhost:6006`.

## Available Scripts

- `npm run storybook` - Start Storybook development server
- `npm run build-storybook` - Build static Storybook for deployment

## Troubleshooting

Common issues and solutions:

1. **Storybook fails to start**
   - Check Node.js version
   - Clear npm cache: `npm cache clean --force`
   - Delete node_modules and reinstall: `rm -rf node_modules && npm install`

2. **Stories not appearing**
   - Verify file naming follows conventions
   - Check story export format
   - Clear Storybook cache: `rm -rf node_modules/.cache/storybook`

3. **Styles not loading**
   - Verify style imports
   - Check webpack configuration
   - Clear browser cache

## Resources

- [Storybook Documentation](https://storybook.js.org/docs)
- [MDX Documentation](https://mdxjs.com/docs/)
