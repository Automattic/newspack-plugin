/**
 * External dependencies.
 */
import { omit, times } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';
import { Icon, warning, check } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { NewspackLogo, Button, ProgressBar, withWizardScreen } from '../../../../components/src';

const POST_COUNT = newspack_aux_data.is_e2e ? 12 : 40;

const REQUIRED_SOFTWARE_SLUGS = [
	'jetpack',
	'amp',
	'pwa',
	'wordpress-seo',
	'google-site-kit',
	'newspack-blocks',
	'newspack-theme',
];

const TOTAL = POST_COUNT + 4 + REQUIRED_SOFTWARE_SLUGS.length;

const ERROR_TYPES = {
	plugin_configuration: { message: __( 'Plugin installation' ) },
	starter_content: { message: __( 'Starter content' ) },
};

const starterContentFetch = endpoint =>
	apiFetch( {
		path: `/newspack/v1/wizard/newspack-setup-wizard/starter-content/${ endpoint }`,
		method: 'post',
	} );

const Welcome = ( { buttonAction } ) => {
	const [ installationProgress, setInstallationProgress ] = useState( 0 );
	const [ softwareInfo, setSoftwareInfo ] = useState( [] );
	const [ errors, setErrors ] = useState( [] );
	const addError = errorInfo => error =>
		setErrors( _errors => [ ..._errors, { ...errorInfo, error } ] );

	useEffect( () => {
		document.body.classList.add( 'newspack_page_newspack-setup-wizard__welcome' );

		Promise.all(
			REQUIRED_SOFTWARE_SLUGS.map( item =>
				apiFetch( { path: `/newspack/v1/plugins/${ item }` } ).then( res =>
					setSoftwareInfo( _softwareInfo => [ ..._softwareInfo, res ] )
				)
			)
		);

		return () => document.body.classList.remove( 'newspack_page_newspack-setup-wizard__welcome' );
	}, [] );

	const increment = () => setInstallationProgress( progress => progress + 1 );

	const install = async () => {
		increment();

		// Plugins and theme.
		const softwarePromises = softwareInfo.map( item => {
			if ( item.Status === 'active' ) {
				increment();
				return () => Promise.resolve();
			}
			return () =>
				apiFetch( {
					path: `/newspack/v1/plugins/${ item.Slug }/configure/`,
					method: 'POST',
				} )
					.then( increment )
					.catch( addError( { info: ERROR_TYPES.plugin_configuration, item: item.Name } ) );
		} );
		for ( let i = 0; i < softwarePromises.length; i++ ) {
			await softwarePromises[ i ]();
		}

		// Starter content.
		await starterContentFetch( `categories` )
			.then( increment )
			.catch( addError( { info: ERROR_TYPES.starter_content, item: 'categories' } ) );
		await Promise.allSettled(
			times( POST_COUNT, n =>
				starterContentFetch( `post/${ n }` )
					.then( increment )
					.catch( addError( { info: ERROR_TYPES.starter_content, item: 'post' } ) )
			)
		);
		await starterContentFetch( `homepage` )
			.then( increment )
			.catch( addError( { info: ERROR_TYPES.starter_content, item: 'homepage' } ) );
		await starterContentFetch( `theme` )
			.then( increment )
			.catch( addError( { info: ERROR_TYPES.starter_content, item: 'theme' } ) );
	};

	const hasErrors = errors.length > 0;
	const isInit = installationProgress === 0;
	const isDone = installationProgress === TOTAL;

	// eslint-disable-next-line no-nested-ternary
	const getHeadingText = () => {
		if ( hasErrors ) {
			return __( 'Installation error' );
		}
		if ( isInit ) {
			return __( 'Welcome to WordPress for your Newsroom!' );
		}
		if ( isDone ) {
			return __( 'Installation complete!' );
		}
		return __( 'Installing…' );
	};

	const getInfoText = () => {
		if ( hasErrors ) {
			return __(
				'There has been an error during the installation. Please retry or manually install required plugins to continue with the configuration of your Newspack site.'
			);
		}
		if ( isInit ) {
			return __(
				'We’ll help you get set up by installing the most relevant Newspack plugins in the background.'
			);
		}
		if ( isDone ) {
			return __( 'Click the button below to proceed.' );
		}
		return __(
			'We are now installing core plugins and pre-populating your site with categories and placeholder stories to help you pre-configure it. All placeholder content can be deleted later.'
		);
	};

	const getHeadingIcon = () => {
		if ( hasErrors ) {
			return <Icon className="mr1 newspack--error" icon={ warning } />;
		}
		if ( isDone ) {
			return <Icon className="mr1 newspack--success" icon={ check } />;
		}
	};

	const renderErrorBox = ( error, i ) => (
		<div key={ i } className="ph3 pv2 mb3 ba br1 b--moon-gray">
			<b>
				{ error.info.message }: { error.item }
			</b>
		</div>
	);

	return (
		<>
			<div className="newspack-logo__wrapper welcome">
				<NewspackLogo centered />
			</div>
			<div className="newspack-setup-wizard__welcome">
				<h2 className="flex">
					{ getHeadingIcon() }
					{ getHeadingText() }
				</h2>
				{ errors.length === 0 && installationProgress > 0 ? (
					<ProgressBar completed={ installationProgress } total={ TOTAL } />
				) : null }
				<p>{ getInfoText() }</p>
				{ errors.length ? errors.map( renderErrorBox ) : null }
				{ ( isInit || isDone ) && (
					<div className="cf">
						<Button
							disabled={ REQUIRED_SOFTWARE_SLUGS.length !== softwareInfo.length }
							isPrimary
							className="fr mt3"
							onClick={ isInit ? install : null }
							href={ isDone ? buttonAction.href : null }
						>
							{ isInit ? __( 'Start the Installation' ) : __( 'Continue' ) }
						</Button>
					</div>
				) }
			</div>
		</>
	);
};

const WelcomeWizardScreen = withWizardScreen( Welcome );
// eslint-disable-next-line react/display-name
export default props => (
	<WelcomeWizardScreen { ...omit( props, [ 'routes', 'headerText', 'buttonText' ] ) } />
);
