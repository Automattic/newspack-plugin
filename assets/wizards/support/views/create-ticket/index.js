/**
 * WordPress dependencies
 */
import { Fragment, Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	withWizardScreen,
	Notice,
	Button,
	TextareaControl,
	TextControl,
} from '../../../../components/src';

const Footer = props => (
	<span className="newspack-buttons-card">
		<Button isPrimary { ...props } />
	</span>
);

/**
 * Create ticket Support screen.
 */
class CreateTicket extends Component {
	state = {
		isSent: false,
		errorMessage: false,
		subject: '',
		message: '',
	};
	handleChange = type => value => this.setState( { [ type ]: value } );
	handleSubmit = event => {
		event.preventDefault();

		if ( ! this.isValid() ) {
			return;
		}

		const { wizardApiFetch } = this.props;
		const { subject, message } = this.state;

		wizardApiFetch( {
			path: '/newspack/v1/wizard/newspack-support-wizard/ticket',
			method: 'POST',
			data: { subject, message },
		} )
			.then( () => {
				this.setState( { isSent: true } );
			} )
			.catch( ( { message: errorMessage } ) => {
				this.setState( { errorMessage } );
			} );
	};
	isValid = () => Boolean( this.state.subject && this.state.message );
	render() {
		const { isSent, errorMessage } = this.state;
		const buttonProps =
			isSent || errorMessage
				? {
						href: newspack_urls && newspack_urls.dashboard,
						children: __( 'Back to dashboard', 'newspack' ),
				  }
				: {
						type: 'submit',
						disabled: ! this.isValid(),
						children: __( 'Send', 'newspack' ),
				  };

		if ( errorMessage ) {
			return (
				<Fragment>
					<Notice isError noticeText={ errorMessage } rawHTML />
					<Footer { ...buttonProps } />
				</Fragment>
			);
		}

		return (
			<Fragment>
				{ isSent ? (
					<Fragment>
						<Notice
							isSuccess
							noticeText={ __(
								"We've received your message, and you'll hear back from us shortly.",
								'newspack'
							) }
						/>
						<Footer { ...buttonProps } />
					</Fragment>
				) : (
					<form onSubmit={ this.handleSubmit }>
						<TextControl
							label={ __( 'Subject', 'newspack' ) }
							onChange={ this.handleChange( 'subject' ) }
							value={ this.state.subject }
						/>
						<TextareaControl
							label={ __( 'Message', 'newspack' ) }
							onChange={ this.handleChange( 'message' ) }
							value={ this.state.message }
						/>
						<Footer { ...buttonProps } />
					</form>
				) }
			</Fragment>
		);
	}
}

export default withWizardScreen( CreateTicket );
