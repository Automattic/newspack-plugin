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
import Router from '../../../../components/src/proxied-imports/router';
import { NEWSPACK, NRH, STRIPE } from '../../constants';

const { withRouter } = Router;

/**
 * Platform Selection  Screen Component
 */
const Platform = ( { renderError, data, onChange } ) => {
	const { platform } = data;
	return (
		<>
			{ renderError() }
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
		</>
	);
};

export default withWizardScreen( withRouter( Platform ) );
