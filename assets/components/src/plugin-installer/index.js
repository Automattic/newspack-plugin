/**
 * Progress bar for displaying visual feedback about steps-completed.
 */

/**
 * WordPress dependencies.
 */
import apiFetch from '@wordpress/api-fetch';
import { Component } from '@wordpress/element';
import { SVG, Path } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies.
 */
import { ActionCard, Button, ProgressBar, Waiting } from '../';
import './style.scss';

const PLUGIN_STATE_NONE = 0;
const PLUGIN_STATE_ACTIVE = 1;
const PLUGIN_STATE_INSTALLING = 2;
const PLUGIN_STATE_ERROR = 3;

/**
 * External dependencies
 */
import classNames from 'classnames';

/**
 * Plugin installer.
 */
class PluginInstaller extends Component {
	constructor() {
		super( ...arguments );
		this.state = {
			pluginInfo: {},
			installationInitialized: false,
		};
	}

	componentDidMount = () => {
		const { plugins } = this.props;
		this.retrievePluginInfo( plugins ).then( () => {
			const { asProgressBar, autoInstall } = this.props;
			if ( asProgressBar || autoInstall ) this.installAllPlugins();
		} );
	};

	componentDidUpdate = prevProps => {
		const { autoInstall, plugins } = this.props;
		const { installationInitialized } = this.state;
		if ( plugins !== prevProps.plugins ) {
			this.retrievePluginInfo( plugins );
		}
		if ( autoInstall && ! installationInitialized ) {
			this.installAllPlugins();
		}
	};

	retrievePluginInfo = plugins => {
		return new Promise( ( resolve, reject ) => {
			apiFetch( { path: '/newspack/v1/plugins/' } ).then( response => {
				const pluginInfo = Object.keys( response ).reduce( ( result, slug ) => {
					if ( plugins.indexOf( slug ) === -1 ) return result;
					result[ slug ] = {
						...response[ slug ],
						installationStatus:
							response[ slug ].Status === 'active' ? PLUGIN_STATE_ACTIVE : PLUGIN_STATE_NONE,
					};
					return result;
				}, {} );
				this.updatePluginInfo( pluginInfo ).then( () => resolve() );
			} );
		} );
	};

	installAllPlugins = () => {
		const { pluginInfo } = this.state;
		this.setState( { installationInitialized: true } );
		const promises = Object.keys( pluginInfo )
			.filter( slug => 'active' !== pluginInfo[ slug ].Status )
			.map( slug => () => this.installPlugin( slug ) );
		promises.reduce(
			( promise, action ) =>
				promise.then( result => action().then( Array.prototype.concat.bind( result ) ) ),
			Promise.resolve( [] )
		);
	};

	installPlugin = slug => {
		this.setInstallationStatus( slug, PLUGIN_STATE_INSTALLING );
		const params = {
			path: `/newspack/v1/plugins/${ slug }/configure/`,
			method: 'post',
		};
		return apiFetch( params )
			.then( response => {
				const { pluginInfo } = this.state;
				this.updatePluginInfo( {
					...pluginInfo,
					[ slug ]: { ...response, installationStatus: PLUGIN_STATE_ACTIVE },
				} );
			} )
			.catch( error => {
				this.setInstallationStatus( slug, PLUGIN_STATE_ERROR, error.message );
				return;
			} );
	};

	setChecked = ( slug, checked ) => {
		const { pluginInfo } = this.state;
		this.updatePluginInfo( { ...pluginInfo, [ slug ]: { ...pluginInfo[ slug ], checked } } );
	};

	setInstallationStatus = ( slug, installationStatus, notification = null ) => {
		const { pluginInfo } = this.state;
		this.updatePluginInfo( {
			...pluginInfo,
			[ slug ]: { ...pluginInfo[ slug ], installationStatus, notification },
		} );
	};

