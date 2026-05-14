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
import { Button } from '@wordpress/components';
import type { Action, Field, View } from '@wordpress/dataviews';

/**
 * Internal dependencies.
 */
import { Card, DataViews, Notice, utils } from '../../../../../../packages/components/src';
import WizardsPluginCard from '../../../../wizards-plugin-card';

interface EmailItem {
	label: string;
	description: string;
	post_id: number;
	edit_link: string;
	subject: string;
	from_name: string;
	from_email: string;
	reply_to_email: string;
	status: string;
	type: string;
	category: string;
	default_shown: boolean;
	trigger_description: string;
	registry_slug: string;
	recipient: 'reader' | 'admin';
}

interface EmailSettings {
	newspack_emails: EmailItem[];
	post_type: string;
	admin_url?: string;
	enable_woocommerce_email_editor?: boolean;
}

const CATEGORY_ORDER: Record< string, number > = {
	'reader-revenue': 0,
	'reader-activation': 1,
};

const DEFAULT_VIEW: View = {
	type: 'table',
	page: 1,
	perPage: 25,
	search: '',
	fields: [ 'recipient', 'status' ],
	filters: [],
	layout: {},
	titleField: 'name',
};

const Emails = () => {
	const emailSections = window.newspackSettings.emails.sections;
	const [ pluginsReady, setPluginsReady ] = useState( emailSections.emails.dependencies.newspackNewsletters );

	const [ data, setData ] = useState< EmailItem[] >( [] );
	const [ postType, setPostType ] = useState< string >( emailSections.emails.postType );
	const [ isLoading, setIsLoading ] = useState( true );
	const [ showAll, setShowAll ] = useState( false );
	const [ view, setView ] = useState< View >( DEFAULT_VIEW );
	const [ error, setError ] = useState< string | null >( null );

	const fetchData = useCallback( () => {
		setIsLoading( true );
		setError( null );
		apiFetch< EmailSettings >( {
			path: '/newspack/v1/wizard/newspack-settings/emails',
		} )
			.then( result => {
				const emails = result.newspack_emails || [];
				// Sort by category: reader-revenue first, reader-activation second, everything else last.
				emails.sort( ( a, b ) => {
					const orderA = CATEGORY_ORDER[ a.category ] ?? 2;
					const orderB = CATEGORY_ORDER[ b.category ] ?? 2;
					return orderA - orderB;
				} );
				setData( emails );
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

	const filteredData = useMemo( () => ( showAll ? data : data.filter( email => email.default_shown ) ), [ data, showAll ] );

	const updateStatus = useCallback(
		( postId: number, status: string ) => {
			setError( null );
			// Optimistic update.
			setData( prev =>
				prev.map( email => {
					if ( email.post_id === postId ) {
						return { ...email, status };
					}
					return email;
				} )
			);
			apiFetch( {
				path: `/wp/v2/${ postType }/${ postId }`,
				method: 'POST',
				data: { status },
			} ).catch( () => {
				// Revert on failure.
				setData( prev =>
					prev.map( email => {
						if ( email.post_id === postId ) {
							return {
								...email,
								status: status === 'publish' ? 'draft' : 'publish',
							};
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
				id: 'name',
				label: __( 'Email', 'newspack-plugin' ),
				enableGlobalSearch: true,
				getValue: ( { item }: { item: EmailItem } ) => item.label,
				render: ( { item }: { item: EmailItem } ) => (
					<div>
						<strong>{ item.label }</strong>
						{ item.trigger_description && (
							<div style={ { color: '#757575', fontSize: '12px', marginTop: '4px' } }>{ item.trigger_description }</div>
						) }
					</div>
				),
			},
			{
				id: 'recipient',
				label: __( 'Recipient', 'newspack-plugin' ),
				getValue: ( { item }: { item: EmailItem } ) => item.recipient,
				render: ( { item }: { item: EmailItem } ) => (
					<span>{ item.recipient === 'admin' ? __( 'Admin', 'newspack-plugin' ) : __( 'Reader', 'newspack-plugin' ) }</span>
				),
			},
			{
				id: 'status',
				label: __( 'Status', 'newspack-plugin' ),
				getValue: ( { item }: { item: EmailItem } ) => item.status,
				render: ( { item }: { item: EmailItem } ) => (
					<span>{ item.status === 'publish' ? __( 'Enabled', 'newspack-plugin' ) : __( 'Disabled', 'newspack-plugin' ) }</span>
				),
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
				isEligible: ( item: EmailItem ) => item.category !== 'reader-activation' && item.status === 'publish',
				callback: ( items: EmailItem[] ) => {
					updateStatus( items[ 0 ].post_id, 'draft' );
				},
			},
			{
				id: 'activate',
				label: __( 'Activate', 'newspack-plugin' ),
				isEligible: ( item: EmailItem ) => item.category !== 'reader-activation' && item.status !== 'publish',
				callback: ( items: EmailItem[] ) => {
					updateStatus( items[ 0 ].post_id, 'publish' );
				},
			},
			{
				id: 'reset',
				label: __( 'Reset', 'newspack-plugin' ),
				isDestructive: true,
				isEligible: ( item: EmailItem ) => item.type === 'receipt' || item.type === 'welcome',
				callback: ( items: EmailItem[] ) => {
					if ( utils.confirmAction( __( 'Are you sure you want to reset the contents of this email?', 'newspack-plugin' ) ) ) {
						resetEmail( items[ 0 ].post_id );
					}
				},
			},
		],
		[ resetEmail, updateStatus ]
	);

	const { data: processedData, paginationInfo } = useMemo(
		() => filterSortAndPaginate( filteredData, view, fields ),
		[ filteredData, view, fields ]
	);

	if ( false === pluginsReady ) {
		return (
			<Fragment>
				<Notice isError>
					{ __(
						'Newspack uses Newspack Newsletters to handle editing email-type content. Please activate this plugin to proceed.',
						'newspack-plugin'
					) }
					<br />
					{ __( 'Until this feature is configured, default receipts will be used.', 'newspack-plugin' ) }
				</Notice>
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
			<Card headerActions noBorder>
				<div>
					<p style={ { color: '#757575', margin: 0 } }>
						{ __(
							"Manage the transactional emails your readers receive. Use 'Edit template' to customize the design that wraps every email.",
							'newspack-plugin'
						) }
					</p>
				</div>
				<Button variant="secondary" href={ `/wp-admin/edit.php?post_type=${ postType }` }>
					{ __( 'Edit template', 'newspack-plugin' ) }
				</Button>
			</Card>
			{ error && <Notice isError noticeText={ error } /> }
			<DataViews
				className="newspack-emails"
				data={ processedData }
				fields={ fields }
				view={ view }
				onChangeView={ setView }
				actions={ actions }
				paginationInfo={ paginationInfo }
				defaultLayouts={ { table: {} } }
				isLoading={ isLoading }
				getItemId={ ( item: EmailItem ) => String( item.post_id ) }
				search
			/>
			<p>
				<Button variant="link" onClick={ () => setShowAll( ! showAll ) }>
					{ showAll ? __( 'Show default emails', 'newspack-plugin' ) : __( 'Show all emails', 'newspack-plugin' ) }
				</Button>
			</p>
		</Fragment>
	);
};

export default Emails;
