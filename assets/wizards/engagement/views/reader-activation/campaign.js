/* global newspack_engagement_wizard */

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	Button,
	Notice,
	SectionHeader,
	Waiting,
	withWizardScreen,
} from '../../../../components/src';
import Prompt from '../../components/prompt';
import './style.scss';

export default withWizardScreen( () => {
	const [ inFlight, setInFlight ] = useState( false );
	const [ error, setError ] = useState( false );
	const [ prompts, setPrompts ] = useState( null );
	const [ allReady, setAllReady ] = useState( false );
	const { reader_activation_url } = newspack_engagement_wizard;

	const fetchPrompts = () => {
		setError( false );
		setInFlight( true );
		apiFetch( {
			path: '/newspack-popups/v1/reader-activation/campaign',
		} )
			.then( fetchedPrompts => {
				setPrompts( fetchedPrompts );
			} )
			.catch( setError )
			.finally( () => setInFlight( false ) );
	};

	useEffect( () => {
		window.scrollTo( 0, 0 );
		fetchPrompts();
	}, [] );

	useEffect( () => {
		if ( Array.isArray( prompts ) && 0 < prompts.length ) {
			setAllReady( prompts.every( prompt => prompt.ready ) );
		}
	}, [ prompts ] );

	return (
		<div className="newspack-ras-campaign__prompt-wizard">
			<SectionHeader
				title={ __( 'Set Up Reader Activation Campaign', 'newspack-plugin' ) }
				description={ __(
					'Preview and customize the prompts, or use our suggested defaults.',
					'newspack-plugin'
				) }
			/>
			{ error && (
				<Notice
					noticeText={ error?.message || __( 'Something went wrong.', 'newspack-plugin' ) }
					isError
				/>
			) }
			{ ! prompts && ! error && (
				<>
					<Waiting isLeft />
					{ __( 'Retrieving prompts…', 'newspack-plugin' ) }
				</>
			) }
			{ prompts &&
				prompts.map( prompt => (
					<Prompt
						key={ prompt.slug }
						prompt={ prompt }
						inFlight={ inFlight }
						setInFlight={ setInFlight }
						setPrompts={ setPrompts }
					/>
				) ) }
			<div className="newspack-buttons-card">
				<Button
					isPrimary
					disabled={ inFlight || ! allReady }
					href={ `${ reader_activation_url }/complete` }
				>
					{ __( 'Continue', 'newspack-plugin' ) }
				</Button>
				<Button isSecondary disabled={ inFlight } href={ reader_activation_url }>
					{ __( 'Back', 'newspack-plugin' ) }
				</Button>
			</div>
		</div>
	);
} );
