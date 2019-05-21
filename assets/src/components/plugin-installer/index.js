/**
 * Progress bar for displaying visual feedback about steps-completed.
 */

/**
 * WordPress dependencies.
 */
import apiFetch from '@wordpress/api-fetch';
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies.
 */
import { CheckboxControl, Button } from '../';

const PLUGIN_STATE_NONE = 0;
const PLUGIN_STATE_INSTALLED = 1;
const PLUGIN_STATE_INSTALLING = 2;

/**
 * Progress bar.
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
		apiFetch( {
			path: '/newspack/v1/plugins',
		} ).then( response => {
			console.log( response );
			this.setState( { pluginInfo: response } );
		} );
	};

	installPlugins = () => {
		const { pluginInfo } = this.state;
		const promises = Object.keys( pluginInfo ).map( slug => {
			return this.installPlugin( slug );
		} );
		console.log( promises );
		Promise.all( promises )
			.then( result => {
				console.log( 'All plugins installed', result );
			} )
			.catch( error => {
				console.log( 'Plugins installed with errors', error );
				return;
			} );
	};

	installPlugin = slug => {
		const { pluginInfo } = this.state;
		const activateParams = {
			path: `/newspack/v1/plugins/${ slug }/activate/`,
			method: 'post',
		};
		return apiFetch( activateParams )
			.catch( error => {
				console.log( 'Install Error', slug, error );
				return;
			} );
	};

	/**
	 * Render.
	 */
	render() {
		const { pluginInfo } = this.state;
		const slugs = Object.keys( pluginInfo );
		return (
			<div>
				{ pluginInfo &&
					slugs.map( slug => {
						const plugin = pluginInfo[ slug ];
						return (
							<div key={ slug }>
								<CheckboxControl
									label={ plugin.Name }
									checked={ plugin.checked }
									tooltip={ plugin.Description }
									onChange={ () => null }
								/>
							</div>
						);
					} ) }
				<Button isPrimary className="is-centered" onClick={ this.installPlugins }>
					{ __( 'Install' ) }
				</Button>
			</div>
		);
	}
}

export default PluginInstaller;
