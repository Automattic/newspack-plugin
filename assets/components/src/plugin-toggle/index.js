/**
 * Plugin toggle group component.
 */

/**
 * WordPress dependencies.
 */
import apiFetch from '@wordpress/api-fetch';
import { Component, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies.
 */
import { ActionCard, Waiting } from '../';
import './style.scss';

/**
 * Plugin toggle group component.
 */
class PluginToggle extends Component {
	state = {
		pluginInfo: {},
	};

	componentDidMount = () => {
		this.retrievePluginInfo();
	};

	/**
	 * Retrieve complete data about Newspack plugins.
	 */
	retrievePluginInfo = () => {
		const { plugins } = this.props;
		return new Promise( ( resolve, reject ) => {
			apiFetch( { path: '/newspack/v1/plugins/' } ).then( pluginInfo =>
				this.setState( { pluginInfo } )
			);
		} );
	};

	/**
	 * Install/activate or remove a plugin.
	 */
	managePlugin = ( plugin, value ) => {
		const { shouldRefreshAfterUpdate } = this.props;
		const { pluginInfo } = this.state;
		const action = value ? 'configure' : 'uninstall';
		const params = {
			path: `/newspack/v1/plugins/${ plugin }/${ action }/`,
			method: 'post',
		};

		this.setState(
			{
				pluginInfo: { ...pluginInfo, [ plugin ]: { ...pluginInfo[ plugin ], inFlight: action } },
			},
			() => {
				apiFetch( params ).then( response => {
					this.setState( { pluginInfo: { ...pluginInfo, [ plugin ]: response } }, () => shouldRefreshAfterUpdate && location.reload() );
				} );
			}
		);
	};

	/**
	 * Render.
	 */
	render() {
		const { plugins } = this.props;
		const { pluginInfo } = this.state;
		return this.prepareDataForRender( plugins, pluginInfo ).map( plugin => {
			const { name, description, href, slug, status, editPath, inFlight } = plugin;
			const pluginStatus = this.statusForPlugin( plugin );
			const handoff = ! href && pluginStatus && editPath ? slug : null;
			return (
				<ActionCard
					className={ this.classNameForPlugin( plugin ) }
					title={ name }
					description={ description }
					actionText={ this.actionTextForPlugin( plugin ) }
					handoff={ handoff }
					href={ href }
					toggle
					toggleChecked={ this.statusForPlugin( plugin ) }
					toggleOnChange={ value => this.managePlugin( slug, value ) }
				/>
			);
		} );
	}

	/**
	 * Prepare plugins data for render. Change all keys to camelCase, merge API-fetched data with prop.
	 */
	prepareDataForRender = ( pluginsFromProps, pluginsFromAPI ) =>
		Object.keys( pluginsFromProps )
			.map( pluginSlug =>
				pluginsFromAPI[ pluginSlug ]
					? Object.keys( pluginsFromAPI[ pluginSlug ] ).reduce(
							( accumulator, key ) => ( {
								...accumulator,
								[ key.charAt( 0 ).toLowerCase() + key.slice( 1 ) ]: pluginsFromAPI[ pluginSlug ][
									key
								],
							} ),
							{}
					  )
					: {}
			)
			.map( plugin => Object.assign( plugin, pluginsFromProps[ plugin.slug ] ) );

	/**
	 * Generate a classname for the ActionCard based on plugin state. Applies 'in-flight' class if an API is underway and 'loading' if the plugin data is not yet available.
	 */
	classNameForPlugin = plugin => {
		const { status, inFlight } = plugin;
		if ( inFlight ) {
			return 'in-flight';
		}
		if ( ! status ) {
			return 'loading';
		}
	};

	/**
	 * Generate the ActionCard action text for a plugin.
	 */
	actionTextForPlugin = plugin => {
		const { actionText, editPath, href, inFlight, name } = plugin;
		// Show spinner when plugin data is unavailable, or when an API call is in flight.
		if ( 'configure' === inFlight ) {
			return (
				<Fragment>
					{ __( 'Installing...', 'newspack' ) } <Waiting isRight />
				</Fragment>
			);
		}
		if ( 'uninstall' === inFlight ) {
			return (
				<Fragment>
					{ __( 'Uninstalling...', 'newspack' ) } <Waiting isRight />
				</Fragment>
			);
		}
		if ( ! name ) {
			return (
				<Fragment>
					{ __( 'Loading...', 'newspack' ) } <Waiting isRight />
				</Fragment>
			);
		}
		// No action button at all if the plugin isn't installed and active.
		if ( ! this.statusForPlugin( plugin ) ) {
			return null;
		}
		if ( href || editPath ) {
			return actionText ? actionText : __( 'Configure', 'newspack' );
		}
	};

	/**
	 * Get installation/activation state for a plugin.
	 */
	statusForPlugin = plugin => {
		const { status } = plugin;
		return status === 'active';
	};
}

export default PluginToggle;
