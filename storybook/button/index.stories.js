import React from 'react';
import '../../src/newspack-ui/style.scss';

export default {
  title: 'Newspack UI/Button',
  parameters: {
    layout: 'padded',
    backgrounds: {
      default: 'light',
    },
  },
  argTypes: {
    variant: {
      description: 'The visual style variant of the button',
      control: 'select',
      options: ['primary', 'secondary', 'branded', 'ghost', 'outline', 'destructive'],
      defaultValue: 'secondary',
      table: {
        defaultValue: { summary: 'secondary' },
        type: { summary: 'CSS class: newspack-ui__button--{variant}' },
      },
    },
    text: {
      description: 'The button text',
      control: 'text',
      defaultValue: 'Button',
      if: { arg: 'isIcon', neq: true },
      table: {
        defaultValue: { summary: 'Button' },
        type: { summary: 'Text content' },
      },
    },
    size: {
      description: 'The size of the button',
      control: 'radio',
      options: ['x-small', 'small', 'medium'],
      defaultValue: 'medium',
      table: {
        defaultValue: { summary: 'medium' },
        type: { summary: 'CSS class: newspack-ui__button--{size}' },
      },
    },
    isWide: {
      description: 'Whether the button should take full width',
      control: 'boolean',
      defaultValue: false,
      table: {
        defaultValue: { summary: false },
        type: { summary: 'CSS class: newspack-ui__button--wide' },
      },
    },
    isLoading: {
      description: 'Whether to show loading state',
      control: 'boolean',
      defaultValue: false,
      table: {
        defaultValue: { summary: false },
        type: { summary: 'CSS class: newspack-ui__button--loading' },
      },
    },
    disabled: {
      description: 'Whether the button is disabled',
      control: 'boolean',
      defaultValue: false,
      table: {
        defaultValue: { summary: false },
        type: { summary: 'HTML attribute: disabled' },
      },
    },
    hasIcon: {
      description: 'Whether to show an icon alongside text',
      control: 'boolean',
      defaultValue: false,
      table: {
        defaultValue: { summary: false },
        type: { summary: 'Adds icon element' },
      },
    },
    isIcon: {
      description: 'Whether this is an icon-only button',
      control: 'boolean',
      defaultValue: false,
      if: { arg: 'hasIcon', truthy: true },
      table: {
        defaultValue: { summary: false },
        type: { summary: 'CSS class: newspack-ui__button--icon' },
      },
    },
    iconType: {
      description: 'The WordPress icon to use',
      control: 'select',
      options: ['plus', 'check'],
      defaultValue: 'plus',
      if: { arg: 'hasIcon', eq: true, or: { arg: 'isIcon', eq: true } },
      table: {
        defaultValue: { summary: 'plus' },
        type: { summary: 'WordPress icon component' },
      },
    },
    iconPosition: {
      description: 'Position of the icon relative to text',
      control: 'radio',
      options: ['left', 'right'],
      defaultValue: 'left',
      if: { arg: 'hasIcon', truthy: true },
      table: {
        defaultValue: { summary: 'left' },
        type: { summary: 'Order of icon and text elements' },
      },
    },
  },
};

const StoryWrapper = ({ children }) => (
  <div style={{
    width: '100%',
    display: 'flex',
    justifyContent: 'center'
  }}>
    <div style={{ width: '100%' }}>
      {children}
    </div>
  </div>
);

const getButtonClasses = (args) => {
  const classes = ['newspack-ui__button'];
  if (args.variant) {
    classes.push(`newspack-ui__button--${args.variant}`);
  }
  if (args.size && args.size !== 'medium') {
    classes.push(`newspack-ui__button--${args.size}`);
  }
  if (args.isWide) {
    classes.push('newspack-ui__button--wide');
  }
  if (args.isLoading) {
    classes.push('newspack-ui__button--loading');
  }
  if (args.isIcon) {
    classes.push('newspack-ui__button--icon');
  }
  return classes.filter(Boolean).join(' ');
};

