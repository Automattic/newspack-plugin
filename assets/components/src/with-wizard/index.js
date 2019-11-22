/**
 * Higher-Order Component to provide plugin management and error handling to Newspack Wizards.
 */

/**
 * WordPress dependencies
 */
import { Component, createRef, Fragment } from '@wordpress/element';
import { Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies.
 */
import { Button, Card, FormattedHeader, Modal, NewspackLogo, PluginInstaller, Grid } from '../';
import { buttonProps } from '../../../shared/js/';
import './style.scss';

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
				loading: requiredPlugins ? 1 : 0,
			};
			this.wrappedComponentRef = createRef();
		}

		componentDidMount = () => {
			// If there are no requiredPlugins, fire onWizardReady as soon as component mounts.
			if ( ! requiredPlugins ) {
				const instance = this.wrappedComponentRef.current;
				instance && instance.onWizardReady && instance.onWizardReady();
			}
		};

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
			if ( this.state.loading ) {
				this.doneLoading();
			}
			const instance = this.wrappedComponentRef.current;
			this.setState( { complete }, () => {
				complete && instance && instance.onWizardReady && instance.onWizardReady();
			} );
		};

		/**
		 * Begin loading.
		 */
		startLoading = () => {
			this.setState( state => ( {
				loading: state.loading + 1,
			} ) );
		};

		/**
		 * End loading.
		 */
		doneLoading = () => {
			this.setState( state => ( {
				loading: state.loading - 1,
			} ) );
		};

		/**
		 * Replacement for core apiFetch that automatically manages wizard loading UI.
		 */
		wizardApiFetch = args => {
			this.startLoading();
			return new Promise( ( resolve, reject ) => {
				apiFetch( args )
					.then( response => {
						this.doneLoading();
						resolve( response );
					} )
					.catch( error => {
						this.doneLoading();
						reject( error );
					} );
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
				<Route
					path="/"
					render={ routeProps => (
						<Grid>
							<Card noBackground className="muriel-wizardScreen muriel-wizardScreen__no-background">
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
						</Grid>
					) }
				/>
			);
		};

		/**
		 * Render.
		 *
		 * @return JSX
		 */
		render() {
			const { buttonText, buttonAction } = this.props;
			const { loading } = this.state;
			return (
				<Fragment>
					{ this.getError() }
					<div className="newspack-logo-wrapper">
						<NewspackLogo />
					</div>
					<div className={ !! loading ? 'muriel-wizardScreen__loading' : '' }>
						<WrappedComponent
							pluginRequirements={ requiredPlugins && this.pluginRequirements() }
							clearError={ this.clearError }
							getError={ this.getError }
							setError={ this.setError }
							startLoading={ this.startLoading }
							doneLoading={ this.doneLoading }
							wizardApiFetch={ this.wizardApiFetch }
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
					</div>
				</Fragment>
			);
		}
	};
}
