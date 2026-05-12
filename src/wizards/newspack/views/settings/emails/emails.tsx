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
import { Button, ToggleControl } from '@wordpress/components';
import type { Action, Field, View } from '@wordpress/dataviews';

/**
 * Internal dependencies.
 */
import { DataViews, Notice, utils } from '../../../../../../packages/components/src';
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
}

interface EmailSettings {
	newspack_emails: EmailItem[];
	post_type: string;
	admin_url?: string;
	enable_woocommerce_email_editor?: boolean;
}

const DEFAULT_VIEW: View = {
	type: 'table',
	page: 1,
	perPage: 25,
	sort: { field: 'name', direction: 'asc' },
	search: '',
	fields: [ 'trigger_description', 'status', 'note' ],
	filters: [],
	layout: {},
	titleField: 'name',
};

function getInactiveNote( item: EmailItem ): string {
	if ( item.status === 'publish' ) {
		return '';
	}
	if ( item.type === 'receipt' ) {
		return __( 'This email is not active. The default receipt will be used.', 'newspack-plugin' );
	}
	if ( item.type === 'welcome' ) {
		return __( 'This email is not active. The receipt template will be used if active.', 'newspack-plugin' );
	}
	return __( 'This email is not active.', 'newspack-plugin' );
}

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
						{ item.description && <div className="newspack-emails__description">{ item.description }</div> }
					</div>
				),
			},
			{
				id: 'trigger_description',
				label: __( 'Trigger', 'newspack-plugin' ),
				getValue: ( { item }: { item: EmailItem } ) => item.trigger_description || '',
				render: ( { item }: { item: EmailItem } ) => <span>{ item.trigger_description }</span>,
				enableSorting: false,
			},
			{
				id: 'status',
				label: __( 'Status', 'newspack-plugin' ),
				getValue: ( { item }: { item: EmailItem } ) => item.status,
				render: ( { item }: { item: EmailItem } ) => {
					if ( item.category === 'reader-activation' ) {
						return <span>{ item.status === 'publish' ? __( 'Active', 'newspack-plugin' ) : __( 'Inactive', 'newspack-plugin' ) }</span>;
					}
					return (
						<ToggleControl
							__nextHasNoMarginBottom
							checked={ item.status === 'publish' }
							onChange={ ( checked: boolean ) => updateStatus( item.post_id, checked ? 'publish' : 'draft' ) }
							label={ item.status === 'publish' ? __( 'Active', 'newspack-plugin' ) : __( 'Inactive', 'newspack-plugin' ) }
						/>
					);
				},
				enableSorting: false,
			},
			{
				id: 'note',
				label: __( 'Note', 'newspack-plugin' ),
				getValue: ( { item }: { item: EmailItem } ) => getInactiveNote( item ),
				render: ( { item }: { item: EmailItem } ) => {
					const note = getInactiveNote( item );
					return note ? <em>{ note }</em> : null;
				},
				enableSorting: false,
			},
		],
		[ updateStatus ]
	);

	const actions: Action< EmailItem >[] = useMemo(
		() => [
			{
				id: 'edit',
				label: __( 'Edit', 'newspack-plugin' ),
				isPrimary: true,
				callback: ( items: EmailItem[] ) => {
					window.location.href = items[ 0 ].edit_link;
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
		[ resetEmail ]
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
