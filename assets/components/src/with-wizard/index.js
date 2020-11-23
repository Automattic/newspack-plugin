/**
 * WordPress dependencies.
 */
import { Component, createRef, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';

/**
 * Material UI dependencies.
 */
import HeaderIcon from '@material-ui/icons/Warning';

/**
 * Internal dependencies.
 */
import { Button, Card, FormattedHeader, Modal, Notice, PluginInstaller, Grid } from '../';
import Router from '../proxied-imports/router';
import './style.scss';

const { Redirect, Route } = Router;

/**
 * Higher-Order Component to provide plugin management and error handling to Newspack Wizards.
 */
export default function withWizard( WrappedComponent, requiredPlugins ) {
	return class WrappedWithWizard extends Component {
		constructor( props ) {
			super( props );
			this.state = {
				complete: null,
				error: null,
				loading: requiredPlugins && requiredPlugins.length > 0 ? 1 : 0,
			};
			this.wrappedComponentRef = createRef();
		}

		componentDidMount = () => {
			// If there are no requiredPlugins, fire onWizardReady as soon as component mounts.
			if ( ! requiredPlugins ) {
				const instance = this.wrappedComponentRef.current;
				// eslint-disable-next-line no-unused-expressions
				instance && instance.onWizardReady && instance.onWizardReady();
			}
		};

		/**
		 * Set the error. Called by Wizards when an error occurs.
		 *
		 * @return {Promise} Resolved after state update
		 */
		setError = error => {
			return new Promise( resolve => {
				this.setState( { error: error || null }, () => resolve() );
			} );
		};

		/**
		 * Render any errors that need rendering.
		 *
		 * @return {Component} Error UI
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
		 * @param {Error} error object already parsed by parseError
		 * @return {Component} Error notice
		 */
		getErrorNotice = error => {
			const { message } = error;
			return <Notice noticeText={ message } isError rawHTML />;
		};

		/**
		 * Get a fatal-level error.
		 *
		 * @param {Error} error object already parsed by parseError
		 * @return {Component} React object
		 */
		getFatalError = error => {
			const fallbackURL = this.getFallbackURL();
			if ( ! fallbackURL ) {
				return null;
			}
			const { message } = error;
			return (
				<Modal
					title={ __( 'Unrecoverable error' ) }
					onRequestClose={ () => ( window.location = fallbackURL ) }
				>
					<Notice noticeText={ message } isError rawHTML />
					<div className="newspack-buttons-card">
						<Button isPrimary href={ fallbackURL }>
							{ __( 'Return to dashboard' ) }
						</Button>
					</div>
				</Modal>
			);
		};

		/**
		 * Get all the relevant info out of a raw API error response.
		 *
		 * @param {Object} error error object
		 * @return {Object} Error object with relevant fields and defaults
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
				// eslint-disable-next-line no-unused-expressions
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
		 * @return {void}
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
					render={ () => (
						<Grid>
							{ complete !== null && (
								<FormattedHeader
									headerIcon={ <HeaderIcon /> }
									headerText={
										requiredPlugins.length > 1 ? __( 'Required plugins' ) : __( 'Required plugin' )
									}
									subHeaderText={
										requiredPlugins.length > 1
											? __( 'This feature requires the following plugins.' )
											: __( 'This feature requires the following plugin.' )
									}
								/>
							) }
							<Card>
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

		getFallbackURL = () => {
			if ( typeof newspack_urls !== 'undefined' ) {
				return newspack_urls.dashboard;
			}
		};

		/**
		 * Render.
		 */
		render() {
			const { loading, error } = this.state;
			return (
				<Fragment>
					{ this.getError() }
					<div className={ loading ? 'newspack-wizard__is-loading' : 'newspack-wizard__is-loaded' }>
						<WrappedComponent
							pluginRequirements={ requiredPlugins && this.pluginRequirements() }
							clearError={ this.clearError }
							getError={ this.getError }
							errorData={ error }
							setError={ this.setError }
							isLoading={ loading }
							startLoading={ this.startLoading }
							doneLoading={ this.doneLoading }
							wizardApiFetch={ this.wizardApiFetch }
							ref={ this.wrappedComponentRef }
							{ ...this.props }
						/>
					</div>
				</Fragment>
			);
		}
	};
}
