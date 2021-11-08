/**
 * WordPress dependencies.
 */
import apiFetch from '@wordpress/api-fetch';
import { Component, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies.
 */
import { SectionHeader, Notice } from '../';
import SettingsSection from './SettingsSection';

class PluginSettings extends Component {
	constructor() {
		super( ...arguments );
		this.state = {
			inFlight: false,
			settings: {},
			error: null,
		};
	}

	fetchSettings = () => {
		const { pluginSlug } = this.props;
		this.setState( { inFlight: true } );
		apiFetch( { path: `/${ pluginSlug }/v1/settings-list` } )
			.then( settings => {
				this.setState( { settings, error: null } );
			} )
			.catch( error => {
				this.setState( { error } );
			} )
			.finally( () => {
				this.setState( { inFlight: false } );
			} );
	};

	componentDidMount() {
		this.fetchSettings();
	}

	getSettingsValues = sectionKey => {
		return (
			this.state.settings[ sectionKey ]?.reduce( ( map, setting ) => {
				map[ setting.key ] = setting.value;
				return map;
			}, {} ) || {}
		);
	};

	handleSettingChange = sectionKey => ( key, value ) => {
		const sectionSettings = [ ...this.state.settings[ sectionKey ] ];
		sectionSettings.forEach( setting => {
			if ( setting.key === key ) {
				setting.value = value;
			}
		} );
		this.setState( {
			settings: {
				...this.state.settings,
				[ sectionKey ]: sectionSettings,
			},
		} );
	};

	handleSectionUpdate = sectionKey => data => {
		const { pluginSlug } = this.props;
		this.setState( { inFlight: true } );
		apiFetch( {
			path: `/${ pluginSlug }/v1/settings`,
			method: 'POST',
			data: {
				section: sectionKey,
				settings: {
					...this.getSettingsValues( sectionKey ),
					...( data || {} ),
				},
			},
			quiet: true,
		} )
			.then( settings => {
				this.setState( { settings, error: null } );
			} )
			.catch( error => {
				this.setState( { error } );
			} )
			.finally( () => {
				this.setState( { inFlight: false } );
			} );
	};

	/**
	 * Render.
	 */
	render() {
		const { title, description } = this.props;
		const { settings, inFlight, error } = this.state;
		return (
			<Fragment>
				<SectionHeader title={ title } description={ description } />
				{ error && <Notice isError noticeText={ error.message } /> }
				{ Object.keys( settings ).map( sectionKey => (
					<SettingsSection
						key={ sectionKey }
						disabled={ inFlight }
						settings={ settings[ sectionKey ] }
						onChange={ this.handleSettingChange( sectionKey ) }
						onUpdate={ this.handleSectionUpdate( sectionKey ) }
					/>
				) ) }
			</Fragment>
		);
	}
}

PluginSettings.defaultProps = {
	title: __( 'General Settings', 'newspack' ),
};

PluginSettings.SettingsSection = SettingsSection;

export default PluginSettings;
