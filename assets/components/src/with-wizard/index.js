/**
 * Wizard Higher-Order Component.
 */

/**
 * WordPress dependencies
 */
import { Component, Fragment, render } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies.
 */
import { Button, Card, FormattedHeader, PluginInstaller } from '../';

/**
 * External dependencies
 */
import { HashRouter, Redirect, Route, Switch } from 'react-router-dom';

export default function withWizard( WrappedComponent, requiredPlugins ) {
	// ...and returns another component...
	return class extends React.Component {
		constructor( props ) {
			super( props );
			this.state = {
				pluginRequirementsMet: false,
			};
			// this.handleChange = this.handleChange.bind(this);
			// this.state = {
			//   data: selectData(DataSource, props)
			// };
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

		pluginRequirements = () => {
			console.log( WrappedComponent );
			const requiredPluginsCancelText = false;
			const { pluginRequirementsMet } = this.state;
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

		render() {
			// ... and renders the wrapped component with the fresh data!
			// Notice that we pass through any additional props
			return (
				<WrappedComponent error={ this.getError() } pluginRequirements={ this.pluginRequirements() } { ...this.props } />
			);
		}
	};
}
