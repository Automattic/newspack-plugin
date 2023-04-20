/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	Button,
	SectionHeader,
	withWizardScreen,
	Card,
	ProgressBar,
	SteppedList,
} from '../../../../components/src';
import './style.scss';

export default withWizardScreen( () => {
	//const [ inFlight, setInFlight ] = useState( false );
	//const [ error, setError ] = useState( false );
	//const [ prompts, setPrompts ] = useState( null );
	//const [ allReady, setAllReady ] = useState( false );

	return (
		<div className="newspack-ras-campaign__completed">
			<SectionHeader
				title={ __( 'Enable Reader Activation', 'newspack' ) }
				description={ __(
					'An easy way to let your readers register for your site, sign up for newsletters, or become donors and paid members.',
					'newspack'
				) }
			/>

			<Card>
				<h2>{ __( "You're all set to enable Reader Activation!", 'newspack' ) }</h2>
				<p>{ __( 'This is what will happen next:', 'newspack' ) }</p>

				<Card noBorder className="justify-center">
					<SteppedList
						listNumber="1"
						listText={ __(
							'Your current segments and prompts will be deactivated and archived.',
							'newspack'
						) }
						rawHTML
					/>
					<SteppedList
						listNumber="2"
						listText={ __(
							'Reader registration will be activated to enable better targeting for driving engagement and conversations.',
							'newspack'
						) }
						rawHTML
					/>
					<SteppedList
						listNumber="3"
						listText={ __(
							'The Reader Activation campaign will be activated with default segments and settings.',
							'newspack'
						) }
						rawHTML
					/>
				</Card>

				<Card buttonsCard noBorder className="justify-center">
					<Button
						isPrimary
						href="/wp-admin/admin.php?page=newspack-engagement-wizard#/reader-activation"
					>
						{ __( 'Enable Reader Activation', 'newspack ' ) }
					</Button>
				</Card>
			</Card>
			<Card>
				<ProgressBar
					completed="3"
					total="8"
					label={ __( 'Deactivating existing prompts and segments', 'newspack' ) }
					displayFraction
				/>
			</Card>
		</div>
	);
} );
