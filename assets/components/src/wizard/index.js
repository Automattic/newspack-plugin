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
import './style.scss';

class Wizard extends Component {
	constructor( props ) {
		super( ...arguments );

		const { requiredPlugins } = props;
		this.state = {
			pluginRequirementsMet: requiredPlugins ? false : true,
		}
	}

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
	 * @return null | React object
	 */
	getError() {
		const { error } = this.props;
		if ( ! error ) {
			return null;
		}
		const { level } = error;
		if ( 'fatal' === level ) {
			return this.getFatalError( error );
		}

		return this.getErrorNotice( error );
	}

	/**
	 * Get a notice-level error.
	 *
	 * @param Error object already parsed by parseError
	 * @return React object
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
				onRequestClose={ () => console.log( 'Redirect to checklist now' ) }
			>
				<p>
					<strong>{ message }</strong>
				</p>
				<Button isPrimary onClick={ () => this.setState( { modalShown: false } ) }>
					{ __( 'Return to checklist' ) }
				</Button>
			</Modal>
		);
	}

	/**
	 * Parse an error caught by an API request.
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
	 * Go to the next wizard step.
	 */
	nextWizardStep() {
		const { wizardStep, error } = this.state;

		if ( ! error ) {
			this.setState( {
				wizardStep: wizardStep + 1,
			} );
		}
	}

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
							<Button isTertiary className='is-centered' onClick={ () => onRequiredPluginsCancel() }>
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