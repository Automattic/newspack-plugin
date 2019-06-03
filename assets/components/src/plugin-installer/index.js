/**
 * Progress bar for displaying visual feedback about steps-completed.
 */

/**
 * WordPress dependencies.
 */
import apiFetch from '@wordpress/api-fetch';
import { Component } from '@wordpress/element';
import { Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * External dependencies.
 */
import { forEach, includes, pickBy } from 'lodash';

/**
 * Internal dependencies.
 */
import { ActionCard, Button } from '../';
import './style.scss';

const PLUGIN_STATE_NONE = 0;
const PLUGIN_STATE_ACTIVE = 1;
const PLUGIN_STATE_INSTALLING = 2;
const PLUGIN_STATE_UNINSTALLING = 3;
const PLUGIN_STATE_ERROR = 4;

/**
 * Plugin installer.
 */
class PluginInstaller extends Component {
	constructor() {
		super( ...arguments );
		this.state = {
			pluginInfo: [],
		};
	}

	componentDidMount = () => {
		const { plugins } = this.props;
		this.retrievePluginInfo( plugins );
	};

	componentDidUpdate = prevProps => {
		const { plugins } = this.props;
		if ( plugins !== prevProps.plugins ) {
			this.retrievePluginInfo( plugins );
		}
	};

	retrievePluginInfo = plugins => {
		apiFetch( { path: '/newspack/v1/plugins/' } ).then( response => {
			const pluginInfo = pickBy( response, ( value, key ) => includes( plugins, key ) );
			forEach( pluginInfo, plugin => {
				plugin.installationStatus =
					plugin.Status === 'active' ? PLUGIN_STATE_ACTIVE : PLUGIN_STATE_NONE;
			} );
			this.setState( { pluginInfo } );
		} );
	};

	installAllPlugins = () => {
		const { pluginInfo } = this.state;
		const promises = Object.keys( pluginInfo ).map( slug => {
			const plugin = pluginInfo[ slug ];
			return plugin.Status !== 'active' ? this.installPlugin( slug ) : null;
		} );
		Promise.all( promises );
	};

	installPlugin = slug => {
		this.setInstallationStatus( slug, PLUGIN_STATE_INSTALLING );
		const params = {
			path: `/newspack/v1/plugins/${ slug }/activate/`,
			method: 'post',
		};
		return apiFetch( params )
			.then( response => {
				let { pluginInfo } = this.state;
				pluginInfo[ slug ] = response;
				pluginInfo[ slug ].installationStatus = PLUGIN_STATE_ACTIVE;
				this.setState( { pluginInfo } );
			} )
			.catch( error => {
				this.setInstallationStatus( slug, PLUGIN_STATE_ERROR, error.message );
				return;
			} );
	};

	unInstallPlugin = slug => {
		this.setInstallationStatus( slug, PLUGIN_STATE_UNINSTALLING );
		const params = {
			path: `/newspack/v1/plugins/${ slug }/deactivate/`,
			method: 'post',
		};
		return apiFetch( params )
			.then( response => {
				let { pluginInfo } = this.state;
				pluginInfo[ slug ] = response;
				pluginInfo[ slug ].installationStatus = PLUGIN_STATE_NONE;
				this.setState( { pluginInfo } );
			} )
			.catch( error => {
				this.setInstallationStatus( slug, PLUGIN_STATE_ERROR, error.message );
				return;
			} );
	};

	setChecked = ( slug, value ) => {
		let { pluginInfo } = this.state;
		pluginInfo[ slug ].checked = value;
		this.setState( { pluginInfo } );
	};

	setInstallationStatus = ( slug, value, notification = null ) => {
		let { pluginInfo } = this.state;
		pluginInfo[ slug ].installationStatus = value;
		pluginInfo[ slug ].notification = notification;
		this.setState( { pluginInfo } );
	};

	/**
	 * Render.
	 */
	render() {
		const { pluginInfo } = this.state;
		const slugs = Object.keys( pluginInfo );
		const needsInstall = slugs.some( slug => {
			const plugin = pluginInfo[ slug ];
			return plugin.Status !== 'active' && plugin.installationStatus === PLUGIN_STATE_NONE;
		} );
		return (
			<div>
				{ pluginInfo &&
					slugs.length > 0 &&
					slugs.map( slug => {
						const plugin = pluginInfo[ slug ];
						const { Name, Description, Status, installationStatus, notification } = plugin;
						const isWaiting =
							installationStatus === PLUGIN_STATE_INSTALLING ||
							installationStatus === PLUGIN_STATE_UNINSTALLING;
						const isButton = ! isWaiting && Status !== 'active';
						let actionText;
						if ( installationStatus === PLUGIN_STATE_INSTALLING ) {
							actionText = __( 'Installing' );
						} else if ( installationStatus === PLUGIN_STATE_UNINSTALLING ) {
							actionText = __( 'Removing' );
						} else if ( Status === 'active' ) {
							actionText = __( 'Active' );
						} else {
							actionText = __( 'Install' );
						}
						const onClick = isButton ? () => this.installPlugin( slug ) : null;
						return (
							<ActionCard
								key={ slug }
								title={ Name }
								description={ Description }
								actionText={ actionText }
								secondaryActionText={
									installationStatus === PLUGIN_STATE_ACTIVE && __( 'Uninstall' )
								}
								deletionText={ __( 'Remove' ) }
								isWaiting={ isWaiting }
								onClick={ onClick }
								onSecondaryActionClick={ () => this.unInstallPlugin( slug ) }
								notification={ notification }
								notificationLevel="error"
							/>
						);
					} ) }
				<Button
					disabled={ ! needsInstall }
					isPrimary
					className="is-centered"
					onClick={ this.installAllPlugins }
				>
					{ __( 'Install All' ) }
				</Button>
			</div>
		);
	}
}

export default PluginInstaller;
