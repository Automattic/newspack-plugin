/**
 * Higher-Order Component to provide plugin management and error handling to Newspack Wizards.
 */

/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies.
 */
import { Button, Card, FormattedHeader, Modal, PluginInstaller } from '../';

/**
 * External dependencies
 */
import { HashRouter, Redirect, Route, Switch } from 'react-router-dom';

export default function withWizard( WrappedComponent, requiredPlugins ) {
	return class extends React.Component {
		constructor( props ) {
			super( props );
			this.state = {
				pluginRequirementsMet: false,
				error: null,
			};
		}

		/**
		 * Set the error. Called by Wizards when an error occurs.
		 *
		 * @return Promise
		 */
		setError = error => {
			return new Promise( resolve => {
				this.setState( { error }, () => resolve() );
			} );
		}

		/**
		 * Clear the error. Called by Wizards after successful API calls.
		 *
		 * @return Promise
		 */
		clearError = error => {
			return new Promise( resolve => {
				this.setState( { error: null }, () => resolve() );
			} );
		}

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
		 * Render a Route that checks for plugin installation requirements, and redirects to '/' when all are done.
		 *
		 * @return void
		 */
		pluginRequirements = () => {
			const requiredPluginsCancelText = false;
			const { pluginRequirementsMet } = this.state;
			/* After all plugins are loaded, redirect to / (this could be configurable) */
			if ( pluginRequirementsMet ) {
				return <Redirect from="/plugin-requirements" to="/" />;
			}
			return (
				<Fragment>
					<Route
						path="/plugin-requirements"
						render={ routeProps => (
							<Card noBackground>
								<FormattedHeader
									headerText={ __( 'Required plugin' ) }
									subHeaderText={ __( 'This feature requires the following plugin.' ) }
								/>
								<PluginInstaller
									plugins={ requiredPlugins }
									onComplete={ () => this.setState( { pluginRequirementsMet: true } ) }
								/>
								<Button isTertiary className="is-centered" href={ null }>
									{ __( 'Back to checklist' ) }
								</Button>
							</Card>
						) }
					/>
					<Redirect to="/plugin-requirements" />
				</Fragment>
			);
		};

		/**
		 * Render.
		 *
		 * @return JSX
		 */
		render() {
			const { pluginRequirementsMet } = this.state;
			return (
				<WrappedComponent
					wizardReady={ pluginRequirementsMet }
					setError={ this.setError }
					clearError={ this.clearError }
					getError={ this.getError }
					pluginRequirements={ this.pluginRequirements() }
					{ ...this.props }
				/>
			);
		}
	};
}
