/**
 * Newspack > Settings > Emails > Emails section
 */

/**
 * WordPress dependencies.
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect, useMemo, Fragment } from '@wordpress/element';
import { filterSortAndPaginate } from '@wordpress/dataviews';
import type { Action, Field, View } from '@wordpress/dataviews';
import { Icon, envelope } from '@wordpress/icons';

/**
 * Internal dependencies.
 */
import { Badge, DataViews, Notice, utils } from '../../../../../../packages/components/src';
import WizardsPluginCard from '../../../../wizards-plugin-card';
import { useWizardApiFetch } from '../../../../hooks/use-wizard-api-fetch';
import './emails.scss';

interface EmailItem {
	label: string;
	post_id: number;
	edit_link: string;
	status: string;
	type: string;
	category: string;
	trigger_description: string;
	registry_slug: string;
	recipient: 'reader' | 'admin';
	source: 'newspack' | 'woocommerce';
}

interface EmailSettings {
	newspack_emails: EmailItem[];
	post_type: string;
	admin_url?: string;
	enable_woocommerce_email_editor?: boolean;
}

const DEFAULT_VIEW: View = {
	type: 'grid',
	page: 1,
	perPage: 50,
	search: '',
	fields: [ 'recipient', 'status' ],
	filters: [],
	layout: {},
	titleField: 'name',
	descriptionField: 'trigger_description',
	mediaField: 'preview',
};

const PageHeading = () => <h1 className="screen-reader-text">{ __( 'Emails', 'newspack-plugin' ) }</h1>;

