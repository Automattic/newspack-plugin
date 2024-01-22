/**
 * WordPress dependencies
 */
import { useDispatch } from '@wordpress/data';
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Card, PluginInstaller, SelectControl, Wizard } from '../../../../components/src';
import { NEWSPACK, NRH, OTHER } from '../../constants';

/**
 * Platform Selection  Screen Component
 */
const Platform = () => {
	const wizardData = Wizard.useWizardData( 'reader-revenue' );
	const { saveWizardSettings, updateWizardSettings } = useDispatch( Wizard.STORE_NAMESPACE );
	return (
		<Fragment>
			<Card noBorder>
				<SelectControl
					label={ __( 'Select Reader Revenue Platform', 'newspack' ) }
					value={ wizardData.platform_data?.platform }
					options={ [
						{
							label: __( 'Other', 'newspack' ),
							value: OTHER,
						},
						{
							label: __( 'Newspack', 'newspack' ),
							value: NEWSPACK,
						},
						{
							label: __( 'News Revenue Hub', 'newspack' ),
							value: NRH,
						},
					] }
					onChange={ value => {
						saveWizardSettings( {
							slug: 'newspack-reader-revenue-wizard',
							payloadPath: [ 'platform_data' ],
							updatePayload: {
								path: [ 'platform_data', 'platform' ],
								value,
							},
						} );
					} }
				/>
			</Card>
			{ NEWSPACK === wizardData.platform_data?.platform && ! wizardData.plugin_status && (
				<PluginInstaller
					plugins={ [
						'woocommerce',
						'woocommerce-subscriptions',
						'woocommerce-name-your-price',
						'woocommerce-gateway-stripe',
					] }
					onStatus={ ( { complete } ) => {
						if ( complete ) {
							updateWizardSettings( {
								slug: 'newspack-reader-revenue-wizard',
								path: [ 'plugin_status' ],
								value: true,
							} );
						}
					} }
					withoutFooterButton={ true }
				/>
			) }
		</Fragment>
	);
};

export default Platform;
