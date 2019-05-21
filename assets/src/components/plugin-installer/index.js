/**
 * Progress bar for displaying visual feedback about steps-completed.
 */

/**
 * WordPress dependencies.
 */
import apiFetch from '@wordpress/api-fetch';
import { Component } from '@wordpress/element';
import { Dashicon, Placeholder, Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * External dependencies.
 */
import { includes, pickBy } from 'lodash';

/**
 * Internal dependencies.
 */
import { CheckboxControl, Button } from '../';
import './style.scss';

const PLUGIN_STATE_NONE = 0;
const PLUGIN_STATE_INSTALLING = 1;
const PLUGIN_STATE_ERROR = 2;

/**
 * Plugin installer.
 */
class PluginInstaller extends Component {
	constructor() {
		super( ...arguments );
		this.state = {
			pluginInfo: [],
			progress: false,
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
			this.setState( { pluginInfo } );
		} );
	};

	installPlugins = () => {
		const { pluginInfo } = this.state;
		const promises = Object.keys( pluginInfo ).map( slug => {
			const plugin = pluginInfo[ slug ];
			const shouldInstall = plugin.status !== 'active' && plugin.checked;
			return shouldInstall ? this.installPlugin( slug ) : null;
		} );
		this.setState( { progress: true } );
		Promise.all( promises )
			.then( result => {
				console.log( 'All plugins installed', result );
			} )
			.finally( result => {
				this.setState( { progress: false } );
			} );
	};

	installPlugin = slug => {
		this.setInstallationStatus( slug, PLUGIN_STATE_INSTALLING );
		const activateParams = {
			path: `/newspack/v1/plugins/${ slug }/activate/`,
			method: 'post',
		};
		return apiFetch( activateParams )
			.then( response => {
				let { pluginInfo } = this.state;
				pluginInfo[ slug ] = response;
				this.setState( { pluginInfo } );
			} )
			.catch( error => {
				this.setInstallationStatus( slug, PLUGIN_STATE_ERROR );
				console.log( 'Install Error', slug, error );
				return;
			} );
	};

	setChecked = ( slug, value ) => {
		let { pluginInfo } = this.state;
		pluginInfo[ slug ].checked = value;
		this.setState( { pluginInfo } );
	};

	setInstallationStatus = ( slug, value ) => {
		let { pluginInfo } = this.state;
		pluginInfo[ slug ].installationStatus = value;
		this.setState( { pluginInfo } );
	};

	/**
	 * Render.
	 */
	render() {
		const { pluginInfo, progress } = this.state;
		const slugs = Object.keys( pluginInfo );
		const needsInstall = slugs.some( slug => {
			const plugin = pluginInfo[ slug ];
			const shouldInstall = plugin.Status !== 'active' && plugin.checked;
			return shouldInstall;
		} );
		return (
			<div>
				{ pluginInfo &&
					slugs.length > 0 &&
					slugs.map( slug => {
						const plugin = pluginInfo[ slug ];
						return (
							<div className="newspack-plugin-installer__checkbox-row" key={ slug }>
								<CheckboxControl
									disabled={ plugin.Status === 'active' }
									label={ `${ plugin.Name } (${ plugin.Status })` }
									checked={ !! plugin.checked }
									onChange={ value => {
										this.setChecked( slug, value );
									} }
								/>
								{ PLUGIN_STATE_INSTALLING === plugin.installationStatus && <Spinner /> }
								{ PLUGIN_STATE_ERROR === plugin.installationStatus && (
									<Dashicon icon="warning" className="newspack-plugin-installer__status" />
								) }
							</div>
						);
					} ) }
				<Button
					disabled={ ! needsInstall || progress }
					isPrimary
					className="is-centered"
					onClick={ this.installPlugins }
				>
					{ progress ? __( 'Installing' ) : __( 'Install' ) }
				</Button>
			</div>
		);
	}
}

export default PluginInstaller;
