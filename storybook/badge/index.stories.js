import React from 'react';
import '../../src/newspack-ui/style.scss';

export default {
    title: 'Newspack UI/Badge',
    parameters: {
        layout: 'padded',
        backgrounds: {
            default: 'light',
        }
    },
    argTypes: {
        variant: {
            description: 'The visual style variant of the badge',
            control: 'select',
            options: ['primary', 'secondary', 'outline', 'success', 'error', 'warning'],
            defaultValue: 'primary',
            table: {
                defaultValue: { summary: 'primary' },
                type: { summary: 'CSS class: newspack-ui__badge--{variant}' },
            },
        },
        text: {
            description: 'The badge text',
            control: 'text',
            defaultValue: 'Badge',
            table: {
                defaultValue: { summary: 'Badge' },
                type: { summary: 'Text content' },
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

const getBadgeClasses = (args) => {
    const classes = ['newspack-ui__badge'];
    if (args.variant) {
        classes.push(`newspack-ui__badge--${args.variant}`);
    }
    return classes.filter(Boolean).join(' ');
};

const BadgeStory = (args) => (
    <StoryWrapper>
        <div className="newspack-ui">
            <span className={getBadgeClasses(args)}>
                {args.text}
            </span>
        </div>
    </StoryWrapper>
);

// Primary badge
export const Primary = {
    args: {
        variant: 'primary',
        text: 'Primary',
    },
    render: BadgeStory,
};

// Secondary badge
export const Secondary = {
    args: {
        variant: 'secondary',
        text: 'Secondary',
    },
    render: BadgeStory,
};

// Outline badge
export const Outline = {
    args: {
        variant: 'outline',
        text: 'Outline',
    },
    render: BadgeStory,
};

// Success badge
export const Success = {
    args: {
        variant: 'success',
        text: 'Success',
    },
    render: BadgeStory,
};

// Error badge
export const Error = {
    args: {
        variant: 'error',
        text: 'Error',
    },
    render: BadgeStory,
};

// Warning badge
export const Warning = {
    args: {
        variant: 'warning',
        text: 'Warning',
    },
    render: BadgeStory,
};
