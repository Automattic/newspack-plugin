/**
 * Multi-Screen Wizard.
 */

/**
 * WordPress dependencies
 */
import { Children, Component, Fragment, cloneElement } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { PluginInstaller, Card, FormattedHeader, Modal, Button, WizardScreen } from '../';

/**
 * External dependencies.
 */
import { HashRouter, Redirect, Switch } from 'react-router-dom';

const INSTALL_PLUGINS_PATH = '/install-plugins';

/**
 * Manages a bunch of WizardScreen components into a cohesive wizard.
 * Handles required plugins, errors, screen switching, etc.
 */
class Wizard extends Component {
	/**
	 * Constructor.
	 */
	constructor( props ) {
		super( ...arguments );

		const { requiredPlugins } = props;
		this.state = {
			pluginRequirementsMet: requiredPlugins ? false : true,
		};
	}

	/**
	 * Handler that fires when the plugin requirements have been met.
	 */
	handlePluginRequirementsMet() {
		this.setState( {
			pluginRequirementsMet: true,
		} );

		const { onPluginRequirementsMet } = this.props;
		if ( !! onPluginRequirementsMet ) {
			onPluginRequirementsMet();
		}
	}

	/**
	 * Render any errors that need rendering.
	 *
	 * @return null | Component
	 */
	getError() {
		const { error } = this.props;
		if ( ! error ) {
			return null;
		}

		const parsedError = this.parseError( error );
		const { level } = parsedError;
		if ( 'fatal' === level ) {
			return this.getFatalError( parsedError );
		}

		return this.getErrorNotice( parsedError );
	}

	/**
	 * Get a notice-level error.
	 *
	 * @param Error object already parsed by parseError
	 * @return Component
	 */
	getErrorNotice( error ) {
		const { message } = error;
		return (
			<div className="notice notice-error notice-alt update-message">
				<p>{ message }</p>
			</div>
		);
	}

	/**
	 * Get a fatal-level error.
	 *
	 * @param Error object already parsed by parseError
	 * @return React object
	 */
	getFatalError( error ) {
		const { message } = error;
		return (
			<Modal
				title={ __( 'Unrecoverable error' ) }
				onRequestClose={ () => ( window.location = newspack_urls[ 'dashboard' ] ) }
			>
				<p>
					<strong>{ message }</strong>
				</p>
				<Button isPrimary onClick={ () => ( window.location = newspack_urls[ 'dashboard' ] ) }>
					{ __( 'Return to dashboard' ) }
				</Button>
			</Modal>
		);
	}

	/**
	 * Get all the relevant info out of a raw API error response.
	 *
	 * @param Raw error object
	 * @return Error object with relevant fields and defaults
	 */
	parseError( error ) {
		const { data, message, code } = error;
		let level = 'fatal';
		if ( !! data && 'level' in data ) {
			level = data.level;
		} else if ( 'rest_invalid_param' === code ) {
			level = 'notice';
		}

		return {
			message,
			level,
		};
	}

	/**
	 * Derive the path of the first screen.
	 */
	startPath() {
		const { children } = this.props;
		if ( Children.count( children ) > 0 && Children.toArray( children )[0].props.path ) {
			return Children.toArray( children )[0].props.path;
		}
		return '/';
	}

	/**
	 * Render.
	 */
	render() {
		const { pluginRequirementsMet, wizardStep } = this.state;
		const { children, requiredPlugins, requiredPluginsCancelText, onRequiredPluginsCancel } = this.props;
		const error = this.getError();
		const pluginScreen = ! pluginRequirementsMet && (
			<WizardScreen path={ INSTALL_PLUGINS_PATH } noBackground>
				<FormattedHeader
					headerText={ __( 'Required plugin' ) }
					subHeaderText={ __( 'This feature requires the following plugin.' ) }
				/>
				<PluginInstaller
					plugins={ requiredPlugins }
					onComplete={ () => this.handlePluginRequirementsMet() }
				/>
				{ requiredPluginsCancelText && (
					<Button
						isTertiary
						className="is-centered"
						onClick={ () => onRequiredPluginsCancel() }
					>
						{ requiredPluginsCancelText }
					</Button>
				) }
			</WizardScreen>
		);

		return (
			<HashRouter>
				{ error }
				<Switch>
					{ pluginScreen }
					{ ! pluginRequirementsMet && <Redirect to={ INSTALL_PLUGINS_PATH } /> }
					{ children }
					<Redirect to={ this.startPath() } />
				</Switch>
			</HashRouter>
		);
	}
}
export default Wizard;
