/**
 * Platform Selection Screen
 */

/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Grid, PluginInstaller, SelectControl, withWizardScreen } from '../../../../components/src';
import Router from '../../../../components/src/proxied-imports/router';
import { NEWSPACK, NRH, STRIPE } from '../../constants';

const { withRouter } = Router;

/**
 * Platform Selection  Screen Component
 */
const Platform = ( { data, onChange, onReady, pluginStatus } ) => {
	const { platform } = data;
	return (
		<Fragment>
			<Grid gutter={ 32 }>
				<SelectControl
					label={ __( 'Reader Revenue Platform', 'newspack' ) }
					value={ platform }
					options={ [
						{ label: __( '-- Select Your Platform --', 'newspack' ), value: '' },
						{
							label: __( 'Newspack', 'newspack' ),
							value: NEWSPACK,
						},
						{
							label: __( 'News Revenue Hub', 'newspack' ),
							value: NRH,
						},
						{
							label: __( 'Stripe', 'newspack' ),
							value: STRIPE,
							disabled: data.stripeData.can_use_stripe_platform === false,
						},
					] }
					onChange={ _platform => {
						if ( _platform.length ) {
							onChange( {
								...data,
								platform: _platform,
							} );
						}
					} }
				/>
			</Grid>
			{ NEWSPACK === platform && ! pluginStatus && (
				<PluginInstaller
					plugins={ [
						'woocommerce',
						'woocommerce-subscriptions',
						'woocommerce-name-your-price',
						'woocommerce-gateway-stripe',
					] }
					onStatus={ ( { complete } ) => {
						if ( complete ) {
							onReady();
						}
					} }
					withoutFooterButton={ true }
				/>
			) }
		</Fragment>
	);
};

export default withWizardScreen( withRouter( Platform ) );
