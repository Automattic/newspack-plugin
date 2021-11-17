/**
 * External dependencies.
 */
import classnames from 'classnames';

/**
 * WordPress dependencies.
 */
import { useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { category } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import './style.scss';
import { Footer, Notice, Button, NewspackIcon, TabbedNavigation, PluginInstaller } from '../';
import Router from '../proxied-imports/router';
import registerStore, { WIZARD_STORE_NAMESPACE } from './store';
import { useWizardData } from './store/utils';
import WizardError from './components/WizardError';

registerStore();

const { HashRouter, Redirect, Route, Switch } = Router;

const Wizard = ( {
	sections = [],
	apiSlug,
	headerText,
	subHeaderText,
	hasSimpleFooter,
	className,
	renderAboveSections,
	requiredPlugins = [],
} ) => {
	const isLoading = useSelect( select => select( WIZARD_STORE_NAMESPACE ).isLoading() );
	const isQuietLoading = useSelect( select => select( WIZARD_STORE_NAMESPACE ).isQuietLoading() );

	// Trigger initial data fetch. Some sections might not use the wizard data,
	// but for consistency, fetching is triggered regardless of the section.
	useSelect( select => select( WIZARD_STORE_NAMESPACE ).getWizardAPIData( apiSlug ) );

	let displayedSections = sections.filter( section => ! section.isHidden );

	const [ pluginRequirementsSatisfied, setPluginRequirementsSatisfied ] = useState(
		requiredPlugins.length === 0
	);
	if ( ! pluginRequirementsSatisfied ) {
		headerText =
			requiredPlugins.length > 1
				? __( 'Required plugins', 'newspack' )
				: __( 'Required plugin', 'newspack' );
		displayedSections = [
			{
				path: '/',
				render: () => (
					<PluginInstaller
						plugins={ requiredPlugins }
						onStatus={ ( { complete } ) => setPluginRequirementsSatisfied( complete ) }
					/>
				),
			},
		];
	}

	return (
		<>
			<WizardError />
			<div
				className={ classnames(
					isLoading ? 'newspack-wizard__is-loading' : 'newspack-wizard__is-loaded',
					{
						'newspack-wizard__is-loading-quiet': isQuietLoading,
					}
				) }
			>
				<HashRouter hashType="slash">
					{ newspack_aux_data.is_debug_mode && (
						<Notice
							isWarning
							className="newspack-wizard__above-header"
							noticeText={ __( 'Newspack is in debug mode.', 'newspack' ) }
						/>
					) }
					<div className="bg-white">
						<div className="newspack-wizard__header__inner">
							<div className="newspack-wizard__title">
								<Button
									isLink
									href={ newspack_urls.dashboard }
									label={ __( 'Return to Dashboard', 'newspack' ) }
									showTooltip={ true }
									icon={ category }
									iconSize={ 36 }
								>
									<NewspackIcon size={ 36 } />
								</Button>
								{ headerText && <h1>{ headerText }</h1> }
								{ subHeaderText && <p className="screen-reader-text">{ subHeaderText }</p> }
							</div>
							{ displayedSections.length > 1 && <TabbedNavigation items={ displayedSections } /> }
						</div>
					</div>
					<Switch>
						{ displayedSections.map( ( section, index ) => {
							const SectionComponent = section.render;
							return (
								<Route key={ index } path={ section.path }>
									<div
										className={ classnames(
											'newspack-wizard newspack-wizard__content',
											className
										) }
									>
										{ 'function' === typeof renderAboveSections ? renderAboveSections() : null }
										<SectionComponent />
									</div>
								</Route>
							);
						} ) }
						<Redirect to={ displayedSections[ 0 ].path } />
					</Switch>
				</HashRouter>
			</div>
			{ ! isLoading && <Footer simple={ hasSimpleFooter } /> }
		</>
	);
};

Wizard.useWizardData = useWizardData;

Wizard.STORE_NAMESPACE = WIZARD_STORE_NAMESPACE;

export default Wizard;
