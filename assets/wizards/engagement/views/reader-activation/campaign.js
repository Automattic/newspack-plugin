/* global newspack_engagement_wizard */
/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { ExternalLink } from '@wordpress/components';
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Notice, SectionHeader, withWizardScreen } from '../../../../components/src';
import Prompt from './prompt';

const prompts = {
	ras_registration_overlay: {
		featured_image_id: null,
		ready: false,
		title: __( 'Registration Overlay', 'newspack' ),
		user_inputs: [
			{
				name: 'heading',
				type: 'string',
				label: __( 'Heading', 'newspack' ),
				description: __( 'A heading to describe the prompt.', 'newspack' ),
				required: true,
				default: __( 'Sign Up', 'newspack' ),
				max_length: 40,
			},
			{
				name: 'body',
				type: 'string',
				label: __( 'Body', 'newspack' ),
				description: __( 'The primary call to action for the promptt.', 'newspack' ),
				required: true,
				default: __( 'Sign up for our free newsletter to receive the latest news.', 'newspack' ),
				max_length: 300,
			},
			{
				name: 'button_label',
				type: 'string',
				label: __( 'Button Label', 'newspack' ),
				description: __( 'The label for the primary CTA button.', 'newspack' ),
				required: true,
				default: __( 'Sign up', 'newspack' ),
				max_length: 20,
			},
			{
				name: 'success_message',
				type: 'string',
				label: __( 'Success Message', 'newspack' ),
				description: __( 'The message shown to readers after completing the signup.', 'newspack' ),
				required: true,
				default: __( 'Thank you for registering!', 'newspack' ),
				max_length: 300,
			},
			{
				name: 'list_ids',
				type: 'array',
				options: [
					{
						id: 1,
						label: __( 'List 1', 'newspack' ),
						checked: false,
					},
					{
						id: 2,
						label: __( 'List 2', 'newspack' ),
						checked: false,
					},
				],
				label: __( 'Select Newsletters', 'newspack' ),
				required: true,
				default: [],
			},
		],
	},
};

export default withWizardScreen( () => {
	const [ inFlight, setInFlight ] = useState( false );
	const [ error, setError ] = useState( false );

	return (
		<>
			<SectionHeader
				title={ __( 'Set Up Reader Activation Campaign', 'newspack' ) }
				description={ __(
					'Preview and customize the prompts, or use our suggested defaults.',
					'newspack'
				) }
			/>
			{ error && (
				<Notice
					noticeText={ error?.message || __( 'Something went wrong.', 'newspack' ) }
					isError
				/>
			) }
			{ Object.keys( prompts ).map( key => (
				<Prompt key={ key } prompt={ prompts[ key ] } slug={ key } />
			) ) }
		</>
	);
} );
