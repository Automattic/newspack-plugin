/**
 * Complete UI for Newspack handoff to an external plugin.
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

class Handoff extends Component {
	constructor() {
		super( ...arguments );
		this.state = {
			pluginInfo: [],
			showModal: false,
		};
	}

	componentDidMount = () => {
		this._isMounted = true;
		const { plugin } = this.props;
		this.retrievePluginInfo( plugin );
	};

	componentWillUnmount = () => {
		this._isMounted = false;
	};

	retrievePluginInfo = plugin => {
		const { onReady } = this.props;
		apiFetch( { path: '/newspack/v1/plugins/' + plugin } ).then( pluginInfo => {
			if ( this._isMounted ) {
				onReady( pluginInfo );
				this.setState( { pluginInfo } );
			}
		} );
	};

	textForPlugin = pluginInfo => {
		const defaults = {
			modalBody: null,
			modalTitle: pluginInfo.Name && `${ __( 'Manage' ) } ${ pluginInfo.Name }`,
			primaryButton: pluginInfo.Name && `${ __( 'Manage' ) } ${ pluginInfo.Name }`,
			primaryModalButton: __( 'Manage' ),
			dismissModalButton: __( 'Dismiss' ),
		};
		return assign( defaults, this.props );
	};

	goToPlugin = plugin => {
		const { editLink, showOnBlockEditor } = this.props;
		apiFetch( {
			path: '/newspack/v1/plugins/' + plugin + '/handoff',
			method: 'POST',
			data: {
				editLink,
				handoffReturnUrl: window && window.location.href,
				showOnBlockEditor: showOnBlockEditor ? true : false,
			},
		} ).then( response => {
			window.location.href = response.HandoffLink;
		} );
	};

	/**
	 * Render.
	 */
	render( props ) {
		const { className, children, compact, useModal, onReady, ...otherProps } = this.props;
		const { pluginInfo, showModal } = this.state;
		const {
			modalBody,
			modalTitle,
			primaryButton,
			primaryModalButton,
			dismissModalButton,
		} = this.textForPlugin( pluginInfo );
		const { Configured, Name, Slug, Status } = pluginInfo;
		const classes = murielClassnames( 'muriel-button', Configured && 'is-configured', className );
		return (
			<Fragment>
				{ Name && 'active' === Status && (
					<Button
						className={ classes }
						isDefault={ ! otherProps.isLink }
						{ ...otherProps }
						onClick={ () =>
							useModal ? this.setState( { showModal: true } ) : this.goToPlugin( Slug )
						}
					>
						{ children ? children : primaryButton }
					</Button>
				) }
				{ Name && 'active' !== Status && (
					<Button className={ classes } isDefault disabled { ...otherProps }>
						{ Name + __( ' not installed' ) }
					</Button>
				) }
				{ ! Name && (
					<Button className={ classes } isDefault={ ! otherProps.isLink } { ...otherProps }>
						<Fragment>
							{ __( 'Retrieving Plugin Info' ) }
							{ ! compact && <Spinner /> }
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

Handoff.defaultProps = {
	onReady: () => {},
};

export default Handoff;
