import '../../shared/js/public-path';

/**
 * Pop-ups Wizard
 */

/**
 * WordPress dependencies.
 */
import { Component, render, Fragment, createElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Material UI dependencies.
 */
import HeaderIcon from '@material-ui/icons/NewReleases';

/**
 * Internal dependencies.
 */
import { withWizard } from '../../components/src';
import Router from '../../components/src/proxied-imports/router';
import { PopupGroup, Analytics } from './views';

const { HashRouter, Redirect, Route, Switch } = Router;

const headerText = __( 'Pop-ups', 'newspack' );
const subHeaderText = __( 'Reach your readers with configurable calls-to-action.', 'newspack' );

const tabbedNavigation = [
	{
		label: __( 'Overlay', 'newpack' ),
		path: '/overlay',
		exact: true,
	},
	{
		label: __( 'Inline', 'newpack' ),
		path: '/inline',
		exact: true,
	},
	{
		label: __( 'Analytics', 'newpack' ),
		path: '/analytics',
		exact: true,
	},
];

class PopupsWizard extends Component {
	constructor( props ) {
		super( props );
		this.state = {
			popups: {
				inline: [],
				overlay: [],
			},
		};
	}
	/**
	 * Figure out whether to use the WooCommerce or Jetpack Mailchimp wizards and get appropriate settings.
	 */
	onWizardReady = () => {
		this.getPopups();
	};

	/**
	 * Get Pop-ups for the current wizard.
	 */
	getPopups = () => {
		const { setError, wizardApiFetch } = this.props;
		return wizardApiFetch( {
			path: '/newspack/v1/wizard/newspack-popups-wizard/',
		} )
			.then( ( { popups } ) => this.setState( { popups: this.sortPopups( popups ) } ) )
			.catch( error => setError( error ) );
	};

	/**
	 * Sort Pop-ups into categories.
	 */
	sortPopups = popups => {
		const overlay = this.sortPopupGroup(
			popups.filter( ( { options } ) => 'inline' !== options.placement )
		);
		const inline = this.sortPopupGroup(
			popups.filter( ( { options } ) => 'inline' === options.placement )
		);
		return { overlay, inline };
	};

	/**
	 * Sort Pop-up groups into categories.
	 */
	sortPopupGroup = popups => {
		const test = popups.filter( ( { options } ) => 'test' === options.frequency );
		const active = popups.filter( ( { categories, options, sitewide_default: sitewideDefault } ) =>
			'inline' === options.placement
				? 'test' !== options.frequency && 'never' !== options.frequency
				: 'test' !== options.frequency && ( sitewideDefault || categories.length )
		);
		const activeWithSitewideDefaultFirst = [
			...active.filter( ( { sitewide_default: sitewideDefault } ) => sitewideDefault ),
			...active.filter( ( { sitewide_default: sitewideDefault } ) => ! sitewideDefault ),
		];
		const inactive = popups.filter(
			( { categories, options, sitewide_default: sitewideDefault } ) =>
				'inline' === options.placement
					? 'never' === options.frequency
					: 'test' !== options.frequency && ( ! sitewideDefault && ! categories.length )
		);
		return { test, active: activeWithSitewideDefaultFirst, inactive };
	};

	render() {
		const { pluginRequirements } = this.props;
		console.log( this.state.popups );
		const { inline, overlay } = this.state.popups;
		return (
			<Fragment>
				<HashRouter hashType="slash">
					<Switch>
						{ pluginRequirements }
						<Route
							path="/overlay"
							render={ () => (
								<PopupGroup
									headerIcon={ <HeaderIcon /> }
									headerText={ headerText }
									subHeaderText={ subHeaderText }
									tabbedNavigation={ tabbedNavigation }
									items={ overlay }
									buttonText={ __( 'Add new Overlay Pop-up', 'newspack' ) }
									buttonAction="/wp-admin/post-new.php?post_type=newspack_popups_cpt"
								/>
							) }
						/>
						<Route
							path="/inline"
							render={ () => (
								<PopupGroup
									headerIcon={ <HeaderIcon /> }
									headerText={ headerText }
									subHeaderText={ subHeaderText }
									tabbedNavigation={ tabbedNavigation }
									items={ inline }
									buttonText={ __( 'Add new Inline Pop-up', 'newspack' ) }
									buttonAction="/wp-admin/post-new.php?post_type=newspack_popups_cpt?placement=inline"
								/>
							) }
						/>
						<Route
							path="/analytics"
							render={ () => (
								<Analytics
									headerIcon={ <HeaderIcon /> }
									headerText={ headerText }
									subHeaderText={ subHeaderText }
									tabbedNavigation={ tabbedNavigation }
								/>
							) }
						/>
						<Redirect to="/overlay" />
					</Switch>
				</HashRouter>
			</Fragment>
		);
	}
}

render(
	createElement( withWizard( PopupsWizard, [ 'jetpack', 'newspack-popups' ] ) ),
	document.getElementById( 'newspack-popups-wizard' )
);
