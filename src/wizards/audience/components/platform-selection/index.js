/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { ActionCard, Button, Card, PluginInstaller } from '../../../../../packages/components/src';
import { WIZARD_STORE_NAMESPACE } from '../../../../../packages/components/src/wizard/store';
import { NEWSPACK, NRH, OTHER } from '../../constants';

// The payment endpoint (api_update_payment_settings) persists the platform slug and
// is the same store slug the Setup view reads platform_selected from.
const PAYMENT_WIZARD_SLUG = 'newspack-audience/payment';

export const PLATFORM_PLUGINS = {
	[ NEWSPACK ]: [ 'woocommerce', 'woocommerce-subscriptions', 'newspack-blocks' ],
	[ NRH ]: [ 'newspack-blocks' ],
	[ OTHER ]: [],
};

export const OPTIONS = [
	{
		value: NEWSPACK,
		title: __( 'Newspack', 'newspack-plugin' ),
		description: __( 'Full reader revenue stack with checkout, donations, and subscriptions.', 'newspack-plugin' ),
	},
	{
		value: NRH,
		title: __( 'RevEngine', 'newspack-plugin' ),
		description: __( 'Use the Donate block with News Revenue Hub / RevEngine.', 'newspack-plugin' ),
	},
	{
		value: OTHER,
		title: __( 'Other', 'newspack-plugin' ),
		description: __( 'Use your own integrations. No checkout or donation tools are configured.', 'newspack-plugin' ),
	},
];

const PlatformSelection = ( { onComplete, onCancel } ) => {
	const { saveWizardSettings } = useDispatch( WIZARD_STORE_NAMESPACE );
	const [ installing, setInstalling ] = useState( null );

	const choose = value => {
		saveWizardSettings( {
			slug: PAYMENT_WIZARD_SLUG,
			payloadPath: [ 'platform_data' ],
			updatePayload: {
				path: [ 'platform_data', 'platform' ],
				value,
			},
		} ).then( result => {
			// On a failed save the store swallows the error and resolves to
			// undefined; don't advance past an unsaved platform choice.
			if ( ! result ) {
				return;
			}
			if ( PLATFORM_PLUGINS[ value ].length ) {
				setInstalling( value );
			} else {
				onComplete();
			}
		} );
	};

	if ( installing ) {
		return (
			<Card noBorder>
				<PluginInstaller
					plugins={ PLATFORM_PLUGINS[ installing ] }
					autoInstall
					withoutFooterButton
					onStatus={ ( { complete } ) => complete && onComplete() }
				/>
			</Card>
		);
	}

	return (
		<Card noBorder>
			{ OPTIONS.map( option => (
				<ActionCard
					key={ option.value }
					isMedium
					title={ option.title }
					description={ option.description }
					actionText={ __( 'Select', 'newspack-plugin' ) }
					onClick={ () => choose( option.value ) }
				/>
			) ) }
			{ onCancel && (
				<div className="newspack-buttons-card">
					<Button isSecondary onClick={ onCancel }>
						{ __( 'Cancel', 'newspack-plugin' ) }
					</Button>
				</div>
			) }
		</Card>
	);
};

export default PlatformSelection;
