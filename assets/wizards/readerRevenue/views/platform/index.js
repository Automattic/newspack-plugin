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
import Router from '../../../../components/src/proxied-imports/router';
import { NEWSPACK, NRH } from '../../constants';

const { withRouter } = Router;

/**
 * Platform Selection  Screen Component
 */
class Platform extends Component {
	/**
	 * Redirect after platform change.
	 */
	componentDidUpdate( prevProps ) {
		const { data, history } = this.props;
		const { platform } = data;
		if ( this.props.data.platform !== prevProps.data.platform ) {
			if ( NRH === platform ) {
				history.push( '/settings' );
			} else if ( NEWSPACK === platform ) {
				history.push( '/donations' );
			}
		}
	}

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
							'woocommerce-gateway-stripe',
						] }
						onStatus={ ( { complete } ) => complete && onReady( 'newspack' ) }
					/>
				) }
			</Fragment>
		);
	}
}
export default withWizardScreen( withRouter( Platform ) );
