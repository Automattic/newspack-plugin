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
import { CreateTicket } from './views';

/**
 * Support
 */
class SupportWizard extends Component {
	render() {
		const screenParams = {
			headerIcon: <HeaderIcon />,
			headerText: __( 'Contact support', 'newspack' ),
			subHeaderText: __( 'Use the form below to contact our support.', 'newspack' ),
		};

		return <CreateTicket { ...screenParams } { ...this.props } />;
	}
}

render(
	createElement( withWizard( SupportWizard ) ),
	document.getElementById( 'newspack-support-wizard' )
);
