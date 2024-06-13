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

const { useHistory } = Router;

export default withWizardScreen( () => {
	const { is_skipped_campaign_setup, reader_activation_url } = newspack_engagement_wizard;

	const [ inFlight, setInFlight ] = useState( false );
	const [ error, setError ] = useState( false );
	const [ prompts, setPrompts ] = useState( null );
	const [ allReady, setAllReady ] = useState( false );
	const [ skipped, setSkipped ] = useState( {
		status: '',
		isSkipped: is_skipped_campaign_setup === '1',
	} );
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

	/**
	 * Display prompt requiring editors to confirm skipping, on confirmation send request to
	 * server to store skipped option in options table and redirect back to RAS
	 *
	 * @return {void}
	 */
	async function onSkipCampaignSetup() {
		if (
			! utils.confirmAction(
				__(
					'Are you sure you want to skip setting up a reader activation campaign?',
					'newspack-plugin'
				)
			)
		) {
			return;
		}
		setError( false );
		setSkipped( { ...skipped, status: 'pending' } );
		try {
			const request = await apiFetch( {
				path: '/newspack/v1/wizard/newspack-engagement-wizard/reader-activation/skip-campaign-setup',
				method: 'POST',
				data: { skip: ! skipped.isSkipped },
			} );
			if ( ! request.updated ) {
				setError( { message: __( 'Server not updated', 'newspack-plugin' ) } );
				setSkipped( { isSkipped: false, status: '' } );
				return;
			}
			setSkipped( { isSkipped: Boolean( request.skipped ), status: '' } );
			newspack_engagement_wizard.is_skipped_campaign_setup = request.skipped ? '1' : '';
			history.push( '/reader-activation/complete' );
		} catch ( err ) {
			setError( err );
			setSkipped( { isSkipped: false, status: '' } );
		}
	}

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
					isTertiary
					disabled={ inFlight || skipped.isSkipped || skipped.status === 'pending' }
					onClick={ onSkipCampaignSetup }
				>
					{ /* eslint-disable-next-line no-nested-ternary */ }
					{ skipped.status === 'pending'
						? __( 'Skipping…', 'newspack-plugin' )
						: skipped.isSkipped
						? __( 'Skipped', 'newspack-plugin' )
						: __( 'Skip', 'newspack-plugin' ) }
				</Button>
				<Button
					isPrimary
					disabled={ inFlight || ( ! allReady && ! skipped.isSkipped ) }
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
