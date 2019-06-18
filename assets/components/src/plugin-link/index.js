/**
 * Muriel-styled buttons.
 */

/**
 * WordPress dependencies.
 */
import apiFetch from '@wordpress/api-fetch';
import { Component, Fragment } from '@wordpress/element';
import { Spinner } from '@wordpress/components';
import { Button, Modal } from '../';
import { __ } from '@wordpress/i18n';

/**
 * External dependencies.
 */
import { assign } from 'lodash';

/**
 * Internal dependencies
 */
import murielClassnames from '../../../shared/js/muriel-classnames';

class PluginLink extends Component {
	constructor() {
		super( ...arguments );
		this.state = {
			pluginInfo: [],
			showModal: false,
		};
	}

	componentDidMount = () => {
		const { plugin } = this.props;
		this.retrievePluginInfo( plugin );
	};

	retrievePluginInfo = plugin => {
		apiFetch( { path: '/newspack/v1/plugins/' + plugin } ).then( pluginInfo => {
			this.setState( { pluginInfo } );
		} );
	};

	textForPlugin = pluginInfo => {
		const defaults = {
			modalBody: null,
			modalTitle: pluginInfo.Name && `${ __( 'Manage' ) } ${pluginInfo.Name}`,
			primaryButton: pluginInfo.Name && `${ __( 'Manage' ) } ${pluginInfo.Name}`,
			primaryModalButton: __( 'Manage' ),
			dismissModalButton: __( 'Dismiss' ),
		}
		return assign( defaults, this.props );
	};

	goToPlugin = plugin => {
		apiFetch( { path: '/newspack/v1/plugins/' + plugin + '/edit', method: 'POST' } ).then( response => {
			window.location.href = response.EditLink;
		} );
	}

	/**
	 * Render.
	 */
	render( props ) {
		const { className, ...otherProps } = this.props;
		const classes = murielClassnames( 'muriel-button', className );
		const { pluginInfo, showModal } = this.state;
		const { modalBody, modalTitle, primaryButton, primaryModalButton, dismissModalButton } = this.textForPlugin( pluginInfo );
		const { Name, Slug } = pluginInfo;
		return (
			<Fragment>
				{ Name && (
					<Button
						className={ classes }
						isDefault
						{ ...otherProps }
						onClick={ () => this.setState( { showModal: true } ) }
					>
						{ primaryButton }
					</Button>
				) }
				{ ! Name && (
					<Button className={ classes } isDefault { ...otherProps }>
						<Fragment>
							{ __( 'Retrieving Plugin Info' ) }
							<Spinner />
						</Fragment>
					</Button>
				) }
				{ showModal && (
					<Modal
						title={ modalTitle }
						onRequestClose={ () => this.setState( { showModal: false } ) }
					>
						<p>{ modalBody }</p>
						<Button isPrimary onClick={ () => this.goToPlugin( Slug ) }>
							{ primaryModalButton }
						</Button>
						<Button isDefault onClick={ () => this.setState( { showModal: false } ) }>
							{ dismissModalButton }
						</Button>
					</Modal>
				) }
			</Fragment>
		);
	}
}

export default PluginLink;
