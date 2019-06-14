/**
 * Multi-Screen Wizard.
 */

/**
 * WordPress dependencies
 */
import { Component, Fragment, cloneElement } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { PluginInstaller, Card, FormattedHeader, Modal, Button } from '../';

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
	 * Get the screen that is currently displayed.
	 *
	 * @return Component|false
	 */
	getActiveWizardScreen() {
		const { children, activeScreen } = this.props;

		const activeComponent = children.find( function( child ) {
			const { identifier } = child.props;
			if ( ! identifier ) {
				return false;
			}

			return identifier === activeScreen;
		} );

		return activeComponent || false;
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
	 * Render.
	 */
	render() {
		const { pluginRequirementsMet, wizardStep } = this.state;
		const { requiredPlugins, requiredPluginsCancelText, onRequiredPluginsCancel } = this.props;
		const error = this.getError();

		if ( ! pluginRequirementsMet ) {
			return (
				<Fragment>
					{ error }
					<Card noBackground>
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
					</Card>
				</Fragment>
			);
		}

		return (
			<Fragment>
				{ error }
				{ this.getActiveWizardScreen() }
			</Fragment>
		);
	}
}
export default Wizard;
