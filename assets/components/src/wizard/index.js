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

//const REQUIRED_PLUGINS = [ 'woocommerce' ];

class Wizard extends Component {
	constructor( props ) {
		super( ...arguments );

		const { requiredPlugins } = props;
		this.state = {
			pluginRequirementsMet: requiredPlugins ? false : true,
			wizardScreen: false,
			error: false,
		}
	}

	getActiveWizardScreen() {
		const { wizardScreen } = this.state;
		const { children } = this.props;

		const active = children.find( function( child ) {
			const { identifier } = child.props;
			if ( ! identifier ) {
				return false;
			}

			// If no wizardScreen is active, return the first wizardScreen.
			if ( ! wizardScreen ) {
				return true;
			}

			return identifier === wizardScreen;
		} );

		return active || false;
	}

	getActiveWizardScreenIdentifier() {
		const active = this.getActiveWizardScreen();
		if ( ! active ) {
			return false;
		}

		return active.props.identifier;
	}

	prepareWizardScreen( wizardScreen ) {
		const { props } = wizardScreen;
		if ( ! props ) {
			return wizardScreen;
		}

		const newProps = {};
		const { onCompleteButtonClicked, onSubCompleteButtonClicked } = props;
		if ( 'string' === typeof onCompleteButtonClicked ) {
			newProps.onCompleteButtonClicked = () => this.setState( { wizardScreen: onCompleteButtonClicked } );
		}

		if ( 'string' === typeof onSubCompleteButtonClicked ) {
			newProps.onSubCompleteButtonClicked = () => this.setState( { wizardScreen: onSubCompleteButtonClicked } );
		}

		return cloneElement( wizardScreen, newProps );
	}

	componentDidMount() {
		this.setState( {
			wizardStep: this.getActiveWizardScreenIdentifier(),
		} );
	}

	/**
	 * Get the saved data for populating the forms when wizard is first loaded.
	 */
	componentDidUpdate( prevProps, prevState ) {
		const { error, pluginRequirementsMet } = this.state;

		if ( error ) {
			return;
		}

		if ( ! prevState.pluginRequirementsMet && this.state.pluginRequirementsMet ) {
			// Get initial info.
		}
	}

	/**
	 * Render any errors that need rendering.
	 *
	 * @return null | React object
	 */
	getError() {
		const { error } = this.state;
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
		const { requiredPlugins } = this.props;
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
							onComplete={ () => this.setState( { pluginRequirementsMet: true } ) }
						/>
					</Card>
				</Fragment>
			);
		}

		return (
			<Fragment>
				{ error }
				{ this.prepareWizardScreen( this.getActiveWizardScreen() ) }
			</Fragment>
		);
	}
}
export default Wizard;