const Emails = () => {
	const emailSections = window.newspackSettings.emails.sections;
	const [ pluginsReady, setPluginsReady ] = useState( Boolean( emailSections.emails.dependencies.newspackNewsletters ) );

	const [ data, setData ] = useState< EmailItem[] >( [] );
	const [ postType, setPostType ] = useState< string >( emailSections.emails.postType );
	const [ view, setView ] = useState< View >( DEFAULT_VIEW );

	const { wizardApiFetch, isFetching, errorMessage, resetError } = useWizardApiFetch( 'newspack-settings/emails' );

	const fetchData = () => {
		resetError();
		wizardApiFetch< EmailSettings >(
			{
				path: '/newspack/v1/wizard/newspack-settings/emails',
				isCached: false,
			},
			{
				onSuccess( result: EmailSettings ) {
					setData( result.newspack_emails || [] );
					if ( result.post_type ) {
						setPostType( result.post_type );
					}
				},
			}
		);
	};

	useEffect( fetchData, [] );

	const updateStatus = ( postId: number, nextStatus: string ) => {
		resetError();
		wizardApiFetch(
			{
				path: `/wp/v2/${ postType }/${ postId }`,
				method: 'POST',
				data: { status: nextStatus },
			},
			{
				onSuccess: () => fetchData(),
			}
		);
	};

	const resetEmail = ( postId: number ) => {
		resetError();
		// @todo NPPD-1532 Move reset handler to class-emails-section.php so it
		// lives under wizard/newspack-settings/emails/{id} instead of reaching
		// into the donations wizard namespace.
		wizardApiFetch(
			{
				path: `/newspack/v1/wizard/newspack-audience-donations/emails/${ postId }`,
				method: 'DELETE',
			},
			{
				onSuccess: () => fetchData(),
			}
		);
	};

	const fields: Field< EmailItem >[] = useMemo(
		() => [
			{
				id: 'preview',
				label: __( 'Preview', 'newspack-plugin' ),
				type: 'media',
				enableSorting: false,
				enableHiding: true,
				// @todo NPPD-1525 Replace with <EmailPreview> component.
				render: ( { item }: { item: EmailItem } ) => (
					<a href={ item.edit_link } className="newspack-emails__preview-placeholder">
						<Icon icon={ envelope } size={ 32 } />
					</a>
				),
			},
			{
				id: 'name',
				label: __( 'Email', 'newspack-plugin' ),
				enableGlobalSearch: true,
				getValue: ( { item }: { item: EmailItem } ) => item.label,
				render: ( { item }: { item: EmailItem } ) => (
					<a href={ item.edit_link } className="newspack-emails__name-link">
						<strong>{ item.label }</strong>
					</a>
				),
			},
			{
				id: 'trigger_description',
				label: __( 'Description', 'newspack-plugin' ),
				enableGlobalSearch: true,
				getValue: ( { item }: { item: EmailItem } ) => item.trigger_description,
				render: ( { item }: { item: EmailItem } ) => (
					<span className="newspack-emails__trigger-description">{ item.trigger_description }</span>
				),
				enableHiding: false,
				enableSorting: false,
			},
			{
				id: 'recipient',
				label: __( 'Recipient', 'newspack-plugin' ),
				enableGlobalSearch: true,
				getValue: ( { item }: { item: EmailItem } ) =>
					item.recipient === 'admin' ? __( 'Admin', 'newspack-plugin' ) : __( 'Reader', 'newspack-plugin' ),
				render: ( { item }: { item: EmailItem } ) => (
					<span>{ item.recipient === 'admin' ? __( 'Admin', 'newspack-plugin' ) : __( 'Reader', 'newspack-plugin' ) }</span>
				),
			},
			{
				id: 'status',
				label: __( 'Status', 'newspack-plugin' ),
				getValue: ( { item }: { item: EmailItem } ) => item.status,
				render: ( { item }: { item: EmailItem } ) => {
					const isEnabled = item.status === 'publish';
					return (
						<Badge
							level={ isEnabled ? 'success' : 'default' }
							text={ isEnabled ? __( 'Enabled', 'newspack-plugin' ) : __( 'Disabled', 'newspack-plugin' ) }
						/>
					);
				},
				elements: [
					{ value: 'publish', label: __( 'Enabled', 'newspack-plugin' ) },
					{ value: 'draft', label: __( 'Disabled', 'newspack-plugin' ) },
				],
				filterBy: { isPrimary: false, operators: [ 'is' ] },
			},
		],
		[]
	);

	const actions: Action< EmailItem >[] = [
		{
			id: 'edit',
			label: __( 'Edit', 'newspack-plugin' ),
			callback: ( items: EmailItem[] ) => {
				window.location.href = items[ 0 ].edit_link;
			},
		},
		{
			id: 'deactivate',
			label: __( 'Deactivate', 'newspack-plugin' ),
			isEligible: ( item: EmailItem ) => item.source !== 'woocommerce' && item.category !== 'reader-activation' && item.status === 'publish',
			callback: ( items: EmailItem[] ) => {
				updateStatus( items[ 0 ].post_id, 'draft' );
			},
		},
		{
			id: 'activate',
			label: __( 'Activate', 'newspack-plugin' ),
			isEligible: ( item: EmailItem ) => item.source !== 'woocommerce' && item.category !== 'reader-activation' && item.status !== 'publish',
			callback: ( items: EmailItem[] ) => {
				updateStatus( items[ 0 ].post_id, 'publish' );
			},
		},
		{
			id: 'reset',
			label: __( 'Reset', 'newspack-plugin' ),
			isDestructive: true,
			isEligible: ( item: EmailItem ) => item.source !== 'woocommerce' && Boolean( item.registry_slug ),
			callback: ( items: EmailItem[] ) => {
				if ( utils.confirmAction( __( 'Are you sure you want to reset the contents of this email?', 'newspack-plugin' ) ) ) {
					resetEmail( items[ 0 ].post_id );
				}
			},
		},
	];

	const { data: processedData, paginationInfo } = useMemo( () => filterSortAndPaginate( data, view, fields ), [ data, view, fields ] );

	if ( false === pluginsReady ) {
		return (
			<Fragment>
				<PageHeading />
				<Notice
					isError
					noticeText={
						__(
							'Newspack uses Newspack Newsletters to handle editing email-type content. Please activate this plugin to proceed.',
							'newspack-plugin'
						) +
						' ' +
						__( 'Until this feature is configured, default receipts will be used.', 'newspack-plugin' )
					}
				/>
				<WizardsPluginCard
					slug="newspack-newsletters"
					title={ __( 'Newspack Newsletters', 'newspack-plugin' ) }
					description={ __( 'Newspack Newsletters is the plugin that powers Newspack email receipts.', 'newspack-plugin' ) }
					onStatusChange={ ( statuses: Record< string, boolean > ) => {
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
			<PageHeading />
			{ errorMessage && <Notice isError noticeText={ errorMessage } /> }
			<DataViews
				className="newspack-emails"
				data={ processedData }
				fields={ fields }
				view={ view }
				onChangeView={ setView }
				actions={ actions }
				paginationInfo={ paginationInfo }
				defaultLayouts={ { table: {}, grid: {} } }
				isLoading={ isFetching }
				getItemId={ ( item: EmailItem ) => String( item.post_id ) }
				search
			/>
		</Fragment>
	);
};

export default Emails;
