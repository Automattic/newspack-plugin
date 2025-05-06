/**
 * WordPress dependencies.
 */
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { ToggleControl, TextareaControl } from '@wordpress/components';

/**
 * Internal dependencies.
 */
import { Button, Grid } from '../../../../components/src';
import { useWizardData } from '../../../../components/src/wizard/store/utils';
import { WIZARD_STORE_NAMESPACE } from '../../../../components/src/wizard/store';
import WizardsSection from '../../../wizards-section';

const DATA_STORE_KEY = 'newspack-audience/subscription-settings';

function SubscriptionSettings() {
	const config = useWizardData( DATA_STORE_KEY );
	const { updateWizardSettings, saveWizardSettings } = useDispatch(
		WIZARD_STORE_NAMESPACE
	);
	const isQuietLoading = useSelect(
		( select: any ) =>
			select( WIZARD_STORE_NAMESPACE ).isQuietLoading() ?? false,
		[]
	);

	const onChange = ( value: any, key: string ) =>
		updateWizardSettings( {
			slug: DATA_STORE_KEY,
			path: [ key ],
			value,
		} );

	function onSave() {
		saveWizardSettings( {
			slug: DATA_STORE_KEY,
		} );
	}

	return (
		<WizardsSection
			title={ __( 'Subscription Settings', 'newspack-plugin' ) }
			className={ isQuietLoading ? 'is-fetching' : '' }
		>
			<ToggleControl
				label={ __(
					'Enable subscription confirmation checkbox',
					'newspack-plugin'
				) }
				help={ __(
					'Display a separate checkbox at checkout to confirm the user understands this is a recurring subscription and they can cancel anytime.',
					'newspack-plugin'
				) }
				checked={ config.woocommerce_enable_subscription_confirmation ?? false }
				onChange={ value =>
					onChange( value, 'woocommerce_enable_subscription_confirmation' )
				}
				disabled={ isQuietLoading }
			/>

			{ config.woocommerce_enable_subscription_confirmation && (
				<TextareaControl
					label={ __(
						'Label',
						'newspack-plugin'
					) }
					value={ config.woocommerce_subscription_confirmation_text }
					onChange={ value =>
						onChange(
							value,
							'woocommerce_subscription_confirmation_text'
						)
					}
				/>
			) }

			<ToggleControl
				label={ __(
					'Enable Terms & Conditions confirmation checkbox',
					'newspack-plugin'
				) }
				help={ __(
					"Display the 'I have read and accept the Terms & Conditions' checkbox at checkout. Ensure the Terms & Conditions include subscription details to comply with the FTC guidelines.",
					'newspack-plugin'
				) }
				checked={ config.woocommerce_enable_terms_confirmation ?? false }
				onChange={ value =>
					onChange( value, 'woocommerce_enable_terms_confirmation' )
				}
				disabled={ isQuietLoading }
			/>

			<div className="newspack-buttons-card">
				<Button
					variant="primary"
					onClick={ onSave }
					disabled={ isQuietLoading }
				>
					{ isQuietLoading
						? __( 'Saving…', 'newspack-plugin' )
						: __( 'Save Settings', 'newspack-plugin' ) }
				</Button>
			</div>
		</WizardsSection>
	);
}

export default SubscriptionSettings;
