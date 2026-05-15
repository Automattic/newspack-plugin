/**
 * Newspack > Settings > Emails > Emails section
 */

/**
 * WordPress dependencies.
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect, useCallback, useMemo, Fragment } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { filterSortAndPaginate } from '@wordpress/dataviews';
import type { Action, Field, View } from '@wordpress/dataviews';
import { Icon, envelope } from '@wordpress/icons';

/**
 * Internal dependencies.
 */
import { Badge, DataViews, Notice, utils } from '../../../../../../packages/components/src';
import WizardsPluginCard from '../../../../wizards-plugin-card';
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
	const [ isLoading, setIsLoading ] = useState( true );
	const [ view, setView ] = useState< View >( DEFAULT_VIEW );
	const [ error, setError ] = useState< string | null >( null );

	const fetchData = useCallback( () => {
		setIsLoading( true );
		setError( null );
		apiFetch< EmailSettings >( {
			path: '/newspack/v1/wizard/newspack-settings/emails',
		} )
			.then( result => {
				setData( result.newspack_emails || [] );
				if ( result.post_type ) {
					setPostType( result.post_type );
				}
			} )
			.catch( () => {
				setError( __( 'Failed to load emails. Please refresh the page.', 'newspack-plugin' ) );
			} )
			.finally( () => setIsLoading( false ) );
	}, [] );

	useEffect( () => {
		fetchData();
	}, [ fetchData ] );

	const updateStatus = useCallback(
		( postId: number, nextStatus: string ) => {
			setError( null );
			let previousStatus: string | undefined;
			// Optimistic update — see NPPD-1531 for consolidating with the wizard data store.
			setData( prev =>
				prev.map( email => {
					if ( email.post_id === postId ) {
						previousStatus = email.status;
						return { ...email, status: nextStatus };
					}
					return email;
				} )
			);
			apiFetch( {
				path: `/wp/v2/${ postType }/${ postId }`,
				method: 'POST',
				data: { status: nextStatus },
			} ).catch( () => {
				// Revert on failure.
				setData( prev =>
					prev.map( email => {
						if ( email.post_id === postId && previousStatus !== undefined ) {
							return { ...email, status: previousStatus };
						}
						return email;
					} )
				);
				setError( __( 'Failed to update email status.', 'newspack-plugin' ) );
			} );
		},
		[ postType ]
	);

	const resetEmail = useCallback(
		( postId: number ) => {
			setError( null );
			// @todo NPPD-1532 Move reset handler to class-emails-section.php so it
			// lives under wizard/newspack-settings/emails/{id} instead of reaching
			// into the donations wizard namespace.
			apiFetch( {
				path: `/newspack/v1/wizard/newspack-audience-donations/emails/${ postId }`,
				method: 'DELETE',
			} )
				.then( () => {
					fetchData();
				} )
				.catch( () => {
					setError( __( 'Failed to reset email. Please try again.', 'newspack-plugin' ) );
				} );
		},
		[ fetchData ]
	);

	const fields: Field< EmailItem >[] = useMemo(
		() => [
			{
				id: 'preview',
				label: __( 'Preview', 'newspack-plugin' ),
				type: 'media',
				enableSorting: false,
				enableHiding: true,
				// @todo NPPD-1525 Replace with <EmailPreview> component.
				render: () => (
					<div className="newspack-emails__preview-placeholder">
						<Icon icon={ envelope } size={ 32 } />
					</div>
				),
			},
			{
				id: 'name',
				label: __( 'Email', 'newspack-plugin' ),
				enableGlobalSearch: true,
				getValue: ( { item }: { item: EmailItem } ) => item.label,
				render: ( { item }: { item: EmailItem } ) => <strong>{ item.label }</strong>,
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

	const actions: Action< EmailItem >[] = useMemo(
		() => [
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
				isEligible: ( item: EmailItem ) =>
					item.source !== 'woocommerce' && item.category !== 'reader-activation' && item.status === 'publish',
				callback: ( items: EmailItem[] ) => {
					updateStatus( items[ 0 ].post_id, 'draft' );
				},
			},
			{
				id: 'activate',
				label: __( 'Activate', 'newspack-plugin' ),
				isEligible: ( item: EmailItem ) =>
					item.source !== 'woocommerce' && item.category !== 'reader-activation' && item.status !== 'publish',
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
		],
		[ resetEmail, updateStatus ]
	);

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
			{ error && <Notice isError noticeText={ error } /> }
			<DataViews
				className="newspack-emails"
				data={ processedData }
				fields={ fields }
				view={ view }
				onChangeView={ setView }
				actions={ actions }
				paginationInfo={ paginationInfo }
				defaultLayouts={ { table: {}, grid: {} } }
				isLoading={ isLoading }
				getItemId={ ( item: EmailItem ) => String( item.post_id ) }
				search
			/>
		</Fragment>
	);
};

export default Emails;
