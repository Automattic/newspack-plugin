import React, { useState } from 'react';
import '../../src/newspack-ui/style.scss';

/**
 * The Segmented Control component provides a tabbed interface for switching between different views or options.
 */
export default {
	title: 'Newspack UI/Segmented Control',
	parameters: {
		layout: 'padded',
		backgrounds: {
			default: 'light',
		},
		docs: {
			source: {
				transform: (_, story) => {
					const args = story.args;
					const segmentedControlClasses = ['newspack-ui__segmented-control'];
					const buttonClasses = ['newspack-ui__button'];

					if (args.size && args.size !== 'medium') {
						buttonClasses.push(`newspack-ui__button--${args.size}`);
					}
					if (args.isWide) {
						segmentedControlClasses.push('newspack-ui__segmented-control--wide');
					}

					return `<div class="newspack-ui">
	<div class="${segmentedControlClasses.join(' ')}">
		<div class="newspack-ui__segmented-control__tabs">
			<button class="${buttonClasses.join(' ')} selected">Last 7 Days</button>
			<button class="${buttonClasses.join(' ')}">Last 30 Days</button>
			<button class="${buttonClasses.join(' ')}">Last Quarter</button>
		</div>
		<div class="newspack-ui__segmented-control__content">
			<div class="newspack-ui__segmented-control__panel selected">
				Showing analytics data for the past 7 days. This is a shorter time range that helps identify recent trends.
			</div>
			<div class="newspack-ui__segmented-control__panel">
				Displaying analytics for the past month. This provides a broader view of your site's performance.
			</div>
			<div class="newspack-ui__segmented-control__panel">
				Quarterly view of analytics data. Use this to understand long-term patterns and seasonal changes.
			</div>
		</div>
	</div>
</div>`;
				},
			},
		},
	},
	argTypes: {
		size: {
			description: 'The size of the buttons',
			control: 'radio',
			options: ['x-small', 'small', 'medium'],
			defaultValue: 'medium',
			table: {
				defaultValue: { summary: 'medium' },
				type: { summary: 'CSS class: newspack-ui__button--{size}' },
			},
		},
		isWide: {
			description: 'Whether the segmented control should take full width with equal-width buttons',
			control: 'boolean',
			defaultValue: false,
			table: {
				defaultValue: { summary: false },
				type: { summary: 'CSS class: newspack-ui__segmented-control--wide' },
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

const getSegmentedControlClasses = (args) => {
	const classes = ['newspack-ui__segmented-control'];
	if (args.size && args.size !== 'medium') {
		classes.push(`newspack-ui__segmented-control--${args.size}`);
	}
	if (args.isWide) {
		classes.push('newspack-ui__segmented-control--wide');
	}
	return classes.filter(Boolean).join(' ');
};

const getTabsClasses = () => {
	return 'newspack-ui__segmented-control__tabs';
};

const getButtonClasses = (isSelected, size) => {
	const classes = ['newspack-ui__button'];
	if (isSelected) {
		classes.push('selected');
	}
	if (size && size !== 'medium') {
		classes.push(`newspack-ui__button--${size}`);
	}
	return classes.join(' ');
};

const SegmentedControlStory = (args) => {
	const [selectedIndex, setSelectedIndex] = useState(0);
	const tabs = [
		{
			label: 'Last 7 Days',
			content: 'Showing analytics data for the past 7 days. This is a shorter time range that helps identify recent trends.',
		},
		{
			label: 'Last 30 Days',
			content: "Displaying analytics for the past month. This provides a broader view of your site's performance.",
		},
		{
			label: 'Last Quarter',
			content: 'Quarterly view of analytics data. Use this to understand long-term patterns and seasonal changes.',
		},
	];

	return (
		<StoryWrapper>
			<div className="newspack-ui">
				<div className={getSegmentedControlClasses(args)}>
					<div className={getTabsClasses()}>
						{tabs.map((tab, index) => (
							<button
								key={tab.label}
								className={getButtonClasses(selectedIndex === index, args.size)}
								onClick={() => setSelectedIndex(index)}
							>
								{tab.label}
							</button>
						))}
					</div>
					<div className="newspack-ui__segmented-control__content">
						{tabs.map((tab, index) => (
							<div
								key={tab.label}
								className={`newspack-ui__segmented-control__panel ${selectedIndex === index ? 'selected' : ''}`}
							>
								{tab.content}
							</div>
						))}
					</div>
				</div>
			</div>
		</StoryWrapper>
	);
};

// Default example
export const Default = {
	args: {
		size: 'medium',
		isWide: false,
	},
	render: SegmentedControlStory,
};

