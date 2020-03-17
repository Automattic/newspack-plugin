import '../../shared/js/public-path';

/**
 * External dependencies
 */
import { parse } from 'qs';

/**
 * WordPress dependencies.
 */
import { render, createElement, Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Material UI dependencies.
 */
import HeaderIcon from '@material-ui/icons/ContactSupport';

/**
 * Internal dependencies.
 */
import { withWizard } from '../../components/src';
import { CreateTicket, Chat, Loading } from './views';
import Router from '../../components/src/proxied-imports/router';

const { HashRouter, Redirect, Route, Switch } = Router;

/**
 * Support view.
 *
 * This is also the location of redirect URI for WPCOM.
 * It means WPCOM will redirect here after authentication - this component
 * will read the auth variables provided by in location hash and pass
 * them to the backend, where they will be saved.
 */
class SupportWizard extends Component {
	hasHashDataWithToken = () => {
		const { hash } = window.location;
		const hashData = parse( hash.substring( 1 ) );
		return hashData.access_token ? hashData : false;
	};

	componentDidMount() {
		const hashData = this.hasHashDataWithToken();
		if ( hashData ) {
			this.props
				.wizardApiFetch( {
					path: '/newspack/v1/wizard/newspack-support-wizard/wpcom_access_token',
					method: 'POST',
					data: hashData,
				} )
				.then( () => {
					// redirect so that Router can take over
					const urlWithoutHash = window.location.href.substring(
						-1,
						window.location.href.indexOf( '#' )
					);
					window.location = `${ urlWithoutHash }#/chat`;
					window.location.reload();
				} )
				.catch( ( { message: errorMessage } ) => {
					this.setState( { errorMessage } );
				} );
		}
	}

	render() {
		if ( this.hasHashDataWithToken() ) {
			return <Loading />;
		}

		const props = {
			headerIcon: <HeaderIcon />,
			headerText: __( 'Contact support', 'newspack' ),
			subHeaderText: __( 'Use the form below to contact our support.', 'newspack' ),
			tabbedNavigation: [
				{
					label: __( 'Submit ticket' ),
					path: '/ticket',
					exact: true,
				},
				{
					label: __( 'Chat' ),
					path: '/chat',
					exact: true,
				},
			],
			...this.props,
		};

		return (
			<HashRouter hashType="slash">
				<Switch>
					<Route path="/ticket" exact render={ () => <CreateTicket { ...props } /> } />
					<Route path="/chat" exact render={ () => <Chat { ...props } /> } />
					<Redirect to="/ticket" />
				</Switch>
			</HashRouter>
		);
	}
}

render(
	createElement( withWizard( SupportWizard ) ),
	document.getElementById( 'newspack-support-wizard' )
);
