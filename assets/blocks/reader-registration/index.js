/**
 * WordPress dependencies
 */
import { useInnerBlocksProps, useBlockProps } from '@wordpress/block-editor';
import { Path, SVG } from '@wordpress/components';

/**
 * Internal dependencies
 */
import edit from './edit';
import metadata from './block.json';

export const icon = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
		<Path d="M18.5 8V5.5H16V4h2.5V1.5H20V4h2.5v1.5H20V8h-1.5ZM16.75 17v-2A2.75 2.75 0 0 0 14 12.25h-4A2.75 2.75 0 0 0 7.25 15v2h1.5v-2c0-.69.56-1.25 1.25-1.25h4c.69 0 1.25.56 1.25 1.25v2h1.5Z" />
		<Path
			fillRule="evenodd"
			clipRule="evenodd"
			d="M14.5 8.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Zm-1.5 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"
		/>
	</SVG>
);

const { name } = metadata;

export { metadata, name };

export const settings = {
	icon: {
		src: icon,
		foreground: '#36f',
	},
	edit,
	save: () => <div { ...useInnerBlocksProps.save( useBlockProps.save() ) } />,
};
