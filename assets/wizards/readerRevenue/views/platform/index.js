/**
 * Platform Selection Screen
 */

/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { PluginInstaller, SelectControl, withWizardScreen } from '../../../../components/src';
import { NEWSPACK, NRH } from '../../constants';

/**
 * Platform Selection  Screen Component
 */
class Platform extends Component {
	/**
	 * Render.
	 */
	render() {
		const { data, onChange, onReady, status } = this.props;
		const { newspack: newspackStatus } = status;
		const { platform } = data;
		return (
			<Fragment>
				<SelectControl
					label={ __( 'Select Reader Revenue Platform', 'newspack' ) }
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
					] }
					onChange={ _platform =>
						_platform.length &&
						onChange( {
							...data,
							platform: _platform,
						} )
					}
				/>
				{ NEWSPACK === platform && ! newspackStatus && (
					<PluginInstaller
						plugins={ [
							'woocommerce',
							'woocommerce-subscriptions',
							'woocommerce-name-your-price',
						] }
						onStatus={ ( { complete } ) => complete && onReady( 'newspack' ) }
					/>
				) }
			</Fragment>
		);
	}
}
export default withWizardScreen( Platform );
