/* global newspack_support_data */

/**
 * External dependencies
 */
import Dropzone from 'react-dropzone';
import classnames from 'classnames';
import { uniqueId } from 'lodash';
import RichTextEditor from 'react-rte';

/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { trash } from '@wordpress/icons';
import { useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import {
	Notice,
	Button,
	TextControl,
	SelectControl,
	Wizard,
	hooks,
} from '../../../../components/src';
import './style.scss';
import withWPCOMAuth from '../../components/withWPCOMAuth';

const { API_URL } = newspack_support_data;

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

const CreateTicket = () => {
	const [ newTicket, updateNewTicket ] = hooks.useObjectState( {
		isSent: false,
		errorMessage: API_URL ? false : __( 'Missing support API URL.', 'newspack' ),
		subject: '',
		priority: PRIORITY_OPTIONS[ 0 ].value,
		message: RichTextEditor.createEmptyValue(),
		attachments: [],
	} );

	const handleChange = type => value => updateNewTicket( { [ type ]: value } );

	const { wizardApiFetch } = useDispatch( Wizard.STORE_NAMESPACE );

	const createTicket = ( uploads = [] ) => {
		const { subject, message, priority } = newTicket;
		wizardApiFetch( {
			path: '/newspack/v1/wizard/newspack-support-wizard/ticket',
			method: 'POST',
			data: { subject, message: message.toString( 'html' ), priority, uploads },
		} ).then( response => {
			updateNewTicket(
				response.error ? { errorMessage: response.error.message } : { isSent: true }
			);
		} );
	};

	const handleSubmit = event => {
		event.preventDefault();

		if ( ! isValid() ) {
			return;
		}

		const { attachments } = newTicket;
		if ( attachments ) {
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

			Promise.all( uploadRequests ).then( createTicket );
		} else {
			createTicket();
		}
	};

	const isValid = () => Boolean( newTicket.subject && newTicket.message );

	const handleFiles = newAttachments =>
		updateNewTicket( ( { attachments } ) => ( {
			attachments: [
				...attachments,
				...newAttachments.map( file => ( {
					file,
					id: uniqueId(),
				} ) ),
			],
		} ) );

	const removeAttachment = idToRemove =>
		updateNewTicket( ( { attachments } ) => ( {
			attachments: attachments.filter( ( { id } ) => id !== idToRemove ),
		} ) );

	const { isSent, errorMessage, attachments } = newTicket;
	const buttonProps =
		isSent || errorMessage
			? {
					href: newspack_urls && newspack_urls.dashboard,
					children: __( 'Back to dashboard', 'newspack' ),
			  }
			: {
					type: 'submit',
					disabled: ! isValid(),
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
				<form onSubmit={ handleSubmit }>
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
						onChange={ handleChange( 'subject' ) }
						value={ newTicket.subject }
					/>
					<SelectControl
						label={ __( 'Priority', 'newspack' ) }
						options={ PRIORITY_OPTIONS }
						onChange={ handleChange( 'priority' ) }
						value={ newTicket.priority }
					/>
					<div className="components-base-control newspack-text-control">
						<div className="components-base-control__field">
							{ /* eslint-disable-next-line jsx-a11y/label-has-for */ }
							<label className="components-base-control__label">
								{ __( 'Message', 'newspack' ) }
							</label>
							<RichTextEditor
								onChange={ handleChange( 'message' ) }
								value={ newTicket.message }
								placeholder={ __( 'Your message…', 'newspack' ) }
							/>
						</div>
					</div>
					<div className="newspack-support__files">
						{ attachments.map( ( { file, id } ) => (
							<div key={ id } className="newspack-support__files__item">
								<Button
									onClick={ () => removeAttachment( id ) }
									icon={ trash }
									isQuaternary
									isSmall
								/>
								<span>{ file.name }</span>
							</div>
						) ) }
					</div>
					<Dropzone onDrop={ handleFiles }>
						{ ( { getRootProps, getInputProps, isDragActive } ) => (
							<section
								className={ classnames( 'newspack-support__dropzone', {
									'newspack-support__dropzone--active': isDragActive,
								} ) }
							>
								<div { ...getRootProps() }>
									<input { ...getInputProps() } />
									<div className="newspack-support__dropzone__text">
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
};

export default withWPCOMAuth( CreateTicket );
