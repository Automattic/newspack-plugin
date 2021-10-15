/**
 * Platform Selection Screen
 */

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Grid, SelectControl, withWizardScreen } from '../../../../components/src';
import { NEWSPACK, NRH, STRIPE } from '../../constants';

/**
 * Platform Selection  Screen Component
 */
const Platform = ( { data, onChange } ) => (
	<Grid gutter={ 32 }>
		<SelectControl
			label={ __( 'Reader Revenue Platform', 'newspack' ) }
			value={ data.platform }
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
);

export default withWizardScreen( Platform );
