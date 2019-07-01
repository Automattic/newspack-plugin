/**
 * Higher-Order Component to provide plugin management and error handling to Newspack Wizards.
 */

/**
 * WordPress dependencies
 */
import { Component, createRef, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies.
 */
import { Button, Card, FormattedHeader, Modal, PluginInstaller } from '../';
import { buttonProps } from '../../../shared/js/';

/**
 * External dependencies
 */
import { Redirect, Route } from 'react-router-dom';
import { isFunction } from 'lodash';

export default function withWizard( WrappedComponent, requiredPlugins ) {
	return class extends Component {
		constructor( props ) {
			super( props );
			this.state = {
				complete: null,
				error: null,
			};
			this.wrappedComponentRef = createRef();
		}

		/**
		 * Set the error. Called by Wizards when an error occurs.
		 *
		 * @return Promise
		 */
		setError = error => {
			return new Promise( resolve => {
				this.setState( { error: error || null }, () => resolve() );
			} );
		};

		/**
		 * Render any errors that need rendering.
		 *
		 * @return error UI
		 */
		getError = () => {
			const { error } = this.state;
			if ( ! error ) {
				return null;
			}

			const parsedError = this.parseError( error );
			const { level } = parsedError;
			if ( 'fatal' === level ) {
				return this.getFatalError( parsedError );
			}

			return this.getErrorNotice( parsedError );
		};

		/**
		 * Get a notice-level error.
		 *
		 * @param Error object already parsed by parseError
		 * @return Component
		 */
		getErrorNotice = error => {
			const { message } = error;
			return (
				<div className="notice notice-error notice-alt update-message">
					<p>{ message }</p>
				</div>
			);
		};

		/**
		 * Get a fatal-level error.
		 *
		 * @param Error object already parsed by parseError
		 * @return React object
		 */
		getFatalError = error => {
			const { message } = error;
			return (
				<Modal
					title={ __( 'Unrecoverable error' ) }
					onRequestClose={ () => ( window.location = newspack_urls[ 'dashboard' ] ) }
				>
					<p>
						<strong>{ message }</strong>
					</p>
					<Button isPrimary href={ newspack_urls[ 'dashboard' ] }>
						{ __( 'Return to dashboard' ) }
					</Button>
				</Modal>
			);
		};

		/**
		 * Get all the relevant info out of a raw API error response.
		 *
		 * @param Raw error object
		 * @return Error object with relevant fields and defaults
		 */
		parseError = error => {
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
		};

		/**
		 * Called when plugin installation is complete. Updates state and calls onWizardReady on the wrapped component.
		 */
		pluginInstallationStatus = ( { complete } ) => {
			const instance = this.wrappedComponentRef.current;
			this.setState( { complete }, () => {
				complete && instance && instance.onWizardReady && instance.onWizardReady();
			} );
		};

		/**
		 * Render a Route that checks for plugin installation requirements, and redirects to '/' when all are done.
		 *
		 * @return void
		 */
		pluginRequirements = () => {
			const { complete } = this.state;
			/* After all plugins are loaded, redirect to / (this could be configurable) */
			if ( complete ) {
				return <Redirect from="/plugin-requirements" to="/" />;
			}
			return (
				<Fragment>
					<Route
						path="/"
						render={ routeProps => (
							<Card noBackground>
								{ complete !== null && (
									<FormattedHeader
										headerText={ __( 'Required plugin' ) }
										subHeaderText={ __( 'This feature requires the following plugin.' ) }
									/>
								) }
								<PluginInstaller
									plugins={ requiredPlugins }
									onStatus={ status => this.pluginInstallationStatus( status ) }
								/>
							</Card>
						) }
					/>
				</Fragment>
			);
		};

		/**
		 * Render.
		 *
		 * @return JSX
		 */
		render() {
			const { buttonText, buttonAction } = this.props;
			return (
				<Fragment>
					{ this.getError() }
					<WrappedComponent
						pluginRequirements={ requiredPlugins && this.pluginRequirements() }
						clearError={ this.clearError }
						getError={ this.getError }
						setError={ this.setError }
						ref={ this.wrappedComponentRef }
						{ ...this.props }
					/>
					{ buttonText && buttonAction && (
						<Button
							isTertiary
							className="is-centered muriel-wizardScreen__subCompleteButton"
							{ ...buttonProps( buttonAction ) }
						>
							{ buttonText }
						</Button>
					) }
				</Fragment>
			);
		}
	};
}
