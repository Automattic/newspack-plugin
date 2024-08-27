/**
 * Newspack > Settings > Emails > Emails section
 */

/**
 * WordPress dependencies.
 */
import { __ } from '@wordpress/i18n';
import { useState, Fragment } from '@wordpress/element';

/**
 * Internal dependencies.
 */
import { Notice } from '../../../../../components/src';
import { useWizardApiFetch } from '../../../../hooks/use-wizard-api-fetch';
import WizardsActionCard from '../../../../wizards-action-card';
import WizardsPluginCard from '../../../../wizards-plugin-card';

const emailSections = window.newspackSettings.emails.sections;
const emailsCache = Object.values( emailSections.emails.all );
const postType = emailSections.emails.postType;

const Emails = () => {
	const [ pluginsReady, setPluginsReady ] = useState(
		emailSections.emails.dependencies.newspackNewsletters
	);

	const { wizardApiFetch, isFetching, errorMessage, resetError } =
		useWizardApiFetch( 'newspack-settings/emails' );

	const [ emails, setEmails ] = useState( emailsCache );

	const updateStatus = ( postId: number, status: string ) => {
		wizardApiFetch(
			{
				path: `/wp/v2/${ postType }/${ postId }`,
				method: 'POST',
				data: { status },
			},
			{
				onStart() {
					resetError();
				},
				onSuccess() {
					setEmails(
						emails.map( email => {
							if ( email.post_id === postId ) {
								return { ...email, status };
							}
							return email;
						} )
					);
				},
			}
		);
	};

	if ( false === pluginsReady ) {
		return (
			<Fragment>
				<Notice isError>
					{ __(
						'Newspack uses Newspack Newsletters to handle editing email-type content. Please activate this plugin to proceed.',
						'newspack'
					) }
					<br />
					{ __(
						'Until this feature is configured, default receipts will be used.',
						'newspack'
					) }
				</Notice>
				<WizardsPluginCard
					slug="newspack-newsletters"
					title={ __( 'Newspack Newsletters', 'newspack' ) }
					description={ __(
						'Newspack Newsletters is the plugin that powers Newspack email receipts.',
						'newspack'
					) }
					onStatusChange={ (
						statuses: Record< string, boolean >
					) => {
						if ( ! statuses.isLoading ) {
							setPluginsReady( statuses.isSetup );
						}
					} }
				/>
			</Fragment>
		);
	}

	return (
		<Fragment>
			{ emails.map( email => {
				const isActive = email.status === 'publish';
				return (
					<WizardsActionCard
						key={ email.post_id }
						disabled={ isFetching }
						title={ email.label }
						titleLink={ email.edit_link }
						href={ email.edit_link }
						description={ email.description }
						actionText={ __( 'Edit', 'newspack' ) }
						toggleChecked={ isActive }
						toggleOnChange={ value =>
							updateStatus(
								email.post_id,
								value ? 'publish' : 'draft'
							)
						}
						{ ...( isActive
							? {}
							: {
									notification: __(
										'This email is not active. The default receipt will be used.',
										'newspack'
									),
									notificationLevel: 'info',
							  } ) }
					>
						{ errorMessage && (
							<Notice
								noticeText={
									errorMessage ||
									__( 'Something went wrong.', 'newspack' )
								}
								isError
							/>
						) }
					</WizardsActionCard>
				);
			} ) }
		</Fragment>
	);
};

export default Emails;
