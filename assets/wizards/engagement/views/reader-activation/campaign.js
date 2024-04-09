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
	utils,
} from '../../../../components/src';
import Prompt from '../../components/prompt';
import Router from '../../../../components/src/proxied-imports/router';
import './style.scss';

const { is_skipped_campaign_setup, reader_activation_url } = newspack_engagement_wizard;
const { useHistory } = Router;

export default withWizardScreen( () => {
	const [ inFlight, setInFlight ] = useState( false );
	const [ error, setError ] = useState( false );
	const [ prompts, setPrompts ] = useState( null );
	const [ allReady, setAllReady ] = useState( false );
	const [ isSetupSkipped, setIsSetupSkipped ] = useState( is_skipped_campaign_setup === '1' );

	const history = useHistory();

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
					disabled={ isSetupSkipped }
					onClick={ () => {
						if (
							utils.confirmAction(
								__(
									'Are you sure you want to skip setting up a reader activation campaign?',
									'newspack-plugin'
								)
							)
						) {
							apiFetch( {
								path: '/newspack/v1/wizard/newspack-engagement-wizard/reader-activation/skip-campaign-setup',
								method: 'POST',
							} )
								.then( res => {
									setIsSetupSkipped( Boolean( res ) );
									history.push( '/reader-activation' );
									newspack_engagement_wizard.is_skipped_campaign_setup = '1';
								} )
								.catch( () => setIsSetupSkipped( false ) );
						} else {
							console.log( 'Denied' );
						}
					} }
				>
					{ __( 'Skip', 'newspack-plugin' ) }
				</Button>
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
