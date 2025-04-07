/**
 * WordPress dependencies
 */
import { Path, Placeholder, SVG } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './style.scss';
import metadata from './block.json';

export const title = __( 'Correction Item', 'newspack-plugin' );

export const icon = (
	<SVG xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
		<Path d="M4 14.5H20V16H4V14.5ZM4 20H13V18.5H4V20ZM12 5.9L10.1 4L4.7 9.4L4.1 12L6.7 11.4L12.1 6L12 5.9Z" />
	</SVG>
);

const EditComponent = ( { context: { postType } } ) => {
	if ( 'newspack_correction' !== postType ) {
		return (
			<Placeholder
				icon={ icon }
				label={ __( 'Corrections & Clarifications', 'newspack-plugin' ) }
				instructions={ __(
					'Please select "Corrections" as the post type in the Query Loop to use this block.',
					'newspack-plugin'
				) }
			/>
		);
	}

	return (
		<>
			<div className="correction__item">
				<strong className="correction__item-title">
					{ __( 'Correction Type, Date, and Time: ', 'newspack-plugin' ) }
				</strong>
				<span className="correction__item-content">
					{ __(
						'This is where the content will appear, providing details about the update, whether correcting an error or offering additional context.',
						'newspack-plugin'
					) }
				</span>
			</div>
			<a className="correction__post-link" href="/#" style={ { pointerEvents: 'none' } }>
				{ __( 'Post Title', 'newspack-plugin' ) }
			</a>
		</>
	);
};

const { name } = metadata;

export { metadata, name };

export const settings = {
	title,
	icon: {
		src: icon,
		foreground: '#406ebc',
	},
	description: __(
		'Display an archive of all the corrections and clarifications.',
		'newspack-plugin'
	),
	usesContext: [ 'postType' ],
	edit: EditComponent,
};
