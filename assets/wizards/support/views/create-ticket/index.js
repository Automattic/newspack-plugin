/* global newspack_support_data */

/**
 * External dependencies
 */
import Dropzone from 'react-dropzone';
import classnames from 'classnames';
import CloseIcon from '@material-ui/icons/Close';
import { uniqueId } from 'lodash';

/**
 * WordPress dependencies
 */
import { Fragment, Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Material UI dependencies
 */
import CloudUploadIcon from '@material-ui/icons/CloudUpload';

/**
 * Internal dependencies
 */
import {
	withWizardScreen,
	Notice,
	Button,
	TextareaControl,
	TextControl,
	SelectControl,
} from '../../../../components/src';
import './style.scss';
import withWPCOMAuth from '../../components/withWPCOMAuth';

const Footer = props => (
	<span className="newspack-buttons-card">
		<Button isPrimary { ...props } />
	</span>
);

const PRIORITY_OPTIONS = [
	{ value: 'low', label: __( 'Low', 'newspack' ) },
	{ value: 'normal', label: __( 'Normal', 'newspack' ) },
	{ value: 'high', label: __( 'High', 'newspack' ) },
	{ value: 'urgent', label: __( 'Urgent', 'newspack' ) },
];

/**
 * Create ticket Support screen.
 */
class CreateTicket extends Component {
	state = {
		isSent: false,
		errorMessage: false,
		subject: '',
		priority: PRIORITY_OPTIONS[ 0 ].value,
		message: '',
		attachments: [],
	};

	handleChange = type => value => this.setState( { [ type ]: value } );

	createTicket = ( uploads = [] ) => {
		const { wizardApiFetch } = this.props;
		const { subject, message, priority } = this.state;
		wizardApiFetch( {
			path: '/newspack/v1/wizard/newspack-support-wizard/ticket',
			method: 'POST',
			data: { subject, message, priority, uploads },
		} )
			.then( () => {
				this.setState( { isSent: true } );
				this.props.doneLoading();
			} )
			.catch( ( { message: errorMessage } ) => {
				this.setState( { errorMessage } );
				this.props.doneLoading();
			} );
	};

	handleSubmit = event => {
		event.preventDefault();

		if ( ! this.isValid() ) {
			return;
		}
		this.props.startLoading();

		const { attachments } = this.state;
		if ( attachments ) {
			const { API_URL } = newspack_support_data;
			const uploadRequests = [ ...attachments ].map( ( { file } ) => {
				return fetch( `${ API_URL }/uploads.json?filename=${ file.name }`, {
					method: 'POST',
					body: file,
					headers: {
						'Content-Type': file.type,
					},
				} )
					.then( res => res.json() )
					.then( ( { upload } ) => upload.token );
			} );

			Promise.all( uploadRequests ).then( this.createTicket );
		} else {
			this.createTicket();
		}
	};

	isValid = () => Boolean( this.state.subject && this.state.message );

	handleFiles = newAttachments =>
		this.setState( ( { attachments } ) => ( {
			attachments: [
				...attachments,
				...newAttachments.map( file => ( {
					file,
					id: uniqueId(),
				} ) ),
			],
		} ) );

	removeAttachment = idToRemove =>
		this.setState( ( { attachments } ) => ( {
			attachments: attachments.filter( ( { id } ) => id !== idToRemove ),
		} ) );

	render() {
		const { isSent, errorMessage, attachments } = this.state;
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
						{ ! newspack_support_data.IS_PRE_LAUNCH && (
							<Notice
								noticeText={ __(
									'Please visit our <a href="https://newspack.blog/support/">support docs</a> first.',
									'newspack'
								) }
								rawHTML
							/>
						) }
						<TextControl
							label={ __( 'Subject', 'newspack' ) }
							onChange={ this.handleChange( 'subject' ) }
							value={ this.state.subject }
						/>
						<SelectControl
							label={ __( 'Priority', 'newspack' ) }
							options={ PRIORITY_OPTIONS }
							onChange={ this.handleChange( 'priority' ) }
							value={ this.state.priority }
						/>
						<TextareaControl
							label={ __( 'Message', 'newspack' ) }
							onChange={ this.handleChange( 'message' ) }
							value={ this.state.message }
						/>
						<div className="newspack-support__files">
							{ attachments.map( ( { file, id } ) => (
								<div key={ id } className="newspack-support__files__item">
									<Button onClick={ () => this.removeAttachment( id ) }>
										<CloseIcon />
									</Button>
									<span>{ file.name }</span>
								</div>
							) ) }
						</div>
						<Dropzone onDrop={ this.handleFiles }>
							{ ( { getRootProps, getInputProps, isDragActive } ) => (
								<section
									className={ classnames( 'newspack-support__dropzone', {
										'newspack-support__dropzone--active': isDragActive,
									} ) }
								>
									<div { ...getRootProps() }>
										<input { ...getInputProps() } />
										<div className="newspack-support__dropzone__text">
											<CloudUploadIcon />
											{ __( 'Drop files to upload, or click to select files.', 'newspack' ) }
										</div>
									</div>
								</section>
							) }
						</Dropzone>
						<Footer { ...buttonProps } />
					</form>
				) }
			</Fragment>
		);
	}
}

export default withWizardScreen( withWPCOMAuth( CreateTicket ) );
