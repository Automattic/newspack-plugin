/* global newspack_engagement_wizard */

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { ExternalLink } from '@wordpress/components';
import { useEffect, useRef, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	Button,
	SectionHeader,
	withWizardScreen,
	Card,
	Notice,
	ProgressBar,
	StepsList,
} from '../../../../components/src';

const listItems = [
	__(
		'Your <strong>current segments and prompts</strong> will be deactivated and archived.',
		'newspack-plugin'
	),
	__(
		'<strong>Reader registration</strong> will be activated to enable better targeting for driving engagement and conversations.',
		'newspack-plugin'
	),
	__(
		'The <strong>Reader Activation campaign</strong> will be activated with default segments and settings.',
		'newspack-plugin'
	),
];

const activationSteps = [
	__( 'Setting up new segments…', 'newspack-plugin' ),
	__( 'Activating reader registration…', 'newspack-plugin' ),
	__( 'Activating Reader Activation Campaign…', 'newspack-plugin' ),
];

/**
 * Get a random number between min and max.
 *
 * @param {number} min Minimum value to return.
 * @param {number} max Maximum value to return.
 * @return {number} Random number between min and max.
 */
const generateRandomNumber = ( min, max ) => {
	return min + Math.random() * ( max - min );
};

export default withWizardScreen( () => {
	const [ inFlight, setInFlight ] = useState( false );
	const [ error, setError ] = useState( false );
	const [ progress, setProgress ] = useState( null );
	const [ progressLabel, setProgressLabel ] = useState( false );
	const [ completed, setCompleted ] = useState( false );
	const timer = useRef();
	const { reader_activation_url } = newspack_engagement_wizard;

	useEffect( () => {
		if ( timer.current ) {
			clearTimeout( timer.current );
		}
		if ( error ) {
			setInFlight( false );
		}
		if ( ! error && inFlight && 0 <= progress && progress < activationSteps.length ) {
			setProgressLabel( activationSteps[ progress ] );
			timer.current = setTimeout( () => {
				setProgress( _progress => _progress + 1 );
			}, generateRandomNumber( 1000, 2000 ) );
		}
		if ( progress === activationSteps.length && completed ) {
			setProgress( activationSteps.length + 1 ); // Plus one to account for the "Done!" step.
			setProgressLabel( __( 'Done!', 'newspack-plugin' ) );
			setTimeout( () => {
				setInFlight( false );
				window.location = reader_activation_url;
			}, 3000 );
		}
	}, [ completed, progress ] );

	const activate = async () => {
		setError( false );
		setInFlight( true );
		setProgress( 0 );

		try {
			setCompleted(
				await apiFetch( {
					path: '/newspack/v1/wizard/newspack-engagement-wizard/reader-activation/activate',
					method: 'post',
				} )
			);
		} catch ( err ) {
			setError( err );
		}
	};

	return (
		<div className="newspack-ras-campaign__completed">
			<SectionHeader
				title={ __( 'Enable Reader Activation', 'newspack-plugin' ) }
				description={ () => (
					<>
						{ __(
							'An easy way to let your readers register for your site, sign up for newsletters, or become donors and paid members. ',
							'newspack-plugin'
						) }

						{ /** TODO: Update this URL with the real one once the docs are ready. */ }
						<ExternalLink href={ 'https://help.newspack.com' }>
							{ __( 'Learn more', 'newspack-plugin' ) }
						</ExternalLink>
					</>
				) }
			/>
			{ inFlight && (
				<Card className="newspack-ras-campaign__completed-card">
					<ProgressBar
						completed={ progress }
						displayFraction={ false }
						total={ activationSteps.length + 1 } // Plus one to account for the "Done!" step.
						label={ progressLabel }
					/>
				</Card>
			) }
			{ ! inFlight && (
				<Card className="newspack-ras-campaign__completed-card">
					<h2>{ __( "You're all set to enable Reader Activation!", 'newspack-plugin' ) }</h2>
					<p>{ __( 'This is what will happen next:', 'newspack-plugin' ) }</p>

					<Card noBorder className="justify-center">
						<StepsList stepsListItems={ listItems } narrowList />
					</Card>

					{ error && (
						<Notice
							noticeText={ error?.message || __( 'Something went wrong.', 'newspack-plugin' ) }
							isError
						/>
					) }

					<Card buttonsCard noBorder className="justify-center">
						<Button isPrimary onClick={ () => activate() }>
							{ __( 'Enable Reader Activation', 'newspack-plugin' ) }
						</Button>
					</Card>
				</Card>
			) }
			<div className="newspack-buttons-card">
				<Button isSecondary disabled={ inFlight } href={ `${ reader_activation_url }/campaign` }>
					{ __( 'Back', 'newspack-plugin' ) }
				</Button>
			</div>
		</div>
	);
} );
