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
import { Notice, SectionHeader, Waiting, withWizardScreen } from '../../../../components/src';
import Prompt from './prompt';

export default withWizardScreen( () => {
	const [ inFlight, setInFlight ] = useState( false );
	const [ error, setError ] = useState( false );
	const [ prompts, setPrompts ] = useState( null );

	const fetchPrompts = () => {
		setError( false );
		setInFlight( true );
		apiFetch( {
			path: '/newspack/v1/wizard/newspack-engagement-wizard/reader-activation/campaign',
		} )
			.then( fetchedPrompts => {
				setPrompts( fetchedPrompts );
			} )
			.catch( setError )
			.finally( () => setInFlight( false ) );
	};

	useEffect( fetchPrompts, [] );

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
			{ ! prompts && (
				<>
					<Waiting isLeft />
					{ __( 'Retrieving status…', 'newspack' ) }
				</>
			) }
			{ prompts &&
				prompts.map( prompt => (
					<Prompt key={ prompt.slug } prompt={ prompt } inFlight={ inFlight } />
				) ) }
		</>
	);
} );