	updatePluginInfo = pluginInfo => {
		return new Promise( ( resolve, reject ) => {
			const { onStatus } = this.props;
			this.setState( { pluginInfo }, () => {
				const { pluginInfo } = this.state;
				const complete = Object.values( pluginInfo ).every( plugin => {
					return 'active' === plugin.Status;
				} );
				onStatus( { complete, pluginInfo } );
				resolve();
			} );
		} );
	};

	classForInstallationStatus = status =>  {
		switch ( status ) {
			case PLUGIN_STATE_ACTIVE:
				return 'newspack-plugin-installer__status-active';
				break;
			case PLUGIN_STATE_INSTALLING:
				return 'newspack-plugin-installer__status-installing';
				break;
			case PLUGIN_STATE_ERROR:
				return 'newspack-plugin-installer__status-error';
				break;
			default:
				return 'newspack-plugin-installer__status-none';
				break;
		}
	}

	/**
	 * Render.
	 */
	render() {
		const { asProgressBar, autoInstall } = this.props;
		const { pluginInfo } = this.state;
		const slugs = Object.keys( pluginInfo );
		const needsInstall = slugs.some( slug => {
			const plugin = pluginInfo[ slug ];
			return plugin.Status !== 'active' && plugin.installationStatus === PLUGIN_STATE_NONE;
		} );
		const inactiveIcon = (
			<SVG xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
				<Path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
			</SVG>
		);
		const activeIcon = (
			<SVG xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
				<Path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
			</SVG>
		);
		if ( asProgressBar ) {
			const completed = slugs.reduce(
				( completed, slug ) =>
					'active' === pluginInfo[ slug ].Status ? completed + 1 : completed,
				0
			);
			return slugs.length > 0 && <ProgressBar completed={ completed } total={ slugs.length } />;
		}
		return (
			<div>
				{ ( ! pluginInfo || ! Object.keys( pluginInfo ).length ) && (
					<div className="newspack-plugin-installer_is-waiting">
						<Waiting isLeft />
						{ __( 'Retrieving plugin information...' ) }
					</div>
				) }
				{ pluginInfo &&
					slugs.length > 0 &&
					slugs.map( slug => {
						const plugin = pluginInfo[ slug ];
						const { Name, Description, Status, installationStatus, notification } = plugin;
						const isWaiting = installationStatus === PLUGIN_STATE_INSTALLING;
						const isButton = ! isWaiting && Status !== 'active';
						let actionText;
						if ( installationStatus === PLUGIN_STATE_INSTALLING ) {
							actionText = __( 'Installing...' );
						} else if ( Status === 'uninstalled' ) {
							actionText = (
								<span className="newspack-plugin-installer__status">
									{ __( 'Install' ) }
									{ inactiveIcon }
								</span>
							);
						} else if ( Status === 'inactive' ) {
							actionText = (
								<span className="newspack-plugin-installer__status">
									{ __( 'Activate' ) }
									{ inactiveIcon }
								</span>
							);
						} else if ( Status === 'active' ) {
							actionText = (
								<span className="newspack-plugin-installer__status">
									{ __( 'Installed' ) }
									{ activeIcon }
								</span>
							);
						}

						const classes = classNames(
							'newspack-action-card__plugin-installer',
							this.classForInstallationStatus( installationStatus ),
						);
						const onClick = isButton ? () => this.installPlugin( slug ) : null;
						return (
							<ActionCard
								key={ slug }
								title={ Name }
								description={ Description }
								actionText={ actionText }
								isWaiting={ isWaiting }
								onClick={ onClick }
								notification={ notification }
								notificationLevel="error"
								className={ classes }
							/>
						);
					} ) }
				{ ! autoInstall && pluginInfo && slugs.length > 0 && (
					<div className="newspack-buttons-card">
						<Button
							disabled={ ! needsInstall }
							isPrimary
							onClick={ this.installAllPlugins }
						>
							{ __( 'Install' ) }
						</Button>
					</div>
				) }
			</div>
		);
	}
}

PluginInstaller.defaultProps = {
	onStatus: () => {},
};

export default PluginInstaller;