const ICONS = {
  plus: (
    <svg aria-hidden="true" focusable="false" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M18 11.2h-5.2V6h-1.6v5.2H6v1.6h5.2V18h1.6v-5.2H18z" /></svg>
  ),
  check: (
    <svg aria-hidden="true" focusable="false" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M16.7 7.1l-6.3 8.5-3.3-2.5-.9 1.2 4.5 3.4L17.9 8z" /></svg>
  )
};

const renderButtonContent = (args) => {
  if (args.isIcon) {
    return <span className="newspack-ui__button__glyph">{ICONS[args.iconType || 'plus']}</span>;
  }

  const textElement = <span className="newspack-ui__button__label">{args.text}</span>;

  if (!args.hasIcon) {
    return textElement;
  }

  const iconElement = <span className="newspack-ui__button__glyph">{ICONS[args.iconType || 'plus']}</span>;

  return args.iconPosition === 'left' ? [iconElement, textElement] : [textElement, iconElement];
};

// Primary button
export const Primary = {
  args: {
    variant: 'primary',
    text: 'Primary Button',
  },
  render: (args) => (
    <StoryWrapper>
      <div className="newspack-ui">
        <button className={getButtonClasses(args)} disabled={args.disabled} aria-label={args.isIcon ? args.iconType || 'plus' : undefined}>
          {renderButtonContent(args)}
        </button>
      </div>
    </StoryWrapper>
  ),
};

// Secondary button
export const Secondary = {
  args: {
    variant: 'secondary',
    text: 'Secondary Button',
  },
  render: (args) => (
    <StoryWrapper>
      <div className="newspack-ui">
        <button className={getButtonClasses(args)} disabled={args.disabled} aria-label={args.isIcon ? args.iconType || 'plus' : undefined}>
          {renderButtonContent(args)}
        </button>
      </div>
    </StoryWrapper>
  ),
};

// Branded button
export const Branded = {
  args: {
    variant: 'branded',
    text: 'Branded Button',
  },
  render: (args) => (
    <StoryWrapper>
      <div className="newspack-ui">
        <button className={getButtonClasses(args)} disabled={args.disabled} aria-label={args.isIcon ? args.iconType || 'plus' : undefined}>
          {renderButtonContent(args)}
        </button>
      </div>
    </StoryWrapper>
  ),
};

// Ghost button
export const Ghost = {
  args: {
    variant: 'ghost',
    text: 'Ghost Button',
  },
  render: (args) => (
    <StoryWrapper>
      <div className="newspack-ui">
        <button className={getButtonClasses(args)} disabled={args.disabled} aria-label={args.isIcon ? args.iconType || 'plus' : undefined}>
          {renderButtonContent(args)}
        </button>
      </div>
    </StoryWrapper>
  ),
};

// Outline button
export const Outline = {
  args: {
    variant: 'outline',
    text: 'Outline Button',
  },
  render: (args) => (
    <StoryWrapper>
      <div className="newspack-ui">
        <button className={getButtonClasses(args)} disabled={args.disabled} aria-label={args.isIcon ? args.iconType || 'plus' : undefined}>
          {renderButtonContent(args)}
        </button>
      </div>
    </StoryWrapper>
  ),
};

// Destructive button
export const Destructive = {
  args: {
    variant: 'destructive',
    text: 'Destructive Button',
  },
  render: (args) => (
    <StoryWrapper>
      <div className="newspack-ui">
        <button className={getButtonClasses(args)} disabled={args.disabled} aria-label={args.isIcon ? args.iconType || 'plus' : undefined}>
          {renderButtonContent(args)}
        </button>
      </div>
    </StoryWrapper>
  ),
};

// Icon-only button
export const IconOnly = {
  args: {
    variant: 'secondary',
    size: 'medium',
    isWide: false,
    isLoading: false,
    disabled: false,
    hasIcon: true,
    isIcon: true,
    iconType: 'plus',
  },
  render: (args) => (
    <StoryWrapper>
      <div className="newspack-ui">
        <button className={getButtonClasses(args)} disabled={args.disabled} aria-label={args.iconType}>
          {renderButtonContent(args)}
        </button>
      </div>
    </StoryWrapper>
  ),
};
